package app.mnhotel.hotel_reservation_system_backend.security;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;

/**
 * Limite de fuerza bruta en login, en memoria. Tres contadores, todos con ventana de {@link #WINDOW}
 * por inactividad:
 * <ul>
 * <li>usuario+IP: {@value #MAX_PER_USER_IP} intentos;</li>
 * <li>cuenta (usuario, sin IP): {@value #MAX_PER_ACCOUNT} intentos;</li>
 * <li>IP (todos los usuarios): {@value #MAX_PER_IP} intentos.</li>
 * </ul>
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
	public synchronized boolean tryAttempt(String username, String ip) {
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
	public synchronized void recordSuccess(String username, String ip) {
		String account = normalize(username);
		byUserIp.remove(account + "|" + ip);
		byAccount.remove(account);
	}

	/** Mayor numero de entradas en cualquiera de los mapas (para pruebas y diagnostico). */
	public synchronized int trackedEntries() {
		return Math.max(byUserIp.size(), Math.max(byAccount.size(), byIp.size()));
	}

	private static String normalize(String username) {
		String u = username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
		return u.length() > MAX_USERNAME_LENGTH ? u.substring(0, MAX_USERNAME_LENGTH) : u;
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
		if (map.size() > MAX_ENTRIES) {
			purgeExpired(map, now);
			if (map.size() > MAX_ENTRIES) {
				Iterator<String> oldest = map.keySet().iterator();
				oldest.next();
				oldest.remove();
			}
		}
	}

	private void purgeExpired(Map<String, Entry> map, Instant now) {
		Iterator<Entry> it = map.values().iterator();
		while (it.hasNext() && !now.isBefore(it.next().lastAttempt().plus(WINDOW))) {
			it.remove();
		}
	}
}
