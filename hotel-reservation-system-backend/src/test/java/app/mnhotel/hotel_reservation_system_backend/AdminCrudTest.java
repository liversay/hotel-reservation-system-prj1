package app.mnhotel.hotel_reservation_system_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

import app.mnhotel.hotel_reservation_system_backend.entity.User;
import app.mnhotel.hotel_reservation_system_backend.repository.UserRepository;

class AdminCrudTest extends TestSupport {

	@Autowired UserRepository users;
	@Autowired PasswordEncoder encoder;

	private String adminToken() throws Exception {
		if (!users.existsByUsername("crudadmin")) {
			users.save(User.builder().username("crudadmin").email("crudadmin@t.com").role("ADMIN")
					.password(encoder.encode("password1")).createdAt(LocalDateTime.now()).build());
		}
		String json = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"crudadmin\",\"password\":\"password1\"}")).andReturn().getResponse().getContentAsString();
		return json.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
	}

	private String auth(String t) { return "Bearer " + t; }

	private long idOf(String json) { return Long.parseLong(json.replaceAll(".*?\"id\":(\\d+).*", "$1")); }

	@Test
	void hotelFullCrud() throws Exception {
		String t = adminToken();
		mvc.perform(post("/api/hotel/registration-hotel").header("Authorization", auth(t)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"CrudHotel\",\"location\":\"Lima\",\"description\":\"d\",\"rating\":4.0}")).andExpect(status().isOk());
		String list = mvc.perform(get("/api/hotel/get-all")).andReturn().getResponse().getContentAsString();
		long id = Long.parseLong(list.replaceAll(".*\"id\":(\\d+),\"name\":\"CrudHotel\".*", "$1"));
		mvc.perform(put("/api/hotel/update-hotel/" + id).header("Authorization", auth(t)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"CrudHotel2\",\"location\":\"Cusco\",\"description\":\"d\",\"rating\":3.5}")).andExpect(status().isOk());
		mvc.perform(get("/api/hotel/get-hotel/" + id)).andExpect(jsonPath("$.name").value("CrudHotel2"));
		mvc.perform(delete("/api/hotel/delete-hotel/" + id).header("Authorization", auth(t))).andExpect(status().isOk());
		mvc.perform(delete("/api/hotel/delete-hotel/" + id).header("Authorization", auth(t))).andExpect(status().isNotFound());
		mvc.perform(put("/api/hotel/update-hotel/" + id).header("Authorization", auth(t)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"x\"}")).andExpect(status().isNotFound());
	}

	@Test
	void hotelCreateRequiresNameAndAdmin() throws Exception {
		mvc.perform(post("/api/hotel/registration-hotel").header("Authorization", auth(adminToken()))
				.contentType(MediaType.APPLICATION_JSON).content("{\"name\":\" \"}")).andExpect(status().isBadRequest());
		mvc.perform(post("/api/hotel/registration-hotel").header("Authorization", auth(registerAndGetToken("ac_user")))
				.contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"X\"}")).andExpect(status().isForbidden());
	}

	@Test
	void roomCreateUpdateDeleteAndListAll() throws Exception {
		String t = adminToken();
		long hotelId = newRoom(50).getHotel().getId();
		String created = mvc.perform(post("/api/rooms").header("Authorization", auth(t)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"hotelId\":" + hotelId + ",\"roomNumber\":\"900\",\"type\":\"Suite\",\"pricePerNight\":200}"))
				.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
		long id = idOf(created);
		mvc.perform(put("/api/rooms/" + id).header("Authorization", auth(t)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"roomNumber\":\"901\",\"type\":\"Doble\",\"pricePerNight\":120}"))
			.andExpect(status().isOk()).andExpect(jsonPath("$.roomNumber").value("901")).andExpect(jsonPath("$.pricePerNight").value(120));
		mvc.perform(put("/api/rooms/" + id).header("Authorization", auth(t)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"roomNumber\":\"901\",\"pricePerNight\":0}")).andExpect(status().isBadRequest());
		mvc.perform(get("/api/rooms")).andExpect(status().isOk()); // sin hotelId = todas
		mvc.perform(delete("/api/rooms/" + id).header("Authorization", auth(t))).andExpect(status().isNoContent());
		mvc.perform(delete("/api/rooms/" + id).header("Authorization", auth(t))).andExpect(status().isNotFound());
	}

	@Test
	void roomAndHotelWithReservationsCannotBeDeleted() throws Exception {
		String t = adminToken();
		var room = newRoom(100);
		LocalDate in = LocalDate.now().plusDays(70);
		mvc.perform(post("/api/reservations").header("Authorization", auth(registerAndGetToken("ac_res")))
				.contentType(MediaType.APPLICATION_JSON).content(reservationJson(room.getId(), in, in.plusDays(1)))).andExpect(status().isCreated());
		mvc.perform(delete("/api/rooms/" + room.getId()).header("Authorization", auth(t))).andExpect(status().isConflict());
		mvc.perform(delete("/api/hotel/delete-hotel/" + room.getHotel().getId()).header("Authorization", auth(t))).andExpect(status().isConflict());
	}

	@Test
	void userFullCrudWithRoles() throws Exception {
		String t = adminToken();
		String created = mvc.perform(post("/api/admin/users").header("Authorization", auth(t)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"nuevo\",\"email\":\"nuevo@t.com\",\"password\":\"password1\",\"role\":\"admin\"}"))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("ADMIN")).andReturn().getResponse().getContentAsString();
		long id = idOf(created);
		org.junit.jupiter.api.Assertions.assertFalse(created.contains("password"), "no debe exponer la contrasena");
		mvc.perform(put("/api/admin/users/" + id).header("Authorization", auth(t)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"otro@t.com\",\"role\":\"USER\",\"password\":\"nuevapass1\"}"))
			.andExpect(status().isOk()).andExpect(jsonPath("$.email").value("otro@t.com")).andExpect(jsonPath("$.role").value("USER"));
		// la nueva contrasena funciona
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"username\":\"nuevo\",\"password\":\"nuevapass1\"}"))
			.andExpect(status().isOk());
		mvc.perform(get("/api/admin/users").header("Authorization", auth(t))).andExpect(status().isOk());
		mvc.perform(delete("/api/admin/users/" + id).header("Authorization", auth(t))).andExpect(status().isNoContent());
		mvc.perform(delete("/api/admin/users/" + id).header("Authorization", auth(t))).andExpect(status().isNotFound());
	}

	@Test
	void userValidationsAndSelfProtection() throws Exception {
		String t = adminToken();
		mvc.perform(post("/api/admin/users").header("Authorization", auth(t)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"a\",\"email\":\"a@t.com\",\"password\":\"123\"}")).andExpect(status().isBadRequest());
		mvc.perform(post("/api/admin/users").header("Authorization", auth(t)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"b\",\"email\":\"b@t.com\",\"password\":\"password1\",\"role\":\"ROOT\"}")).andExpect(status().isBadRequest());
		mvc.perform(post("/api/admin/users").header("Authorization", auth(t)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"crudadmin\",\"email\":\"z@t.com\",\"password\":\"password1\"}")).andExpect(status().isConflict());
		long selfId = users.findByUsername("crudadmin").orElseThrow().getId();
		mvc.perform(delete("/api/admin/users/" + selfId).header("Authorization", auth(t))).andExpect(status().isConflict());
		mvc.perform(put("/api/admin/users/" + selfId).header("Authorization", auth(t)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"role\":\"USER\"}")).andExpect(status().isConflict());
		mvc.perform(get("/api/admin/users").header("Authorization", auth(registerAndGetToken("ac_plain")))).andExpect(status().isForbidden());
	}

	@Test
	void userWithReservationsCannotBeDeleted() throws Exception {
		String t = adminToken();
		var room = newRoom(100);
		String ut = registerAndGetToken("ac_booker");
		LocalDate in = LocalDate.now().plusDays(80);
		mvc.perform(post("/api/reservations").header("Authorization", auth(ut)).contentType(MediaType.APPLICATION_JSON)
				.content(reservationJson(room.getId(), in, in.plusDays(1)))).andExpect(status().isCreated());
		mvc.perform(delete("/api/admin/users/" + users.findByUsername("ac_booker").orElseThrow().getId()).header("Authorization", auth(t)))
			.andExpect(status().isConflict());
	}
}
