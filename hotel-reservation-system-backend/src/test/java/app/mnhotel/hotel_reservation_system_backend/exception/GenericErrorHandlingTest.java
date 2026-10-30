package app.mnhotel.hotel_reservation_system_backend.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class GenericErrorHandlingTest {

	private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

	@Test
	void illegalArgumentDoesNotLeakRawMessage() {
		var res = handler.illegalArgument(new IllegalArgumentException("detalle interno: columna x"));
		assertEquals(400, res.getStatusCode().value());
		assertEquals("Solicitud inválida", res.getBody().getMessage());
	}

	@Test
	void badRequestKeepsItsOwnMessage() {
		var res = handler.badRequest(new BadRequestException("Fechas incorrectas"));
		assertEquals("Fechas incorrectas", res.getBody().getMessage());
	}
}
