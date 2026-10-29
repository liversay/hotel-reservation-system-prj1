# Auditoria de codigo (backend + frontend) - 2026-10-28

Alcance: lectura de codigo, ejecucion de pruebas y llamadas curl contra API http://localhost:3000 (perfil dev, H2 en memoria). No se modifico codigo fuente. Solo se reporta lo ejecutado o leido.

## 1. Resultados de pruebas y build

| Comando | Resultado real |
|---|---|
| `cd hotel-reservation-system-backend && sh ./mvnw -q test` | OK. Surefire: AdminCrud 7, AuthController 6, AvailabilityAndReservation 7, CancelReservation 5, DemandForecaster 6, ForecastController 7, RealDispatchSecurity 1, SavedPaymentBooking 7, StaleToken 3 = **49 tests, 0 fallos, 0 errores**. (El PR-7 dice "46 en total"; real: 49.) Las copias `src/test/java 2` y `src/test/resources 2` no rompen el build. |
| `npm test -- --run` (vitest) | **8 archivos, 34 tests, todos pasan.** |
| `npx tsc --noEmit` | exit 0, sin errores (el tsconfig raiz usa `references`, no chequea nada). |
| `npx tsc -b --noEmit` | **1 error** (TS2345). |
| `npm run build` (`tsc -b && vite build`) | **FALLA: 14 errores TS**; `vite build` nunca se ejecuta. 13x TS6133 (`React` importado y sin usar) en ButtonSecondary, CardHotelSlider, SliderPlaces, CardRoom, HeaderBanner, AboutUs, About, RoomDetailComponent, RoomDetailPlus, RoomDetails, HeaderAdmin, ButtonGroup, ErrorPage; 1x TS2345 en `src/components/Search.tsx:27` (`setSuggestions(string[])` sobre `useState([])` -> `never[]`). Todos en archivos heredados del repo upstream (Search.tsx ultimo commit fcc1bc4, de upstream). El log de IA lo declara como decision humana ("no arreglar archivos ajenos"), pero el build de produccion queda roto. |

## 2. Requisitos vs evidencia

| Requisito | Estado | Evidencia |
|---|---|---|
| US-04 registro/login JWT | FUNCIONA | `POST /api/auth/login admin/admin12345` -> 200 con token HS256 (claims sub, role, uid, exp 2h). Registro con `"role":"ADMIN"` -> 201 pero `"role":"USER"` (no hay escalada). Usuario duplicado -> 409. Login sin campos -> 400 `password: must not be blank`. Token basura -> 401. Sin token -> 401. `JwtAuthFilter.java:41-46` valida usuario y rol en BD por request. |
| US-04 roles | FUNCIONA | demo (USER) -> `/api/admin/forecast` 403, `/api/admin/users` 403, `POST /api/hotel/registration-hotel` 403; sin token 401; admin 200. |
| US-02 calendario de disponibilidad | FUNCIONA (API) / PARCIAL (UI) | `GET /api/rooms/1/availability?month=2026-11` -> 200 con 30 dias AVAILABLE/OCCUPIED/PAST. Tras reservar 1-3 dic la API refleja ocupacion (tests). Doble reserva solapada: POST 2026-12-01..03 -> 201; POST 12-02..04 -> **409**; repetir identica -> 409. Lock pesimista `ReservationServiceImp.java:72`. UI: componente `AvailabilityCalendar.tsx` existe y esta en `/book/:roomId`, pero esa ruta no es alcanzable desde la navegacion (ver F-02). |
| US-01 pago guardado / un clic | FUNCIONA (API) / PARCIAL (UI) | Con demo: `POST /api/payment-methods {cardNumber:"4111 1111 1111 1111", holderName, expMonth:12, expYear:2030, cvv:"123"}` -> 201 `{brand:VISA,last4:1111,defaultMethod:true}` (sin PAN ni token ni cvv en la respuesta). Luego `POST /api/reservations {..., savedPaymentMethodId:1}` -> 201 con `payments:[{status:PAID, methodLabel:"VISA **** 1111"}]`. Luhn invalido -> 400; tarjeta vencida -> 400; usar la tarjeta de otro usuario (id 2 de admin) -> 404. Cobro es simulado (`ReservationServiceImp.java:84`); tokenizacion simulada (`PaymentMethodServiceImp.java:50`). UI: BookRoom/SavedCards existen, mismo problema de acceso (F-02). |
| US-03 prevision de demanda | FUNCIONA | `GET /api/admin/forecast` con admin -> 200 `{totalRooms:5, history:[{month:"2025-10", roomNights:23, revenue:2190, occupancy:0.148, suggestedPriceChangePct:0},...` ; `historyMonths=-5&horizonMonths=9999` -> 400 con mensaje; `historyMonths=abc` -> 400. Dashboard.tsx llama este endpoint. Historico viene de DataSeeder (datos sinteticos, esperado en dev). |
| US-05 cancelacion | FUNCIONA | `PUT /api/reservations/140/cancel` por dueno -> 200 `status:CANCELLED`, pago `REFUNDED`; segunda vez -> 409; por otro usuario (audit1) -> 404; id inexistente -> 404; sin token -> 401. |
| CRUD admin hoteles | FUNCIONA | `POST /api/hotel/registration-hotel` -> 200 (crea, sin retornar id); `{}` -> 400; update/delete inexistente -> 404; get-hotel/9999 -> 404. Ver F-07 (rating 99 aceptado). |
| CRUD admin habitaciones | FUNCIONA | `POST /api/rooms` admin -> 201; hotel inexistente -> 404; `pricePerNight:-5` -> 400; `{}` -> 400; PUT/DELETE 9999 -> 404. (No se probo borrar habitaciones con reservas por no destruir datos del servidor compartido; el PR-7 declara 409 y hay test AdminCrudTest.) |
| CRUD admin usuarios | FUNCIONA | `GET /api/admin/users` admin 200 / demo 403; crear usuario 201; duplicado 409; rol `SUPERUSER` -> 400; password corta -> 400; PUT 9999 -> 404. |
| Issues / historias | PARCIAL | `gh issue list -R liversay/hotel-reservation-system-prj1 --state all` -> **vacio (0 issues)**. Las historias solo estan en `docs/issues/README.md`. |
| Ramas | FUNCIONA | `git branch -a`: chore/jdk-build-fix, feature/auth-jwt, availability-calendar, saved-payment-booking, demand-forecast, cancel-reservation, admin-crud, fix/e2e-findings, fix/jwt-stale-authorization, fix/dashboard-label, develop, main (+ origin). |
| Commits identificables | FUNCIONA | Mensajes `feat(...)`/`fix(...)`; autores "Dev A/B/C" (13 commits) y "Simon" (14 merges/releases). Los autores Dev A/B/C son identidades simuladas de un solo desarrollador (ver F-06). |
| Pull Request | PARCIAL | `gh pr list -R liversay/hotel-reservation-system-prj1 --state all` -> **vacio (0 PRs en GitHub)**. Los "Merge PR #n" son merges locales (`git log --merges`) y hay actas en `docs/reviews/PR-1..7-*.md`. "Revision equivalente" documentada, pero no PR real. |
| Pruebas automatizadas | FUNCIONA | 49 backend + 34 frontend, todas verdes (seccion 1). |
| AI_DEVELOPMENT_LOG | FUNCIONA | `docs/AI_DEVELOPMENT_LOG.md` (26 lineas, 22 filas): respuestas incorrectas (diagnostico Lombok, `Array.at()`, 401 en vez de 403, marcador `@P` que pisaba anotaciones, rotulo de Dashboard), cambios rechazados/modificados (secreto JWT por defecto, user enumeration), decisiones humanas (no tocar 20+ archivos ajenos, CVV nunca, rate-limit diferido). Reviews en `docs/reviews`. Observacion: la columna "Herramienta" es casi siempre "A" y los roles Dev/Reviewer/QA son simulados (un solo humano). El log no registra la intervencion del usuario real mas alla de dos reportes. |

## 3. Casos limite por API (curl real)

| Caso | Resultado |
|---|---|
| Doble reserva solapada | 409 (OK) |
| salida<entrada / salida==entrada | 400 "La salida debe ser posterior..." (OK) |
| Entrada en pasado (2026-10-01) | 400 (OK) |
| Estancia >30 noches | 400 (OK) |
| roomId inexistente | 404 (OK) |
| Falta `checkOut` | 400 `checkOut: must not be null` (OK) |
| `checkIn:"notadate"` o JSON malformado | **400 pero con cuerpo Whitelabel con stack trace completo** (F-04) |
| `GET /api/rooms/1/availability?month=bad` | **500** `DateTimeParseException` con stack trace (F-01) |
| `GET /api/rooms/abc` | 400 (OK) |
| `GET /api/hotel` (sin subruta) | 404 con stack trace (`NoResourceFoundException`) |
| Sin token / token basura | 401 (OK) |
| Rol incorrecto | 403 (OK) |
| Paginacion | **No existe**: ningun listado (`/api/rooms`, `/api/hotel/get-all`, `/api/admin/users`, `/api/reservations/mine`) acepta page/size (F-08). |
| `HEAD /api/rooms/1` | 401 (solo GET esta permitido, menor) |
| Login con contrasena <8 chars | 400 con mensaje de politica de contrasena (revela politica; menor) |

## 4. Stubs, TODOs, mocks y endpoints

- `grep TODO|FIXME|mock|stub` sobre `src/main` y `src` (sin tests): **sin resultados**.
- Endpoints llamados por el frontend vs controladores: `/api/admin/forecast`, `/api/hotel/{registration-hotel,update-hotel/{id},delete-hotel/{id},get-all}`, `/api/rooms` (GET/POST/PUT/DELETE), `/api/rooms/{id}`, `/api/rooms/{id}/availability`, `/api/admin/users` (+ `/{id}`), `/api/auth/{login,register}`, `/api/payment-methods`, `/api/reservations`, `/api/reservations/mine`, `/api/reservations/{id}/cancel`: **todos existen en el backend**. No hay endpoints huerfanos.
- Datos mock en el frontend (heredados y NO conectados a la API): `pages/Rooms.tsx` (8x `<CardRoom />` estatico, "The Ritz-Carlton, Bali $5555 Madrid", `CardRoom.tsx:11-26`), `RoomDetails.tsx`/`RoomDetailComponent.tsx`, `Search.tsx` (provincias argentinas), `SideBarFilter.tsx`, `ProfileCircule.tsx` (avatar de GitHub de upstream), Hero/Sliders.
- Botones/enlaces sin accion: `components/Button.tsx:8` renderiza `<a href="#">` siempre, por lo que "Login" y "Register" del Header (`Header.tsx:41-43`), "Explore Hotels" (`Hero.tsx:24`), "Reserve" (`RoomDetailComponent.tsx:104`), "Apply Filters" (`SideBarFilter.tsx:336`) y "Search" (`Search.tsx:180`, ButtonBorder) **no hacen nada**. "Toggle menu" movil (`Header.tsx:46`) sin handler. Los `<button>` de `SideBarFilter.tsx:91,156,231,294` sin onClick.
- Copias basura iCloud: `docs/issues 2`, `docs/reviews 2`, `hotel-reservation-system-backend/src/test/java 2`, `.../src/test/resources 2`; refs git rotas `refs/heads/develop 2` y `main 2` (git emite warning). No rompen el build actual; no se borraron.

## 5. Seguridad

| Aspecto | Estado |
|---|---|
| CORS | OK: solo `http://localhost:5173`; origen `evil.com` -> 403; metodos GET/POST/PUT/DELETE/OPTIONS (`SecurityConfig.java:57`). Origen hardcodeado (no configurable para despliegue). |
| Secretos | JWT sin default (`application.properties:20` `${JWT_SECRET}`, obligatorio). Perfil dev tiene secreto fijo y credenciales seed (solo con `app.seed.enabled`). **`application.properties:9-10` commitea `root/root` de PostgreSQL** (heredado). |
| Tarjetas | Sin PAN ni CVV persistidos (`SavedPaymentMethod`: brand, last4, token `@JsonIgnore`). **Pero el PAN completo viaja al backend y el "token" es `tok_<UUID>` generado localmente** (`PaymentMethodServiceImp.java:50`): tokenizacion simulada, no hay pasarela real; el cobro tambien (`ReservationServiceImp.java:84`). Documentado en log. |
| Rate limiting | **No existe.** 30 logins fallidos consecutivos -> 30x 401 sin bloqueo ni retardo; luego login correcto 200. Diferido en el log. (F-05) |
| Stack traces | Respuestas de error incluyen campo `trace` con stack completo (ver F-04). Proviene de `spring-boot-devtools` en `pom.xml:47` (fuerza `include-stacktrace`); revisar que el scope sea `runtime/optional` y que no vaya en el jar de produccion. |
| Cabeceras | Spring defaults: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Cache-Control no-store`. No hay HSTS (solo HTTP local). |
| JWT | Almacenado en `tokenStore` del frontend (localStorage presumiblemente: XSS-expuesto; no verificado en detalle). Sin revocacion al cambiar contrasena (declarado pendiente). Expiracion 120 min. |
| CSRF | Deshabilitado; aceptable con Bearer token stateless. |
| Registro | Sin verificacion de email; `role` del request ignorado (OK). |

## 6. Fallas priorizadas

### P0 (bloquean entrega / demo)
- **F-01 Flujo de cliente inalcanzable desde la UI.** Ningun enlace lleva a `/login`, `/book/:roomId` ni `/my-reservations`: `grep "book/\|my-reservations"` en `src` solo coincide en `App.tsx:24-25` y `BookRoom.tsx:43`. El Header "Login/Register" es `<a href="#">` (`Header.tsx:41-43`, `Button.tsx:8`). `/products` muestra 8 tarjetas estaticas que enlazan a `/productDetail` estatico y su boton "Reserve" no hace nada (`RoomDetailComponent.tsx:104`). Resultado: US-01, US-02 y US-05 solo se pueden usar escribiendo la URL a mano. Arreglo: Header con `<Link to="/login">`, enlace "Mis reservas", `Rooms.tsx` alimentado por `GET /api/rooms` con `<Link to={`/book/${id}`}>`.
- **F-02 `npm run build` falla** (14 errores TS): `Search.tsx:27` (TS2345) y 13 imports `React` sin usar (lista en seccion 1). No se puede generar el bundle de produccion. Arreglo trivial: `useState<string[]>([])` y quitar `import React`.

### P1
- **F-03 500 en `availability?month=bad`** (`RoomController.java:50`, `YearMonth.parse` sin manejo). Anadir handler de `DateTimeParseException`/`MethodArgumentTypeMismatchException` en `GlobalExceptionHandler.java` -> 400.
- **F-04 Fuga de stack traces** en errores no capturados por `GlobalExceptionHandler` (JSON malformado, fecha invalida, ruta inexistente, 500): cuerpo con `"trace":"java.time...at app.mnhotel..."`. Falta handler para `HttpMessageNotReadableException`, `MissingServletRequestParameterException`, `MethodArgumentTypeMismatchException` (el ultimo si devuelve 400 limpio via otro camino) y fijar `server.error.include-stacktrace=never`; revisar `spring-boot-devtools` (`pom.xml:47`).
- **F-05 Sin rate limiting / bloqueo de fuerza bruta** en `/api/auth/login` y `/register` (`SecurityConfig.java:38`). Probado: 30 intentos seguidos sin limitacion.
- **F-06 Evidencia de proceso debil:** 0 issues y 0 PRs reales en GitHub (`gh ... list` vacio); autores Dev A/B/C son identidades simuladas del mismo desarrollador. El enunciado exige "Issues o historias de usuario" y "Pull Request o revision equivalente": hay equivalentes en `docs/`, pero conviene crear los issues/PRs en GitHub y abrir PRs reales para las ramas.
- **F-07 Validacion insuficiente en hoteles:** `rating:99` aceptado y persistido (`POST /api/hotel/registration-hotel`, HotelController/HotelServiceImp) y `RoomController.java:43,54` recibe `RoomDTO` sin `@Valid` (la validacion existe solo en el servicio). `POST /registration-hotel` devuelve 200 sin id del hotel creado (deberia ser 201).

### P2
- **F-08 Sin paginacion** en `GET /api/rooms`, `/api/hotel/get-all`, `/api/admin/users`, `/api/reservations/mine` (crecen sin limite).
- **F-09 Credenciales root/root de PostgreSQL commiteadas** en `application.properties:9-10` (heredado). Pasar a variables de entorno.
- **F-10 Tokenizacion y cobro simulados;** PAN pasa por el backend (`PaymentMethodServiceImp.java:34,50`; `ReservationServiceImp.java:84`). Documentado, pero no es PCI-friendly; usar Stripe/Mercado Pago Elements en un siguiente paso.
- **F-11 CORS hardcodeado** a `localhost:5173` (`SecurityConfig.java:57`); hacerlo propiedad.
- **F-12 `ReservationDTO` serializa `"user":null`** en cada respuesta (campo sobrante) y `HEAD` devuelve 401.
- **F-13 Basura de sincronizacion:** carpetas `* 2` y refs git `develop 2`/`main 2`; limpiar (el log ya registro que eso rompio una compilacion antes).
- **F-14 Documentacion inconsistente:** PR-7 dice 46 tests backend (real 49).
- **F-15 Login revela politica de contrasena** (`password: La contrasena debe tener al menos 8 caracteres` en login con clave corta); validar solo `@NotBlank` en login.

## 7. Datos de prueba dejados en el servidor en ejecucion
Mis pruebas crearon (no pude borrarlas; el borrado fue bloqueado por permisos): usuarios `audit1` (id 4) y `audit2` (id 5), hotel "AuditHotel" (id 2, rating 99), habitacion `A-T` (id 6, hotel 1) y la tarjeta VISA 1111 de demo (id 1). Las reservas 139 y 140 quedaron CANCELLED. El usuario `qa50930` (id 3) fue creado por otro agente. Se reinician al reiniciar el servidor (H2 en memoria).
