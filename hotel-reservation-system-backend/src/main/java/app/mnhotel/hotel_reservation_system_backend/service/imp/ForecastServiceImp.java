package app.mnhotel.hotel_reservation_system_backend.service.imp;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.mnhotel.hotel_reservation_system_backend.dto.ForecastDTO;
import app.mnhotel.hotel_reservation_system_backend.dto.ForecastDTO.Point;
import app.mnhotel.hotel_reservation_system_backend.entity.Reservation;
import app.mnhotel.hotel_reservation_system_backend.exception.BadRequestException;
import app.mnhotel.hotel_reservation_system_backend.repository.ReservationRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.RoomRepository;
import app.mnhotel.hotel_reservation_system_backend.service.DemandForecaster;
import app.mnhotel.hotel_reservation_system_backend.service.ForecastService;

@Service
public class ForecastServiceImp implements ForecastService {

	private final ReservationRepository reservationRepository;
	private final RoomRepository roomRepository;

	public ForecastServiceImp(ReservationRepository reservationRepository, RoomRepository roomRepository) {
		this.reservationRepository = reservationRepository;
		this.roomRepository = roomRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public ForecastDTO forecast(int historyMonths, int horizonMonths) {
		if (historyMonths < 1 || historyMonths > 36 || horizonMonths < 1 || horizonMonths > 12) {
			throw new BadRequestException("historyMonths debe estar entre 1 y 36 y horizonMonths entre 1 y 12");
		}
		int rooms = (int) roomRepository.count();
		YearMonth current = YearMonth.now();
		// Historico = ultimos N meses COMPLETOS (el mes en curso esta incompleto y sesgaria la serie a la baja).
		YearMonth first = current.minusMonths(historyMonths);
		YearMonth lastForecast = current.plusMonths(horizonMonths - 1L);

		Map<YearMonth, double[]> acc = new TreeMap<>(); // [noches, ingresos]
		for (YearMonth m = first; !m.isAfter(lastForecast); m = m.plusMonths(1)) acc.put(m, new double[2]);

		List<Reservation> all = reservationRepository.findActiveBetween(first.atDay(1).atStartOfDay(),
				lastForecast.plusMonths(1).atDay(1).atStartOfDay());
		for (Reservation r : all) {
			// Prorrateo por noche: una reserva que cruza de mes reparte noches e ingresos entre ambos meses.
			int nights = (int) java.time.temporal.ChronoUnit.DAYS.between(r.getStartDate().toLocalDate(), r.getEndDate().toLocalDate());
			if (nights <= 0) continue;
			double perNight = r.getTotalPrice() == null ? 0 : (double) r.getTotalPrice() / nights;
			for (LocalDate d = r.getStartDate().toLocalDate(); d.isBefore(r.getEndDate().toLocalDate()); d = d.plusDays(1)) {
				double[] a = acc.get(YearMonth.from(d));
				if (a != null) { a[0] += 1; a[1] += perNight; }
			}
		}

		List<Point> history = new ArrayList<>();
		List<Double> series = new ArrayList<>();
		for (YearMonth m = first; m.isBefore(current); m = m.plusMonths(1)) {
			double[] a = acc.get(m);
			history.add(new Point(m.toString(), a[0], Math.round(a[1] * 100) / 100.0, occupancy(a[0], m, rooms), 0));
			series.add(a[0]);
		}

		// Prevision desde el mes en curso. Lo ya reservado es un piso: no se preve menos de lo confirmado.
		List<Double> predicted = DemandForecaster.forecast(series, horizonMonths);
		List<Point> forecast = new ArrayList<>();
		for (int k = 0; k < horizonMonths; k++) {
			YearMonth m = current.plusMonths(k);
			double nights = Math.max(predicted.get(k), acc.get(m)[0]);
			double occ = occupancy(nights, m, rooms);
			forecast.add(new Point(m.toString(), nights, 0, occ, DemandForecaster.suggestedPriceChangePct(occ)));
		}
		return new ForecastDTO(rooms, history, forecast);
	}

	static double occupancy(double roomNights, YearMonth m, int rooms) {
		if (rooms == 0) return 0;
		return Math.min(1.0, Math.round(roomNights / (rooms * (double) m.lengthOfMonth()) * 1000) / 1000.0);
	}
}
