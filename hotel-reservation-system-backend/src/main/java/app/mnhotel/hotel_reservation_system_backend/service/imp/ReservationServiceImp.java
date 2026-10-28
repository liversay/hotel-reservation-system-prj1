package app.mnhotel.hotel_reservation_system_backend.service.imp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.mnhotel.hotel_reservation_system_backend.dto.PaymentDTO;
import app.mnhotel.hotel_reservation_system_backend.dto.ReservationDTO;
import app.mnhotel.hotel_reservation_system_backend.dto.ReservationRequest;
import app.mnhotel.hotel_reservation_system_backend.entity.Reservation;
import app.mnhotel.hotel_reservation_system_backend.entity.Payment;
import app.mnhotel.hotel_reservation_system_backend.entity.Room;
import app.mnhotel.hotel_reservation_system_backend.entity.SavedPaymentMethod;
import app.mnhotel.hotel_reservation_system_backend.entity.User;
import app.mnhotel.hotel_reservation_system_backend.exception.BadRequestException;
import app.mnhotel.hotel_reservation_system_backend.exception.ConflictException;
import app.mnhotel.hotel_reservation_system_backend.exception.ResourceNotFoundException;
import app.mnhotel.hotel_reservation_system_backend.repository.ReservationRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.RoomRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.SavedPaymentMethodRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.UserRepository;
import app.mnhotel.hotel_reservation_system_backend.service.ReservationService;

@Service
public class ReservationServiceImp implements ReservationService {

	static final int MAX_NIGHTS = 30;

	private final ReservationRepository reservationRepository;
	private final RoomRepository roomRepository;
	private final UserRepository userRepository;
	private final SavedPaymentMethodRepository paymentMethodRepository;

	public ReservationServiceImp(ReservationRepository reservationRepository, RoomRepository roomRepository,
			UserRepository userRepository, SavedPaymentMethodRepository paymentMethodRepository) {
		this.reservationRepository = reservationRepository;
		this.roomRepository = roomRepository;
		this.userRepository = userRepository;
		this.paymentMethodRepository = paymentMethodRepository;
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
		SavedPaymentMethod method = null;
		if (req.getSavedPaymentMethodId() != null) {
			method = paymentMethodRepository.findByIdAndUserUsername(req.getSavedPaymentMethodId(), username)
					.orElseThrow(() -> new ResourceNotFoundException("Metodo de pago no encontrado"));
			if (YearMonth.of(method.getExpYear(), method.getExpMonth()).isBefore(YearMonth.from(req.getCheckIn()))) {
				throw new BadRequestException("La tarjeta vence antes de la fecha de entrada");
			}
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
		if (method != null) {
			// Cobro simulado contra el token guardado; en produccion se llamaria a la pasarela con method.getProviderToken().
			saved.setPayments(new java.util.ArrayList<>(java.util.List.of(Payment.builder().reservation(saved)
					.amount(saved.getTotalPrice()).paymentDate(LocalDateTime.now()).status("PAID")
					.methodLabel(method.getBrand() + " **** " + method.getLast4()).build())));
			reservationRepository.saveAndFlush(saved);
		}
		return toDTO(saved);
	}

	@Override
	@Transactional(readOnly = true)
	public List<ReservationDTO> findMine(String username) {
		return reservationRepository.findByUserUsernameOrderByStartDateDesc(username).stream()
				.map(ReservationServiceImp::toDTO).toList();
	}

	@Override
	@Transactional
	public ReservationDTO cancel(String username, boolean isAdmin, Long id) {
		Reservation r = reservationRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada: " + id));
		// 404 (no 403) para no revelar la existencia de reservas ajenas.
		if (!isAdmin && !r.getUser().getUsername().equals(username)) {
			throw new ResourceNotFoundException("Reserva no encontrada: " + id);
		}
		if ("CANCELLED".equals(r.getStatus())) {
			throw new ConflictException("La reserva ya esta cancelada");
		}
		if (!r.getStartDate().toLocalDate().isAfter(LocalDate.now())) {
			throw new BadRequestException("No se puede cancelar una reserva ya iniciada o pasada");
		}
		r.setStatus("CANCELLED");
		if (r.getPayments() != null) {
			r.getPayments().stream().filter(p -> "PAID".equals(p.getStatus())).forEach(p -> p.setStatus("REFUNDED"));
		}
		return toDTO(reservationRepository.save(r));
	}

	static ReservationDTO toDTO(Reservation r) {
		return ReservationDTO.builder().id(r.getId()).startDate(r.getStartDate()).endDate(r.getEndDate())
				.status(r.getStatus()).totalPrice(r.getTotalPrice()).createdAt(r.getCreatedAt())
				.room(RoomServiceImp.toDTO(r.getRoom()))
				.payments(r.getPayments() == null ? List.of() : r.getPayments().stream()
						.map(p -> PaymentDTO.builder().id(p.getId()).amount(p.getAmount())
								.paymentDate(p.getPaymentDate()).status(p.getStatus()).methodLabel(p.getMethodLabel()).build())
						.toList())
				.build();
	}
}
