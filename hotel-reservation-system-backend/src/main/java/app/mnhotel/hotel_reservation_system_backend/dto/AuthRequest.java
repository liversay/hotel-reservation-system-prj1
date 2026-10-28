package app.mnhotel.hotel_reservation_system_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {
	@NotBlank
	private String username;
	@Email
	private String email; // requerido solo en registro
	@ToString.Exclude
	@NotBlank
	@Size(min = 8, message = "La contrasena debe tener al menos 8 caracteres")
	private String password;
}
