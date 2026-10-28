package app.mnhotel.hotel_reservation_system_backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import app.mnhotel.hotel_reservation_system_backend.entity.Hotel;
import app.mnhotel.hotel_reservation_system_backend.entity.Room;
import app.mnhotel.hotel_reservation_system_backend.repository.HotelRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.RoomRepository;

/** Base comun: utilidades para crear usuarios con token y habitaciones. */
@SpringBootTest
@AutoConfigureMockMvc
abstract class TestSupport {

	@Autowired protected MockMvc mvc;
	@Autowired protected HotelRepository hotels;
	@Autowired protected RoomRepository rooms;

	protected String registerAndGetToken(String username) throws Exception {
		String json = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"" + username + "\",\"email\":\"" + username + "@t.com\",\"password\":\"password1\"}"))
				.andReturn().getResponse().getContentAsString();
		return json.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
	}

	protected Room newRoom(int price) {
		Hotel h = hotels.save(Hotel.builder().name("H").location("L").description("d").rating(4.0).build());
		return rooms.save(Room.builder().hotel(h).roomNumber("1").type("Doble").pricePerNight(price).availbility(true).build());
	}

	protected String reservationJson(Long roomId, java.time.LocalDate in, java.time.LocalDate out) {
		return "{\"roomId\":" + roomId + ",\"checkIn\":\"" + in + "\",\"checkOut\":\"" + out + "\"}";
	}
}
