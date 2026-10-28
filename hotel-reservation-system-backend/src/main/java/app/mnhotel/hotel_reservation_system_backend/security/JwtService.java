package app.mnhotel.hotel_reservation_system_backend.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	private final SecretKey key;
	private final long expirationMinutes;

	public JwtService(@Value("${app.jwt.secret}") String secret,
			@Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
		this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.expirationMinutes = expirationMinutes;
	}

	public String generateToken(String username, String role) {
		Instant now = Instant.now();
		return Jwts.builder()
				.subject(username)
				.claim("role", role)
				.issuedAt(Date.from(now))
				.expiration(Date.from(now.plusSeconds(expirationMinutes * 60)))
				.signWith(key)
				.compact();
	}

	/** Devuelve los claims si el token es valido; lanza JwtException si esta alterado o vencido. */
	public Claims parse(String token) throws JwtException {
		return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
	}
}
