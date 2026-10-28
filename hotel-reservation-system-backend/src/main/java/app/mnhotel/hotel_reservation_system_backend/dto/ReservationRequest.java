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
	@NotNull
	private Long roomId;
	/** Primera noche (inclusive). */
	@NotNull
	private LocalDate checkIn;
	/** Dia de salida (exclusivo: la noche de este dia queda libre). */
	@NotNull
	private LocalDate checkOut;
}
