package app.mnhotel.hotel_reservation_system_backend;

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

import app.mnhotel.hotel_reservation_system_backend.entity.Reservation;
import app.mnhotel.hotel_reservation_system_backend.entity.Room;
import app.mnhotel.hotel_reservation_system_backend.entity.User;
import app.mnhotel.hotel_reservation_system_backend.repository.ReservationRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.UserRepository;

class CancelReservationTest extends TestSupport {

	@Autowired ReservationRepository reservations;
	@Autowired UserRepository users;

	private long book(String token, Room room, LocalDate in, LocalDate out) throws Exception {
		String json = mvc.perform(post("/api/reservations").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(reservationJson(room.getId(), in, out)))
				.andReturn().getResponse().getContentAsString();
		return Long.parseLong(json.replaceAll(".*\"id\":(\\d+),\"startDate.*", "$1"));
	}

	@Test
	void ownerCancelsAndDatesBecomeAvailableAgain() throws Exception {
		Room room = newRoom(100);
		String t = registerAndGetToken("cx1");
		LocalDate in = LocalDate.now().plusDays(12);
		long id = book(t, room, in, in.plusDays(2));
		mvc.perform(put("/api/reservations/" + id + "/cancel").header("Authorization", "Bearer " + t))
			.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"));
		// el mismo rango puede reservarse otra vez
		mvc.perform(post("/api/reservations").header("Authorization", "Bearer " + registerAndGetToken("cx1b"))
				.contentType(MediaType.APPLICATION_JSON).content(reservationJson(room.getId(), in, in.plusDays(2))))
			.andExpect(status().isCreated());
	}

	@Test
	void cancelTwiceIsConflict() throws Exception {
		Room room = newRoom(100);
		String t = registerAndGetToken("cx2");
		LocalDate in = LocalDate.now().plusDays(14);
		long id = book(t, room, in, in.plusDays(1));
		mvc.perform(put("/api/reservations/" + id + "/cancel").header("Authorization", "Bearer " + t)).andExpect(status().isOk());
		mvc.perform(put("/api/reservations/" + id + "/cancel").header("Authorization", "Bearer " + t)).andExpect(status().isConflict());
	}

	@Test
	void anotherUserGets404AndAnonymous401() throws Exception {
		Room room = newRoom(100);
		String owner = registerAndGetToken("cx3a");
		LocalDate in = LocalDate.now().plusDays(16);
		long id = book(owner, room, in, in.plusDays(1));
		mvc.perform(put("/api/reservations/" + id + "/cancel").header("Authorization", "Bearer " + registerAndGetToken("cx3b")))
			.andExpect(status().isNotFound());
		mvc.perform(put("/api/reservations/" + id + "/cancel")).andExpect(status().isUnauthorized());
	}

	@Test
	void startedReservationCannotBeCancelled() throws Exception {
		Room room = newRoom(100);
		registerAndGetToken("cx4");
		User u = users.findByUsername("cx4").orElseThrow();
		Reservation r = reservations.save(Reservation.builder().user(u).room(room)
				.startDate(LocalDate.now().atStartOfDay()).endDate(LocalDate.now().plusDays(2).atStartOfDay())
				.status("CONFIRMED").totalPrice(200).createdAt(LocalDateTime.now()).build());
		String t = registerAndGetToken("cx4"); // ya existe: devuelve 409 sin token; hacemos login
		String login = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"cx4\",\"password\":\"password1\"}")).andReturn().getResponse().getContentAsString();
		t = login.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
		mvc.perform(put("/api/reservations/" + r.getId() + "/cancel").header("Authorization", "Bearer " + t))
			.andExpect(status().isBadRequest());
	}

	@Test
	void cancellingRefundsPaidPayments() throws Exception {
		String t = registerAndGetToken("cx5");
		String card = mvc.perform(post("/api/payment-methods").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON)
				.content("{\"cardNumber\":\"4242424242424242\",\"holderName\":\"X\",\"expMonth\":12,\"expYear\":" + (LocalDate.now().getYear() + 3) + "}"))
				.andReturn().getResponse().getContentAsString();
		long pm = Long.parseLong(card.replaceAll(".*\"id\":(\\d+).*", "$1"));
		Room room = newRoom(100);
		LocalDate in = LocalDate.now().plusDays(18);
		String res = mvc.perform(post("/api/reservations").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON)
				.content("{\"roomId\":" + room.getId() + ",\"checkIn\":\"" + in + "\",\"checkOut\":\"" + in.plusDays(2) + "\",\"savedPaymentMethodId\":" + pm + "}"))
				.andReturn().getResponse().getContentAsString();
		long id = Long.parseLong(res.replaceAll(".*\"id\":(\\d+),\"startDate.*", "$1"));
		mvc.perform(put("/api/reservations/" + id + "/cancel").header("Authorization", "Bearer " + t))
			.andExpect(status().isOk()).andExpect(jsonPath("$.payments[0].status").value("REFUNDED"));
		mvc.perform(get("/api/reservations/mine").header("Authorization", "Bearer " + t))
			.andExpect(jsonPath("$[0].status").value("CANCELLED"));
	}
}
