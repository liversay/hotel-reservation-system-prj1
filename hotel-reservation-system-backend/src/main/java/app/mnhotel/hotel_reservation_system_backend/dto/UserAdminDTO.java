package app.mnhotel.hotel_reservation_system_backend.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAdminDTO {
	private Long id;
	private String username;
	private String email;
	private String role;
	private LocalDateTime createdAt;
}
