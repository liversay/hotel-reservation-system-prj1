package app.mnhotel.hotel_reservation_system_backend.service.imp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.mnhotel.hotel_reservation_system_backend.dto.ReservationDTO;
import app.mnhotel.hotel_reservation_system_backend.dto.ReservationRequest;
import app.mnhotel.hotel_reservation_system_backend.entity.Reservation;
import app.mnhotel.hotel_reservation_system_backend.entity.Room;
import app.mnhotel.hotel_reservation_system_backend.entity.User;
import app.mnhotel.hotel_reservation_system_backend.exception.BadRequestException;
import app.mnhotel.hotel_reservation_system_backend.exception.ConflictException;
import app.mnhotel.hotel_reservation_system_backend.exception.ResourceNotFoundException;
import app.mnhotel.hotel_reservation_system_backend.repository.ReservationRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.RoomRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.UserRepository;
import app.mnhotel.hotel_reservation_system_backend.service.ReservationService;

@Service
public class ReservationServiceImp implements ReservationService {

	static final int MAX_NIGHTS = 30;

	private final ReservationRepository reservationRepository;
	private final RoomRepository roomRepository;
	private final UserRepository userRepository;

	public ReservationServiceImp(ReservationRepository reservationRepository, RoomRepository roomRepository,
			UserRepository userRepository) {
		this.reservationRepository = reservationRepository;
		this.roomRepository = roomRepository;
		this.userRepository = userRepository;
	}

	@Override
	@Transactional
	public ReservationDTO create(String username, ReservationRequest req) {
		LocalDate today = LocalDate.now();
		if (!req.getCheckOut().isAfter(req.getCheckIn())) {
			throw new BadRequestException("La salida debe ser posterior a la entrada");
		}
		if (req.getCheckIn().isBefore(today)) {
			throw new BadRequestException("La entrada no puede ser en el pasado");
		}
		long nights = ChronoUnit.DAYS.between(req.getCheckIn(), req.getCheckOut());
		if (nights > MAX_NIGHTS) {
			throw new BadRequestException("La estancia maxima es de " + MAX_NIGHTS + " noches");
		}
		User user = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
		// Bloqueo de fila: dos reservas simultaneas de la misma habitacion se serializan.
		Room room = roomRepository.findByIdForUpdate(req.getRoomId())
				.orElseThrow(() -> new ResourceNotFoundException("Habitacion no encontrada: " + req.getRoomId()));
		LocalDateTime start = req.getCheckIn().atStartOfDay();
		LocalDateTime end = req.getCheckOut().atStartOfDay();
		if (!reservationRepository.findActiveOverlapping(room.getId(), start, end).isEmpty()) {
			throw new ConflictException("La habitacion no esta disponible en las fechas elegidas");
		}
		Reservation saved = reservationRepository.save(Reservation.builder()
				.user(user).room(room).startDate(start).endDate(end)
				.status("CONFIRMED").totalPrice((int) (nights * room.getPricePerNight()))
				.createdAt(LocalDateTime.now()).build());
		return toDTO(saved);
	}

	@Override
	@Transactional(readOnly = true)
	public List<ReservationDTO> findMine(String username) {
		return reservationRepository.findByUserUsernameOrderByStartDateDesc(username).stream()
				.map(ReservationServiceImp::toDTO).toList();
	}

	static ReservationDTO toDTO(Reservation r) {
		return ReservationDTO.builder().id(r.getId()).startDate(r.getStartDate()).endDate(r.getEndDate())
				.status(r.getStatus()).totalPrice(r.getTotalPrice()).createdAt(r.getCreatedAt())
				.room(RoomServiceImp.toDTO(r.getRoom())).build();
	}
}
