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

import app.mnhotel.hotel_reservation_system_backend.dto.UserAdminDTO;
import app.mnhotel.hotel_reservation_system_backend.dto.UserAdminRequest;
import app.mnhotel.hotel_reservation_system_backend.service.UserService;

/** Gestion de usuarios; /api/admin/** exige ROLE_ADMIN en SecurityConfig. */
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

	private final UserService userService;

	public AdminUserController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping
	public List<UserAdminDTO> list() {
		return userService.findAll();
	}

	@PostMapping
	public ResponseEntity<UserAdminDTO> create(@RequestBody UserAdminRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(request));
	}

	@PutMapping("/{id}")
	public UserAdminDTO update(Principal principal, @PathVariable Long id, @RequestBody UserAdminRequest request) {
		return userService.update(principal.getName(), id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(Principal principal, @PathVariable Long id) {
		userService.delete(principal.getName(), id);
		return ResponseEntity.noContent().build();
	}
}
