package app.mnhotel.hotel_reservation_system_backend.exception;

import java.time.format.DateTimeParseException;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import app.mnhotel.hotel_reservation_system_backend.response.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Map<String, String> FIELD_LABELS = Map.ofEntries(
			Map.entry("pricePerNight", "Precio por noche"),
			Map.entry("roomNumber", "Número de habitación"),
			Map.entry("type", "Tipo"),
			Map.entry("rating", "Calificación"),
			Map.entry("expMonth", "Mes de vencimiento"),
			Map.entry("expYear", "Año de vencimiento"),
			Map.entry("cardNumber", "Número de tarjeta"),
			Map.entry("holderName", "Titular"),
			Map.entry("username", "Usuario"),
			Map.entry("email", "Correo"),
			Map.entry("password", "Contraseña"),
			Map.entry("roomId", "Habitación"),
			Map.entry("checkIn", "Fecha de entrada"),
			Map.entry("checkOut", "Fecha de salida"),
			Map.entry("hotelId", "Hotel"),
			Map.entry("name", "Nombre"),
			Map.entry("location", "Ubicación"),
			Map.entry("description", "Descripción"));

	@ExceptionHandler(ResourceNotFoundException.class)
	ResponseEntity<ApiResponse> notFound(ResourceNotFoundException e) {
		return build(HttpStatus.NOT_FOUND, e.getMessage());
	}

	@ExceptionHandler(ConflictException.class)
	ResponseEntity<ApiResponse> conflict(ConflictException e) {
		return build(HttpStatus.CONFLICT, e.getMessage());
	}

	@ExceptionHandler(BadRequestException.class)
	ResponseEntity<ApiResponse> badRequest(BadRequestException e) {
		return build(HttpStatus.BAD_REQUEST, e.getMessage());
	}

	/** Mensaje generico: el de una IllegalArgumentException proviene de librerias y no debe filtrarse. */
	@ExceptionHandler(IllegalArgumentException.class)
	ResponseEntity<ApiResponse> illegalArgument(IllegalArgumentException e) {
		return build(HttpStatus.BAD_REQUEST, "Solicitud inválida");
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<ApiResponse> validation(MethodArgumentNotValidException e) {
		String msg = e.getBindingResult().getFieldErrors().stream()
				.map(f -> FIELD_LABELS.getOrDefault(f.getField(), f.getField()) + ": " + f.getDefaultMessage()).findFirst().orElse("Solicitud inválida");
		return build(HttpStatus.BAD_REQUEST, msg);
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	ResponseEntity<ApiResponse> unreadable(HttpMessageNotReadableException e) {
		return build(HttpStatus.BAD_REQUEST, "Cuerpo de la solicitud inválido o malformado");
	}

	@ExceptionHandler({ MethodArgumentTypeMismatchException.class, DateTimeParseException.class })
	ResponseEntity<ApiResponse> invalidFormat(Exception e) {
		return build(HttpStatus.BAD_REQUEST, "Parámetro con formato inválido");
	}

	@ExceptionHandler(MissingServletRequestParameterException.class)
	ResponseEntity<ApiResponse> missingParam(MissingServletRequestParameterException e) {
		return build(HttpStatus.BAD_REQUEST, "Falta el parámetro: " + e.getParameterName());
	}

	@ExceptionHandler(NoResourceFoundException.class)
	ResponseEntity<ApiResponse> noResource(NoResourceFoundException e) {
		return build(HttpStatus.NOT_FOUND, "Recurso no encontrado");
	}

	@ExceptionHandler(TooManyRequestsException.class)
	ResponseEntity<ApiResponse> tooMany(TooManyRequestsException e) {
		return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).header(HttpHeaders.RETRY_AFTER, "900")
				.body(new ApiResponse(e.getMessage()));
	}

	@ExceptionHandler(BadCredentialsException.class)
	ResponseEntity<ApiResponse> badCredentials(BadCredentialsException e) {
		return build(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
	}

	@ExceptionHandler(AccessDeniedException.class)
	ResponseEntity<ApiResponse> denied(AccessDeniedException e) {
		return build(HttpStatus.FORBIDDEN, "Acceso denegado");
	}

	private ResponseEntity<ApiResponse> build(HttpStatus status, String message) {
		return ResponseEntity.status(status).body(new ApiResponse(message));
	}
}
