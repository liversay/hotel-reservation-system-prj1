# AI Development Log

Herramienta A = Claude Code (Sonnet 5.5, sesión principal). Solo se registran interacciones que afectaron el desarrollo.

| Actividad | Herramienta IA | Qué se solicitó | Resultado | Decisión humana |
|-----------|----------------|-----------------|-----------|-----------------|
| Análisis | A | Analizar repo antes de modificar | Detectó que el backend es esqueleto y front sin API | Aceptada; define alcance |
| Build | A | Compilar backend | Primer diagnóstico: Lombok desactualizado; subir `lombok.version` | **Rechazado/corregido**: no bastó; la causa real era `proc=full` en JDK 23+ |
