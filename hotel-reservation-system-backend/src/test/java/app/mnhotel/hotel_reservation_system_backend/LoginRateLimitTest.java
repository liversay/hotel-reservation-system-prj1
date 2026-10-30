package app.mnhotel.hotel_reservation_system_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

class LoginRateLimitTest extends TestSupport {

	private void login(String user, String pass, int expected) throws Exception {
		login(user, pass, "10.99.0.1", expected);
	}

	private void login(String user, String pass, String ip, int expected) throws Exception {
		RequestPostProcessor from = r -> { r.setRemoteAddr(ip); return r; };
		mvc.perform(post("/api/auth/login").with(from).contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"" + user + "\",\"password\":\"" + pass + "\"}"))
			.andExpect(status().is(expected));
	}

	@Test
	void sixthFailedLoginReturns429() throws Exception {
		registerAndGetToken("rl_six");
		for (int i = 0; i < 5; i++) {
			login("rl_six", "wrongpass1", 401);
		}
		login("rl_six", "wrongpass1", 429);
		// Bloqueado incluso con la clave correcta.
		login("rl_six", "password1", 429);
		mvc.perform(post("/api/auth/login").with(r -> { r.setRemoteAddr("10.99.0.1"); return r; })
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"rl_six\",\"password\":\"password1\"}"))
			.andExpect(jsonPath("$.message").value("Demasiados intentos. Inténtalo de nuevo en 15 minutos."));
	}

	@Test
	void lockedLoginSendsRetryAfterHeader() throws Exception {
		registerAndGetToken("rl_retry");
		for (int i = 0; i < 5; i++) {
			login("rl_retry", "wrongpass1", "10.9.0.1", 401);
		}
		mvc.perform(post("/api/auth/login").with(r -> { r.setRemoteAddr("10.9.0.1"); return r; })
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"rl_retry\",\"password\":\"password1\"}"))
			.andExpect(status().isTooManyRequests())
			.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Retry-After", "900"));
	}

	@Test
	void successfulLoginResetsCounter() throws Exception {
		registerAndGetToken("rl_reset");
		for (int i = 0; i < 4; i++) {
			login("rl_reset", "wrongpass1", 401);
		}
		login("rl_reset", "password1", 200);
		for (int i = 0; i < 4; i++) {
			login("rl_reset", "wrongpass1", 401);
		}
		login("rl_reset", "password1", 200);
	}

	@Test
	void lockIsPerUserAndIp() throws Exception {
		registerAndGetToken("rl_scope");
		for (int i = 0; i < 5; i++) {
			login("rl_scope", "wrongpass1", "10.0.0.1", 401);
		}
		login("rl_scope", "password1", "10.0.0.1", 429);
		login("rl_scope", "password1", "10.0.0.2", 200);
	}

	@Test
	void accountLockHoldsAcrossDifferentIps() throws Exception {
		registerAndGetToken("rl_acct");
		for (int i = 0; i < 20; i++) {
			login("rl_acct", "wrongpass1", "10.1." + (i / 4) + ".1", 401);
		}
		login("rl_acct", "password1", "10.1.200.1", 429);
	}

	@Test
	void ipLockCoversManyUsernames() throws Exception {
		registerAndGetToken("rl_ipuser");
		for (int i = 0; i < 30; i++) {
			login("rl_nouser" + i, "wrongpass1", "10.2.0.1", 401);
		}
		login("rl_ipuser", "password1", "10.2.0.1", 429);
		login("rl_ipuser", "password1", "10.2.0.2", 200);
	}

	/** El login distingue mayusculas y el registro permite "rl_Dup" y "rl_dup" como cuentas distintas. */
	@Test
	void caseVariantsAreSeparateAccountsAndSuccessDoesNotResetTheOther() throws Exception {
		registerAndGetToken("rl_Dup");
		registerAndGetToken("rl_dup");
		for (int i = 0; i < 5; i++) {
			login("rl_Dup", "wrongpass1", "10.3.0.1", 401);
		}
		login("rl_Dup", "password1", "10.3.0.1", 429);
		login("rl_dup", "password1", "10.3.0.1", 200);
		login("rl_Dup", "password1", "10.3.0.1", 429); // el exito de rl_dup no reinicio a rl_Dup
	}

	@Test
	void successfulLoginsDoNotConsumeIpQuota() throws Exception {
		registerAndGetToken("rl_many");
		for (int i = 0; i < 40; i++) {
			login("rl_many", "password1", "10.5.0.1", 200);
		}
	}

	@Test
	void successResetsPerUserCountersAndRefundsIpAttempt() throws Exception {
		registerAndGetToken("rl_succ");
		for (int i = 0; i < 4; i++) {
			login("rl_succ", "wrongpass1", "10.4.0.1", 401);
		}
		login("rl_succ", "password1", "10.4.0.1", 200);
		// usuario+IP reiniciado: 5 fallos mas antes de bloquear
		for (int i = 0; i < 5; i++) {
			login("rl_succ", "wrongpass1", "10.4.0.1", 401);
		}
		login("rl_succ", "password1", "10.4.0.1", 429);
		// contador de IP solo de fallos: 4 + 5 = 9 (el exito se devolvio); 21 fallos mas llegan a 30 y el siguiente se rechaza
		for (int i = 0; i < 21; i++) {
			login("rl_other" + i, "wrongpass1", "10.4.0.1", 401);
		}
		login("rl_other_y", "wrongpass1", "10.4.0.1", 429);
	}
}
