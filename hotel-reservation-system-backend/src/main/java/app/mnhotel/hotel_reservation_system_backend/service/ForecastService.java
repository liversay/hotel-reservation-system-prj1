package app.mnhotel.hotel_reservation_system_backend.service;

import app.mnhotel.hotel_reservation_system_backend.dto.ForecastDTO;

public interface ForecastService {

	/** @param historyMonths meses COMPLETOS de historico; la prevision empieza en el mes en curso */
	ForecastDTO forecast(int historyMonths, int horizonMonths);
}
