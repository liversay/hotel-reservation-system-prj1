package app.mnhotel.hotel_reservation_system_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodDTO {
	private Long id;
	private String brand;
	private String last4;
	private String holderName;
	private Integer expMonth;
	private Integer expYear;
	private boolean defaultMethod;
}
