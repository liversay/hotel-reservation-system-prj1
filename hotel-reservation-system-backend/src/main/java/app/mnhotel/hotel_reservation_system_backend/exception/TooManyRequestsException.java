package app.mnhotel.hotel_reservation_system_backend.exception;

public class TooManyRequestsException extends RuntimeException {

	public TooManyRequestsException(String message) {
		super(message);
	}
}
