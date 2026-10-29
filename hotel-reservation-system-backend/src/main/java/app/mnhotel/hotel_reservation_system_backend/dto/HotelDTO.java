package app.mnhotel.hotel_reservation_system_backend.dto;

import java.util.List;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HotelDTO {

    private Long id;
	private String name;
    private String location;
	private String description;
	@DecimalMin(value = "1.0", message = "rating debe estar entre 1 y 5")
	@DecimalMax(value = "5.0", message = "rating debe estar entre 1 y 5")
	private Double rating;
	
	// Opcional: Nombres de habitaciones o sus IDs
    private List<Long> roomIds;
    
    // Opcional: Información de reseñas como DTO o sólo IDs
    private List<ReviewDTO> reviews;
}
