package app.mnhotel.hotel_reservation_system_backend.service.imp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.mnhotel.hotel_reservation_system_backend.dto.UserAdminDTO;
import app.mnhotel.hotel_reservation_system_backend.dto.UserAdminRequest;
import app.mnhotel.hotel_reservation_system_backend.entity.User;
import app.mnhotel.hotel_reservation_system_backend.exception.BadRequestException;
import app.mnhotel.hotel_reservation_system_backend.exception.ConflictException;
import app.mnhotel.hotel_reservation_system_backend.exception.ResourceNotFoundException;
import app.mnhotel.hotel_reservation_system_backend.repository.ReservationRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.SavedPaymentMethodRepository;
import app.mnhotel.hotel_reservation_system_backend.repository.UserRepository;
import app.mnhotel.hotel_reservation_system_backend.service.UserService;

@Service
public class UserServiceImp implements UserService {

	private static final Set<String> ROLES = Set.of("USER", "ADMIN");

	private final UserRepository users;
	private final ReservationRepository reservations;
	private final SavedPaymentMethodRepository paymentMethods;
	private final PasswordEncoder encoder;

	public UserServiceImp(UserRepository users, ReservationRepository reservations,
			SavedPaymentMethodRepository paymentMethods, PasswordEncoder encoder) {
		this.users = users;
		this.reservations = reservations;
		this.paymentMethods = paymentMethods;
		this.encoder = encoder;
	}

	@Override
	@Transactional(readOnly = true)
	public List<UserAdminDTO> findAll() {
		return users.findAll().stream().map(UserServiceImp::toDTO).toList();
	}

	@Override
	@Transactional
	public UserAdminDTO create(UserAdminRequest r) {
		if (blank(r.getUsername()) || blank(r.getEmail())) throw new BadRequestException("Usuario y email son obligatorios");
		if (r.getPassword() == null || r.getPassword().length() < 8) throw new BadRequestException("La contrasena debe tener al menos 8 caracteres");
		String role = normalizeRole(r.getRole());
		if (users.existsByUsername(r.getUsername()) || users.existsByEmail(r.getEmail())) {
			throw new ConflictException("El usuario o email ya existe");
		}
		return toDTO(users.save(User.builder().username(r.getUsername()).email(r.getEmail())
				.password(encoder.encode(r.getPassword())).role(role).createdAt(LocalDateTime.now()).build()));
	}

	@Override
	@Transactional
	public UserAdminDTO update(String acting, Long id, UserAdminRequest r) {
		User u = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));
		if (!blank(r.getEmail()) && !r.getEmail().equals(u.getEmail())) {
			if (users.existsByEmail(r.getEmail())) throw new ConflictException("El email ya existe");
			u.setEmail(r.getEmail());
		}
		if (!blank(r.getRole())) {
			String role = normalizeRole(r.getRole());
			// Evita que el unico admin en sesion se quite el rol a si mismo y bloquee la gestion.
			if (u.getUsername().equals(acting) && !role.equals(u.getRole())) {
				throw new ConflictException("No puedes cambiar tu propio rol");
			}
			u.setRole(role);
		}
		if (!blank(r.getPassword())) {
			if (r.getPassword().length() < 8) throw new BadRequestException("La contrasena debe tener al menos 8 caracteres");
			u.setPassword(encoder.encode(r.getPassword()));
		}
		return toDTO(u);
	}

	@Override
	@Transactional
	public void delete(String acting, Long id) {
		User u = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));
		if (u.getUsername().equals(acting)) throw new ConflictException("No puedes eliminar tu propia cuenta");
		if (reservations.existsByUserId(id)) {
			throw new ConflictException("No se puede eliminar: el usuario tiene reservas (conservadas para el historico)");
		}
		paymentMethods.deleteByUserId(id);
		users.delete(u);
	}

	private static String normalizeRole(String role) {
		String r = blank(role) ? "USER" : role.toUpperCase();
		if (!ROLES.contains(r)) throw new BadRequestException("Rol invalido: " + role);
		return r;
	}

	private static boolean blank(String s) {
		return s == null || s.isBlank();
	}

	static UserAdminDTO toDTO(User u) {
		return UserAdminDTO.builder().id(u.getId()).username(u.getUsername()).email(u.getEmail())
				.role(u.getRole()).createdAt(u.getCreatedAt()).build();
	}
}
