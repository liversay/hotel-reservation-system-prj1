package app.mnhotel.hotel_reservation_system_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

	@Autowired
	MockMvc mvc;

	private String body(String user, String email, String pass) {
		return "{\"username\":\"" + user + "\",\"email\":\"" + email + "\",\"password\":\"" + pass + "\"}";
	}

	@Test
	void registerThenLoginReturnsToken() throws Exception {
		mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content(body("ana", "ana@x.com", "password1")))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.token").isNotEmpty())
			.andExpect(jsonPath("$.role").value("USER"));
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content(body("ana", "", "password1")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.token").isNotEmpty());
	}

	@Test
	void duplicateUsernameIsConflict() throws Exception {
		String b = body("dup", "dup@x.com", "password1");
		mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(b))
			.andExpect(status().isCreated());
		mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(b))
			.andExpect(status().isConflict());
	}

	@Test
	void wrongPasswordIs401() throws Exception {
		mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content(body("bob", "bob@x.com", "password1")));
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content(body("bob", "", "wrongpass1")))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void shortPasswordIs400() throws Exception {
		mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content(body("sho", "sho@x.com", "123")))
			.andExpect(status().isBadRequest());
	}

	@Test
	void adminEndpointRejectsAnonymousAndRegularUser() throws Exception {
		mvc.perform(get("/api/admin/ping")).andExpect(status().isUnauthorized());
		String json = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content(body("carl", "carl@x.com", "password1"))).andReturn().getResponse().getContentAsString();
		String token = json.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
		mvc.perform(get("/api/admin/ping").header("Authorization", "Bearer " + token))
			.andExpect(status().isForbidden());
	}

	@Test
	void tamperedTokenIsUnauthorized() throws Exception {
		mvc.perform(get("/api/admin/ping").header("Authorization", "Bearer abc.def.ghi"))
			.andExpect(status().isUnauthorized());
	}
}
