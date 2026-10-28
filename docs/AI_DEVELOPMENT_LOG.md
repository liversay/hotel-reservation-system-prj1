# AI Development Log

Herramienta A = Claude Code (Sonnet 5.5, sesión principal). Solo se registran interacciones que afectaron el desarrollo.

| Actividad | Herramienta IA | Qué se solicitó | Resultado | Decisión humana |
|-----------|----------------|-----------------|-----------|-----------------|
| Análisis | A | Analizar repo antes de modificar | Detectó que el backend es esqueleto y front sin API | Aceptada; define alcance |
| Build | A | Compilar backend | Primer diagnóstico: Lombok desactualizado; subir `lombok.version` | **Rechazado/corregido**: no bastó; la causa real era `proc=full` en JDK 23+ |
| Seguridad | A | Implementar JWT + Spring Security | Código funcional, pero con secreto JWT por defecto en properties | **Modificado** en revisión: eliminado el default, secreto obligatorio por entorno |
| Testing | A | Tests de auth (MockMvc) | 6 tests, pasan a la primera | Aceptada; revisados casos 401/403/409 manualmente |
