package app.mnhotel.hotel_reservation_system_backend;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

import app.mnhotel.hotel_reservation_system_backend.security.LoginAttemptService;

class LoginAttemptServiceTest {

	/** Reloj mutable para avanzar el tiempo sin dormir. */
	static class MutableClock extends Clock {
		Instant now = Instant.parse("2030-01-01T00:00:00Z");
		public java.time.ZoneId getZone() { return ZoneOffset.UTC; }
		public Clock withZone(java.time.ZoneId z) { return this; }
		public Instant instant() { return now; }
	}

	@Test
	void lockExpiresAfter15Minutes() {
		MutableClock clock = new MutableClock();
		LoginAttemptService svc = new LoginAttemptService(clock);
		for (int i = 0; i < 5; i++) svc.recordFailure("u|1.1.1.1");
		assertTrue(svc.isBlocked("u|1.1.1.1"));
		clock.now = clock.now.plus(Duration.ofMinutes(14));
		assertTrue(svc.isBlocked("u|1.1.1.1"));
		clock.now = clock.now.plus(Duration.ofMinutes(2));
		assertFalse(svc.isBlocked("u|1.1.1.1"));
	}
}
