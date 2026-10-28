package app.mnhotel.hotel_reservation_system_backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import app.mnhotel.hotel_reservation_system_backend.response.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ResourceNotFoundException.class)
	ResponseEntity<ApiResponse> notFound(ResourceNotFoundException e) {
		return build(HttpStatus.NOT_FOUND, e.getMessage());
	}

	@ExceptionHandler(ConflictException.class)
	ResponseEntity<ApiResponse> conflict(ConflictException e) {
		return build(HttpStatus.CONFLICT, e.getMessage());
	}

	@ExceptionHandler({ BadRequestException.class, IllegalArgumentException.class })
	ResponseEntity<ApiResponse> badRequest(RuntimeException e) {
		return build(HttpStatus.BAD_REQUEST, e.getMessage());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<ApiResponse> validation(MethodArgumentNotValidException e) {
		String msg = e.getBindingResult().getFieldErrors().stream()
				.map(f -> f.getField() + ": " + f.getDefaultMessage()).findFirst().orElse("Solicitud invalida");
		return build(HttpStatus.BAD_REQUEST, msg);
	}

	@ExceptionHandler(BadCredentialsException.class)
	ResponseEntity<ApiResponse> badCredentials(BadCredentialsException e) {
		return build(HttpStatus.UNAUTHORIZED, "Credenciales invalidas");
	}

	@ExceptionHandler(AccessDeniedException.class)
	ResponseEntity<ApiResponse> denied(AccessDeniedException e) {
		return build(HttpStatus.FORBIDDEN, "Acceso denegado");
	}

	private ResponseEntity<ApiResponse> build(HttpStatus status, String message) {
		return ResponseEntity.status(status).body(new ApiResponse(message));
	}
}
