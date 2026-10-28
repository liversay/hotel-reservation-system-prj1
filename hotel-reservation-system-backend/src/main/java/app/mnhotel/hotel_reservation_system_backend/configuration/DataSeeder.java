package app.mnhotel.hotel_reservation_system_backend.configuration;

import java.time.LocalDateTime;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import app.mnhotel.hotel_reservation_system_backend.entity.Hotel;
import app.mnhotel.hotel_reservation_system_backend.entity.Reservation;
import app.mnhotel.hotel_reservation_system_backend.entity.Room;
import app.mnhotel.hotel_reservation_system_backend.entity.User;
import app.mnhotel.hotel_reservation_system_backend.repository.HotelRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.ReservationRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.RoomRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.UserRepository;

/** Datos de demostracion; solo con app.seed.enabled=true (perfil dev). Credenciales: admin/admin12345, demo/demo12345. */
@Configuration
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DataSeeder {

	@Bean
	CommandLineRunner seed(UserRepository users, HotelRepository hotels, RoomRepository rooms,
			ReservationRepository reservations, PasswordEncoder enc) {
		return args -> {
			if (users.count() > 0) return;
			users.save(User.builder().username("admin").email("admin@hotel.test").role("ADMIN")
					.password(enc.encode("admin12345")).createdAt(LocalDateTime.now()).build());
			User demo = users.save(User.builder().username("demo").email("demo@hotel.test").role("USER")
					.password(enc.encode("demo12345")).createdAt(LocalDateTime.now()).build());
			Hotel h = hotels.save(Hotel.builder().name("MN Hotel Centro").location("Ciudad de Panama")
					.description("Hotel de demostracion").rating(4.5).build());
			java.util.List<Room> all = new java.util.ArrayList<>();
			for (int i = 1; i <= 5; i++) {
				all.add(rooms.save(Room.builder().hotel(h).roomNumber("10" + i).type(i <= 3 ? "Doble" : "Suite")
						.pricePerNight(i <= 3 ? 80 : 150).availbility(true).build()));
			}
			// Historico de 12 meses con tendencia al alza y estacionalidad, para la prevision de demanda.
			java.time.LocalDate today = java.time.LocalDate.now();
			for (int m = 12; m >= 1; m--) {
				java.time.YearMonth ym = java.time.YearMonth.from(today).minusMonths(m);
				int stays = 8 + (12 - m) / 2 + (ym.getMonthValue() == 12 || ym.getMonthValue() == 7 ? 6 : 0);
				for (int s = 0; s < stays; s++) {
					Room room = all.get(s % all.size());
					java.time.LocalDate in = ym.atDay(1 + (s * 3) % 26);
					int nights = 2 + s % 3;
					reservations.save(Reservation.builder().user(demo).room(room).startDate(in.atStartOfDay())
							.endDate(in.plusDays(nights).atStartOfDay()).status("COMPLETED")
							.totalPrice(nights * room.getPricePerNight()).createdAt(in.minusDays(10).atStartOfDay()).build());
				}
			}
		};
	}
}
