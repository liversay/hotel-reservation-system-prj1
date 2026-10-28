package app.mnhotel.hotel_reservation_system_backend.exception;

public class BadRequestException extends RuntimeException {
	public BadRequestException(String message) {
		super(message);
	}
}
