package app.mnhotel.hotel_reservation_system_backend;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

import app.mnhotel.hotel_reservation_system_backend.entity.Room;
import app.mnhotel.hotel_reservation_system_backend.entity.User;
import app.mnhotel.hotel_reservation_system_backend.repository.RoomRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.UserRepository;

/**
 * Simula la carrera de F-02: la comprobacion previa "exists" devuelve false (otra peticion aun no
 * habia confirmado), pero el indice unico (hotel, numero) rechaza el duplicado al escribir.
 */
class RoomRaceTest extends TestSupport {

	@SpyBean RoomRepository roomRepo;
	@Autowired UserRepository users;
	@Autowired PasswordEncoder encoder;

	private static final String MSG = "Ya existe una habitación con ese número en este hotel";

	private String auth() throws Exception {
		if (!users.existsByUsername("raceadmin")) {
			users.save(User.builder().username("raceadmin").email("raceadmin@t.com").role("ADMIN")
					.password(encoder.encode("password1")).createdAt(LocalDateTime.now()).build());
		}
		String json = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"raceadmin\",\"password\":\"password1\"}")).andReturn().getResponse().getContentAsString();
		return "Bearer " + json.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
	}

	private void skipPreCheck() {
		doReturn(false).when(roomRepo).existsByHotelIdAndRoomNumber(anyLong(), anyString());
		doReturn(false).when(roomRepo).existsByHotelIdAndRoomNumberAndIdNot(anyLong(), anyString(), anyLong());
	}

	@Test
	void raceOnCreateReturns409() throws Exception {
		String auth = auth();
		Long hotelId = newRoom(50).getHotel().getId(); // habitacion "1" existente
		skipPreCheck();
		mvc.perform(post("/api/rooms").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"hotelId\":" + hotelId + ",\"roomNumber\":\"1\",\"type\":\"Doble\",\"pricePerNight\":100}"))
			.andExpect(status().isConflict()).andExpect(jsonPath("$.message").value(MSG));
	}

	@Test
	void raceOnUpdateReturns409() throws Exception {
		String auth = auth();
		Room first = newRoom(50);
		Room second = roomRepo.save(Room.builder().hotel(first.getHotel()).roomNumber("2").type("Doble")
				.pricePerNight(60).availbility(true).build());
		skipPreCheck();
		mvc.perform(put("/api/rooms/" + second.getId()).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"roomNumber\":\"1\",\"type\":\"Doble\",\"pricePerNight\":100}"))
			.andExpect(status().isConflict()).andExpect(jsonPath("$.message").value(MSG));
	}
}
