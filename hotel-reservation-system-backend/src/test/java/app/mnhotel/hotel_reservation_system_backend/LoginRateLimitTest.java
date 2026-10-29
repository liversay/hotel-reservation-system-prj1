package app.mnhotel.hotel_reservation_system_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

class LoginRateLimitTest extends TestSupport {

	private void login(String user, String pass, int expected) throws Exception {
		login(user, pass, "127.0.0.1", expected);
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
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"rl_six\",\"password\":\"password1\"}"))
			.andExpect(jsonPath("$.message").isNotEmpty());
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
}
