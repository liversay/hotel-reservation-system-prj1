package app.mnhotel.hotel_reservation_system_backend.service;

import java.util.List;

import app.mnhotel.hotel_reservation_system_backend.dto.ReservationDTO;
import app.mnhotel.hotel_reservation_system_backend.dto.ReservationRequest;

public interface ReservationService {

	ReservationDTO create(String username, ReservationRequest request);

	List<ReservationDTO> findMine(String username);
}
