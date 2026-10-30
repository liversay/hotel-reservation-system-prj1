# Verificación E2E independiente (navegador real, Playwright MCP)

Fecha de la prueba: 2026-10-30. Frontend http://localhost:5173, API http://localhost:3000.
Método: Chromium real vía Playwright MCP; cada flujo se hizo con clics y tecleo reales. Para endpoints
(403, 400, 429) se usó `fetch` desde la propia página con el token de la sesión. Capturas en
`docs/audit/screenshots/verify-*.png`. Fallos de login usados: 5 de un usuario único (`ghostNNNNN`) más 2 intentos
bloqueados con 429; 0 fallos con admin/demo.

Nota de entorno: la base "recién reiniciada" NO estaba limpia: tenía hoteles/habitaciones/usuarios de una corrida E2E previa
(`Hotel xmvv1qza212`, `canx...`, etc.) y el usuario demo trae ~150 reservas históricas sembradas.

## Tabla de requisitos

| Requisito | Estado | Evidencia |
|---|---|---|
| Visitante: ver hoteles y habitaciones con datos reales | FUNCIONA | Home lista 4 hoteles y 6 destacadas; /products lista 8 habitaciones (101-105, E2E) con precio/hotel/ubicación desde la API. verify-01-home, verify-02-products |
| Detalle de habitación | FUNCIONA | /rooms/4: Suite 104, $150/noche, Disponible, hotel, rating. /rooms/9999 y /productDetail: "Habitación no encontrada" con enlace de vuelta. verify-03-detail. (El detalle anónimo no muestra calendario, solo botón Reservar) |
| Búsqueda / filtro | FUNCIONA | Texto "suite": 8 -> 3; precio máx 90: 3; "zzzz": mensaje "No hay habitaciones que coincidan"; Limpiar restaura 8; buscador del home -> /products?q=Suite (3). verify-06-filter |
| Registro de usuario nuevo | FUNCIONA | `qa1112` registrado, entra logueado a "/" con "Mis reservas/Salir". Duplicado: "El usuario o email ya existe" (409). Contraseña corta: "La contraseña debe tener al menos 8 caracteres". verify-07/08 |
| Login | FUNCIONA | qa1112, demo y admin entran. Credencial mala: "Credenciales inválidas". verify-31 |
| Logout | FUNCIONA | "Salir" borra `hotel.token`, navbar vuelve a Iniciar sesión/Registrarse |
| Navbar/footer sin dead links | PARCIAL | Todos los href del sitio público resuelven (/, /products, /about, /login, /register, /rooms/:id, /my-reservations, /admin, "Volver arriba" sube a scrollY 0, menú móvil abre). Pero el menú de perfil del panel admin tiene "Config" y "Change Password" con href="#" (muertos, en inglés), y el panel admin no tiene logout ni enlace al sitio. verify-30 |
| Rutas protegidas -> /login y retorno | FUNCIONA | /my-reservations y /admin anónimos -> /login?next=...; tras login vuelve a /my-reservations. /book/1 anónimo muestra calendario y "Inicia sesión para reservar" (sin redirección, aceptable) |
| /nope muestra 404 | FUNCIONA | "ERROR 404 / Página no encontrada / Volver al inicio". verify-05-404 |
| US-02 calendario dinámico: días ocupados bloqueados | FUNCIONA | Tras reservar 10-13 nov (hab. 104) los días 10, 11, 12 quedan `disabled`, `data-status=OCCUPIED`, rojo y tachados; el 13 (salida) libre. Pasados deshabilitados (PAST) |
| Rango que cruza ocupados rechazado | PARCIAL | UI: clic en 8 y luego 15 (cruza 10-12) NO forma rango; el 15 pasa a ser nueva entrada, sin resumen. Es un rechazo silencioso, sin mensaje explicando por qué. API: POST 8->15 = 409 "La habitación no está disponible en las fechas elegidas" (correcto). verify-13 |
| Flechas de mes con clic real | FUNCIONA | Oct -> Nov -> Dic -> Nov -> Oct -> Sep; cada clic dispara GET /availability?month=YYYY-MM. Se puede navegar a meses pasados (Sep 2026, todo PAST), menor |
| Calendario se actualiza tras reservar | FUNCIONA | Sin recargar, 10-12 pasan a ocupados tras "¡Reserva confirmada!". verify-12 |
| Reserva completa | FUNCIONA | 10-13 nov, 3 noches, $450, POST /api/reservations 201, aparece en Mis reservas como "Confirmada". Validaciones API: pasado 400, salida<entrada 400, habitación inexistente 404 |
| US-01 guardar tarjeta | FUNCIONA | Tarjeta 4111...1111 12/2030 -> "VISA •••• 1111 (12/2030) predeterminada". Solo se almacena el número enmascarado. Inválida (mes 13): se rechaza (400) pero el mensaje es crudo, ver F-04. verify-14/15 |
| US-01 reservar con un clic con la guardada | FUNCIONA | Elegido 20-23 nov, un solo clic en "Reservar y pagar con tarjeta guardada": POST con `savedPaymentMethodId:4`, sin pedir datos, 201. verify-16/17 |
| Ver mis reservas | FUNCIONA (con reparo) | Lista con hab., fechas, total, estado (Confirmada/Completada/Cancelada). Sin paginación: demo muestra ~150 filas en una página. verify-18 |
| US-05 cancelar: confirmación | FUNCIONA | "¿Confirmar cancelación? Sí, cancelar / No, mantener" inline. verify-19 |
| US-05 estado Cancelada y reembolso visible | FUNCIONA | "Cancelada" + "Reembolsado $450"; PUT /cancel 200, status CANCELLED. verify-20 |
| US-05 disponibilidad restaurada | FUNCIONA | Tras cancelar 20-23, el calendario de nov solo muestra ocupados 10,11,12 |
| US-03 dashboard con gráficos de previsión y precios sugeridos | FUNCIONA | /admin: KPI $41,720 ingresos 12m, 16% ocupación, 8 habitaciones; gráfico de barras SVG histórico (azul) + previsión (naranja) nov-dic; tabla "Ajuste de precios sugerido" 2026-10/11/12: -10%. Responsive a 390px. verify-21 |
| CRUD hoteles | FUNCIONA | Crear (QA Hotel, tildes OK), editar (precarga + guardar), eliminar con confirmación inline "¿Eliminar? Sí/No". verify-22..25 |
| Rating fuera de 1..5 rechazado | FUNCIONA (con reparo) | 6, 7, 0 y -1 -> 400 "rating: rating debe estar entre 1 y 5". Pero la etiqueta del campo dice "Rating (0-5)" (contradice la regla) y el mensaje lleva prefijo de campo. Nombre vacío bloqueado por `required` del navegador. verify-24 |
| CRUD habitaciones | PARCIAL | Crear/editar/eliminar OK; precio 0 y -5 -> 400 "pricePerNight: must be greater than 0" (inglés, sin traducir). Número de habitación duplicado en el mismo hotel se ACEPTA (se creó una segunda "101", ver F-02; la eliminé). verify-26/27 |
| CRUD usuarios | FUNCIONA | Crear, validar contraseña corta, usuario/email duplicado (409), editar rol a ADMIN, eliminar. No puede borrarse ni cambiarse el rol a sí mismo ("No puedes eliminar tu propia cuenta", "No puedes cambiar tu propio rol"). verify-28/29 |
| Cliente no accede a /admin (redirige) | FUNCIONA | qa1112 en /admin -> redirige a "/". verify-09 |
| Cliente recibe 403 en endpoints admin | FUNCIONA | Con token de cliente: GET /api/admin/forecast, GET/DELETE /api/admin/users, POST/DELETE /api/hotel/*, PUT/DELETE /api/rooms/1 -> todos 403. Anónimo -> 401 |
| Viewport 390px sin desborde horizontal | FUNCIONA | scrollWidth = clientWidth = 390 en home, products, login, register, my-reservations, about, rooms/4, book/4, admin, 404; ningún elemento excede el ancho. Capturas verify-m-*.png |
| Consola sin errores de la app | FUNCIONA | Los únicos errores de consola son "Failed to load resource" por respuestas 4xx provocadas a propósito (409/400/404/429). Ninguna excepción JS ni warning de React |
| Mensajes legibles, tildes, sin mojibake | PARCIAL | Cero 'Ã/Â/â€/�' en las 10 rutas. Tildes correctas ("Contraseña", "Inténtalo"). Pero hay mensajes crudos en inglés/técnicos (F-04) y textos sin tilde en datos ("Ciudad de Panama", "Hotel de demostracion", "Ubicacion E2E") |
| GET /api/rooms/1/availability?month=bad -> 400 sin trace | FUNCIONA | 400 `{"message":"Parámetro con formato inválido"}` |
| JSON malformado a /api/auth/login -> 400 sin trace | FUNCIONA | 400 `{"message":"Cuerpo de la solicitud inválido o malformado"}` (también en register) |
| 6 logins fallidos de usuario único -> 429 | FUNCIONA | Fallos 1-5: 401 "Credenciales inválidas"; el 6.º y siguientes: 429 "Demasiados intentos. Inténtalo de nuevo en 15 minutos." (la UI lo muestra). Sin cabecera Retry-After visible |

## Fallas priorizadas

### P0
Ninguna encontrada. Los flujos centrales (registro, login, reserva, calendario, tarjeta guardada, cancelación, dashboard admin, autorización) funcionan.

### P1
- F-01 Contenido de plantilla visible al público. Pasos: abrir /about y bajar al pie de cualquier página. /about está íntegro en inglés ("About Our Hotels", "Founded in 1985", "Jane Doe - Satisfied Customer", cifras inventadas) y el pie dice "Lorem ipsum dolor sit amet..." y "Copyright © 2024". Contradice "datos reales, no plantilla".
- F-02 Número de habitación duplicado aceptado. Pasos: admin -> rooms -> + Nuevo -> hotel "MN Hotel Centro", número 101, tipo Doble, precio 50 -> Guardar. Resultado: se crea una segunda habitación 101 en el mismo hotel (y ya existe otra 101 de $80). No hay restricción de unicidad hotel+número. (Eliminada tras probar.)

### P2
- F-03 Rechazo silencioso del rango que cruza ocupados. Pasos: /book/4 (con 10-12 nov ocupados) -> clic 8 nov, clic 15 nov. No aparece ningún aviso; el 15 se vuelve nueva entrada. Falta un mensaje tipo "El rango incluye fechas ocupadas".
- F-04 Mensajes de validación crudos. Tarjeta con mes 13 en /book/4: muestra "expMonth: must be less than or equal to 12". Habitación con precio 0/-5: "pricePerNight: must be greater than 0". Login `{}` por API: "username: must not be blank". Hotel rating: "rating: rating debe estar entre 1 y 5" (prefijo de campo). Deberían ser frases en español sin nombre de campo interno.
- F-05 Menú de perfil del admin: "Config" y "Change Password" con href="#" (no hacen nada, en inglés); el panel /admin no tiene botón de salir ni enlace al sitio (solo navegando por URL). Menú lateral en minúsculas e inglés ("dashboard / hotel / rooms / users").
- F-06 Etiqueta "Rating (0-5)" en el formulario de hotel, pero el servidor exige 1..5.
- F-07 Mis reservas sin paginación ni orden por estado: demo muestra ~150 filas en una sola página larga.
- F-08 El calendario permite navegar a meses completamente pasados (Septiembre 2026 y anteriores).
- F-09 El mensaje "¡Reserva confirmada!" permanece visible al cambiar de selección/mes; puede confundir tras una segunda selección.
- F-10 Datos sin tilde/placeholder: "Ciudad de Panama", "Hotel de demostracion". Datos de la corrida E2E previa (hoteles/habitaciones/usuarios "xmvv1...") contaminan el catálogo público y el panel.
- F-11 429 sin cabecera Retry-After; 415 (Content-Type erróneo) devuelve el JSON por defecto de Spring en inglés (sin trace).

## No probado
Eliminar habitaciones/hoteles con reservas activas (para no dañar datos); cancelar reservas ajenas por API; límite global de 30 fallos por IP.
Datos que dejé: usuario `qa1112`, tarjeta VISA 1111 y reserva confirmada 10-13 nov (hab. 104) de demo.

## Comparación con la auditoría original (e2e-audit.md, 2026-10-28)

Esta sección se escribió después de terminar mis pruebas, leyendo e2e-audit.md.

### Corregidas (verificadas por mí)
- Home y /products ya usan datos reales de la API (antes plantilla "Ritz-Carlton $5555"); detalle real en /rooms/:id; /productDetail ya no es plantilla.
- Buscar y filtrar funcionan (antes maquetas `href="#"`).
- Navbar con Login/Registro/Mis reservas/Administración enlazados; logo y footer ya no son `#`; menú hamburguesa abre; logout "Salir" existe.
- Rutas protegidas redirigen a /login?next= y regresan tras iniciar sesión.
- /admin ya redirige al cliente (antes mostraba el panel); el backend sigue dando 403.
- Flechas de mes: el clic real SÍ cambia el mes y consulta /availability (el P1-6 original no se reproduce).
- Calendario se refresca tras reservar sin recargar (P2-2 original).
- Selección atascada tras rechazo (P2-3): ya no se atasca; el 15 pasa a ser nueva entrada (queda solo el reparo de falta de mensaje, F-03).
- Cancelar pide confirmación y muestra "Reembolsado $450" (P2-1).
- Rating fuera de rango: ahora 0, -1, 6, 7 dan 400 (antes aceptaba 9 y 99); queda la etiqueta "0-5" (F-06).
- /nope muestra 404 (antes en blanco).
- Mensajes con tildes ("contraseña", "Credenciales inválidas"); sin mojibake.
- Consola: ya no vi ERR_NAME_NOT_RESOLVED/ORB, ni warnings de React; solo "Failed to load resource" de 4xx provocados.
- Móvil 390px: sin desborde en 10 rutas, incluida home (no evalué visualmente el solapamiento de la barra de búsqueda del hero que reportó la original; no hay desborde medido).
- Nuevos controles de seguridad verificados: 429 tras 5 fallos, 400 limpio ante JSON malformado o `month=bad`.

### Siguen
- Contenido de plantilla: lorem ipsum y "Copyright © 2024" en el footer, /about íntegro en inglés con testimonios inventados (P2-10 original, aquí F-01 subido a P1 por contradecir "datos reales").
- Mensajes de validación crudos con nombre de campo en inglés (P2-5 original; F-04). Ya no hay "contrasena" sin tilde.
- Mis reservas sin paginación (P2-6; F-07).
- Etiqueta "Rating (0-5)" inconsistente (F-06).
- Textos del backend/datos sin tilde ("Ciudad de Panama", "Hotel de demostracion").

### Nuevo (no estaba en la original)
- F-02: número de habitación duplicado aceptado en el mismo hotel.
- F-05: menú de perfil del admin con "Config"/"Change Password" `href="#"`, sin logout ni enlace al sitio dentro de /admin, menú lateral en inglés minúsculas (la original no pudo abrir ese menú).
- F-03 (rechazo silencioso de rango), F-08 (meses pasados navegables), F-09 (mensaje de éxito persistente), F-11 (sin Retry-After, 415 con formato por defecto).

### No verificado por mí (la original lo marcó NO EXISTE)
Edición de perfil y vista admin de todas las reservas: no las busqué en esta pasada; en el panel admin solo vi pestañas dashboard/hotel/rooms/users, así que presumiblemente siguen sin existir.
