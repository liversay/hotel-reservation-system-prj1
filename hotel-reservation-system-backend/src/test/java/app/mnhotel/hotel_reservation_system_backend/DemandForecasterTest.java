package app.mnhotel.hotel_reservation_system_backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import app.mnhotel.hotel_reservation_system_backend.service.DemandForecaster;

class DemandForecasterTest {

	@Test
	void emptyHistoryForecastsZeros() {
		assertEquals(List.of(0.0, 0.0, 0.0), DemandForecaster.forecast(List.of(), 3));
	}

	@Test
	void constantSeriesForecastsSameValue() {
		List<Double> f = DemandForecaster.forecast(List.of(10.0, 10.0, 10.0, 10.0), 2);
		assertEquals(List.of(10.0, 10.0), f);
	}

	@Test
	void growingSeriesForecastsAboveRecentAverage() {
		List<Double> hist = List.of(10.0, 12.0, 14.0, 16.0, 18.0, 20.0);
		List<Double> f = DemandForecaster.forecast(hist, 3);
		assertTrue(f.get(0) > 18.0, "debe superar el promedio reciente (18): " + f);
		assertTrue(f.get(2) > f.get(0), "la tendencia al alza debe crecer: " + f);
	}

	@Test
	void decliningSeriesNeverGoesNegative() {
		List<Double> f = DemandForecaster.forecast(List.of(10.0, 6.0, 3.0, 1.0, 0.0), 12);
		f.forEach(v -> assertTrue(v >= 0, "no negativos: " + f));
	}

	@Test
	void singlePointRepeatsItself() {
		assertEquals(List.of(7.0, 7.0), DemandForecaster.forecast(List.of(7.0), 2));
	}

	@Test
	void priceSuggestionThresholds() {
		assertEquals(10, DemandForecaster.suggestedPriceChangePct(0.90));
		assertEquals(10, DemandForecaster.suggestedPriceChangePct(0.85));
		assertEquals(5, DemandForecaster.suggestedPriceChangePct(0.75));
		assertEquals(0, DemandForecaster.suggestedPriceChangePct(0.50));
		assertEquals(-10, DemandForecaster.suggestedPriceChangePct(0.35));
		assertEquals(-10, DemandForecaster.suggestedPriceChangePct(0.0));
	}
}
