# PR #5 — feature/cancel-reservation → develop
Dev: B · Reviewer: C · QA: A

## Resumen
`PUT /api/reservations/{id}/cancel` (dueño o ADMIN), reembolso de pagos PAID → REFUNDED, fechas liberadas; página `/my-reservations`.

## Revisión (Reviewer C)
- 🟡 Reserva ajena → 404 (no 403) para no filtrar existencia.
- 🟡 Regla "no cancelar si ya inició": comparada con fecha del servidor; la UI solo oculta el botón (el backend es la fuente de verdad).
- 🟡 UI usa fecha UTC (`toISOString`) para ocultar el botón: puede diferir unas horas del servidor por zona horaria; no afecta seguridad (el backend decide). Registrado como deuda menor.
- 🟢 Doble cancelación → 409.

## QA (A)
Backend 5 tests (liberar fechas, doble cancelación, 404/401, iniciada → 400, reembolso). Frontend 3 tests. Totales: backend 36, frontend 29.

## Veredicto: aprobado.
