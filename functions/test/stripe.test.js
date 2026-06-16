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
