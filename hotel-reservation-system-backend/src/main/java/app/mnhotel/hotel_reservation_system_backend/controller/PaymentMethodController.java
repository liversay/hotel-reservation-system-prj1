package app.mnhotel.hotel_reservation_system_backend.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.mnhotel.hotel_reservation_system_backend.dto.PaymentMethodDTO;
import app.mnhotel.hotel_reservation_system_backend.dto.PaymentMethodRequest;
import app.mnhotel.hotel_reservation_system_backend.service.PaymentMethodService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payment-methods")
public class PaymentMethodController {

	private final PaymentMethodService service;

	public PaymentMethodController(PaymentMethodService service) {
		this.service = service;
	}

	@GetMapping
	public List<PaymentMethodDTO> list(Principal principal) {
		return service.list(principal.getName());
	}

	@PostMapping
	public ResponseEntity<PaymentMethodDTO> save(Principal principal, @Valid @RequestBody PaymentMethodRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(service.save(principal.getName(), request));
	}

	@PutMapping("/{id}/default")
	public PaymentMethodDTO setDefault(Principal principal, @PathVariable Long id) {
		return service.setDefault(principal.getName(), id);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(Principal principal, @PathVariable Long id) {
		service.delete(principal.getName(), id);
		return ResponseEntity.noContent().build();
	}
}
