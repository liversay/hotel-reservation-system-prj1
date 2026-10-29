# Auditoría E2E en navegador (Playwright MCP)

Fecha: 2026-10-28. Frontend http://localhost:5173, API http://localhost:3000. Cuentas usadas: admin, demo y un usuario nuevo (qa50930). No se modificó código fuente.
Capturas: `docs/audit/screenshots/` (01 a 37). Consola y red se revisaron con Playwright, y los 4xx/5xx se registraron por script.

Caveat: el backend es compartido y otro agente o proceso lo usaba a la vez (existían AuditHotel con rating 99, usuarios audit1/audit2, la sala A-T y reservas previas de demo). Esos datos no son de esta auditoría. Mis datos de prueba (hotel QA, sala QA-2, usuario qauser1, reservas de demo) se borraron o cancelaron al terminar.

## Tabla de requisitos

| Requisito | Estado | Evidencia |
|---|---|---|
| Visitante: listado de hoteles | PARCIAL | Home `/` muestra 4 tarjetas, pero son datos estáticos (Jujuy, Córdoba... todas con "220 West 41st Street", precios y rating fijos). No llama a `/api/hotel/get-all`, que sí devuelve "MN Hotel Centro". `/products` repite 8 veces `CardRoom` con "The Ritz-Carlton, Bali $5555". Capturas 01 y 06. |
| Visitante: detalle de hotel / habitaciones | PARCIAL | `/productDetail` es una plantilla estática (Deluxe Room $150, 123 Main Street) y no recibe id. La habitación real solo se ve en `/book/:roomId`, que muestra "Reservar habitación 101 · Doble" con datos de la API. Ningún enlace de la UI lleva a `/book/:id` ni a `/my-reservations`. Capturas 07 y 10. |
| Visitante: registro | FUNCIONA | `/login` > "Regístrate". Contraseña corta da 400 y se muestra "La contrasena debe tener al menos 8 caracteres". Con una válida da 200, guarda el token y redirige a `/`. Capturas 05 y 03. |
| Visitante: login | FUNCIONA | admin entra a `/admin`, demo respeta `?next=`. Credenciales malas dan 401 con "Credenciales invalidas" (captura 04). Pero los botones "Login" y "Register" de la navbar son `href="#"` y no llevan a ninguna parte (ver P1-1). |
| Visitante: logout | FALLA | No hay botón ni enlace de cerrar sesión. Solo existe `tokenStore.clear` y no se usa en la UI (búsqueda en el código). Tuve que limpiar localStorage a mano. |
| Rutas protegidas redirigen a login | FALLA | `/my-reservations` sin sesión muestra la página vacía "Mis reservas" y dispara 401 en consola, sin redirigir (captura 02). `/admin` sin token muestra el texto "Necesitas iniciar sesión" con un enlace, tampoco redirige. `/book/1` sí redirige a `/login?next=` al pulsar reservar. |
| US-02 calendario con días disponibles y ocupados | FUNCIONA | `/book/1` pinta pasado (gris, deshabilitado), disponible (verde) y ocupado (rojo, tachado, deshabilitado). Tras reservar 10-12 dic, 10 y 11 dic salen ocupados y deshabilitados. Un rango que cruza ocupados no se acepta. El 12 (checkout) queda libre. Capturas 12, 13 y 15. Ver P1-2 y P2 por defectos menores. |
| Crear reserva completa | FUNCIONA | Elegir 10 a 12 dic, 2 noches, $160. `POST /api/reservations` devuelve 201 y aparece "¡Reserva confirmada!" (captura 14). Una reserva solapada por API da 409, fechas invertidas o pasadas dan 400. |
| US-01 guardar tarjeta y reservar con un clic | FUNCIONA | La tarjeta VISA 1111 estaba como predeterminada y preseleccionada. Guardé una MASTERCARD 4444 con el formulario, 201 y aparece en la lista (captura 17). Con una tarjeta guardada seleccionada, el botón "Reservar y pagar con tarjeta guardada" crea la reserva en un solo clic, con el pago ligado a la tarjeta. Un número "1234" es rechazado con 400 y se muestra el error (captura 16b). |
| Ver mis reservas | FUNCIONA | `/my-reservations` lista 142 reservas con estado y el botón Cancelar solo si es futura (captura 18). Ver P2 (sin paginación ni orden claro). |
| US-05 cancelar reserva | PARCIAL | `PUT /api/reservations/141/cancel` da 200, estado CANCELLED, pago `REFUNDED` por 160, y 10-11 dic vuelven a estar disponibles (API y calendario). Falla en la UI: no muestra el reembolso y cancela sin confirmación (captura 19). Cancelar la reserva de otro usuario da 400 y un id inexistente da 404. |
| Editar perfil | NO EXISTE | No hay ruta, ni UI, ni endpoint de perfil. |
| Buscar o filtrar hoteles | FALLA | El buscador de Home (Location, fechas, Search) y `SideBarFilter` en `/products` son maquetas. "Search" y "Apply Filters" son `href="#"` y no filtran nada. |
| US-03 dashboard con previsión y precios | FUNCIONA | Admin ve las tarjetas ($41,720, 21%, 6 habitaciones), un gráfico de barras histórico y previsión (12 meses y 3 de pronóstico) y la tabla "Ajuste de precios sugerido" (los 3 meses -10%). `GET /api/admin/forecast` da 200. Capturas 21 y 30. |
| CRUD hoteles | PARCIAL | Crear, editar (PUT 200) y eliminar con confirmación inline "¿Eliminar? Sí/No" (DELETE 200) funcionan. Validación: nombre vacío lo bloquea el navegador, pero el rating acepta 9 y 99 pese a la etiqueta "0-5" (captura 23). |
| CRUD habitaciones | FUNCIONA | Crear (201), editar precio (200) y eliminar (204) con QA-2. Precio -50 da 400 y se muestra el error. Capturas 25. El mensaje sale como "pricePerNight debe ser mayor que 0" (nombre técnico de campo, ver P2). |
| CRUD usuarios | FUNCIONA | Crear (201), editar rol USER a ADMIN (200), eliminar (204). Email sin `@` lo bloquea el navegador, contraseña corta da 400, usuario duplicado da 409 ("El usuario o email ya existe"), borrar la propia cuenta da 409 ("No puedes eliminar tu propia cuenta"). Capturas 26 a 28. |
| Ver todas las reservas (admin) | NO EXISTE | No hay pestaña en `/admin` ni endpoint: `GET /api/reservations` da 405, `/api/admin/reservations` y `/api/reservations/all` dan 404. |
| Cliente no entra a endpoints admin | FUNCIONA | Con el token de demo: POST/PUT/DELETE de `/api/hotel/**` y `/api/rooms/**` y GET/PUT `/api/admin/**` dan todos 403. |
| Cliente no entra a /admin (UI) | FALLA | La página `/admin` solo comprueba que haya cualquier token. demo ve el panel completo con pestañas y botones Editar y Eliminar. El backend los rechaza con 403 ("Forbidden" en la pestaña Users, "necesitas iniciar sesión" en el dashboard), pero la UI no lo impide. Captura 20. |
| Responsive 390px | PARCIAL | Sin desborde horizontal en 8 rutas (`scrollWidth` = 390). Home: la barra de búsqueda se superpone al título del hero y el input "Location" queda aplastado. El botón hamburguesa de la navbar no hace nada (ver P1-3). El panel admin se ve bien (captura 30). Capturas 30 a 37. |
| Mensajes de error | PARCIAL | Login, registro, tarjeta, reserva solapada (texto "Esas fechas ya no están disponibles") y CRUD muestran el error. Algunos mensajes del backend salen sin tildes o con nombre de campo en inglés. |
| Estados vacíos | PARCIAL | "Aún no tienes reservas" y "Crea primero un hotel..." existen. No se prueba el vacío de hoteles en Home porque es estático. |
| Navegación (enlaces navbar) | PARCIAL | Home, Rooms (`/products`) y About Us (`/about`) funcionan. Login, Register, el logo y todo el footer son `href="#"`. |
| Consola sin errores | FALLA | Home: `ERR_NAME_NOT_RESOLVED` en una imagen externa (ltmcdn.com) y `ERR_BLOCKED_BY_ORB` en imágenes y enlaces externos. `/products`: warning `validateDOMNesting` (`<a>` dentro de `<a>` en Button). `/productDetail`: warning `fill-rule`. `/my-reservations` anónimo: 401. |

## Fallas priorizadas

### P0 (bloqueante)
No encontré fallas que bloqueen el flujo principal de reserva ni la seguridad del backend. La autorización por rol del API es correcta.

### P1 (importante)
1. **Login, Register, Search, Explore Hotels, Find Offers, "See Availability" y el footer son enlaces muertos.** Pasos: abrir `/`, pulsar "Login" en la navbar y la URL pasa a `/#`. Un visitante no puede llegar a `/login` desde la UI, ni a `/book/:id` o `/my-reservations` (ningún enlace los apunta).
2. **Home, `/products` y `/productDetail` son datos fijos de plantilla**, no del backend. Pasos: `/products` muestra 8 veces "The Ritz-Carlton, Bali $5555". El listado y detalle de hoteles y habitaciones reales no se ve desde la UI pública. Tampoco funcionan buscar ni filtrar.
3. **Sin logout** en ninguna parte de la UI, y el menú móvil (hamburguesa) no tiene acción. Pasos: iniciar sesión y buscar la opción de cerrar sesión, no hay. En 390px pulsar el icono de la navbar no abre nada.
4. **Las rutas protegidas no redirigen.** Pasos: sin sesión abrir `/my-reservations`, se ve la página vacía con 401 en consola. `/admin` anónimo solo muestra un texto con enlace.
5. **El panel `/admin` es visible para clientes.** Pasos: entrar como demo y abrir `/admin`. Se ve el panel con Hotel, Rooms y Users, solo el backend rechaza las acciones con 403. Debería comprobarse el rol.
6. **Las flechas de mes del calendario no responden a clics reales en mi entorno.** Pasos: en `/book/1` hacer clic con Playwright (`click`, `dblclick`, `mouse.click` y Enter con foco) en "Mes siguiente", el título no cambia de "Octubre 2026". Con `element.click()` vía JavaScript sí cambia de mes y carga `availability?month=2026-11`. Los días y los demás botones sí responden a clics reales. No pude explicar la causa. Hay que verificarlo a mano en un navegador. Si es real, el usuario no puede ver meses futuros.

### P2 (menor)
1. **Cancelar reserva no pide confirmación** y la UI no muestra el reembolso (el API devuelve el pago `REFUNDED`).
2. **El calendario no se refresca tras reservar.** Después de "¡Reserva confirmada!" las fechas recién reservadas siguen verdes hasta recargar.
3. **Selección atascada tras rechazo.** En `/book/1` dic, clic en 9 y luego en 13 (cruza ocupados): el rango se rechaza. Después, clic en 20 y 22 no deja un rango válido y el botón sigue deshabilitado hasta recargar.
4. **Rating de hotel sin validación de rango** (acepta 9 y 99 con etiqueta "0-5"). Solo el nombre es obligatorio.
5. **Mensajes de validación crudos**, por ejemplo "pricePerNight debe ser mayor que 0", y textos sin tildes del backend ("contrasena").
6. **Mis reservas no tiene paginación** (142 elementos) y el orden no es claro.
7. **Rutas inexistentes** (`/nope`) muestran una página en blanco, sin 404 (`ErrorPage.tsx` existe, no está cableada).
8. **Home en móvil:** la barra de búsqueda se superpone al título del hero y el input "Location" queda aplastado (captura 31).
9. **Consola:** imágenes externas rotas (`ERR_NAME_NOT_RESOLVED`, `ERR_BLOCKED_BY_ORB`) y warnings de React (`<a>` anidado, `fill-rule`).
10. **Textos de plantilla sin cambiar:** "Save 15% ... before 13/09/2024", "Offer valid until 24th March, 2021", lorem ipsum en el footer, "Discover Argentina" con enlaces a booking.com, mezcla de inglés y español.
11. **Sin vista admin de todas las reservas** y sin edición de perfil (no existen).

## No probado
- El menú desplegable del avatar del admin (el clic no abrió nada visible, en pantalla solo se ve la imagen).
- Pago real o fallido con tarjeta (no hay pasarela, solo se guarda el método).
- Pruebas de carga o concurrencia.
