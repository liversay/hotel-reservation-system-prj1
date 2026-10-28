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
