package app.mnhotel.hotel_reservation_system_backend.exception;

public class ConflictException extends RuntimeException {
	public ConflictException(String message) {
		super(message);
	}
}
