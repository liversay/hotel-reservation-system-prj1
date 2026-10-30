package app.mnhotel.hotel_reservation_system_backend.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationRequest {
	@NotNull(message = "es obligatorio")
	private Long roomId;
	/** Primera noche (inclusive). */
	@NotNull(message = "es obligatoria")
	private LocalDate checkIn;
	/** Dia de salida (exclusivo: la noche de este dia queda libre). */
	@NotNull(message = "es obligatoria")
	private LocalDate checkOut;
	/** Opcional: si se envia, se cobra con el metodo guardado (reserva en un clic). */
	private Long savedPaymentMethodId;
}
