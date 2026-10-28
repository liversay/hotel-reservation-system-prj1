# PR #1 — feature/auth-jwt → develop
Dev: A · Reviewer: B · QA: C

## Resumen
Registro/login con JWT stateless, roles USER/ADMIN, `SecurityConfig` con reglas por ruta, manejador global de errores.

## Revisión (Reviewer B)
- 🔴 **Secreto JWT por defecto en `application.properties`** (`change-me-...`): permitiría forjar tokens si se despliega sin configurar. → Corregido: sin valor por defecto (la app no arranca sin `JWT_SECRET`); el perfil `dev` trae uno solo para desarrollo.
- 🟡 `password` de `User` se serializaba en JSON si alguna vez se devuelve la entidad. → `@JsonIgnore` añadido.
- 🟢 Registro público fuerza rol USER (no acepta rol del cliente). OK.

## QA (C)
6 pruebas MockMvc: registro+login, duplicado 409, password incorrecto 401, password corto 400, `/api/admin/**` 401 anónimo / 403 USER, token alterado 401. Todas verdes.

## Veredicto: aprobado tras correcciones.
