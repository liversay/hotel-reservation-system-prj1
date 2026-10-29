package app.mnhotel.hotel_reservation_system_backend.service.imp;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.mnhotel.hotel_reservation_system_backend.dto.DayAvailabilityDTO;
import app.mnhotel.hotel_reservation_system_backend.dto.RoomDTO;
import app.mnhotel.hotel_reservation_system_backend.entity.Hotel;
import app.mnhotel.hotel_reservation_system_backend.entity.Reservation;
import app.mnhotel.hotel_reservation_system_backend.entity.Room;
import app.mnhotel.hotel_reservation_system_backend.exception.BadRequestException;
import app.mnhotel.hotel_reservation_system_backend.exception.ConflictException;
import app.mnhotel.hotel_reservation_system_backend.exception.ResourceNotFoundException;
import app.mnhotel.hotel_reservation_system_backend.repository.HotelRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.ReservationRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.RoomRepository;
import app.mnhotel.hotel_reservation_system_backend.service.RoomService;

@Service
public class RoomServiceImp implements RoomService {

	private final RoomRepository roomRepository;
	private final HotelRepository hotelRepository;
	private final ReservationRepository reservationRepository;

	public RoomServiceImp(RoomRepository roomRepository, HotelRepository hotelRepository,
			ReservationRepository reservationRepository) {
		this.roomRepository = roomRepository;
		this.hotelRepository = hotelRepository;
		this.reservationRepository = reservationRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<RoomDTO> findByHotel(Long hotelId) {
		return roomRepository.findByHotelId(hotelId).stream().map(RoomServiceImp::toDTO).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public RoomDTO findById(Long id) {
		return toDTO(roomRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Habitacion no encontrada: " + id)));
	}

	@Override
	@Transactional(readOnly = true)
	public List<RoomDTO> findAll() {
		return roomRepository.findAll().stream().map(RoomServiceImp::toDTO).toList();
	}

	@Override
	@Transactional
	public RoomDTO update(Long id, RoomDTO dto) {
		Room room = roomRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Habitacion no encontrada: " + id));
		if (dto.getPricePerNight() == null || dto.getPricePerNight() <= 0) {
			throw new BadRequestException("pricePerNight debe ser mayor que 0");
		}
		if (dto.getHotelId() != null && !dto.getHotelId().equals(room.getHotel().getId())) {
			room.setHotel(hotelRepository.findById(dto.getHotelId())
					.orElseThrow(() -> new ResourceNotFoundException("Hotel no encontrado: " + dto.getHotelId())));
		}
		room.setRoomNumber(dto.getRoomNumber());
		room.setType(dto.getType());
		room.setPricePerNight(dto.getPricePerNight());
		if (dto.getAvailability() != null) room.setAvailbility(dto.getAvailability());
		return toDTO(room);
	}

	@Override
	@Transactional
	public void delete(Long id) {
		if (!roomRepository.existsById(id)) {
			throw new ResourceNotFoundException("Habitacion no encontrada: " + id);
		}
		if (reservationRepository.existsByRoomId(id)) {
			throw new ConflictException("No se puede eliminar: la habitacion tiene reservas asociadas");
		}
		roomRepository.deleteById(id);
	}

	@Override
	@Transactional
	public RoomDTO create(RoomDTO dto) {
		if (dto.getHotelId() == null) {
			throw new BadRequestException("hotelId es obligatorio");
		}
		if (dto.getPricePerNight() == null || dto.getPricePerNight() <= 0) {
			throw new BadRequestException("pricePerNight debe ser mayor que 0");
		}
		Hotel hotel = hotelRepository.findById(dto.getHotelId())
				.orElseThrow(() -> new ResourceNotFoundException("Hotel no encontrado: " + dto.getHotelId()));
		Room room = roomRepository.save(Room.builder().hotel(hotel).roomNumber(dto.getRoomNumber())
				.type(dto.getType()).pricePerNight(dto.getPricePerNight()).availbility(true).build());
		return toDTO(room);
	}

	@Override
	@Transactional(readOnly = true)
	public List<DayAvailabilityDTO> availability(Long roomId, YearMonth month) {
		if (!roomRepository.existsById(roomId)) {
			throw new ResourceNotFoundException("Habitacion no encontrada: " + roomId);
		}
		LocalDate first = month.atDay(1);
		LocalDate lastExclusive = month.plusMonths(1).atDay(1);
		List<Reservation> busy = reservationRepository.findActiveOverlapping(roomId,
				first.atStartOfDay(), lastExclusive.atStartOfDay());
		LocalDate today = LocalDate.now();
		List<DayAvailabilityDTO> days = new ArrayList<>();
		for (LocalDate d = first; d.isBefore(lastExclusive); d = d.plusDays(1)) {
			days.add(new DayAvailabilityDTO(d, statusOf(d, today, busy)));
		}
		return days;
	}

	/** La noche del dia d esta ocupada si start <= d < end (check-out exclusivo). */
	static String statusOf(LocalDate d, LocalDate today, List<Reservation> busy) {
		if (d.isBefore(today)) {
			return "PAST";
		}
		boolean occupied = busy.stream().anyMatch(r ->
				!r.getStartDate().toLocalDate().isAfter(d) && r.getEndDate().toLocalDate().isAfter(d));
		return occupied ? "OCCUPIED" : "AVAILABLE";
	}

	static RoomDTO toDTO(Room r) {
		return RoomDTO.builder().id(r.getId()).roomNumber(r.getRoomNumber()).type(r.getType())
				.pricePerNight(r.getPricePerNight()).availability(r.getAvailbility())
				.hotelId(r.getHotel() != null ? r.getHotel().getId() : null).build();
	}
}
