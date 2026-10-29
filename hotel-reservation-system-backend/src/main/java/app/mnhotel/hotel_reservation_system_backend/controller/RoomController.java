package app.mnhotel.hotel_reservation_system_backend.controller;

import java.time.YearMonth;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import app.mnhotel.hotel_reservation_system_backend.dto.DayAvailabilityDTO;
import app.mnhotel.hotel_reservation_system_backend.dto.RoomDTO;
import app.mnhotel.hotel_reservation_system_backend.service.RoomService;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

	private final RoomService roomService;

	public RoomController(RoomService roomService) {
		this.roomService = roomService;
	}

	@GetMapping
	public List<RoomDTO> list(@RequestParam(required = false) Long hotelId) {
		return hotelId == null ? roomService.findAll() : roomService.findByHotel(hotelId);
	}

	@GetMapping("/{id}")
	public RoomDTO get(@PathVariable Long id) {
		return roomService.findById(id);
	}

	@PostMapping
	public ResponseEntity<RoomDTO> create(@RequestBody RoomDTO room) {
		return ResponseEntity.status(HttpStatus.CREATED).body(roomService.create(room));
	}

	/** Calendario del mes (YYYY-MM): estado por dia AVAILABLE / OCCUPIED / PAST. */
	@GetMapping("/{id}/availability")
	public List<DayAvailabilityDTO> availability(@PathVariable Long id, @RequestParam String month) {
		return roomService.availability(id, YearMonth.parse(month));
	}

	@PutMapping("/{id}")
	public RoomDTO update(@PathVariable Long id, @RequestBody RoomDTO room) {
		return roomService.update(id, room);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		roomService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
