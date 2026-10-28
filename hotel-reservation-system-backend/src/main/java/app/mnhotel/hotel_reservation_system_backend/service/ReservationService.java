package app.mnhotel.hotel_reservation_system_backend.service;

import java.util.List;

import app.mnhotel.hotel_reservation_system_backend.dto.ReservationDTO;
import app.mnhotel.hotel_reservation_system_backend.dto.ReservationRequest;

public interface ReservationService {

	ReservationDTO create(String username, ReservationRequest request);

	List<ReservationDTO> findMine(String username);

	/** Cancela y reembolsa pagos. Solo el dueno o un ADMIN; no se puede cancelar una estancia ya iniciada. */
	ReservationDTO cancel(String username, boolean isAdmin, Long reservationId);
}
