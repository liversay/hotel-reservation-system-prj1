package app.mnhotel.hotel_reservation_system_backend;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;

/**
 * Regresion de un hallazgo E2E: con servidor real el 403 se re-despacha a /error; sin permitirlo
 * un usuario autenticado sin rol recibia 401. MockMvc no ejecuta ese despacho, por eso se usa un puerto real.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RealDispatchSecurityTest {

	@Autowired TestRestTemplate rest;

	@Test
	void regularUserGets403NotAnonymous401OnAdminEndpoint() {
		HttpHeaders h = new HttpHeaders();
		h.setContentType(MediaType.APPLICATION_JSON);
		String json = rest.postForObject("/api/auth/register", new HttpEntity<>(
				"{\"username\":\"rd1\",\"email\":\"rd1@t.com\",\"password\":\"password1\"}", h), String.class);
		String token = json.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
		HttpHeaders auth = new HttpHeaders();
		auth.setBearerAuth(token);
		assertEquals(403, rest.exchange("/api/admin/forecast", HttpMethod.GET, new HttpEntity<>(auth), String.class).getStatusCode().value());
		assertEquals(401, rest.exchange("/api/admin/forecast", HttpMethod.GET, HttpEntity.EMPTY, String.class).getStatusCode().value());
	}
}
