# Stripe — carga automática de créditos (v1: solo tarjeta)

**Fecha:** 2026-06-16
**Rama:** `feat-stripe-creditos`
**Estado:** Diseño aprobado, pendiente de plan de implementación

## Objetivo

Permitir que un docente compre créditos por sí mismo con tarjeta y que el saldo
se acredite **en automático** tras el pago, usando **Stripe Checkout** (página
de pago alojada por Stripe). El flujo manual actual (transferencia bancaria +
comprobante por WhatsApp + `acreditarCreditoManual`) **se conserva** como
respaldo y para cortesías/ajustes de admin.

### Alcance v1 (este entregable)
- Pago con **tarjeta** únicamente.
- 3 paquetes con descuento por volumen.
- Acreditación automática vía webhook de Stripe.
- Coexistencia con el flujo manual (no se elimina nada del modelo actual).

### Fuera de alcance (fase 2, documentado pero no implementado)
- OXXO y SPEI (pagos asíncronos): el mismo webhook puede absorberlos manejando
  estados `pendiente` y los eventos `checkout.session.async_payment_succeeded` /
  `async_payment_failed`. No se implementan ahora para no añadir manejo de
  pendientes al primer entregable.
- Suscripciones / pagos recurrentes.
- Reembolsos automáticos vía Stripe (se siguen haciendo manual si hace falta).

## Contexto del sistema actual

- **Saldo:** `users/{uid}.creditos` (entero). Solo el servidor lo modifica;
  las reglas de Firestore impiden que el cliente lo altere.
- **Acreditación manual:** `acreditarCreditoManual` (onCall, solo admin) suma
  créditos en una transacción atómica, con ID idempotente, y registra en:
  - `acreditacionesManual/{id}` (auditoría global)
  - `users/{uid}/compras/{id}` (historial del usuario)
- **Secretos:** Cloud Functions v2 con `defineSecret` + Google Secret Manager
  (p. ej. `GEMINI_API_KEY`, `OPENAI_API_KEY`). Región global `us-central1`.
- **Código huérfano a eliminar:** `src/services/pagos.js` llama a una función
  `crearPreferenciaPago` (Mercado Pago) que **no existe** en el backend. Es un
  intento previo abandonado; se reemplaza por el servicio de Stripe.
- **Tests:** emulador Firestore + vitest + `firebase-functions-test`
  (`npm run test:emu`). 15 tests de créditos vigentes, gate duro en CI.
- **Proyecto Firebase:** `planificador-docente-d48a6`.

## Arquitectura y flujo

```
Usuario en /comprar-creditos
   │ clic "Pagar con tarjeta" (paquete p100 / p300 / p500)
   ▼
[onCall: crearSesionCheckout]  (auth obligatoria)
   │ valida paqueteId contra catálogo del SERVIDOR
   │ crea Checkout Session (monto desde el servidor, nunca del cliente)
   │ guarda compra "pendiente" en users/{uid}/compras/{sessionId}
   │ devuelve session.url
   ▼
window.location = session.url  → página de pago alojada por Stripe
   │ usuario paga con tarjeta (instantáneo)
   ├─► Stripe redirige a /compra-exitosa?session_id=...   (solo UX)
   └─► Stripe POST  ─────────►  [onRequest: stripeWebhook]
                                   │ verifica firma (rawBody + STRIPE_WEBHOOK_SECRET)
                                   │ evento checkout.session.completed
                                   │ idempotencia: stripeEventos/{event.id}
                                   │ transacción atómica:
                                   │   creditos += paquete.creditos
                                   │   compra.estado = 'pagado'
                                   ▼
                                Saldo actualizado en automático
```

**Principio de seguridad central:** la página `/compra-exitosa` es **solo
cosmética**. La única vía que acredita créditos es el **webhook verificado por
firma**. El navegador nunca acredita. Así nadie puede regalarse créditos
manipulando la URL de redirección.

## Catálogo de paquetes (fuente de verdad en el servidor)

```js
// functions: definido en el backend, el cliente solo envía paqueteId
const PAQUETES = {
  p100: { creditos: 100, precioMXN: 100 },
  p300: { creditos: 300, precioMXN: 270 },
  p500: { creditos: 500, precioMXN: 400 },
}
```

- Moneda: `mxn`. Stripe opera en centavos → `precioMXN * 100`.
- El cliente **solo** envía `paqueteId`; el monto y los créditos se derivan
  siempre del catálogo del servidor.
- Precios afinables sin tocar la lógica.

## Backend — Cloud Functions nuevas

### `crearSesionCheckout` (onCall, región `us-central1`)
- **Auth:** obligatoria (`request.auth`); sin auth → `unauthenticated`.
- **Entrada:** `{ paqueteId }`.
- **Validación:** `paqueteId` debe existir en `PAQUETES`; si no →
  `invalid-argument`.
- **Acción:**
  1. Crea Checkout Session de Stripe con:
     - `mode: 'payment'`
     - `payment_method_types: ['card']`
     - `line_items`: 1 ítem con `price_data` (currency `mxn`, `unit_amount` en
       centavos, nombre del paquete), `quantity: 1`.
     - `client_reference_id: uid`
     - `metadata: { uid, paqueteId, creditos: String(paquete.creditos) }`
     - `success_url: <APP_URL>/compra-exitosa?session_id={CHECKOUT_SESSION_ID}`
     - `cancel_url: <APP_URL>/compra-cancelada`
  2. Escribe registro **pendiente** en `users/{uid}/compras/{session.id}`:
     `{ tipo:'stripe', estado:'pendiente', paqueteId, creditos, monto,
        stripeSessionId, fecha }`.
- **Salida:** `{ url: session.url, sessionId: session.id }`.
- **Errores de Stripe:** capturados → `HttpsError('internal', ...)` con log.

### `stripeWebhook` (onRequest, región `us-central1`)
- **Verificación de firma:** `stripe.webhooks.constructEvent(req.rawBody,
  req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET)`. Falla → responde
  `400` (no procesa).
- **Eventos manejados:** `checkout.session.completed`. Cualquier otro tipo →
  responde `200` e ignora (Stripe deja de reintentar).
- **Idempotencia:** dentro de la transacción, lee `stripeEventos/{event.id}`.
  Si ya existe → no acredita, responde `200`. (Stripe reintenta los webhooks;
  jamás se debe acreditar dos veces.)
- **Acreditación (transacción atómica):**
  1. Lee `uid` y `creditos` desde `session.metadata`.
  2. `users/{uid}.creditos += creditos`.
  3. Actualiza `users/{uid}/compras/{session.id}` →
     `estado:'pagado', stripePaymentIntent, pagadoEn`.
  4. Crea `stripeEventos/{event.id}` con
     `{ sessionId, uid, creditos, monto, fecha }` (auditoría + idempotencia).
- **Respuestas:** `200` al éxito o al ignorar; `400` si la firma falla;
  `500` si falla la acreditación (para que Stripe reintente).
- **URL del endpoint (a registrar en el dashboard de Stripe):**
  `https://us-central1-planificador-docente-d48a6.cloudfunctions.net/stripeWebhook`
- **Nota técnica:** Cloud Functions v2 `onRequest` expone `req.rawBody`, que es
  lo que exige la verificación de firma de Stripe. Las reescrituras de hosting
  (SPA → index.html) **no** afectan: Stripe pega directo a la URL de la función.

## Modelo de datos (reutiliza el patrón existente)

| Ruta | Propósito | Notas |
|---|---|---|
| `users/{uid}.creditos` | Saldo | Sin cambios; solo el webhook lo incrementa vía Admin SDK |
| `users/{uid}/compras/{sessionId}` | Historial del usuario | `tipo:'stripe'`, `estado` `pendiente`→`pagado` |
| `stripeEventos/{eventId}` | Auditoría + idempotencia global | Espejo de `acreditacionesManual` |

Reglas de Firestore: confirmar que el cliente **no** puede escribir `creditos`
ni la subcolección `compras` (el webhook usa Admin SDK y omite las reglas).

## Frontend

- **`src/pages/ComprarCreditos.jsx`:**
  - Arriba: 3 tarjetas de paquete (100 / 300 / 500) con botón
    "Pagar con tarjeta" (estilo `btn-accent`, tokens petróleo+coral).
    Clic → `crearSesionCheckout({ paqueteId })` → `window.location = url`.
    Estado de carga mientras se crea la sesión; manejo de error visible.
  - Abajo: la sección de **transferencia + WhatsApp se conserva** como
    respaldo (coexistencia).
- **Rutas nuevas en el router:**
  - `/compra-exitosa` — confirma el pago y **escucha el saldo en vivo**
    (onSnapshot de `users/{uid}.creditos`) hasta que suba; mensaje de
    "acreditando, puede tardar unos segundos".
  - `/compra-cancelada` — mensaje neutral + volver a comprar.
- **Servicio:** reemplazar `src/services/pagos.js` (Mercado Pago huérfano) por
  la llamada a `crearSesionCheckout` (mismo archivo o nuevo `stripeService.js`).
  Eliminar la referencia muerta a `crearPreferenciaPago`.
- **Sin clave pública en el cliente:** al redirigir a `session.url` no se
  necesita la publishable key ni el SDK de Stripe.js en el frontend.

## Secretos y configuración

```
firebase functions:secrets:set STRIPE_SECRET_KEY      # sk_test_... luego sk_live_...
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET  # whsec_... del endpoint registrado
```

- Declarar con `defineSecret('STRIPE_SECRET_KEY')` y
  `defineSecret('STRIPE_WEBHOOK_SECRET')`, adjuntos a ambas funciones vía
  `secrets: [...]`.
- `APP_URL` (base para success/cancel): por entorno (local vs producción).
- Dependencia nueva en `functions/package.json`: `stripe`.

## Manejo de errores

| Situación | Comportamiento |
|---|---|
| `crearSesionCheckout` sin auth | `HttpsError('unauthenticated')` |
| `paqueteId` inválido | `HttpsError('invalid-argument')` |
| Error de la API de Stripe al crear sesión | `HttpsError('internal')` + log |
| Webhook con firma inválida | HTTP `400`, no procesa |
| Webhook evento no manejado | HTTP `200`, ignora |
| Webhook evento duplicado | HTTP `200`, no re-acredita (idempotencia) |
| Webhook falla al acreditar | HTTP `500`, Stripe reintenta |
| Usuario cancela en Stripe | Redirige a `/compra-cancelada`; compra queda `pendiente` (sin abono) |

## Estrategia de pruebas

Reusar el setup actual (emulador Firestore + vitest + `firebase-functions-test`):

1. **Acreditación correcta:** evento `checkout.session.completed` simulado →
   saldo sube exactamente los créditos del paquete y la compra pasa a `pagado`.
2. **Idempotencia:** el mismo `event.id` procesado dos veces → un solo abono.
3. **Validación de paquete:** `crearSesionCheckout` rechaza `paqueteId`
   inexistente y exige auth.
4. **Firma inválida:** webhook responde `400` (se stubea
   `stripe.webhooks.constructEvent` para forzar el throw).
5. **Regresión:** los **15 tests de créditos actuales siguen verdes**
   (gate duro en CI) — `index.js` no debe romper su lógica existente.

**End-to-end local:** Stripe CLI →
`stripe listen --forward-to localhost:.../stripeWebhook` con tarjeta de prueba
`4242 4242 4242 4242`.

## Seguridad

- El monto y los créditos **siempre** se derivan del catálogo del servidor;
  el cliente solo manda `paqueteId`.
- Verificación de firma del webhook **obligatoria** (rechaza payloads no
  firmados por Stripe).
- Acreditación solo vía Admin SDK en el webhook; el cliente nunca toca el saldo.
- Idempotencia por `event.id` para soportar los reintentos de Stripe sin doble
  abono.

## Pasos previos del usuario (logística, fuera del código)

1. En el dashboard de Stripe: obtener `sk_test_...` (modo test).
2. Registrar el endpoint del webhook y copiar el `whsec_...`.
3. Configurar ambos secretos en Firebase (comandos de arriba).
4. Para cobros reales: verificar la cuenta (RFC + cuenta bancaria) y cambiar a
   las keys `live`. Todo el código y las pruebas funcionan antes con keys de
   test.
