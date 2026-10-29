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

	/** El login distingue mayusculas (findByUsername exacto), asi que "Admin" y "admin" son cuentas distintas. */
	@Test
	void usernameIsCaseSensitiveTrimmedAndTruncated() {
		LoginAttemptService svc = new LoginAttemptService(new MutableClock());
		for (int i = 0; i < 5; i++) assertTrue(svc.tryAttempt(i % 2 == 0 ? "admin" : " admin ", "1.1.1.1"));
		assertFalse(svc.tryAttempt("admin", "1.1.1.1"));
		assertTrue(svc.tryAttempt("Admin", "1.1.1.1"));
		String longA = "a".repeat(100) + "X";
		String longB = "a".repeat(100) + "Y";
		for (int i = 0; i < 5; i++) assertTrue(svc.tryAttempt(longA, "3.3.3.3"));
		assertFalse(svc.tryAttempt(longB, "3.3.3.3"));
	}

	@Test
	void successOfOneIdentityDoesNotResetAnotherCaseVariant() {
		LoginAttemptService svc = new LoginAttemptService(new MutableClock());
		for (int i = 0; i < 19; i++) svc.tryAttempt("Admin", "10.0.0." + (i / 4));
		svc.tryAttempt("admin", "9.9.9.9");
		svc.recordSuccess("admin", "9.9.9.9");
		assertTrue(svc.tryAttempt("Admin", "10.9.9.9")); // 20.o intento: la cuenta "Admin" conserva su cuenta
		assertFalse(svc.tryAttempt("Admin", "10.9.9.8"));
	}

	@Test
	void ipv6AddressesInSame64ShareCounter() {
		LoginAttemptService svc = new LoginAttemptService(new MutableClock());
		for (int i = 0; i < 30; i++) assertTrue(svc.tryAttempt("v" + i, "2001:db8:1:2:0:0:0:" + Integer.toHexString(i + 1)));
		assertFalse(svc.tryAttempt("otro", "2001:db8:1:2:aaaa:bbbb:cccc:dddd"));
		assertTrue(svc.tryAttempt("otro", "2001:db8:1:3::1")); // otro /64
		// IPv4 no se agrupa
		assertTrue(svc.tryAttempt("otro", "192.168.0.1"));
	}

	@Test
	void successfulLoginsDoNotConsumeIpQuota() {
		LoginAttemptService svc = new LoginAttemptService(new MutableClock());
		for (int i = 0; i < 100; i++) {
			assertTrue(svc.tryAttempt("ok" + (i % 3), "7.7.7.7"));
			svc.recordSuccess("ok" + (i % 3), "7.7.7.7");
		}
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
	void successResetsUserAndAccountCountersAndRefundsOnlyOneIpAttempt() {
		LoginAttemptService svc = new LoginAttemptService(new MutableClock());
		for (int i = 0; i < 4; i++) svc.tryAttempt("bob", "7.7.7.7");
		svc.recordSuccess("bob", "7.7.7.7");
		// usuario+IP reiniciado: otros 5 intentos permitidos (el 5to ya no cabria sin reinicio)
		for (int i = 0; i < 5; i++) assertTrue(svc.tryAttempt("bob", "7.7.7.7"));
		assertFalse(svc.tryAttempt("bob", "7.7.7.7"));
		// IP: solo se devuelve el intento del propio login exitoso (no es un reinicio)
		LoginAttemptService s2 = new LoginAttemptService(new MutableClock());
		for (int i = 0; i < 29; i++) s2.tryAttempt("x" + i, "8.8.8.8");
		s2.recordSuccess("x0", "8.8.8.8"); // 29 -> 28
		assertTrue(s2.tryAttempt("y", "8.8.8.8"));
		assertTrue(s2.tryAttempt("z", "8.8.8.8"));
		assertFalse(s2.tryAttempt("w", "8.8.8.8"));
		// el contador de cuenta se reinicio
		LoginAttemptService s3 = new LoginAttemptService(new MutableClock());
		for (int i = 0; i < 19; i++) s3.tryAttempt("cta", "9.9." + (i / 4) + ".1");
		s3.recordSuccess("cta", "9.9.0.1");
		for (int i = 0; i < 20; i++) assertTrue(s3.tryAttempt("cta", "11.11." + (i / 4) + ".1"));
		assertFalse(s3.tryAttempt("cta", "12.12.12.12"));
	}

	@Test
	void refundIsNoOpWhenIpEntryExpiredOrEvicted() {
		MutableClock clock = new MutableClock();
		LoginAttemptService svc = new LoginAttemptService(clock);
		svc.tryAttempt("a", "5.5.5.5");
		clock.now = clock.now.plus(Duration.ofMinutes(16));
		svc.recordSuccess("a", "5.5.5.5");
		for (int i = 0; i < 30; i++) assertTrue(svc.tryAttempt("n" + i, "5.5.5.5"));
		assertFalse(svc.tryAttempt("n", "5.5.5.5"));
	}

	@Test
	void mapIsBoundedAndExpires() {
		MutableClock clock = new MutableClock();
		LoginAttemptService svc = new LoginAttemptService(clock);
		for (int i = 0; i < 10_050; i++) svc.tryAttempt("user" + i, "20." + (i / 25) + ".0.1");
		assertEquals(10_000, svc.trackedEntries());
		// al superar el tope se descarta la mas antigua: user0 vuelve a empezar de cero
		LoginAttemptService small = new LoginAttemptService(clock);
		for (int i = 0; i < 5; i++) assertTrue(small.tryAttempt("victima", "1.2.3.4"));
		assertFalse(small.tryAttempt("victima", "1.2.3.4"));
		for (int i = 0; i < 10_001; i++) small.tryAttempt("relleno" + i, "30." + (i / 25) + ".0.1");
		assertTrue(small.tryAttempt("victima", "1.2.3.4"));
		// expiracion por inactividad: pasados 15 min, al insertar se purgan todas las expiradas de cada mapa
		clock.now = clock.now.plus(Duration.ofMinutes(16));
		svc.tryAttempt("nuevo", "99.99.99.99");
		assertEquals(1, svc.trackedEntries(), "no deben quedar entradas expiradas");
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
