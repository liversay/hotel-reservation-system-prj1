# AI Development Log

Herramienta A = Claude Code (Sonnet 5.5, sesión principal). Solo se registran interacciones que afectaron el desarrollo.

| Actividad | Herramienta IA | Qué se solicitó | Resultado | Decisión humana |
|-----------|----------------|-----------------|-----------|-----------------|
| Análisis | A | Analizar repo antes de modificar | Detectó que el backend es esqueleto y front sin API | Aceptada; define alcance |
| Build | A | Compilar backend | Primer diagnóstico: Lombok desactualizado; subir `lombok.version` | **Rechazado/corregido**: no bastó; la causa real era `proc=full` en JDK 23+ |
| Seguridad | A | Implementar JWT + Spring Security | Código funcional, pero con secreto JWT por defecto en properties | **Modificado** en revisión: eliminado el default, secreto obligatorio por entorno |
| Testing | A | Tests de auth (MockMvc) | 6 tests, pasan a la primera | Aceptada; revisados casos 401/403/409 manualmente |
| Disponibilidad | A | Endpoint de calendario + validar solapes + evitar doble reserva | Lógica noche-based (check-out exclusivo) + lock pesimista de la habitación | Aceptada; la prueba concurrente (2 hilos) confirma que solo 1 reserva se crea |
| Seguridad | Revisión automática (security-guidance) | Revisar commit de auth | Señaló password/token en `toString` con logs DEBUG y enumeración de usuarios por tiempo | **Aceptado**: `@ToString.Exclude`, logs a INFO, bcrypt con hash ficticio. Rate-limiting **diferido** (fuera de alcance) |
| Frontend | A | Calendario dinámico (React) | Lógica de selección separada en `utils/calendar.ts` + componente | Aceptada; 15 tests; se verificó a mano que el rango nunca cruza días ocupados |
| Build | A | `npm run build` | Falla por errores TS **preexistentes** del repo (no por nuestros cambios) | Decisión humana: no arreglar 20+ archivos ajenos; solo tipar bien lo nuevo |
| Pagos | A | Reserva con datos de pago guardados | Diseño con token + últimos 4 desde el inicio; el PAN solo se usa para tokenizar | Aceptada con decisión humana de diseño: CVV nunca se acepta ni guarda; limitación (PAN pasa por backend) documentada |
| Seguridad | Revisión automática | Revisar `Login.tsx` | Open redirect vía `?next=` | **Aceptado**: `safeNext()` con regex + tests |
| Previsión | A | Algoritmo de previsión de demanda | Regresión lineal + promedio móvil; primera versión asignaba toda la reserva al mes de entrada | **Modificado**: prorrateo por noche entre meses; sin estacionalidad (decisión humana: aceptar simplicidad, documentada) |
| Testing | A | Tests de previsión | Un test dependía de otro para crear el usuario admin (falló en una corrida) | **Corregido** y validado con `-Dsurefire.runOrder=reversealphabetical` |
| Frontend | A | Mostrar último mes del histórico | Usó `Array.at()`, no soportado por el `lib` TS del proyecto | **Corregido** tras `tsc` |
| Cancelación | A | Cancelar reserva liberando fechas y reembolsando | Implementación correcta; test inicial de "reserva iniciada" llamaba al registro dos veces (redundante) | Aceptada; limpieza menor del test pendiente (no afecta resultado) |
| E2E | A | Simular los 3 roles contra servidor real | Reveló 2 bugs que 36 tests no vieron: 401 en lugar de 403 y previsión sesgada por mes parcial | **Aceptado y corregido**; lección: MockMvc no cubre el re-despacho a `/error`; añadido test con puerto real, verificado rojo→verde |
| Testing | A | Escapes en tests generados | Varios scripts de edición con `sed`/escapes de `$` fallaron silenciosamente (sed en macOS) y dejaron cambios sin aplicar | **Corregido** a mano; decisión: usar Edit en vez de `sed` para cambios puntuales |
| Admin CRUD | A | Hacer funcionar crear/editar/eliminar en hotel, room y user | Reporte del usuario: mi entrega anterior no lo cubría (paneles estáticos heredados). Además, un marcador `@P` en mi script de generación pisó anotaciones `@PostMapping/@PathVariable` | **Corregido**; lección: validar el alcance contra la UI existente, no solo contra las historias; compilación detectó el error del script |
| Seguridad | Revisión automática | Revisar commit de CRUD de usuarios | Señaló autorización obsoleta: el rol vive en el JWT y no se revoca al degradar/eliminar | **Aceptado**: el filtro lee usuario y rol de la BD en cada request; el token lleva `uid` (nombre reutilizado no hereda tokens). Pendiente: invalidar tokens al cambiar contraseña |
| Entorno | A | Compilar tras el fix | Aparecieron copias `* 2.java` (sincronización del sistema) que rompían la compilación | Comparadas con git (instantáneas antiguas, sin tracking) y eliminadas |
