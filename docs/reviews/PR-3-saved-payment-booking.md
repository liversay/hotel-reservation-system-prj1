# PR #3 — feature/saved-payment-booking → develop
Dev: C · Reviewer: A · QA: B

## Resumen
CRUD de métodos de pago guardados (`/api/payment-methods`), reserva en un clic con `savedPaymentMethodId` que crea un `Payment` PAID, UI `SavedCards` con tarjeta predeterminada preseleccionada.

## Revisión (Reviewer A)
- 🔴 **Nunca persistir PAN/CVV**: la entidad guarda solo marca, últimos 4, vencimiento y un token opaco (`@JsonIgnore`). CVV no se acepta en la API. Verificado con test (la respuesta no contiene el PAN ni "token").
- 🔴 **IDOR**: todos los accesos filtran por dueño (`findByIdAndUserUsername`); probado que otro usuario recibe 404 al usar/borrar/predeterminar.
- 🟡 **Limitación conocida**: el PAN transita por nuestro backend para tokenizar (simulado). En producción debe tokenizarse en el navegador con el SDK de la pasarela (Mercado Pago/Stripe) y exigir HTTPS. Documentado; fuera de alcance del curso.
- 🟡 Tarjeta que vence antes del check-in → 400. Pago no se crea si la reserva falla (409) — probado.
- 🟡 (revisión automática) Open redirect en `Login?next=` → corregido con `safeNext` + tests.

## QA (B)
Backend 7 pruebas nuevas (Luhn, vencida, única predeterminada, IDOR, pago PAID, sin pago si hay conflicto, promover predeterminada al borrar). Frontend 5 nuevas. Total: 20 backend-front verdes (27 backend… ver CI local).

## Veredicto: aprobado.
