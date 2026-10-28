package app.mnhotel.hotel_reservation_system_backend.service.imp;

import java.time.LocalDateTime;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import app.mnhotel.hotel_reservation_system_backend.dto.AuthRequest;
import app.mnhotel.hotel_reservation_system_backend.entity.User;
import app.mnhotel.hotel_reservation_system_backend.exception.BadRequestException;
import app.mnhotel.hotel_reservation_system_backend.exception.ConflictException;
import app.mnhotel.hotel_reservation_system_backend.repository.UserRepository;
import app.mnhotel.hotel_reservation_system_backend.response.AuthResponse;
import app.mnhotel.hotel_reservation_system_backend.security.JwtService;
import app.mnhotel.hotel_reservation_system_backend.service.AuthService;

@Service
public class AuthServiceImp implements AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final String dummyHash;

	public AuthServiceImp(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.dummyHash = passwordEncoder.encode("dummy-password-for-timing");
	}

	@Override
	public AuthResponse register(AuthRequest request) {
		if (request.getEmail() == null || request.getEmail().isBlank()) {
			throw new BadRequestException("El email es obligatorio");
		}
		if (userRepository.existsByUsername(request.getUsername()) || userRepository.existsByEmail(request.getEmail())) {
			throw new ConflictException("El usuario o email ya existe");
		}
		// El rol siempre es USER en el registro publico; los ADMIN se crean fuera de banda.
		User user = userRepository.save(User.builder()
				.username(request.getUsername())
				.email(request.getEmail())
				.password(passwordEncoder.encode(request.getPassword()))
				.role("USER")
				.createdAt(LocalDateTime.now())
				.build());
		return toResponse(user);
	}

	@Override
	public AuthResponse login(AuthRequest request) {
		User user = userRepository.findByUsername(request.getUsername()).orElse(null);
		// Siempre se ejecuta bcrypt (hash ficticio si el usuario no existe) para no revelar por tiempo si el usuario existe.
		String hash = user != null ? user.getPassword() : dummyHash;
		boolean ok = passwordEncoder.matches(request.getPassword(), hash);
		if (user == null || !ok) {
			throw new BadCredentialsException("Credenciales invalidas");
		}
		return toResponse(user);
	}

	private AuthResponse toResponse(User user) {
		return AuthResponse.builder()
				.token(jwtService.generateToken(user.getUsername(), user.getRole()))
				.username(user.getUsername())
				.role(user.getRole())
				.build();
	}
}
