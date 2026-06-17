// Helpers de siembra/lectura para los tests del sistema de créditos.
//
// Hablan directo con Firestore vía el Admin SDK (que ignora las reglas de
// seguridad): así sembramos saldos, ledgers y sesiones para colocar a la
// función bajo prueba en el estado exacto que queremos verificar.
//
// IMPORTANTE: requiere '../index' primero para que initializeApp() del módulo
// de funciones corra una sola vez; getFirestore() devuelve esa misma instancia,
// ya apuntada al emulador por FIRESTORE_EMULATOR_HOST.

require('../index')
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore')

const db = getFirestore()

let _counter = 0
// uid único por test → aislamiento total sin tener que limpiar entre casos.
function uniqueUid(prefix = 'u') {
  return `${prefix}-${Date.now()}-${_counter++}`
}

function userRef(uid) {
  return db.collection('users').doc(uid)
}

async function seedUser(uid, creditos) {
  await userRef(uid).set({ email: `${uid}@test.mx`, creditos })
}

async function getCreditos(uid) {
  const snap = await userRef(uid).get()
  return snap.exists ? snap.data().creditos : undefined
}

async function seedLedger(uid, materiaId, data) {
  await userRef(uid).collection('cobrosMateria').doc(materiaId).set(data)
}

async function getLedger(uid, materiaId) {
  const snap = await userRef(uid).collection('cobrosMateria').doc(materiaId).get()
  return snap.exists ? snap.data() : null
}

async function seedSession(uid, sessionId, data) {
  await userRef(uid).collection('sesionesGeneracion').doc(sessionId).set(data)
}

async function getSession(uid, sessionId) {
  const snap = await userRef(uid).collection('sesionesGeneracion').doc(sessionId).get()
  return snap.exists ? snap.data() : null
}

// Construye el objeto request que espera un callable v2 envuelto por
// firebase-functions-test: { auth: { uid, token }, data }.
function reqUsuario(uid, data = {}) {
  return { auth: { uid, token: { email: `${uid}@test.mx`, email_verified: true } }, data }
}

function reqAdmin(uid, data = {}) {
  return { auth: { uid, token: { email: 'victor20sano@gmail.com', email_verified: true } }, data }
}

// Afirma que una promesa de callable rechaza con un HttpsError de cierto código.
async function expectHttpsError(promise, code) {
  let err
  try {
    await promise
  } catch (e) {
    err = e
  }
  if (!err) throw new Error(`Se esperaba un rechazo con código "${code}" pero la promesa resolvió.`)
  return err
}

module.exports = {
  db,
  FieldValue,
  Timestamp,
  uniqueUid,
  seedUser,
  getCreditos,
  seedLedger,
  getLedger,
  seedSession,
  getSession,
  reqUsuario,
  reqAdmin,
  expectHttpsError,
}
