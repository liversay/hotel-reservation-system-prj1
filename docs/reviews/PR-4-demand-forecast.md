# PR #4 — feature/demand-forecast → develop
Dev: A · Reviewer: B · QA: C

## Resumen
`GET /api/admin/forecast` (solo ADMIN): histórico mensual de noches/ingresos/ocupación (con prorrateo entre meses) y previsión a N meses (regresión lineal 50% + promedio de últimos 3 meses 50%), con sugerencia de ajuste de precio por ocupación. UI: gráfico SVG sin dependencias + tabla de sugerencias en el Dashboard.

## Revisión (Reviewer B)
- 🟡 Método estadístico deliberadamente simple (sin estacionalidad); documentado en `DemandForecaster`. Con 12 meses de histórico es una aproximación, no un modelo productivo.
- 🟡 Se prorratean noches por mes (antes se atribuían al mes de entrada, sesgando meses con estancias a caballo).
- 🟡 Se descartan reservas `CANCELLED` del histórico (probado).
- 🟢 Parámetros acotados (1–36 / 1–12) → 400 si no.
- 🟡 TS: `Array.prototype.at` no existe en el `lib` del proyecto → reemplazado.

## QA (C)
Backend: 6 tests unitarios del forecaster + 5 de integración (401/403, forma, prorrateo, cancelaciones, parámetros). Se detectó un test mío **dependiente del orden** (falló una vez); corregido y verificado ejecutando en orden alfabético inverso. Frontend: 6 tests nuevos (barras, proporciones, signos, vacío, 403, KPIs).

## Veredicto: aprobado.
