package app.mnhotel.hotel_reservation_system_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

/** Metodo de pago guardado. Nunca almacena el numero completo (PAN) ni el CVV: solo un token del proveedor. */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "saved_payment_methods")
public class SavedPaymentMethod {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id")
	@JsonIgnore
	@ToString.Exclude
	private User user;

	@Column(name = "brand")
	private String brand;

	@Column(name = "last4", length = 4)
	private String last4;

	@Column(name = "holder_name")
	private String holderName;

	@Column(name = "exp_month")
	private Integer expMonth;

	@Column(name = "exp_year")
	private Integer expYear;

	@Column(name = "provider_token", nullable = false)
	@JsonIgnore
	@ToString.Exclude
	private String providerToken;

	@Column(name = "is_default")
	private boolean defaultMethod;
}
