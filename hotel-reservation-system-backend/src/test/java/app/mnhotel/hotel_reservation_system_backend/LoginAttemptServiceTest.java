package app.mnhotel.hotel_reservation_system_backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

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
		for (int i = 0; i < 5; i++) svc.tryAttempt("u", "1.1.1.1");
		assertFalse(svc.tryAttempt("u", "1.1.1.1"));
		clock.now = clock.now.plus(Duration.ofMinutes(14));
		assertFalse(svc.tryAttempt("u", "1.1.1.1"));
		clock.now = clock.now.plus(Duration.ofMinutes(2));
		assertTrue(svc.tryAttempt("u", "1.1.1.1"));
	}

	@Test
	void attemptIsRegisteredBeforeValidationAndRejectedAtLimit() {
		LoginAttemptService svc = new LoginAttemptService(new MutableClock());
		for (int i = 0; i < 5; i++) assertTrue(svc.tryAttempt("ana", "1.1.1.1"));
		assertFalse(svc.tryAttempt("ana", "1.1.1.1"));
		assertTrue(svc.tryAttempt("ana", "2.2.2.2"));
	}

	@Test
	void usernameIsCaseInsensitiveTrimmedAndTruncated() {
		LoginAttemptService svc = new LoginAttemptService(new MutableClock());
		assertTrue(svc.tryAttempt("Admin", "1.1.1.1"));
		assertTrue(svc.tryAttempt(" admin ", "1.1.1.1"));
		assertTrue(svc.tryAttempt("ADMIN", "1.1.1.1"));
		assertTrue(svc.tryAttempt("admin", "1.1.1.1"));
		assertTrue(svc.tryAttempt("aDmIn", "1.1.1.1"));
		assertFalse(svc.tryAttempt("admin", "1.1.1.1"));
		String longA = "a".repeat(100) + "X";
		String longB = "a".repeat(100) + "Y";
		for (int i = 0; i < 5; i++) assertTrue(svc.tryAttempt(longA, "3.3.3.3"));
		assertFalse(svc.tryAttempt(longB, "3.3.3.3"));
	}

	@Test
	void accountCounterIgnoresIp() {
		LoginAttemptService svc = new LoginAttemptService(new MutableClock());
		for (int i = 0; i < 20; i++) assertTrue(svc.tryAttempt("victima", "10.0.0." + (i / 4)));
		assertFalse(svc.tryAttempt("victima", "10.9.9.9"));
	}

	@Test
	void ipCounterCoversManyUsernames() {
		LoginAttemptService svc = new LoginAttemptService(new MutableClock());
		for (int i = 0; i < 30; i++) assertTrue(svc.tryAttempt("u" + i, "5.5.5.5"));
		assertFalse(svc.tryAttempt("otro", "5.5.5.5"));
		assertTrue(svc.tryAttempt("otro", "6.6.6.6"));
	}

	@Test
	void successResetsUserAndAccountCountersButNotIpCounter() {
		LoginAttemptService svc = new LoginAttemptService(new MutableClock());
		for (int i = 0; i < 4; i++) svc.tryAttempt("bob", "7.7.7.7");
		svc.recordSuccess("Bob", "7.7.7.7");
		// usuario+IP reiniciado: otros 5 intentos permitidos (el 5to ya no cabria sin reinicio)
		for (int i = 0; i < 5; i++) assertTrue(svc.tryAttempt("bob", "7.7.7.7"));
		assertFalse(svc.tryAttempt("bob", "7.7.7.7"));
		// el contador de IP NO se reinicio: 9 intentos acumulados + 21 mas = 30
		LoginAttemptService s2 = new LoginAttemptService(new MutableClock());
		for (int i = 0; i < 29; i++) s2.tryAttempt("x" + i, "8.8.8.8");
		s2.recordSuccess("x0", "8.8.8.8");
		assertTrue(s2.tryAttempt("y", "8.8.8.8"));
		assertFalse(s2.tryAttempt("z", "8.8.8.8"));
		// el contador de cuenta se reinicio
		LoginAttemptService s3 = new LoginAttemptService(new MutableClock());
		for (int i = 0; i < 19; i++) s3.tryAttempt("cta", "9.9." + (i / 4) + ".1");
		s3.recordSuccess("cta", "9.9.0.1");
		for (int i = 0; i < 20; i++) assertTrue(s3.tryAttempt("cta", "11.11." + (i / 4) + ".1"));
		assertFalse(s3.tryAttempt("cta", "12.12.12.12"));
	}

	@Test
	void mapIsBoundedAndExpires() {
		MutableClock clock = new MutableClock();
		LoginAttemptService svc = new LoginAttemptService(clock);
		for (int i = 0; i < 10_050; i++) svc.tryAttempt("user" + i, "20." + (i / 25) + ".0.1");
		assertTrue(svc.trackedEntries() > 9_000 && svc.trackedEntries() <= 10_000, "entradas: " + svc.trackedEntries());
		// al superar el tope se descarta la mas antigua: user0 vuelve a empezar de cero
		LoginAttemptService small = new LoginAttemptService(clock);
		for (int i = 0; i < 5; i++) assertTrue(small.tryAttempt("victima", "1.2.3.4"));
		assertFalse(small.tryAttempt("victima", "1.2.3.4"));
		for (int i = 0; i < 10_001; i++) small.tryAttempt("relleno" + i, "30." + (i / 25) + ".0.1");
		assertTrue(small.tryAttempt("victima", "1.2.3.4"));
		// expiracion por inactividad: con el mapa lleno, pasados 15 min las expiradas se purgan al insertar
		// (el mapa de IP, ~400 entradas, no estaba lleno y no se purga; los de usuario+IP y cuenta quedan en 1)
		clock.now = clock.now.plus(Duration.ofMinutes(16));
		svc.tryAttempt("nuevo", "99.99.99.99");
		assertTrue(svc.trackedEntries() <= 500, "entradas tras expirar: " + svc.trackedEntries());
	}

	@Test
	void idleEntriesExpireAfterTtl() {
		MutableClock clock = new MutableClock();
		LoginAttemptService svc = new LoginAttemptService(clock);
		for (int i = 0; i < 4; i++) svc.tryAttempt("ana", "1.1.1.1");
		clock.now = clock.now.plus(Duration.ofMinutes(16));
		for (int i = 0; i < 5; i++) assertTrue(svc.tryAttempt("ana", "1.1.1.1"));
		assertFalse(svc.tryAttempt("ana", "1.1.1.1"));
	}

	@Test
	void concurrentAttemptsDoNotExceedLimit() throws Exception {
		LoginAttemptService svc = new LoginAttemptService(new MutableClock());
		int threads = 16;
		ExecutorService pool = Executors.newFixedThreadPool(threads);
		CountDownLatch start = new CountDownLatch(1);
		AtomicInteger allowed = new AtomicInteger();
		for (int i = 0; i < threads * 4; i++) {
			pool.submit(() -> {
				start.await();
				if (svc.tryAttempt("carrera", "4.4.4.4")) allowed.incrementAndGet();
				return null;
			});
		}
		start.countDown();
		pool.shutdown();
		assertTrue(pool.awaitTermination(10, java.util.concurrent.TimeUnit.SECONDS));
		assertEquals(5, allowed.get());
	}
}
