import { doc, collection, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const CREDITOS_POR_GENERACION = 1

/**
 * Descuenta 1 crédito del usuario de forma atómica.
 * Lanza Error('SIN_CREDITOS') si el saldo es insuficiente.
 * Registra el consumo en users/{uid}/consumos con tipo 'generacion'.
 *
 * La regla de Firestore (Caso B) permite este update porque:
 *   - Solo afecta el campo 'creditos'.
 *   - El nuevo valor es exactamente saldoActual - 1.
 *   - El saldo actual es > 0.
 */
export async function descontarCredito(uid) {
  const userRef = doc(db, 'users', uid)

  await runTransaction(db, async (tx) => {
    const snap        = await tx.get(userRef)
    const saldoActual = snap.exists() ? (snap.data().creditos ?? 0) : 0

    if (saldoActual < CREDITOS_POR_GENERACION) {
      throw new Error('SIN_CREDITOS')
    }

    const consumoRef = doc(collection(db, 'users', uid, 'consumos'))

    // tx.update solo modifica el campo creditos → satisface la regla Caso B
    tx.update(userRef, { creditos: saldoActual - CREDITOS_POR_GENERACION })
    tx.set(consumoRef, {
      timestamp: serverTimestamp(),
      cantidad:  CREDITOS_POR_GENERACION,
      tipo:      'generacion',
    })
  })
}

/**
 * Los reembolsos los hace el admin manualmente desde el panel /admin.
 * Las reglas de Firestore no permiten que el cliente incremente creditos
 * (previene abuso). Esta función es un no-op con aviso en consola.
 */
export async function reembolsarCredito(uid) {
  console.warn(
    `[creditosService] Reembolso solicitado para uid=${uid}. ` +
    'El cliente no puede incrementar créditos. Solicitar reembolso al administrador.'
  )
}
