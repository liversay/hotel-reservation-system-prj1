package app.mnhotel.hotel_reservation_system_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

import app.mnhotel.hotel_reservation_system_backend.entity.User;
import app.mnhotel.hotel_reservation_system_backend.repository.UserRepository;

/** El rol y la existencia se validan contra la BD en cada request, no contra el claim del JWT. */
class StaleTokenTest extends TestSupport {

	@Autowired UserRepository users;
	@Autowired PasswordEncoder encoder;

	private User admin(String name) {
		return users.save(User.builder().username(name).email(name + "@t.com").role("ADMIN")
				.password(encoder.encode("password1")).createdAt(LocalDateTime.now()).build());
	}

	private String login(String name) throws Exception {
		String json = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"" + name + "\",\"password\":\"password1\"}")).andReturn().getResponse().getContentAsString();
		return json.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
	}

	@Test
	void demotedAdminLosesAccessImmediately() throws Exception {
		User u = admin("st_demoted");
		String t = login("st_demoted");
		mvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + t)).andExpect(status().isOk());
		u.setRole("USER");
		users.save(u);
		mvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + t)).andExpect(status().isForbidden());
	}

	@Test
	void deletedUserTokenIsRejected() throws Exception {
		User u = admin("st_deleted");
		String t = login("st_deleted");
		users.delete(u);
		mvc.perform(get("/api/reservations/mine").header("Authorization", "Bearer " + t)).andExpect(status().isUnauthorized());
	}

	@Test
	void recreatedUsernameDoesNotInheritOldToken() throws Exception {
		User u = admin("st_reused");
		String old = login("st_reused");
		users.delete(u);
		admin("st_reused"); // mismo nombre, id distinto
		mvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + old)).andExpect(status().isUnauthorized());
	}
}
