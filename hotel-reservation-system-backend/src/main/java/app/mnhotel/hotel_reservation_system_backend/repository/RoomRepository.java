package app.mnhotel.hotel_reservation_system_backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import app.mnhotel.hotel_reservation_system_backend.entity.Room;

@Repository
public interface RoomRepository extends JpaRepository<Room,Long> {

	List<Room> findByHotelId(Long hotelId);

	/** Bloquea la fila de la habitacion para serializar reservas concurrentes sobre ella. */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select r from Room r where r.id = :id")
	Optional<Room> findByIdForUpdate(@Param("id") Long id);
}
