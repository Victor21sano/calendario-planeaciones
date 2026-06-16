# Stripe — carga automática de créditos (v1: solo tarjeta) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que un docente compre créditos con tarjeta vía Stripe Checkout y que el saldo se acredite en automático mediante un webhook verificado, conservando el flujo manual como respaldo.

**Architecture:** Frontend redirige a Stripe Checkout (página alojada). El backend define el catálogo de paquetes (fuente de verdad), crea la sesión de pago (`crearSesionCheckout`, onCall) y acredita en automático al recibir `checkout.session.completed` en un webhook (`stripeWebhook`, onRequest) que verifica la firma de Stripe y es idempotente por `event.id`. Reutiliza el modelo de datos y las transacciones atómicas existentes.

**Tech Stack:** Firebase Cloud Functions v2 (Node 22), `stripe` npm SDK, Firestore (Admin SDK), React + React Router + Vite, vitest + firebase-functions-test + emulador Firestore.

**Spec:** `docs/superpowers/specs/2026-06-16-stripe-creditos-design.md`

**Nota de contexto importante:** los tests de créditos (`functions/test/`) existen en las ramas `tests-creditos` / `tests-sesiones-v2` pero **no están en `main`**, de donde sale esta rama. Por eso la Task 1 crea la infraestructura de test (`functions/vitest.config.js`) y la Task 4 crea un archivo de test **autocontenido** (`functions/test/stripe.test.js`) con sus propios helpers inline, sin depender de `functions/test/helpers.js` de las otras ramas (para evitar colisiones de merge).

---

## File Structure

**Backend (`functions/index.js` — un solo módulo, se añaden secciones):**
- `PAQUETES` — catálogo (fuente de verdad de créditos y precio).
- `crearSesionCheckout` (onCall) — crea la Checkout Session + registro pendiente.
- `acreditarCompraStripe(...)` — helper transaccional idempotente (acredita).
- `stripeWebhook` (onRequest) — verifica firma, delega en el helper.

**Backend (infra de test):**
- Create: `functions/vitest.config.js`
- Create: `functions/test/stripe.test.js` (helpers inline, autocontenido)

**Reglas:**
- Modify: `firestore.rules` — bloquear `stripeEventos` al cliente.

**Frontend:**
- Create: `src/services/stripeService.js` (reemplaza el huérfano `pagos.js`).
- Delete: `src/services/pagos.js`.
- Modify: `src/pages/ComprarCreditos.jsx` — tarjetas de paquete + botón pagar.
- Create: `src/pages/CompraExitosa.jsx`, `src/pages/CompraCancelada.jsx`.
- Modify: `src/App.jsx` — rutas + lazy imports.

---

## Task 1: Dependencia Stripe e infraestructura de test

**Files:**
- Modify: `functions/package.json`
- Create: `functions/vitest.config.js`

- [ ] **Step 1: Instalar el SDK de Stripe en functions**

Run:
```bash
cd functions && npm install stripe@^17.0.0
```
Expected: `stripe` aparece en `functions/package.json` → `dependencies` y `package-lock.json` se actualiza.

- [ ] **Step 2: Crear la config de vitest para functions**

Create `functions/vitest.config.js`:
```js
import { defineConfig } from 'vitest/config'

// Los tests hablan con el emulador de Firestore vía el Admin SDK (transacciones
// reales). Se ejecutan en serie y con timeout amplio.
export default defineConfig({
  // Sin esto, Vite busca hacia arriba un postcss.config.js y carga el de la RAÍZ
  // (que requiere tailwindcss) — ausente en functions/node_modules y rompe CI.
  css: { postcss: { plugins: [] } },
  test: {
    globals: true,
    include: ['test/**/*.test.js'],
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
})
```

- [ ] **Step 3: Verificar que vitest corre (sin tests aún)**

Run:
```bash
cd functions && npx vitest run
```
Expected: vitest arranca y reporta "No test files found" (o 0 tests). Sin errores de configuración de postcss.

- [ ] **Step 4: Commit**

```bash
git add functions/package.json functions/package-lock.json functions/vitest.config.js
git commit -m "chore(stripe): añade SDK de stripe y config de vitest en functions"
```

---

## Task 2: Catálogo de paquetes y secretos en el backend

**Files:**
- Modify: `functions/index.js` (zona de secretos/constantes, junto a los otros `defineSecret`)

- [ ] **Step 1: Declarar secretos y catálogo de paquetes**

En `functions/index.js`, junto a los `defineSecret` existentes (`GEMINI_API_KEY_SECRET`, `OPENAI_API_KEY_SECRET`), añade:
```js
const STRIPE_SECRET_KEY     = defineSecret('STRIPE_SECRET_KEY')
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET')
const Stripe                = require('stripe')

// Base de la app para success/cancel del Checkout. Configurable por entorno.
const APP_URL = process.env.APP_URL || 'https://planificador-docente-d48a6.web.app'

// Catálogo de paquetes — FUENTE DE VERDAD. El cliente solo envía paqueteId;
// el monto y los créditos SIEMPRE se derivan de aquí (nunca del cliente).
const PAQUETES = {
  p100: { creditos: 100, precioMXN: 100 },
  p300: { creditos: 300, precioMXN: 270 },
  p500: { creditos: 500, precioMXN: 400 },
}
```

- [ ] **Step 2: Verificar que el módulo sigue cargando**

Run:
```bash
cd functions && node -e "require('./index.js'); console.log('index.js carga OK')"
```
Expected: imprime `index.js carga OK` sin errores (puede emitir warnings de credenciales de Firebase Admin; eso es normal fuera del entorno de functions).

- [ ] **Step 3: Commit**

```bash
git add functions/index.js
git commit -m "feat(stripe): secretos y catálogo de paquetes en el backend"
```

---

## Task 3: `crearSesionCheckout` (onCall) — validación TDD + creación de sesión

La validación (auth + paqueteId) ocurre ANTES de llamar a Stripe, por lo que es
testeable offline. La creación real de la sesión (que llama a la red de Stripe)
se verifica end-to-end en la Task 8 con el Stripe CLI.

**Files:**
- Modify: `functions/index.js`
- Test: `functions/test/stripe.test.js` (se crea aquí, se amplía en Task 4/5)

- [ ] **Step 1: Escribir los tests de validación que fallan**

Create `functions/test/stripe.test.js`:
```js
// Tests del flujo de pago con Stripe contra el emulador de Firestore.
//   npm run test:emu
// describe/it/expect son globales (vitest.config.js → globals: true).

// Secretos dummy ANTES de requerir el módulo: las funciones leen
// SECRET.value() || process.env.SECRET, así que esto basta para tests offline.
process.env.STRIPE_SECRET_KEY     = 'sk_test_dummy'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy'

const fft = require('firebase-functions-test')()
const fns = require('../index')
const { getFirestore } = require('firebase-admin/firestore')

const db = getFirestore()

let _c = 0
function uniqueUid(p = 'u') { return `${p}-${Date.now()}-${_c++}` }
function userRef(uid) { return db.collection('users').doc(uid) }
async function seedUser(uid, creditos) { await userRef(uid).set({ email: `${uid}@test.mx`, creditos }) }
async function getCreditos(uid) { const s = await userRef(uid).get(); return s.exists ? s.data().creditos : undefined }

async function expectHttpsError(promise, code) {
  let err
  try { await promise } catch (e) { err = e }
  if (!err) throw new Error(`Se esperaba rechazo "${code}" pero resolvió.`)
  expect(err.code).toBe(code)
  return err
}

const crearSesion = fft.wrap(fns.crearSesionCheckout)

afterAll(() => fft.cleanup())

describe('crearSesionCheckout — validación', () => {
  it('rechaza sin autenticación', async () => {
    await expectHttpsError(crearSesion({ data: { paqueteId: 'p100' } }), 'unauthenticated')
  })

  it('rechaza un paqueteId inexistente', async () => {
    const uid = uniqueUid()
    const req = { auth: { uid, token: { email: `${uid}@test.mx` } }, data: { paqueteId: 'pXXX' } }
    await expectHttpsError(crearSesion(req), 'invalid-argument')
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run:
```bash
cd functions && npm run test:emu
```
Expected: FAIL — `crearSesionCheckout` no existe todavía (`fns.crearSesionCheckout` es undefined → `fft.wrap` lanza).

- [ ] **Step 3: Implementar `crearSesionCheckout`**

En `functions/index.js`, añade (después de los helpers de créditos):
```js
exports.crearSesionCheckout = onCall(
  { region: 'us-central1', secrets: [STRIPE_SECRET_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión para comprar créditos.')
    }
    const { paqueteId } = request.data || {}
    const paquete = PAQUETES[paqueteId]
    if (!paquete) {
      throw new HttpsError('invalid-argument', 'Paquete de créditos no válido.')
    }

    const uid    = request.auth.uid
    const stripe = Stripe(STRIPE_SECRET_KEY.value() || process.env.STRIPE_SECRET_KEY)

    let session
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          quantity: 1,
          price_data: {
            currency:     'mxn',
            unit_amount:  paquete.precioMXN * 100, // Stripe opera en centavos
            product_data: { name: `${paquete.creditos} créditos · Planea-Pro` },
          },
        }],
        client_reference_id: uid,
        metadata: { uid, paqueteId, creditos: String(paquete.creditos) },
        success_url: `${APP_URL}/compra-exitosa?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${APP_URL}/compra-cancelada`,
      })
    } catch (err) {
      console.error('[crearSesionCheckout] error de Stripe:', err.message)
      throw new HttpsError('internal', 'No se pudo iniciar el pago. Intenta de nuevo.')
    }

    // Registro "pendiente": el webhook lo marcará "pagado" al confirmarse.
    await db.collection('users').doc(uid).collection('compras').doc(session.id).set({
      tipo:            'stripe',
      estado:          'pendiente',
      paqueteId,
      creditos:        paquete.creditos,
      monto:           paquete.precioMXN,
      stripeSessionId: session.id,
      fecha:           FieldValue.serverTimestamp(),
    })

    return { url: session.url, sessionId: session.id }
  }
)
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run:
```bash
cd functions && npm run test:emu
```
Expected: PASS — los 2 tests de validación pasan (ambos lanzan antes de tocar la red de Stripe).

- [ ] **Step 5: Commit**

```bash
git add functions/index.js functions/test/stripe.test.js
git commit -m "feat(stripe): crearSesionCheckout (onCall) con validación de auth y paquete"
```

---

## Task 4: `stripeWebhook` (onRequest) — firma + acreditación idempotente (TDD)

**Files:**
- Modify: `functions/index.js`
- Test: `functions/test/stripe.test.js`

- [ ] **Step 1: Escribir los tests del webhook que fallan**

Añade al final de `functions/test/stripe.test.js`:
```js
// El SDK real de Stripe firma payloads de prueba sin red: generateTestHeaderString
// produce una firma válida para el mismo secreto que verifica constructEvent.
const stripe   = require('stripe')('sk_test_dummy')
const WH_SECRET = 'whsec_test_dummy'

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this },
    send(b)   { this.body = b; return this },
    json(b)   { this.body = b; return this },
  }
}

function buildEvent(eventId, { uid, creditos, sessionId, amountTotal, type } = {}) {
  return {
    id: eventId,
    type: type || 'checkout.session.completed',
    data: { object: {
      id: sessionId,
      payment_intent: 'pi_test_123',
      amount_total: amountTotal,
      metadata: { uid, creditos: String(creditos) },
    } },
  }
}

async function postWebhook(event, { badSignature = false } = {}) {
  const payload = JSON.stringify(event)
  const sig = badSignature
    ? 'bad-signature'
    : stripe.webhooks.generateTestHeaderString({ payload, secret: WH_SECRET })
  const req = { method: 'POST', rawBody: Buffer.from(payload), headers: { 'stripe-signature': sig } }
  const res = mockRes()
  await fns.stripeWebhook(req, res)
  return res
}

describe('stripeWebhook — acreditación', () => {
  it('acredita los créditos del paquete al completar el checkout', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 10)
    const event = buildEvent(`evt_${uid}`, { uid, creditos: 300, sessionId: `cs_${uid}`, amountTotal: 27000 })

    const res = await postWebhook(event)

    expect(res.statusCode).toBe(200)
    expect(await getCreditos(uid)).toBe(310)
    const ev = await db.collection('stripeEventos').doc(`evt_${uid}`).get()
    expect(ev.exists).toBe(true)
    expect(ev.data().creditos).toBe(300)
  })

  it('es idempotente: el mismo event.id no acredita dos veces', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 0)
    const event = buildEvent(`evt_${uid}`, { uid, creditos: 100, sessionId: `cs_${uid}`, amountTotal: 10000 })

    await postWebhook(event)
    await postWebhook(event) // reintento de Stripe

    expect(await getCreditos(uid)).toBe(100) // un solo abono, no 200
  })

  it('rechaza una firma inválida con 400', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 50)
    const event = buildEvent(`evt_${uid}`, { uid, creditos: 100, sessionId: `cs_${uid}`, amountTotal: 10000 })

    const res = await postWebhook(event, { badSignature: true })

    expect(res.statusCode).toBe(400)
    expect(await getCreditos(uid)).toBe(50) // sin cambios
  })

  it('ignora con 200 los eventos no manejados sin acreditar', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 50)
    const event = buildEvent(`evt_${uid}`, {
      uid, creditos: 100, sessionId: `cs_${uid}`, amountTotal: 10000,
      type: 'payment_intent.created',
    })

    const res = await postWebhook(event)

    expect(res.statusCode).toBe(200)
    expect(await getCreditos(uid)).toBe(50) // sin cambios
  })
})
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run:
```bash
cd functions && npm run test:emu
```
Expected: FAIL — `fns.stripeWebhook` es undefined.

- [ ] **Step 3: Implementar el helper de acreditación y el webhook**

En `functions/index.js`, añade el helper (junto a los otros helpers de créditos):
```js
// Acredita una compra de Stripe de forma atómica e idempotente.
// Idempotencia por event.id: si stripeEventos/{eventId} ya existe, no re-acredita.
async function acreditarCompraStripe(eventId, session) {
  const uid      = session.metadata?.uid
  const creditos = Number(session.metadata?.creditos)
  const sessionId = session.id

  if (!uid || !Number.isInteger(creditos) || creditos <= 0) {
    throw new Error(`Metadata inválida en la sesión ${sessionId} (uid=${uid}, creditos=${creditos})`)
  }

  const userRef   = db.collection('users').doc(uid)
  const eventoRef = db.collection('stripeEventos').doc(eventId)
  const compraRef = userRef.collection('compras').doc(sessionId)

  await db.runTransaction(async (tx) => {
    const evSnap = await tx.get(eventoRef)
    if (evSnap.exists) return // ya procesado → idempotente

    const userSnap    = await tx.get(userRef)
    const saldoActual = userSnap.data()?.creditos ?? 0

    tx.set(userRef, { creditos: saldoActual + creditos }, { merge: true })
    tx.set(compraRef, {
      estado:              'pagado',
      stripePaymentIntent: session.payment_intent ?? null,
      pagadoEn:            FieldValue.serverTimestamp(),
    }, { merge: true })
    tx.set(eventoRef, {
      sessionId,
      uid,
      creditos,
      monto: (session.amount_total ?? 0) / 100,
      fecha: FieldValue.serverTimestamp(),
    })
  })
}
```

Y la función del webhook (junto a los demás `exports`):
```js
exports.stripeWebhook = onRequest(
  { region: 'us-central1', secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    const stripe   = Stripe(STRIPE_SECRET_KEY.value() || process.env.STRIPE_SECRET_KEY)
    const whSecret = STRIPE_WEBHOOK_SECRET.value() || process.env.STRIPE_WEBHOOK_SECRET

    let event
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], whSecret)
    } catch (err) {
      console.error('[stripeWebhook] firma inválida:', err.message)
      return res.status(400).send('Webhook signature verification failed')
    }

    if (event.type !== 'checkout.session.completed') {
      return res.status(200).send('ignored')
    }

    try {
      await acreditarCompraStripe(event.id, event.data.object)
      return res.status(200).send('ok')
    } catch (err) {
      console.error('[stripeWebhook] error al acreditar:', err.message)
      return res.status(500).send('crediting failed') // Stripe reintentará
    }
  }
)
```

Asegúrate de que `onRequest` esté importado al inicio del archivo:
```js
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https')
```
(El proyecto ya importa `onCall` y `HttpsError` de ahí; añade `onRequest` a ese mismo require.)

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run:
```bash
cd functions && npm run test:emu
```
Expected: PASS — los 4 tests del webhook + los 2 de validación pasan (6 en total).

- [ ] **Step 5: Commit**

```bash
git add functions/index.js functions/test/stripe.test.js
git commit -m "feat(stripe): webhook con verificación de firma y acreditación idempotente"
```

---

## Task 5: Reglas de Firestore — bloquear `stripeEventos` al cliente

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Añadir la regla explícita de denegación**

En `firestore.rules`, justo después del bloque `match /pagos/{paymentId}` (≈ línea 97), añade:
```
    // ── Eventos de Stripe (idempotencia/auditoría): bloqueado al cliente ──
    // Solo el webhook (Admin SDK) escribe aquí; el cliente nunca accede.
    match /stripeEventos/{eventId} {
      allow read, write: if false;
    }
```

- [ ] **Step 2: Verificar la sintaxis de las reglas**

Run:
```bash
cd "$(git rev-parse --show-toplevel)" && firebase emulators:exec --only firestore --project demo-planea "echo reglas-ok"
```
Expected: el emulador carga las reglas sin error de compilación e imprime `reglas-ok`.

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat(stripe): regla de Firestore que bloquea stripeEventos al cliente"
```

---

## Task 6: Servicio de frontend `stripeService.js` (reemplaza `pagos.js`)

**Files:**
- Create: `src/services/stripeService.js`
- Delete: `src/services/pagos.js`

- [ ] **Step 1: Crear el servicio de Stripe**

Create `src/services/stripeService.js`:
```js
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

const crearSesionCheckoutFn = httpsCallable(functions, 'crearSesionCheckout')

/**
 * Crea una sesión de Stripe Checkout para un paquete y devuelve la URL de pago.
 * El cliente solo envía paqueteId; el monto/créditos los fija el servidor.
 * @param {'p100'|'p300'|'p500'} paqueteId
 * @returns {Promise<{ url: string, sessionId: string }>}
 */
export async function crearSesionCheckout(paqueteId) {
  const res = await crearSesionCheckoutFn({ paqueteId })
  return res.data
}
```

- [ ] **Step 2: Eliminar el servicio huérfano de Mercado Pago**

Run:
```bash
cd "$(git rev-parse --show-toplevel)" && git rm src/services/pagos.js
```
Expected: `pagos.js` eliminado del índice.

- [ ] **Step 3: Verificar que nada más importa `pagos.js`**

Run:
```bash
cd "$(git rev-parse --show-toplevel)" && grep -rn "services/pagos" src || echo "sin referencias huérfanas"
```
Expected: imprime `sin referencias huérfanas` (el único consumidor era el flujo de Mercado Pago abandonado; si aparece alguna referencia, hay que limpiarla antes de continuar).

- [ ] **Step 4: Commit**

```bash
git add src/services/stripeService.js src/services/pagos.js
git commit -m "feat(stripe): servicio de cliente crearSesionCheckout; elimina pagos.js (Mercado Pago huérfano)"
```

---

## Task 7: Páginas de resultado y rutas

**Files:**
- Create: `src/pages/CompraExitosa.jsx`
- Create: `src/pages/CompraCancelada.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Crear la página de compra exitosa (escucha el saldo en vivo)**

Create `src/pages/CompraExitosa.jsx`:
```jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../firebase'
import BrandLogo from '../components/brand/BrandLogo'

export default function CompraExitosa() {
  const [saldo, setSaldo] = useState(null)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    // El webhook acredita en segundo plano; escuchamos hasta que el saldo suba.
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      setSaldo(snap.data()?.creditos ?? 0)
    })
    return unsub
  }, [])

  return (
    <div className="min-h-screen surface-atmosphere surface-grain flex flex-col px-4">
      <header className="w-full max-w-md mx-auto pt-6 pb-2">
        <Link to="/" className="inline-flex rounded-xl" aria-label="Planea-Pro — inicio">
          <BrandLogo markClassName="w-10 h-10" />
        </Link>
      </header>
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center py-6">
        <div className="card p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-academic-600 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white mb-2">
              ¡Pago recibido!
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tus créditos se están acreditando. Puede tardar unos segundos.
            </p>
          </div>
          {saldo !== null && (
            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 inline-block">
              <p className="text-xs text-slate-400 dark:text-slate-500">Tu saldo actual</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {saldo} {saldo === 1 ? 'crédito' : 'créditos'}
              </p>
            </div>
          )}
          <Link to="/" className="btn-accent w-full justify-center">Ir al inicio</Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear la página de compra cancelada**

Create `src/pages/CompraCancelada.jsx`:
```jsx
import { Link } from 'react-router-dom'
import BrandLogo from '../components/brand/BrandLogo'

export default function CompraCancelada() {
  return (
    <div className="min-h-screen surface-atmosphere surface-grain flex flex-col px-4">
      <header className="w-full max-w-md mx-auto pt-6 pb-2">
        <Link to="/" className="inline-flex rounded-xl" aria-label="Planea-Pro — inicio">
          <BrandLogo markClassName="w-10 h-10" />
        </Link>
      </header>
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center py-6">
        <div className="card p-8 text-center space-y-6">
          <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
            Pago cancelado
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No se realizó ningún cargo. Puedes intentarlo de nuevo cuando quieras.
          </p>
          <Link to="/comprar-creditos" className="btn-accent w-full justify-center">
            Volver a comprar
          </Link>
          <Link to="/" className="btn-secondary w-full justify-center">Ir al inicio</Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Registrar las rutas en `App.jsx`**

En `src/App.jsx`, añade los lazy imports junto a los existentes (≈ línea 16):
```jsx
const CompraExitosa    = lazy(() => import('./pages/CompraExitosa'))
const CompraCancelada  = lazy(() => import('./pages/CompraCancelada'))
```

Y dentro del bloque `<Route element={<ProtectedRoute />}>` (junto a `/comprar-creditos`, ≈ línea 40):
```jsx
            <Route path="/compra-exitosa"   element={<CompraExitosa />} />
            <Route path="/compra-cancelada" element={<CompraCancelada />} />
```

- [ ] **Step 4: Verificar que el build compila**

Run:
```bash
cd "$(git rev-parse --show-toplevel)" && npm run build
```
Expected: build de Vite limpio (~4s), sin errores de import ni de rutas.

- [ ] **Step 5: Commit**

```bash
git add src/pages/CompraExitosa.jsx src/pages/CompraCancelada.jsx src/App.jsx
git commit -m "feat(stripe): páginas /compra-exitosa y /compra-cancelada + rutas"
```

---

## Task 8: ComprarCreditos — tarjetas de paquete y botón de pago

**Files:**
- Modify: `src/pages/ComprarCreditos.jsx`

- [ ] **Step 1: Añadir el bloque de pago con tarjeta (encima del bloque de transferencia)**

En `src/pages/ComprarCreditos.jsx`:

1. Sustituye los imports superiores por:
```jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import BrandLogo from '../components/brand/BrandLogo'
import { crearSesionCheckout } from '../services/stripeService'

const PAQUETES = [
  { id: 'p100', creditos: 100, precio: 100, etiqueta: '1 planeación completa' },
  { id: 'p300', creditos: 300, precio: 270, etiqueta: 'Ahorra ~10%' },
  { id: 'p500', creditos: 500, precio: 400, etiqueta: 'Ahorra ~20%' },
]
```

2. Al inicio del componente, añade estado de carga/error:
```jsx
  const { creditos } = useAuth()
  const [cargandoId, setCargandoId] = useState(null)
  const [error, setError] = useState(null)

  async function pagar(paqueteId) {
    setError(null)
    setCargandoId(paqueteId)
    try {
      const { url } = await crearSesionCheckout(paqueteId)
      window.location.assign(url)
    } catch (e) {
      console.error('[ComprarCreditos] error al iniciar pago:', e)
      setError('No se pudo iniciar el pago. Intenta de nuevo.')
      setCargandoId(null)
    }
  }
```

3. Inmediatamente DESPUÉS del bloque `{/* Precio */}` y ANTES del bloque
   `{/* Pago por transferencia manual */}`, inserta:
```jsx
          {/* Pago con tarjeta (Stripe) */}
          <div className="space-y-3 text-left">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Pago con tarjeta
            </p>
            {PAQUETES.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={cargandoId !== null}
                onClick={() => pagar(p.id)}
                className="btn-accent w-full justify-between gap-3 py-3 text-sm disabled:opacity-60"
              >
                <span className="font-semibold">{p.creditos} créditos</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs opacity-80">{p.etiqueta}</span>
                  <span className="font-extrabold">
                    {cargandoId === p.id ? 'Redirigiendo…' : `$${p.precio} MXN`}
                  </span>
                </span>
              </button>
            ))}
            {error && (
              <p className="text-xs font-semibold text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Pago seguro procesado por Stripe. Tus créditos se acreditan automáticamente.
            </p>
          </div>

          {/* Separador respaldo manual */}
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            o paga por transferencia
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>
```

El bloque de transferencia + WhatsApp existente **se conserva tal cual** debajo.

- [ ] **Step 2: Verificar que el build compila**

Run:
```bash
cd "$(git rev-parse --show-toplevel)" && npm run build
```
Expected: build de Vite limpio, sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ComprarCreditos.jsx
git commit -m "feat(stripe): tarjetas de paquete y pago con tarjeta en ComprarCreditos"
```

---

## Task 9: Verificación end-to-end con Stripe CLI (manual)

Esta tarea NO es de código: valida el flujo real contra Stripe en modo test.
Requiere que el usuario haya configurado los secretos y tenga el Stripe CLI.

- [ ] **Step 1: Configurar los secretos (modo test)**

Run (el usuario pega sus keys de test del dashboard de Stripe):
```bash
cd functions
firebase functions:secrets:set STRIPE_SECRET_KEY      # sk_test_...
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET  # whsec_... (del paso 3)
```

- [ ] **Step 2: Desplegar las funciones nuevas**

Run:
```bash
cd functions && npm run deploy
```
Expected: se despliegan `crearSesionCheckout` y `stripeWebhook`. Anota la URL del webhook:
`https://us-central1-planificador-docente-d48a6.cloudfunctions.net/stripeWebhook`

- [ ] **Step 3: Registrar el webhook en Stripe y obtener el `whsec_`**

En el dashboard de Stripe (modo test) → Developers → Webhooks → Add endpoint:
- URL: la del paso 2.
- Evento: `checkout.session.completed`.
- Copia el "Signing secret" (`whsec_...`) y vuelve al paso 1 para fijarlo, luego re-despliega (paso 2).

- [ ] **Step 4: Probar el flujo completo con tarjeta de prueba**

1. Abre la app desplegada, ve a `/comprar-creditos`, clic en un paquete.
2. En Stripe Checkout, usa la tarjeta de prueba `4242 4242 4242 4242`, fecha futura, CVC cualquiera.
3. Verifica la redirección a `/compra-exitosa` y que el saldo sube solo en unos segundos.
4. En Firestore: confirma `users/{uid}/compras/{sessionId}.estado == 'pagado'` y que existe `stripeEventos/{eventId}`.

Expected: saldo incrementado exactamente en los créditos del paquete; compra en `pagado`; un único documento en `stripeEventos`.

- [ ] **Step 5: Verificar idempotencia en real (opcional)**

En el dashboard de Stripe → Webhooks → el evento → "Resend". El saldo NO debe cambiar (idempotencia por `event.id`).

---

## Self-Review (completado al escribir el plan)

- **Cobertura del spec:**
  - Catálogo en servidor → Task 2. ✓
  - `crearSesionCheckout` + registro pendiente → Task 3. ✓
  - `stripeWebhook` firma + idempotencia + acreditación atómica → Task 4. ✓
  - Modelo de datos (`compras`, `stripeEventos`) → Tasks 3, 4. ✓
  - Reglas Firestore (`stripeEventos`) → Task 5. ✓
  - Frontend: servicio, ComprarCreditos, rutas éxito/cancelación, limpieza de `pagos.js` → Tasks 6, 7, 8. ✓
  - Secretos y E2E con Stripe CLI → Task 9. ✓
  - Tests (acreditación, idempotencia, validación, firma inválida, tipo no manejado) → Tasks 3, 4. ✓
  - Alcance v1 solo tarjeta (`payment_method_types: ['card']`) → Task 3. ✓
- **Placeholders:** ninguno; todos los pasos llevan código/comandos concretos.
- **Consistencia de tipos/nombres:** `crearSesionCheckout`, `stripeWebhook`, `acreditarCompraStripe`, `PAQUETES` (p100/p300/p500), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, colección `stripeEventos`, subcolección `compras`, metadata `{ uid, paqueteId, creditos }` — usados de forma idéntica en backend, tests y frontend.
- **Decisión registrada:** los tests de créditos no están en `main`; el plan crea infra de test autocontenida (sin depender de `functions/test/helpers.js` de otras ramas).
