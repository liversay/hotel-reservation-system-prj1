package app.mnhotel.hotel_reservation_system_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

import app.mnhotel.hotel_reservation_system_backend.entity.Room;
import app.mnhotel.hotel_reservation_system_backend.entity.User;
import app.mnhotel.hotel_reservation_system_backend.repository.UserRepository;

class ErrorHandlingTest extends TestSupport {

	@Autowired UserRepository users;
	@Autowired PasswordEncoder encoder;

	private String adminAuth() throws Exception {
		if (!users.existsByUsername("erradmin")) {
			users.save(User.builder().username("erradmin").email("erradmin@t.com").role("ADMIN")
					.password(encoder.encode("password1")).createdAt(LocalDateTime.now()).build());
		}
		String json = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"erradmin\",\"password\":\"password1\"}")).andReturn().getResponse().getContentAsString();
		return "Bearer " + json.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
	}

	@Test
	void malformedJsonReturns400NoTrace() throws Exception {
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{not json"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").isNotEmpty())
			.andExpect(jsonPath("$.trace").doesNotExist())
			.andExpect(content().string(Matchers.not(Matchers.containsString("Exception"))));
	}

	@Test
	void invalidDateInBodyReturns400() throws Exception {
		String token = registerAndGetToken("err_date");
		Room room = newRoom(100);
		mvc.perform(post("/api/reservations").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"roomId\":" + room.getId() + ",\"checkIn\":\"notadate\",\"checkOut\":\"2030-01-02\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").isNotEmpty())
			.andExpect(jsonPath("$.trace").doesNotExist());
	}

	@Test
	void badMonthReturns400() throws Exception {
		Room room = newRoom(100);
		mvc.perform(get("/api/rooms/" + room.getId() + "/availability").param("month", "bad"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").value("Parámetro con formato inválido"))
			.andExpect(jsonPath("$.trace").doesNotExist());
	}

	@Test
	void errorMessagesAreRealUtf8AndNotMojibake() throws Exception {
		Room room = newRoom(100);
		String[] bodies = {
			mvc.perform(get("/api/rooms/" + room.getId() + "/availability").param("month", "bad"))
				.andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8),
			mvc.perform(get("/api/rooms/999999")).andExpect(status().isNotFound())
				.andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8),
			mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{not json"))
				.andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8),
		};
		for (String b : bodies) {
			org.junit.jupiter.api.Assertions.assertFalse(b.contains("\u00C3") || b.contains("\u00C2"), "mojibake en: " + b);
		}
		org.junit.jupiter.api.Assertions.assertTrue(bodies[0].contains("Parámetro con formato inválido"), bodies[0]);
		org.junit.jupiter.api.Assertions.assertTrue(bodies[1].contains("Habitación no encontrada"), bodies[1]);
		// bytes crudos: "á" debe ir como 0xC3 0xA1 (UTF-8), no doble codificada
		byte[] raw = mvc.perform(get("/api/rooms/" + room.getId() + "/availability").param("month", "bad"))
			.andReturn().getResponse().getContentAsByteArray();
		org.junit.jupiter.api.Assertions.assertEquals("Parámetro con formato inválido",
			new com.fasterxml.jackson.databind.ObjectMapper().readTree(raw).get("message").asText());
	}

	@Test
	void unknownRouteReturns404NoTrace() throws Exception {
		mvc.perform(get("/api/hotel"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.message").isNotEmpty())
			.andExpect(content().string(Matchers.not(Matchers.containsString("Exception"))));
	}

	@Test
	void ratingAbove5Returns400OnCreateAndUpdate() throws Exception {
		String auth = adminAuth();
		mvc.perform(post("/api/hotel/registration-hotel").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"RatingHotel\",\"location\":\"Lima\",\"description\":\"d\",\"rating\":99}"))
			.andExpect(status().isBadRequest());
		mvc.perform(post("/api/hotel/registration-hotel").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"RatingHotel\",\"location\":\"Lima\",\"description\":\"d\",\"rating\":0.5}"))
			.andExpect(status().isBadRequest());
		Long hotelId = newRoom(100).getHotel().getId();
		mvc.perform(put("/api/hotel/update-hotel/" + hotelId).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"RatingHotel\",\"location\":\"Lima\",\"description\":\"d\",\"rating\":99}"))
			.andExpect(status().isBadRequest());
	}

	@Test
	void roomCreateInvalidReturns400() throws Exception {
		String auth = adminAuth();
		Long hotelId = newRoom(100).getHotel().getId();
		mvc.perform(post("/api/rooms").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"hotelId\":" + hotelId + ",\"roomNumber\":\" \",\"type\":\"Suite\",\"pricePerNight\":200}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").value(Matchers.containsString("Número de habitación")));
		mvc.perform(post("/api/rooms").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"hotelId\":" + hotelId + ",\"roomNumber\":\"7\",\"pricePerNight\":200}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").value(Matchers.containsString("Tipo")));
	}

	@Test
	void reservationResponseHasNoUserField() throws Exception {
		String token = registerAndGetToken("err_nouser");
		Room room = newRoom(100);
		mvc.perform(post("/api/reservations").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(reservationJson(room.getId(), java.time.LocalDate.now().plusDays(400), java.time.LocalDate.now().plusDays(402))))
			.andExpect(status().isCreated())
			.andExpect(content().string(Matchers.not(Matchers.containsString("\"user\""))));
	}
}
