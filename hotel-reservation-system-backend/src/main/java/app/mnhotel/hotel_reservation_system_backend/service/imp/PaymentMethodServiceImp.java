package app.mnhotel.hotel_reservation_system_backend.service.imp;

import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.mnhotel.hotel_reservation_system_backend.dto.PaymentMethodDTO;
import app.mnhotel.hotel_reservation_system_backend.dto.PaymentMethodRequest;
import app.mnhotel.hotel_reservation_system_backend.entity.SavedPaymentMethod;
import app.mnhotel.hotel_reservation_system_backend.entity.User;
import app.mnhotel.hotel_reservation_system_backend.exception.BadRequestException;
import app.mnhotel.hotel_reservation_system_backend.exception.ResourceNotFoundException;
import app.mnhotel.hotel_reservation_system_backend.repository.SavedPaymentMethodRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.UserRepository;
import app.mnhotel.hotel_reservation_system_backend.service.PaymentMethodService;

@Service
public class PaymentMethodServiceImp implements PaymentMethodService {

	private final SavedPaymentMethodRepository repository;
	private final UserRepository userRepository;

	public PaymentMethodServiceImp(SavedPaymentMethodRepository repository, UserRepository userRepository) {
		this.repository = repository;
		this.userRepository = userRepository;
	}

	@Override
	@Transactional
	public PaymentMethodDTO save(String username, PaymentMethodRequest req) {
		String pan = req.getCardNumber().replaceAll("[\\s-]", "");
		if (!isValidPan(pan)) {
			throw new BadRequestException("Numero de tarjeta invalido");
		}
		if (isExpired(req.getExpMonth(), req.getExpYear())) {
			throw new BadRequestException("La tarjeta esta vencida");
		}
		User user = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
		boolean first = repository.findByUserUsernameOrderByIdAsc(username).isEmpty();
		if (req.isMakeDefault() || first) {
			clearDefault(username);
		}
		SavedPaymentMethod saved = repository.save(SavedPaymentMethod.builder().user(user)
				.brand(brandOf(pan)).last4(pan.substring(pan.length() - 4)).holderName(req.getHolderName())
				.expMonth(req.getExpMonth()).expYear(req.getExpYear())
				// Tokenizacion simulada: en produccion lo emite la pasarela (Mercado Pago / Stripe), no el backend.
				.providerToken("tok_" + UUID.randomUUID())
				.defaultMethod(req.isMakeDefault() || first).build());
		return toDTO(saved);
	}

	@Override
	@Transactional(readOnly = true)
	public List<PaymentMethodDTO> list(String username) {
		return repository.findByUserUsernameOrderByIdAsc(username).stream().map(PaymentMethodServiceImp::toDTO).toList();
	}

	@Override
	@Transactional
	public void delete(String username, Long id) {
		SavedPaymentMethod m = find(username, id);
		repository.delete(m);
		if (m.isDefaultMethod()) { // promover otro metodo como predeterminado
			repository.findByUserUsernameOrderByIdAsc(username).stream().findFirst().ifPresent(n -> n.setDefaultMethod(true));
		}
	}

	@Override
	@Transactional
	public PaymentMethodDTO setDefault(String username, Long id) {
		SavedPaymentMethod m = find(username, id);
		clearDefault(username);
		m.setDefaultMethod(true);
		return toDTO(m);
	}

	private SavedPaymentMethod find(String username, Long id) {
		return repository.findByIdAndUserUsername(id, username)
				.orElseThrow(() -> new ResourceNotFoundException("Metodo de pago no encontrado"));
	}

	private void clearDefault(String username) {
		repository.findByUserUsernameOrderByIdAsc(username).forEach(m -> m.setDefaultMethod(false));
	}

	static boolean isExpired(int month, int year) {
		return YearMonth.of(year, month).isBefore(YearMonth.now());
	}

	/** Algoritmo de Luhn + longitud 13-19. */
	static boolean isValidPan(String pan) {
		if (!pan.matches("\\d{13,19}")) return false;
		int sum = 0;
		boolean dbl = false;
		for (int i = pan.length() - 1; i >= 0; i--) {
			int d = pan.charAt(i) - '0';
			if (dbl) { d *= 2; if (d > 9) d -= 9; }
			sum += d;
			dbl = !dbl;
		}
		return sum % 10 == 0;
	}

	static String brandOf(String pan) {
		if (pan.startsWith("4")) return "VISA";
		if (pan.matches("^(5[1-5]|2[2-7]).*")) return "MASTERCARD";
		if (pan.matches("^3[47].*")) return "AMEX";
		return "CARD";
	}

	static PaymentMethodDTO toDTO(SavedPaymentMethod m) {
		return PaymentMethodDTO.builder().id(m.getId()).brand(m.getBrand()).last4(m.getLast4())
				.holderName(m.getHolderName()).expMonth(m.getExpMonth()).expYear(m.getExpYear())
				.defaultMethod(m.isDefaultMethod()).build();
	}
}
