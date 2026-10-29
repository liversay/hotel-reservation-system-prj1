# Suite E2E (Playwright)

## Requisitos
- Backend en perfil dev (H2 en memoria) corriendo en http://localhost:3000.
- Frontend (`npm run dev`) corriendo en http://localhost:5173.
- La suite no arranca servidores. Cuentas dev: `admin/admin12345`, `demo/demo12345`.
- Primera vez: `npx playwright install chromium`.

## Ejecutar
`npm run e2e` (reporter list, traza y captura solo si falla).

## Specs
- `visitor`: home y `/products` con datos reales, filtro, detalle, registro/login/logout y enlaces sin dead links.
- `customer-booking`: calendario (flechas de mes, días ocupados, rangos inválidos), reserva completa, refresco y 409.
- `saved-card`: guardar tarjeta y reservar con un clic con la guardada.
- `cancel`: cancelar con confirmación, estado Cancelada, reembolso y disponibilidad restaurada.
- `admin-crud`: CRUD de hoteles, habitaciones y usuarios con validaciones.
- `access-control`: guardas de rutas, 403 en endpoints admin, 404 y errores 400 sin trace.
- `login-rate-limit`: el 6.º fallo seguido da 429 en español.
- `mobile`: 390x844 sin desborde horizontal y menú hamburguesa.

## Datos únicos y limpieza
Cada spec crea hoteles, habitaciones y usuarios con sufijo timestamp y los borra en `afterAll`. El backend conserva a propósito usuarios y habitaciones con reservas (409), así que esos registros quedan en H2 hasta reiniciar; sus nombres únicos evitan colisiones entre corridas.

## Limitación del límite de login
El backend limita los fallos de login por IP: 30 en 15 minutos (ventana por inactividad). `login-rate-limit` consume 5 fallos de ese contador en cada corrida, por lo que no es repetible indefinidamente: caben unas 5-6 corridas por ventana. Después falla en el intento 1 con 429. Reinicia el backend dev antes de repetir la suite más de ~5 veces seguidas.
