# PR #6 — fix/e2e-findings → develop
Dev: C · Reviewer: A · QA: B

## Origen
Prueba manual end-to-end contra el servidor real (perfil `dev`) simulando visitante, cliente y admin. Encontró dos defectos que las 36 pruebas MockMvc **no** detectaron.

## Hallazgos
1. **403 → 401 en `/api/admin/**`** para usuario autenticado sin rol. Causa: el 403 se re-despacha a `/error`, que exigía autenticación; MockMvc no ejecuta ese despacho. Fix: `permitAll` para `/error`. Test de regresión con puerto real (`RealDispatchSecurityTest`); verificado en rojo sin el fix y en verde con él.
2. **Previsión sesgada a la baja**: el mes en curso (incompleto) entraba al histórico con valores parciales/0. Fix: histórico = últimos N meses *completos*; la previsión arranca en el mes en curso y nunca es menor que lo ya reservado. 2 tests nuevos.

## Veredicto: aprobado. Totales: backend 39, frontend 29.
