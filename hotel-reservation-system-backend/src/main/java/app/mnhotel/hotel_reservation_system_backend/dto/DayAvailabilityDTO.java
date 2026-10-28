package app.mnhotel.hotel_reservation_system_backend.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DayAvailabilityDTO {
	private LocalDate date;
	/** AVAILABLE | OCCUPIED | PAST */
	private String status;
}
