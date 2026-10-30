package app.mnhotel.hotel_reservation_system_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

import app.mnhotel.hotel_reservation_system_backend.entity.User;
import app.mnhotel.hotel_reservation_system_backend.repository.UserRepository;

class RoomUniquenessTest extends TestSupport {

	@Autowired UserRepository users;
	@Autowired PasswordEncoder encoder;

	private String auth() throws Exception {
		if (!users.existsByUsername("uniqadmin")) {
			users.save(User.builder().username("uniqadmin").email("uniqadmin@t.com").role("ADMIN")
					.password(encoder.encode("password1")).createdAt(LocalDateTime.now()).build());
		}
		String json = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"uniqadmin\",\"password\":\"password1\"}")).andReturn().getResponse().getContentAsString();
		return "Bearer " + json.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
	}

	private String body(Long hotelId, String number) {
		return "{\"hotelId\":" + hotelId + ",\"roomNumber\":\"" + number + "\",\"type\":\"Doble\",\"pricePerNight\":100}";
	}

	private long idOf(String json) { return Long.parseLong(json.replaceAll(".*?\"id\":(\\d+).*", "$1")); }

	private String create(String auth, Long hotelId, String number) throws Exception {
		return mvc.perform(post("/api/rooms").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content(body(hotelId, number))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
	}

	@Test
	void duplicateRoomNumberSameHotelReturns409OnCreate() throws Exception {
		String auth = auth();
		Long hotelId = newRoom(50).getHotel().getId(); // la habitacion "1" ya existe
		mvc.perform(post("/api/rooms").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content(body(hotelId, "1")))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.message").value("Ya existe una habitación con ese número en este hotel"));
	}

	@Test
	void duplicateRoomNumberSameHotelReturns409OnUpdate() throws Exception {
		String auth = auth();
		Long hotelId = newRoom(50).getHotel().getId();
		create(auth, hotelId, "20");
		long other = idOf(create(auth, hotelId, "21"));
		mvc.perform(put("/api/rooms/" + other).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content(body(hotelId, "20")))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.message").value("Ya existe una habitación con ese número en este hotel"));
	}

	@Test
	void sameRoomNumberInOtherHotelIsAllowed() throws Exception {
		String auth = auth();
		Long hotelA = newRoom(50).getHotel().getId();
		Long hotelB = newRoom(50).getHotel().getId();
		long idA = idOf(create(auth, hotelA, "77"));
		long idB = idOf(create(auth, hotelB, "77"));
		mvc.perform(get("/api/rooms/" + idA)).andExpect(status().isOk())
			.andExpect(jsonPath("$.roomNumber").value("77")).andExpect(jsonPath("$.hotelId").value(hotelA));
		mvc.perform(get("/api/rooms/" + idB)).andExpect(status().isOk())
			.andExpect(jsonPath("$.roomNumber").value("77")).andExpect(jsonPath("$.hotelId").value(hotelB));
	}

	@Test
	void updatingRoomKeepingItsNumberIsAllowed() throws Exception {
		String auth = auth();
		Long hotelId = newRoom(50).getHotel().getId();
		long id = idOf(create(auth, hotelId, "30"));
		mvc.perform(put("/api/rooms/" + id).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
				.content("{\"roomNumber\":\"30\",\"type\":\"Suite\",\"pricePerNight\":300}"))
			.andExpect(status().isOk()).andExpect(jsonPath("$.type").value("Suite"));
	}
}
