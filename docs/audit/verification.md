# Verificación final de la rama `fix/audit-remediation`

Fecha: 2026-10-30. Todos los números salen de ejecuciones del controlador sobre el código final (HEAD `427b801`), con el backend dev reiniciado antes de la suite E2E (contador de IP del login a cero).

| Comprobación | Comando | Resultado |
|---|---|---|
| Backend | `sh ./mvnw test` (en `hotel-reservation-system-backend`) | 93 tests, 0 fallos, 0 errores (verificado en `target/surefire-reports`, tras el fix de la carrera de habitación; ejecución anterior a los commits de frontend 8b) |
| Frontend unit | `npx vitest run` | 17 archivos, 99 tests pasan |
| Build | `npm run build` | exit 0 |
| E2E (Playwright) | `npm run e2e` contra backend :3000 recién reiniciado y frontend :5173 | 36 passed, exit 0 (14.9 s) |
| Mojibake | `grep -rl 'Ã' src e2e` (backend y frontend) | 0 archivos |
| Servidor real | `curl .../availability?month=bad` | 400 `{"message":"Parámetro con formato inválido"}` |
| Límite de login | 6 logins fallidos de un usuario único por `curl` | 5 × 401 "Credenciales inválidas", 6.º 429 con `Retry-After: 900` |

## Auditoría independiente (agente nuevo, navegador real)

Informe: `docs/audit/verification-e2e.md` (sobre HEAD `030b56f`, antes de la ola final 8a/8b). Sin fallas P0. Dos P1 (F-01 `/about` en inglés con testimonios inventados y "Lorem ipsum"; F-02 habitación duplicada aceptada) y varios P2 que se corrigieron en la ola final salvo los listados abajo.

## Pendiente o diferido (no corregido)

- Paginación de "Mis reservas" (con las reservas acumuladas de las pruebas, ~150 filas).
- La spec `login-rate-limit` no es repetible indefinidamente sin reiniciar el backend (30 fallos por IP en 15 min); documentado en `hotel-reservation-system-frontend/e2e/README.md`.
- Compromisos de seguridad aceptados: expulsión del mapa más antiguo al llenarse (10 000 entradas) y bloqueo de cuenta tras 20 fallos (DoS posible por un atacante).
- El hallazgo "las flechas del calendario no responden a clic real" **no se reprodujo** (3 viewports, con y sin sesión); se dejó test de regresión.
- Tokenización real de tarjetas (el pago está simulado), invalidar JWT al cambiar contraseña y dar acceso al profesor al repo privado.
- No se ha hecho push de esta rama a GitHub ni se ha fusionado en `main`.
