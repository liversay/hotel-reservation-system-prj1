package app.mnhotel.hotel_reservation_system_backend.security;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

/**
 * Limite de fuerza bruta en login: {@value #MAX_FAILURES} fallos seguidos por clave (usuario+IP)
 * bloquean esa clave {@link #LOCK} minutos. Estado en memoria; un login correcto reinicia el contador.
 */
@Service
public class LoginAttemptService {

	static final int MAX_FAILURES = 5;
	static final Duration LOCK = Duration.ofMinutes(15);

	private record Attempts(int failures, Instant lockedUntil) { }

	private final ConcurrentHashMap<String, Attempts> attempts = new ConcurrentHashMap<>();
	private final Clock clock;

	public LoginAttemptService() {
		this(Clock.systemUTC());
	}

	public LoginAttemptService(Clock clock) {
		this.clock = clock;
	}

	public boolean isBlocked(String key) {
		Attempts a = attempts.get(key);
		if (a == null || a.lockedUntil() == null) {
			return false;
		}
		if (clock.instant().isBefore(a.lockedUntil())) {
			return true;
		}
		attempts.remove(key, a); // bloqueo vencido: se vuelve a empezar
		return false;
	}

	public void recordFailure(String key) {
		attempts.merge(key, new Attempts(1, null), (old, one) -> {
			int failures = old.failures() + 1;
			return failures >= MAX_FAILURES ? new Attempts(failures, clock.instant().plus(LOCK)) : new Attempts(failures, null);
		});
	}

	public void reset(String key) {
		attempts.remove(key);
	}
}
