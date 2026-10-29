package app.mnhotel.hotel_reservation_system_backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import app.mnhotel.hotel_reservation_system_backend.entity.SavedPaymentMethod;

@Repository
public interface SavedPaymentMethodRepository extends JpaRepository<SavedPaymentMethod, Long> {

	void deleteByUserId(Long userId);

	List<SavedPaymentMethod> findByUserUsernameOrderByIdAsc(String username);

	/** Siempre filtrado por dueno: evita acceder a metodos de otro usuario (IDOR). */
	Optional<SavedPaymentMethod> findByIdAndUserUsername(Long id, String username);
}
