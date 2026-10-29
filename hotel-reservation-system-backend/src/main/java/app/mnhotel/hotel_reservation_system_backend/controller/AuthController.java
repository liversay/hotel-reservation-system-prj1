package app.mnhotel.hotel_reservation_system_backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.mnhotel.hotel_reservation_system_backend.dto.AuthRequest;
import app.mnhotel.hotel_reservation_system_backend.exception.TooManyRequestsException;
import app.mnhotel.hotel_reservation_system_backend.response.AuthResponse;
import app.mnhotel.hotel_reservation_system_backend.security.LoginAttemptService;
import app.mnhotel.hotel_reservation_system_backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;

	private final LoginAttemptService loginAttempts;

	public AuthController(AuthService authService, LoginAttemptService loginAttempts) {
		this.authService = authService;
		this.loginAttempts = loginAttempts;
	}

	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request, HttpServletRequest http) {
		// getRemoteAddr(): no se confia en X-Forwarded-For (lo puede falsificar el cliente).
		String ip = http.getRemoteAddr();
		if (!loginAttempts.tryAttempt(request.getUsername(), ip)) {
			throw new TooManyRequestsException("Demasiados intentos. Inténtalo de nuevo en 15 minutos.");
		}
		AuthResponse response = authService.login(request);
		loginAttempts.recordSuccess(request.getUsername(), ip);
		return ResponseEntity.ok(response);
	}
}
