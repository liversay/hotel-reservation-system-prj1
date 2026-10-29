package app.mnhotel.hotel_reservation_system_backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import app.mnhotel.hotel_reservation_system_backend.entity.Reservation;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation,Long>{

	/** Reservas activas de la habitacion que se solapan con [start, end). */
	@Query("select r from Reservation r where r.room.id = :roomId and r.status <> 'CANCELLED' "
			+ "and r.startDate < :end and r.endDate > :start")
	List<Reservation> findActiveOverlapping(@Param("roomId") Long roomId,
			@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

	/** Reservas activas que tocan el intervalo [from, to). */
	@Query("select r from Reservation r where r.status <> 'CANCELLED' and r.startDate < :to and r.endDate > :from")
	List<Reservation> findActiveBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	boolean existsByRoomId(Long roomId);

	boolean existsByUserId(Long userId);

	List<Reservation> findByUserUsernameOrderByStartDateDesc(String username);
}
