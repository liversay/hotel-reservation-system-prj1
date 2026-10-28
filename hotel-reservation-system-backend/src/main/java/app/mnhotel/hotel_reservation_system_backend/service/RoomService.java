package app.mnhotel.hotel_reservation_system_backend.service;

import java.time.YearMonth;
import java.util.List;

import app.mnhotel.hotel_reservation_system_backend.dto.DayAvailabilityDTO;
import app.mnhotel.hotel_reservation_system_backend.dto.RoomDTO;

public interface RoomService {

	List<RoomDTO> findByHotel(Long hotelId);

	RoomDTO findById(Long id);

	RoomDTO create(RoomDTO room);

	List<DayAvailabilityDTO> availability(Long roomId, YearMonth month);
}
