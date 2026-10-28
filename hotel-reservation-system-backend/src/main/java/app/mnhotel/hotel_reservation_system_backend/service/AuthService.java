package app.mnhotel.hotel_reservation_system_backend.service;

import app.mnhotel.hotel_reservation_system_backend.dto.AuthRequest;
import app.mnhotel.hotel_reservation_system_backend.response.AuthResponse;

public interface AuthService {

	AuthResponse register(AuthRequest request);

	AuthResponse login(AuthRequest request);
}
