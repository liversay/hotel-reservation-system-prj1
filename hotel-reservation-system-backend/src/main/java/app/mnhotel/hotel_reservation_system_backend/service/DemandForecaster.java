package app.mnhotel.hotel_reservation_system_backend.service;

import java.util.ArrayList;
import java.util.List;

/**
 * Prevision de demanda sin dependencias externas: mezcla (50/50) una regresion lineal sobre el historico
 * con el promedio de los ultimos 3 periodos. La regresion capta la tendencia; el promedio reciente la suaviza.
 */
public final class DemandForecaster {

	private DemandForecaster() {}

	public static List<Double> forecast(List<Double> history, int horizon) {
		List<Double> out = new ArrayList<>();
		if (history.isEmpty()) {
			for (int i = 0; i < horizon; i++) out.add(0.0);
			return out;
		}
		int n = history.size();
		double avgRecent = history.subList(Math.max(0, n - 3), n).stream().mapToDouble(d -> d).average().orElse(0);
		double slope = 0, intercept = history.get(0);
		if (n >= 2) {
			double meanX = (n - 1) / 2.0, meanY = history.stream().mapToDouble(d -> d).average().orElse(0);
			double num = 0, den = 0;
			for (int i = 0; i < n; i++) {
				num += (i - meanX) * (history.get(i) - meanY);
				den += (i - meanX) * (i - meanX);
			}
			slope = den == 0 ? 0 : num / den;
			intercept = meanY - slope * meanX;
		}
		for (int k = 0; k < horizon; k++) {
			double trend = intercept + slope * (n + k);
			out.add(Math.max(0, Math.round((0.5 * trend + 0.5 * avgRecent) * 10) / 10.0));
		}
		return out;
	}

	/** Cambio de precio sugerido (%) segun ocupacion prevista (0..1). */
	public static int suggestedPriceChangePct(double occupancy) {
		if (occupancy >= 0.85) return 10;
		if (occupancy >= 0.70) return 5;
		if (occupancy <= 0.35) return -10;
		return 0;
	}
}
