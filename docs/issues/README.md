# Issues / Historias de usuario

Equipo simulado de 3 roles rotativos (Developer / Reviewer / QA). Cada issue = una rama `feature/*` + PR (`docs/reviews/PR-*.md`).

| # | Historia | Rama | Dev | Reviewer | QA |
|---|----------|------|-----|----------|----|
| 0 | Chore: build en JDK 23+ | `chore/jdk-build-fix` | A | B | C |
| 1 | US-04 Registro/login JWT + roles (habilitador) | `feature/auth-jwt` | A | B | C |
| 2 | US-02 Calendario de disponibilidad | `feature/availability-calendar` | B | C | A |
| 3 | US-01 Reserva con datos de pago guardados | `feature/saved-payment-booking` | C | A | B |
| 4 | US-03 Previsión de demanda (admin) | `feature/demand-forecast` | A | B | C |
| 5 | US-05 Cancelar reserva liberando fechas | `feature/cancel-reservation` | B | C | A |

## Historias
- **US-01** Como usuario recurrente, quiero reservar directamente usando mis datos de pago guardados, para no rellenar el formulario de pago en cada compra.
  - Criterios: guardar tarjeta (solo marca, últimos 4, titular, vencimiento, token; nunca PAN/CVV); marcar predeterminada; reservar enviando `savedPaymentMethodId`; rechazar método ajeno o vencido.
- **US-02** Como cliente, quiero ver un calendario dinámico con días disponibles y ocupados, para elegir mi fecha sin intentos fallidos.
  - Criterios: `GET /api/rooms/{id}/availability?month=YYYY-MM` devuelve estado por día; reservar fechas solapadas responde 409; el calendario no permite seleccionar rangos que incluyan días ocupados.
- **US-03** Como administrador, quiero ver gráficos de previsión de demanda basados en el histórico, para ajustar precios e inventario.
  - Criterios: solo ADMIN; histórico mensual de reservas/ingresos + previsión de 3 meses; sugerencia de ajuste de precio según ocupación prevista.
- **US-04 (adicional, habilitador)** Como visitante, quiero registrarme e iniciar sesión, para que mis reservas y datos de pago queden asociados a mi cuenta. Rol ADMIN protege endpoints de gestión.
- **US-05 (adicional)** Como cliente, quiero cancelar una reserva futura, para liberar las fechas y no pagar por una estancia que no usaré.
  - Criterios: solo el dueño (o ADMIN); no se puede cancelar una reserva iniciada; las fechas vuelven a quedar disponibles.

## Hallazgos del análisis previo (antes de pedir código a la IA)
- Backend es esqueleto: solo CRUD de `Hotel`; `Room/Reservation/Payment/User/Auth` services y controllers vacíos; `SecurityConfig` vacío; Spring Security comentado en `pom.xml`.
- Frontend no hace ninguna llamada HTTP; todo es UI estática con datos de ejemplo; no hay tests.
- `AdminPanel.tsx` importa `../components/SideBar` pero el archivo es `Sidebar.tsx` (rompe en FS sensible a mayúsculas).
- No compila con JDK 23+ por Lombok (procesamiento de anotaciones desactivado por defecto).
- `application.properties` apunta a PostgreSQL con credenciales root/root y logs DEBUG.
