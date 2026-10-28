package app.mnhotel.hotel_reservation_system_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import app.mnhotel.hotel_reservation_system_backend.entity.Room;

class AvailabilityAndReservationTest extends TestSupport {

	private org.springframework.test.web.servlet.ResultActions book(String token, Room room, LocalDate in, LocalDate out) throws Exception {
		return mvc.perform(post("/api/reservations").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(reservationJson(room.getId(), in, out)));
	}

	@Test
	void bookingComputesTotalPrice() throws Exception {
		Room room = newRoom(100);
		String t = registerAndGetToken("res1");
		LocalDate in = LocalDate.now().plusDays(10);
		book(t, room, in, in.plusDays(3)).andExpect(status().isCreated())
			.andExpect(jsonPath("$.totalPrice").value(300))
			.andExpect(jsonPath("$.status").value("CONFIRMED"));
	}

	@Test
	void overlappingBookingIsConflictButAdjacentIsAllowed() throws Exception {
		Room room = newRoom(100);
		String t = registerAndGetToken("res2");
		LocalDate in = LocalDate.now().plusDays(20);
		book(t, room, in, in.plusDays(3)).andExpect(status().isCreated());
		book(t, room, in.plusDays(1), in.plusDays(2)).andExpect(status().isConflict());   // dentro
		book(t, room, in.minusDays(1), in.plusDays(1)).andExpect(status().isConflict());  // solapa inicio
		book(t, room, in.plusDays(2), in.plusDays(5)).andExpect(status().isConflict());   // solapa final
		book(t, room, in.plusDays(3), in.plusDays(5)).andExpect(status().isCreated());    // check-in el dia del check-out
		book(t, room, in.minusDays(2), in).andExpect(status().isCreated());               // check-out el dia del check-in
	}

	@Test
	void invalidRangesAreRejected() throws Exception {
		Room room = newRoom(100);
		String t = registerAndGetToken("res3");
		LocalDate in = LocalDate.now().plusDays(5);
		book(t, room, in, in).andExpect(status().isBadRequest());
		book(t, room, in, in.minusDays(1)).andExpect(status().isBadRequest());
		book(t, room, LocalDate.now().minusDays(1), in).andExpect(status().isBadRequest());
		book(t, room, in, in.plusDays(31)).andExpect(status().isBadRequest());
	}

	@Test
	void bookingRequiresAuthentication() throws Exception {
		Room room = newRoom(100);
		mvc.perform(post("/api/reservations").contentType(MediaType.APPLICATION_JSON)
				.content(reservationJson(room.getId(), LocalDate.now().plusDays(2), LocalDate.now().plusDays(3))))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void calendarMarksOccupiedNightsOnly() throws Exception {
		Room room = newRoom(100);
		String t = registerAndGetToken("res4");
		LocalDate in = LocalDate.now().plusDays(40);
		book(t, room, in, in.plusDays(2)).andExpect(status().isCreated());
		YearMonth m = YearMonth.from(in);
		String body = mvc.perform(get("/api/rooms/" + room.getId() + "/availability").param("month", m.toString()))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
		org.junit.jupiter.api.Assertions.assertTrue(body.contains("{\"date\":\"" + in + "\",\"status\":\"OCCUPIED\"}"), body);
		org.junit.jupiter.api.Assertions.assertTrue(body.contains("{\"date\":\"" + in.plusDays(1) + "\",\"status\":\"OCCUPIED\"}"), body);
		// el dia de salida queda libre (si sigue en el mismo mes o en el siguiente)
		LocalDate out = in.plusDays(2);
		if (YearMonth.from(out).equals(m)) {
			org.junit.jupiter.api.Assertions.assertTrue(body.contains("{\"date\":\"" + out + "\",\"status\":\"AVAILABLE\"}"), body);
		}
	}

	@Test
	void calendarOfUnknownRoomIs404() throws Exception {
		mvc.perform(get("/api/rooms/999999/availability").param("month", "2030-01")).andExpect(status().isNotFound());
	}

	@Test
	void concurrentBookingsOfSameRoomAllowExactlyOne() throws Exception {
		Room room = newRoom(100);
		String t1 = registerAndGetToken("conc1");
		String t2 = registerAndGetToken("conc2");
		LocalDate in = LocalDate.now().plusDays(60);
		ExecutorService ex = Executors.newFixedThreadPool(2);
		Callable<Integer> a = () -> book(t1, room, in, in.plusDays(2)).andReturn().getResponse().getStatus();
		Callable<Integer> b = () -> book(t2, room, in, in.plusDays(2)).andReturn().getResponse().getStatus();
		List<Future<Integer>> res = ex.invokeAll(List.of(a, b));
		ex.shutdown();
		int created = 0;
		for (Future<Integer> f : res) if (f.get() == 201) created++;
		org.junit.jupiter.api.Assertions.assertEquals(1, created, "solo una reserva concurrente debe confirmarse");
	}
}
