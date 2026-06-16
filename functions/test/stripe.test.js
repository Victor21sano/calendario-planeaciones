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
