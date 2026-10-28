package app.mnhotel.hotel_reservation_system_backend.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.mnhotel.hotel_reservation_system_backend.dto.ReservationDTO;
import app.mnhotel.hotel_reservation_system_backend.dto.ReservationRequest;
import app.mnhotel.hotel_reservation_system_backend.service.ReservationService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

	private final ReservationService reservationService;

	public ReservationController(ReservationService reservationService) {
		this.reservationService = reservationService;
	}

	@PostMapping
	public ResponseEntity<ReservationDTO> create(Principal principal, @Valid @RequestBody ReservationRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(reservationService.create(principal.getName(), request));
	}

	@GetMapping("/mine")
	public List<ReservationDTO> mine(Principal principal) {
		return reservationService.findMine(principal.getName());
	}

	@PutMapping("/{id}/cancel")
	public ReservationDTO cancel(Authentication auth, @PathVariable Long id) {
		boolean admin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
		return reservationService.cancel(auth.getName(), admin, id);
	}
}
