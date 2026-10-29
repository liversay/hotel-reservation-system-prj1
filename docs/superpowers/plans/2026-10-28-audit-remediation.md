# Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir las fallas halladas en la auditoría (`docs/audit/code-audit.md`, `docs/audit/e2e-audit.md`) para que todos los requisitos del proyecto sean usables desde la interfaz, y probarlos con Playwright.

**Architecture:** Backend Spring Boot (puerto 3000, perfil dev con H2) y frontend React/Vite/TS (5173). Cambios en una sola rama `fix/audit-remediation`; las tareas tocan archivos disjuntos para poder correr en paralelo, con un commit por tarea que añade solo sus archivos.

**Tech Stack:** Spring Boot + JUnit/MockMvc, React + Vitest + Testing Library, `@playwright/test` para la suite E2E.

**Spec:** `proyecto1_instrucciones.md` (directorio padre) y los dos informes de `docs/audit/`.

## Global Constraints

- JDK 26: usar `sh ./mvnw` (no hay `mvn`); `maven.compiler.proc=full` y lombok 1.18.44 ya están en el pom.
- Cuentas dev: admin/admin12345, demo/demo12345. Backend `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev`; datos H2 en memoria.
- Ignorar y no commitear las copias `* 2` de iCloud; nunca `git add -A`, añadir archivos por ruta.
- Texto de UI en español con tildes.
- Comportamiento por API ya correcto (US-01..US-05, CRUD admin) no debe cambiar: las suites actuales (backend 49, frontend 34) deben seguir verdes.
- No dar nada por terminado sin ejecutar el test correspondiente y mostrar su salida.

## Review Focus

- `GET /api/rooms/{id}/availability?month=abc` o JSON malformado: 400 con mensaje, nunca 500 ni stack trace.
- Usuario cliente (demo) abre `/admin` por URL: debe ser redirigido, no ver el panel.
- Visitante sin sesión abre `/my-reservations` o `/book/1`: redirige a `/login` y vuelve tras el login.
- Ruta inexistente (`/nope`): página 404 con enlace al inicio, no página en blanco.
- Rating de hotel fuera de 1..5 (p. ej. 99) en alta y edición: 400.

---

### Task 1: Build del frontend en verde

**Files:**
- Modify: los 13 archivos con `import React` sin usar (TS6133) y `src/components/Search.tsx:27` (TS2345), en `hotel-reservation-system-frontend/src`.

**Interfaces:**
- Produces: `npm run build` sale con código 0. Las demás tareas frontend dependen de esto.

- [ ] **Step 1:** Ejecutar `npm run build`; confirmar los 14 errores.
- [ ] **Step 2:** Quitar los imports sin usar y corregir el tipo en `Search.tsx:27` sin cambiar comportamiento.
- [ ] **Step 3:** `npm run build && npm test -- --run` → build exit 0, 34 tests pasan.
- [ ] **Step 4:** Commit `fix(frontend): build de produccion sin errores de TypeScript`.

### Task 2: Backend robusto (errores, validación, rate limiting)

**Files:**
- Modify: `exception/` (handler global), `controller/RoomController.java` (`@Valid` en `RoomDTO`, month inválido), `dto/HotelDTO` (rating `@Min(1) @Max(5)`), `dto/ReservationDTO` (quitar `"user":null`), `application*.properties` (`server.error.include-stacktrace=never`), filtro/servicio de login con límite de intentos.
- Test: `src/test/java/...` (nuevos `ErrorHandlingTest`, `LoginRateLimitTest`, casos de rating).

**Interfaces:**
- Produces: respuestas de error `ApiResponse` con 400 para `HttpMessageNotReadableException`, `MethodArgumentTypeMismatchException`, `DateTimeParseException` y month inválido; 404 sin trace en rutas inexistentes; login bloqueado con 429 tras 5 fallos seguidos por usuario+IP durante 15 min (en memoria).

- [ ] **Step 1:** Escribir tests rojos: `malformedJsonReturns400NoTrace`, `badMonthReturns400`, `ratingAbove5Returns400OnCreateAndUpdate`, `roomCreateInvalidReturns400`, `sixthFailedLoginReturns429`, `successfulLoginResetsCounter`.
- [ ] **Step 2:** `sh ./mvnw test` → fallan solo esos.
- [ ] **Step 3:** Implementar handler global, `@Valid`, validación de month, límite de intentos.
- [ ] **Step 4:** `sh ./mvnw test` → todos verdes (≥55).
- [ ] **Step 5:** Commit `fix(backend): errores 400 sin trace, validacion de rating y rate limiting de login`.

### Task 3: Navegación, sesión y guardas de ruta

**Files:**
- Modify: `components/Header.tsx`, `components/Button.tsx` (si fuerza `href="#"`), `components/Footer.tsx`, `App.tsx`, `auth/*` (estado de sesión), `pages/Login.tsx` (+ registro si no existe en UI).
- Create: `auth/RequireAuth.tsx`, `auth/RequireAdmin.tsx`, `pages/NotFound.tsx`, `pages/Register.tsx` si falta.
- Test: Vitest `auth/RequireAuth.test.tsx`, `Header.test.tsx`.

**Interfaces:**
- Produces: `<RequireAuth>` redirige a `/login?next=<ruta>` (reutilizar `safeNext`); `<RequireAdmin>` exige rol ADMIN (leer del token/`/me` ya existente) y redirige a `/`; Header muestra Iniciar sesión/Registrarse o "Mis reservas" + Salir (borra token) y panel de admin solo a admin; menú hamburguesa abre/cierra.

- [ ] **Step 1:** Tests rojos: guarda redirige sin token; cliente no pasa `RequireAdmin`; Header muestra Salir con sesión y logout limpia el token; ruta `*` renderiza NotFound.
- [ ] **Step 2:** Implementar; enlaces con `<Link>` reales a `/login`, `/register`, `/my-reservations`.
- [ ] **Step 3:** `npm test -- --run && npm run build` verdes.
- [ ] **Step 4:** Commit `feat(frontend): navegacion real, logout, guardas de ruta y 404`.

### Task 4: Hoteles y habitaciones reales con búsqueda y reserva

**Files:**
- Modify: `pages/Home.tsx`, `pages/Rooms.tsx`, `pages/RoomDetails.tsx`, `components/CardRoom.tsx`, `components/RoomDetailComponent.tsx`, `components/Search.tsx`, `components/SideBarFilter.tsx`.
- Create: `api/hotels.ts` funciones usando endpoints públicos existentes.
- Test: Vitest para listado, filtro y botón Reservar.

**Interfaces:**
- Consumes: endpoints de hoteles/habitaciones ya existentes en el backend (el agente confirma rutas leyendo los controladores).
- Produces: `/products` lista habitaciones reales con filtro por texto/precio; `/productDetail?roomId=` (o ruta `/rooms/:id`) muestra datos reales; botón "Reservar" navega a `/book/:roomId`; estado vacío y error de carga.

- [ ] **Step 1:** Tests rojos con API mockeada: renderiza N tarjetas, filtra por texto, Reservar navega a `/book/ID`.
- [ ] **Step 2:** Implementar sin tocar `Header.tsx`/`App.tsx` (Task 3); si hace falta una ruta nueva, anotarla y añadirla en la integración.
- [ ] **Step 3:** `npm test -- --run && npm run build` verdes.
- [ ] **Step 4:** Commit `feat(frontend): catalogo real de habitaciones con busqueda y enlace a reserva`.

### Task 5: Calendario y cancelación pulidos

**Files:**
- Modify: `components/AvailabilityCalendar.tsx`, `pages/BookRoom.tsx`, `pages/MyReservations.tsx` y sus tests.

**Interfaces:**
- Produces: flechas de mes funcionan con clic real (diagnosticar con Playwright por qué `element.click()` sí y clic real no, probable overlay/`pointer-events`/z-index); el calendario se recarga tras reservar; cancelar pide confirmación inline y muestra el reembolso; mensajes de error con tildes y legibles.

- [ ] **Step 1:** Reproducir con Playwright el fallo de flechas y registrar causa raíz (systematic-debugging) antes de cambiar nada.
- [ ] **Step 2:** Tests rojos: flecha cambia mes; tras reserva exitosa se vuelve a pedir disponibilidad; cancelar requiere confirmar y muestra "Reembolsado".
- [ ] **Step 3:** Implementar; `npm test -- --run && npm run build` verdes.
- [ ] **Step 4:** Commit `fix(frontend): flechas del calendario, recarga tras reservar y confirmacion de cancelacion`.

### Task 6: Suite E2E con Playwright

**Files:**
- Create: `hotel-reservation-system-frontend/playwright.config.ts`, `e2e/*.spec.ts` (`visitor`, `customer-booking`, `saved-card`, `cancel`, `admin-crud`, `access-control`, `mobile`), script `npm run e2e`.

**Interfaces:**
- Consumes: Tareas 1–5 integradas, backend en 3000 y frontend en 5173 recién reiniciados con datos limpios.
- Produces: `npm run e2e` ejecuta todas las specs contra servidores reales.

- [ ] **Step 1:** Instalar `@playwright/test` y navegador chromium.
- [ ] **Step 2:** Escribir una spec por flujo auditado, incluyendo las cinco líneas de Review Focus y viewport 390px sin desborde horizontal.
- [ ] **Step 3:** `npm run e2e` → todo verde; adjuntar la salida.
- [ ] **Step 4:** Commit `test(e2e): suite Playwright de los flujos de visitante, cliente y admin`.

### Task 7: Verificación final independiente y cierre

**Files:**
- Modify: `docs/audit/` (nuevo `verification.md`), `docs/AI_DEVELOPMENT_LOG.md`, memoria del proyecto.

- [ ] **Step 1:** Reiniciar backend y frontend limpios; agente fresco repite la auditoría E2E con Playwright MCP (sin ver los arreglos) y compara con el informe original.
- [ ] **Step 2:** Correr `sh ./mvnw test`, `npm test -- --run`, `npm run build`, `npm run e2e`; pegar salidas reales en `verification.md`.
- [ ] **Step 3:** Registrar en el log de IA las respuestas erróneas/rechazadas reales de esta sesión. Solo hechos ocurridos.
- [ ] **Step 4:** Merge a `main` en local; el push a GitHub se confirma con el usuario.

## Orden de ejecución

T1 → (T2 en paralelo con T3, T4, T5, que tocan archivos disjuntos) → T6 → T7. Cada tarea la implementa un subagente nuevo y la revisa otro antes de seguir.
