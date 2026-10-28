# PR #2 — feature/availability-calendar → develop
Dev: B · Reviewer: C · QA: A

## Resumen
`GET /api/rooms/{id}/availability?month=YYYY-MM`, `POST /api/reservations` con validación de solape, calendario React clicable y página `/book/:roomId`.

## Revisión (Reviewer C)
- 🔴 Riesgo de doble reserva por carrera (check-then-insert): se mitigó con `PESSIMISTIC_WRITE` sobre la habitación; verificado con prueba de 2 hilos.
- 🟡 Semántica de fechas: noche-based, check-out exclusivo (permite check-in el mismo día de otro check-out). Documentado y probado.
- 🟡 `npm run build` ya fallaba en upstream (`React` sin usar, tipo en `Search.tsx`); **no** es regresión de este PR. Corregido solo el import `SideBar`→`Sidebar` (rompía en Linux).
- 🟢 El 409 se muestra al usuario con mensaje claro.

## QA (A)
Backend: 7 pruebas (precio, solapes, rangos inválidos, 401, calendario, 404, concurrencia). Frontend: 11 de lógica de selección + 4 de componente. Todas verdes.

## Veredicto: aprobado.
