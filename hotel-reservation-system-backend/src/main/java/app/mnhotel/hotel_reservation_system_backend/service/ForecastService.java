package app.mnhotel.hotel_reservation_system_backend.service;

import app.mnhotel.hotel_reservation_system_backend.dto.ForecastDTO;

public interface ForecastService {

	/** @param historyMonths meses de historico a incluir (el mes en curso incluido) */
	ForecastDTO forecast(int historyMonths, int horizonMonths);
}
