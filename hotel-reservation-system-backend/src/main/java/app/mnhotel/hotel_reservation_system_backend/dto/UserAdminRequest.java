package app.mnhotel.hotel_reservation_system_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserAdminRequest {
	private String username;
	private String email;
	/** Obligatoria al crear; opcional al editar (vacia = no cambia). */
	@ToString.Exclude
	private String password;
	/** USER | ADMIN */
	private String role;
}
