package app.mnhotel.hotel_reservation_system_backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import app.mnhotel.hotel_reservation_system_backend.dto.ForecastDTO;
import app.mnhotel.hotel_reservation_system_backend.service.ForecastService;

/** Protegido por SecurityConfig: /api/admin/** requiere ROLE_ADMIN. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private final ForecastService forecastService;

	public AdminController(ForecastService forecastService) {
		this.forecastService = forecastService;
	}

	@GetMapping("/forecast")
	public ForecastDTO forecast(@RequestParam(defaultValue = "12") int historyMonths,
			@RequestParam(defaultValue = "3") int horizonMonths) {
		return forecastService.forecast(historyMonths, horizonMonths);
	}
}
