package app.mnhotel.hotel_reservation_system_backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodRequest {
	/** Solo se usa para tokenizar; no se persiste ni se registra. */
	@NotBlank
	@ToString.Exclude
	private String cardNumber;
	@NotBlank
	private String holderName;
	@NotNull @Min(1) @Max(12)
	private Integer expMonth;
	@NotNull @Min(2000) @Max(2100)
	private Integer expYear;
	private boolean makeDefault;
}
