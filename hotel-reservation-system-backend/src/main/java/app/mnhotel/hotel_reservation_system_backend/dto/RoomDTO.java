package app.mnhotel.hotel_reservation_system_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomDTO {
	private Long id;
    @NotBlank(message = "no puede estar vacío")
    private String roomNumber;
    @NotBlank(message = "no puede estar vacío")
    private String type;
    @NotNull(message = "es obligatorio")
    @Positive(message = "debe ser mayor que 0")
    private Integer pricePerNight;
    private Boolean availability;

    // Información del hotel asociado (opcional)
    private Long hotelId;  // O usa HotelDTO si prefieres incluir detalles del hotel
}
