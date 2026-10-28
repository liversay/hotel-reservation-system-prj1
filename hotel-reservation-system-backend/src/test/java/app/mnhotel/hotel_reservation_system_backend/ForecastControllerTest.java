package app.mnhotel.hotel_reservation_system_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.time.YearMonth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

import app.mnhotel.hotel_reservation_system_backend.entity.Reservation;
import app.mnhotel.hotel_reservation_system_backend.entity.Room;
import app.mnhotel.hotel_reservation_system_backend.entity.User;
import app.mnhotel.hotel_reservation_system_backend.repository.ReservationRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.UserRepository;

class ForecastControllerTest extends TestSupport {

	@Autowired UserRepository users;
	@Autowired ReservationRepository reservations;
	@Autowired PasswordEncoder encoder;

	private String adminToken() throws Exception {
		if (!users.existsByUsername("boss")) {
			users.save(User.builder().username("boss").email("boss@t.com").role("ADMIN")
					.password(encoder.encode("password1")).createdAt(LocalDateTime.now()).build());
		}
		String json = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"boss\",\"password\":\"password1\"}")).andReturn().getResponse().getContentAsString();
		return json.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
	}

	@Test
	void forecastIsAdminOnly() throws Exception {
		mvc.perform(get("/api/admin/forecast")).andExpect(status().isUnauthorized());
		mvc.perform(get("/api/admin/forecast").header("Authorization", "Bearer " + registerAndGetToken("fc_user")))
			.andExpect(status().isForbidden());
	}

	@Test
	void returnsHistoryAndForecastShape() throws Exception {
		mvc.perform(get("/api/admin/forecast").param("historyMonths", "6").param("horizonMonths", "3")
				.header("Authorization", "Bearer " + adminToken()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.history.length()").value(6))
			.andExpect(jsonPath("$.forecast.length()").value(3))
			.andExpect(jsonPath("$.forecast[0].month").value(YearMonth.now().plusMonths(1).toString()));
	}

	@Test
	void historyCountsNightsAndRevenueProratedAcrossMonths() throws Exception {
		Room room = newRoom(100);
		User u = users.findByUsername("boss").orElseGet(() -> users.save(User.builder().username("boss").email("boss@t.com")
				.role("ADMIN").password(encoder.encode("password1")).createdAt(LocalDateTime.now()).build()));
		// 4 noches: 2 en el ultimo dia-1 y dia 0 del mes pasado... se reparten entre dos meses (hace 3 y hace 2 meses)
		YearMonth prev = YearMonth.now().minusMonths(3);
		var start = prev.atEndOfMonth().minusDays(1).atStartOfDay(); // penultimo dia del mes
		reservations.save(Reservation.builder().user(u).room(room).startDate(start).endDate(start.plusDays(4))
				.status("COMPLETED").totalPrice(400).createdAt(start.minusDays(5)).build());
		String body = mvc.perform(get("/api/admin/forecast").param("historyMonths", "6")
				.header("Authorization", "Bearer " + adminToken())).andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		org.junit.jupiter.api.Assertions.assertTrue(body.contains("\"month\":\"" + prev + "\",\"roomNights\":2.0,\"revenue\":200.0"), body);
		org.junit.jupiter.api.Assertions.assertTrue(body.contains("\"month\":\"" + prev.plusMonths(1) + "\",\"roomNights\":2.0,\"revenue\":200.0"), body);
	}

	@Test
	void cancelledReservationsAreExcluded() throws Exception {
		Room room = newRoom(100);
		String token = adminToken(); // crea el usuario "boss" si aun no existe: el test no depende del orden de ejecucion
		var user = users.findByUsername("boss").orElseThrow();
		YearMonth m = YearMonth.now().minusMonths(5);
		var start = m.atDay(10).atStartOfDay();
		reservations.save(Reservation.builder().user(user).room(room).startDate(start).endDate(start.plusDays(3))
				.status("CANCELLED").totalPrice(300).createdAt(start.minusDays(5)).build());
		String body = mvc.perform(get("/api/admin/forecast").param("historyMonths", "6")
				.header("Authorization", "Bearer " + token)).andReturn().getResponse().getContentAsString();
		org.junit.jupiter.api.Assertions.assertTrue(body.contains("\"month\":\"" + m + "\",\"roomNights\":0.0"), body);
	}

	@Test
	void invalidParametersAre400() throws Exception {
		mvc.perform(get("/api/admin/forecast").param("historyMonths", "0").header("Authorization", "Bearer " + adminToken()))
			.andExpect(status().isBadRequest());
		mvc.perform(get("/api/admin/forecast").param("horizonMonths", "99").header("Authorization", "Bearer " + adminToken()))
			.andExpect(status().isBadRequest());
	}
}
