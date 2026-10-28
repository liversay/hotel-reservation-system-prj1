package app.mnhotel.hotel_reservation_system_backend.service;

import java.util.List;

import app.mnhotel.hotel_reservation_system_backend.dto.PaymentMethodDTO;
import app.mnhotel.hotel_reservation_system_backend.dto.PaymentMethodRequest;

public interface PaymentMethodService {

	PaymentMethodDTO save(String username, PaymentMethodRequest request);

	List<PaymentMethodDTO> list(String username);

	void delete(String username, Long id);

	PaymentMethodDTO setDefault(String username, Long id);
}
