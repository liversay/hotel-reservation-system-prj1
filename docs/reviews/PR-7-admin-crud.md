# PR #7 — feature/admin-crud → develop
Dev: A · Reviewer: B · QA: C

## Origen
Reporte de usuario: en el panel admin no se podía crear/editar/eliminar hoteles, habitaciones ni usuarios. Causa: `HotelSection/RoomSection/UserSection` eran tablas estáticas del repo original (datos de ejemplo, botones sin acción) y el backend carecía de PUT/DELETE de habitaciones y de gestión de usuarios. Mi entrega previa no cubrió el panel de gestión (solo el Dashboard).

## Cambios
- Backend: `PUT/DELETE /api/rooms/{id}`, `GET /api/rooms` sin filtro, `/api/admin/users` (CRUD), hoteles con 404/409 correctos (antes: 500 o 204 engañoso).
- Frontend: `CrudPanel` genérico + tres secciones conectadas a la API; `/admin` exige sesión.

## Revisión (Reviewer B)
- 🔴 Borrar habitación/hotel/usuario con reservas rompería FK o historial → 409 con mensaje (no cascada).
- 🟡 Un admin no puede borrarse ni cambiarse el rol a sí mismo (evita quedarse sin administración).
- 🟡 Usuarios: nunca se devuelve la contraseña; en edición vacía = no cambiar. Roles validados (USER/ADMIN).
- 🟡 Al borrar usuario se eliminan sus tarjetas guardadas (FK).

## QA (C)
Backend 7 tests nuevos (46 en total), frontend 5 nuevos (34 en total). Verificado además con el servidor real.

## Veredicto: aprobado.
