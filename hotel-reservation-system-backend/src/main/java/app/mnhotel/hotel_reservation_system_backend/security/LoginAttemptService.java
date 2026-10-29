package app.mnhotel.hotel_reservation_system_backend.security;

import java.time.Clock;
import java.time.Duration;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.time.Instant;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

/**
 * Limite de fuerza bruta en login, en memoria. Tres contadores, todos con ventana de {@link #WINDOW}
 * por inactividad:
 * <ul>
 * <li>usuario+IP: {@value #MAX_PER_USER_IP} intentos;</li>
 * <li>cuenta (usuario, sin IP): {@value #MAX_PER_ACCOUNT} intentos;</li>
 * <li>IP (todos los usuarios): {@value #MAX_PER_IP} fallos (IPv6 agrupada por /64).</li>
 * </ul>
 * El nombre de usuario NO se pasa a minusculas: el login distingue mayusculas, "Admin" y "admin" son cuentas
 * distintas y no deben compartir ni reiniciarse mutuamente los contadores.
 * El intento se reserva ({@link #tryAttempt}) antes de validar la contrasena: si algun contador ya esta en su
 * limite se rechaza sin incrementar nada. Un login correcto ({@link #recordSuccess}) borra los contadores
 * usuario+IP y cuenta, pero no el de IP. Cada mapa esta acotado a {@value #MAX_ENTRIES} entradas.
 * Todo se hace bajo un unico cerrojo, asi la reserva sobre los tres contadores es atomica.
 */
@Service
public class LoginAttemptService {

	static final int MAX_PER_USER_IP = 5;
	static final int MAX_PER_ACCOUNT = 20;
	static final int MAX_PER_IP = 30;
	static final int MAX_ENTRIES = 10_000;
	static final int MAX_USERNAME_LENGTH = 100;
	static final Duration WINDOW = Duration.ofMinutes(15);

	private record Entry(int count, Instant lastAttempt) { }

	/** Mapas en orden de insercion; al actualizar se reinserta, asi el primero es siempre el mas antiguo. */
	private final Map<String, Entry> byUserIp = new LinkedHashMap<>();
	private final Map<String, Entry> byAccount = new LinkedHashMap<>();
	private final Map<String, Entry> byIp = new LinkedHashMap<>();
	private final Clock clock;

	public LoginAttemptService() {
		this(Clock.systemUTC());
	}

	public LoginAttemptService(Clock clock) {
		this.clock = clock;
	}

	/** Reserva un intento de login; devuelve false (sin contarlo) si algun limite ya se alcanzo. */
	public synchronized boolean tryAttempt(String username, String rawIp) {
		String ip = normalizeIp(rawIp);
		String account = normalize(username);
		String userIp = account + "|" + ip;
		Instant now = clock.instant();
		if (countOf(byUserIp, userIp, now) >= MAX_PER_USER_IP
				|| countOf(byAccount, account, now) >= MAX_PER_ACCOUNT
				|| countOf(byIp, ip, now) >= MAX_PER_IP) {
			return false;
		}
		increment(byUserIp, userIp, now);
		increment(byAccount, account, now);
		increment(byIp, ip, now);
		return true;
	}

	/** Login correcto: reinicia usuario+IP y cuenta; el contador de IP se conserva. */
	public synchronized void recordSuccess(String username, String rawIp) {
		String ip = normalizeIp(rawIp);
		String account = normalize(username);
		byUserIp.remove(account + "|" + ip);
		byAccount.remove(account);
		// Devuelve el intento reservado en el contador de IP (solo cuentan los fallos).
		Entry e = byIp.get(ip);
		if (e != null && clock.instant().isBefore(e.lastAttempt().plus(WINDOW))) {
			if (e.count() <= 1) {
				byIp.remove(ip);
			} else {
				byIp.put(ip, new Entry(e.count() - 1, e.lastAttempt())); // misma posicion en el orden
			}
		}
	}

	/** Mayor numero de entradas en cualquiera de los mapas (para pruebas y diagnostico). */
	public synchronized int trackedEntries() {
		return Math.max(byUserIp.size(), Math.max(byAccount.size(), byIp.size()));
	}

	private static String normalize(String username) {
		String u = username == null ? "" : username.trim();
		return u.length() > MAX_USERNAME_LENGTH ? u.substring(0, MAX_USERNAME_LENGTH) : u;
	}

	/** IPv4 igual; IPv6 reducida a su prefijo /64 (un cliente controla todo su /64). Solo literales: sin DNS. */
	private static String normalizeIp(String ip) {
		if (ip == null || ip.indexOf(':') < 0 || !ip.matches("[0-9a-fA-F:.%]+")) {
			return String.valueOf(ip);
		}
		try {
			if (InetAddress.getByName(ip) instanceof Inet6Address v6) {
				byte[] b = v6.getAddress();
				return String.format("%02x%02x:%02x%02x:%02x%02x:%02x%02x::/64",
						b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7]);
			}
			return InetAddress.getByName(ip).getHostAddress(); // IPv4 mapeada a IPv6
		} catch (java.net.UnknownHostException e) {
			return ip;
		}
	}

	private int countOf(Map<String, Entry> map, String key, Instant now) {
		Entry e = map.get(key);
		if (e == null) {
			return 0;
		}
		if (!now.isBefore(e.lastAttempt().plus(WINDOW))) {
			map.remove(key); // inactiva mas de la ventana: se vuelve a empezar
			return 0;
		}
		return e.count();
	}

	private void increment(Map<String, Entry> map, String key, Instant now) {
		Entry old = map.remove(key); // remove + put => queda como el mas reciente
		map.put(key, new Entry(old == null ? 1 : old.count() + 1, now));
		purgeExpired(map, now); // el mas antiguo va primero: solo se recorren las expiradas
		if (map.size() > MAX_ENTRIES) {
			Iterator<String> oldest = map.keySet().iterator();
			oldest.next();
			oldest.remove();
		}
	}

	private void purgeExpired(Map<String, Entry> map, Instant now) {
		Iterator<Entry> it = map.values().iterator();
		while (it.hasNext() && !now.isBefore(it.next().lastAttempt().plus(WINDOW))) {
			it.remove();
		}
	}
}
