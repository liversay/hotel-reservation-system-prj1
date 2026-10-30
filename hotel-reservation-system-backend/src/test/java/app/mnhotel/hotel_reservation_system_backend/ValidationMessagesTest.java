package app.mnhotel.hotel_reservation_system_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

import app.mnhotel.hotel_reservation_system_backend.entity.User;
import app.mnhotel.hotel_reservation_system_backend.repository.UserRepository;

/** Los mensajes de validacion salen en espanol con etiqueta legible del campo. */
class ValidationMessagesTest extends TestSupport {

	@Autowired UserRepository users;
	@Autowired PasswordEncoder encoder;

	private String adminAuth() throws Exception {
		if (!users.existsByUsername("valadmin")) {
			users.save(User.builder().username("valadmin").email("valadmin@t.com").role("ADMIN")
					.password(encoder.encode("password1")).createdAt(LocalDateTime.now()).build());
		}
		String json = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"valadmin\",\"password\":\"password1\"}")).andReturn().getResponse().getContentAsString();
		return "Bearer " + json.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
	}

	@Test
	void roomPriceMessageIsSpanish() throws Exception {
		Long hotelId = newRoom(10).getHotel().getId();
		mvc.perform(post("/api/rooms").header("Authorization", adminAuth()).contentType(MediaType.APPLICATION_JSON)
				.content("{\"hotelId\":" + hotelId + ",\"roomNumber\":\"v1\",\"type\":\"Doble\",\"pricePerNight\":0}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").value("Precio por noche: debe ser mayor que 0"));
	}

	@Test
	void cardMonthMessageIsSpanish() throws Exception {
		String t = registerAndGetToken("val_card");
		mvc.perform(post("/api/payment-methods").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON)
				.content("{\"cardNumber\":\"4242424242424242\",\"holderName\":\"A B\",\"expMonth\":13,\"expYear\":2030}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").value("Mes de vencimiento: debe estar entre 1 y 12"));
	}

	@Test
	void hotelRatingMessageIsSpanish() throws Exception {
		mvc.perform(post("/api/hotel/registration-hotel").header("Authorization", adminAuth()).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"H\",\"location\":\"L\",\"description\":\"d\",\"rating\":99}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").value("Calificación: debe estar entre 1 y 5"));
	}

	@Test
	void blankRoomNumberMessageIsSpanish() throws Exception {
		Long hotelId = newRoom(10).getHotel().getId();
		mvc.perform(post("/api/rooms").header("Authorization", adminAuth()).contentType(MediaType.APPLICATION_JSON)
				.content("{\"hotelId\":" + hotelId + ",\"roomNumber\":\" \",\"type\":\"Doble\",\"pricePerNight\":5}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").value("Número de habitación: no puede estar vacío"));
	}

	@Test
	void registerShortPasswordMessageIsSpanish() throws Exception {
		mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"val_pw\",\"email\":\"val_pw@t.com\",\"password\":\"abc\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").value("Contraseña: debe tener al menos 8 caracteres"));
	}
}
