package app.mnhotel.hotel_reservation_system_backend.service;

import java.util.List;

import app.mnhotel.hotel_reservation_system_backend.dto.UserAdminDTO;
import app.mnhotel.hotel_reservation_system_backend.dto.UserAdminRequest;

public interface UserService {

	List<UserAdminDTO> findAll();

	UserAdminDTO create(UserAdminRequest request);

	UserAdminDTO update(String actingUsername, Long id, UserAdminRequest request);

	void delete(String actingUsername, Long id);
}
