package app.mnhotel.hotel_reservation_system_backend.security;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import app.mnhotel.hotel_reservation_system_backend.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

	private final JwtService jwtService;
	private final UserRepository userRepository;

	public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
		this.jwtService = jwtService;
		this.userRepository = userRepository;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String header = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (header != null && header.startsWith("Bearer ")) {
			try {
				Claims claims = jwtService.parse(header.substring(7));
				// Rol y existencia se toman de la BD, no del token: un usuario eliminado, degradado o
				// recreado con el mismo nombre (uid distinto) pierde acceso de inmediato.
				Long uid = claims.get("uid", Long.class);
				userRepository.findByUsername(claims.getSubject())
						.filter(u -> u.getId().equals(uid))
						.ifPresent(u -> SecurityContextHolder.getContext().setAuthentication(
								new UsernamePasswordAuthenticationToken(u.getUsername(), null,
										List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole())))));
			} catch (JwtException | IllegalArgumentException e) {
				SecurityContextHolder.clearContext(); // token invalido: se trata como anonimo -> 401 donde se requiera
			}
		}
		chain.doFilter(request, response);
	}
}
