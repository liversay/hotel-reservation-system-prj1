package app.mnhotel.hotel_reservation_system_backend.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
	@ToString.Exclude
	private String token;
	private String username;
	private String role;
}
