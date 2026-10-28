package app.mnhotel.hotel_reservation_system_backend.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForecastDTO {
	private int totalRooms;
	private List<Point> history;
	private List<Point> forecast;

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class Point {
		private String month;       // YYYY-MM
		private double roomNights;  // noches-habitacion reservadas (prevision: estimadas)
		private double revenue;     // ingresos (solo historico)
		private double occupancy;   // 0..1
		private int suggestedPriceChangePct; // solo prevision
	}
}
