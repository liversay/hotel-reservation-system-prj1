package app.mnhotel.hotel_reservation_system_backend.exception;

import java.time.format.DateTimeParseException;

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

	@ExceptionHandler(HttpMessageNotReadableException.class)
	ResponseEntity<ApiResponse> unreadable(HttpMessageNotReadableException e) {
		return build(HttpStatus.BAD_REQUEST, "Cuerpo de la solicitud invalido o malformado");
	}

	@ExceptionHandler({ MethodArgumentTypeMismatchException.class, DateTimeParseException.class })
	ResponseEntity<ApiResponse> invalidFormat(Exception e) {
		return build(HttpStatus.BAD_REQUEST, "Parametro con formato invalido");
	}

	@ExceptionHandler(MissingServletRequestParameterException.class)
	ResponseEntity<ApiResponse> missingParam(MissingServletRequestParameterException e) {
		return build(HttpStatus.BAD_REQUEST, "Falta el parametro: " + e.getParameterName());
	}

	@ExceptionHandler(NoResourceFoundException.class)
	ResponseEntity<ApiResponse> noResource(NoResourceFoundException e) {
		return build(HttpStatus.NOT_FOUND, "Recurso no encontrado");
	}

	@ExceptionHandler(TooManyRequestsException.class)
	ResponseEntity<ApiResponse> tooMany(TooManyRequestsException e) {
		return build(HttpStatus.TOO_MANY_REQUESTS, e.getMessage());
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
