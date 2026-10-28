package app.mnhotel.hotel_reservation_system_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import app.mnhotel.hotel_reservation_system_backend.entity.Room;

class SavedPaymentBookingTest extends TestSupport {

	static final String VISA = "4242424242424242";
	static final String MC = "5555555555554444";

	private String card(String pan, int month, int year, boolean def) {
		return "{\"cardNumber\":\"" + pan + "\",\"holderName\":\"Ana Perez\",\"expMonth\":" + month + ",\"expYear\":" + year
				+ ",\"makeDefault\":" + def + "}";
	}

	private org.springframework.test.web.servlet.ResultActions saveCard(String token, String json) throws Exception {
		return mvc.perform(post("/api/payment-methods").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private long idOf(String json) {
		return Long.parseLong(json.replaceAll(".*\"id\":(\\d+).*", "$1"));
	}

	private int futureYear() { return LocalDate.now().getYear() + 3; }

	@Test
	void savesCardWithoutExposingPanOrToken() throws Exception {
		String t = registerAndGetToken("pm1");
		String body = saveCard(t, card(VISA, 12, futureYear(), false)).andExpect(status().isCreated())
				.andExpect(jsonPath("$.brand").value("VISA"))
				.andExpect(jsonPath("$.last4").value("4242"))
				.andExpect(jsonPath("$.defaultMethod").value(true)) // la primera es predeterminada
				.andReturn().getResponse().getContentAsString();
		assertFalse(body.contains(VISA), "no debe devolver el PAN");
		assertFalse(body.toLowerCase().contains("token"), "no debe exponer el token del proveedor");
		mvc.perform(get("/api/payment-methods").header("Authorization", "Bearer " + t)).andExpect(status().isOk())
			.andExpect(jsonPath("$[0].last4").value("4242"));
	}

	@Test
	void rejectsInvalidLuhnAndExpiredCard() throws Exception {
		String t = registerAndGetToken("pm2");
		saveCard(t, card("4242424242424241", 12, futureYear(), false)).andExpect(status().isBadRequest());
		saveCard(t, card(VISA, 1, LocalDate.now().getYear() - 1, false)).andExpect(status().isBadRequest());
		saveCard(t, card("abcd", 12, futureYear(), false)).andExpect(status().isBadRequest());
	}

	@Test
	void onlyOneDefaultAtATime() throws Exception {
		String t = registerAndGetToken("pm3");
		saveCard(t, card(VISA, 12, futureYear(), false));
		saveCard(t, card(MC, 12, futureYear(), true)).andExpect(jsonPath("$.defaultMethod").value(true));
		String list = mvc.perform(get("/api/payment-methods").header("Authorization", "Bearer " + t))
				.andReturn().getResponse().getContentAsString();
		org.junit.jupiter.api.Assertions.assertEquals(1, list.split("\"defaultMethod\":true", -1).length - 1, list);
	}

	@Test
	void cannotUseOrDeleteAnotherUsersCard() throws Exception {
		String owner = registerAndGetToken("pm4a");
		String other = registerAndGetToken("pm4b");
		long id = idOf(saveCard(owner, card(VISA, 12, futureYear(), false)).andReturn().getResponse().getContentAsString());
		Room room = newRoom(100);
		LocalDate in = LocalDate.now().plusDays(15);
		mvc.perform(post("/api/reservations").header("Authorization", "Bearer " + other).contentType(MediaType.APPLICATION_JSON)
				.content("{\"roomId\":" + room.getId() + ",\"checkIn\":\"" + in + "\",\"checkOut\":\"" + in.plusDays(2)
						+ "\",\"savedPaymentMethodId\":" + id + "}"))
			.andExpect(status().isNotFound());
		mvc.perform(delete("/api/payment-methods/" + id).header("Authorization", "Bearer " + other)).andExpect(status().isNotFound());
		mvc.perform(put("/api/payment-methods/" + id + "/default").header("Authorization", "Bearer " + other)).andExpect(status().isNotFound());
	}

	@Test
	void bookingWithSavedCardCreatesPaidPaymentInOneStep() throws Exception {
		String t = registerAndGetToken("pm5");
		long id = idOf(saveCard(t, card(VISA, 12, futureYear(), false)).andReturn().getResponse().getContentAsString());
		Room room = newRoom(100);
		LocalDate in = LocalDate.now().plusDays(25);
		mvc.perform(post("/api/reservations").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON)
				.content("{\"roomId\":" + room.getId() + ",\"checkIn\":\"" + in + "\",\"checkOut\":\"" + in.plusDays(2)
						+ "\",\"savedPaymentMethodId\":" + id + "}"))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.payments[0].status").value("PAID"))
			.andExpect(jsonPath("$.payments[0].amount").value(200))
			.andExpect(jsonPath("$.payments[0].methodLabel").value("VISA **** 4242"));
		mvc.perform(get("/api/reservations/mine").header("Authorization", "Bearer " + t)).andExpect(status().isOk())
			.andExpect(jsonPath("$[0].payments[0].status").value("PAID"));
	}

	@Test
	void failedBookingDoesNotCreatePayment() throws Exception {
		String t = registerAndGetToken("pm6");
		long id = idOf(saveCard(t, card(VISA, 12, futureYear(), false)).andReturn().getResponse().getContentAsString());
		Room room = newRoom(100);
		LocalDate in = LocalDate.now().plusDays(35);
		String body = "{\"roomId\":" + room.getId() + ",\"checkIn\":\"" + in + "\",\"checkOut\":\"" + in.plusDays(2)
				+ "\",\"savedPaymentMethodId\":" + id + "}";
		mvc.perform(post("/api/reservations").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON).content(body))
			.andExpect(status().isCreated());
		mvc.perform(post("/api/reservations").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON).content(body))
			.andExpect(status().isConflict());
		mvc.perform(get("/api/reservations/mine").header("Authorization", "Bearer " + t))
			.andExpect(jsonPath("$.length()").value(1));
	}

	@Test
	void deletingDefaultPromotesAnother() throws Exception {
		String t = registerAndGetToken("pm7");
		long first = idOf(saveCard(t, card(VISA, 12, futureYear(), false)).andReturn().getResponse().getContentAsString());
		saveCard(t, card(MC, 12, futureYear(), false));
		mvc.perform(delete("/api/payment-methods/" + first).header("Authorization", "Bearer " + t)).andExpect(status().isNoContent());
		mvc.perform(get("/api/payment-methods").header("Authorization", "Bearer " + t))
			.andExpect(jsonPath("$.length()").value(1))
			.andExpect(jsonPath("$[0].defaultMethod").value(true));
	}
}
