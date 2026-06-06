/**
 * adminService.js
 *
 * Implementación CLIENTE de las operaciones de administración de créditos.
 * No requiere Cloud Functions ni plan Blaze.
 *
 * Seguridad: las reglas de Firestore verifican que el UID del usuario esté
 * en /config/admins.uids antes de permitir cualquier escritura sensible.
 * El cliente nunca puede modificar ese documento (allow write: if false).
 */

import {
  collection,
  doc,
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db, auth } from '../firebase'

/**
 * Acredita (o revierte) créditos a un usuario identificado por email.
 * Usa runTransaction para garantizar atomicidad.
 *
 * @param {{ emailDestino: string, creditos: number, metodo: string, monto: number, nota: string }} params
 * @returns {{ ok, destinoUid, destinoEmail, creditosAcreditados, saldoNuevo, acreditacionId }}
 */
export async function acreditarCreditoManual({ emailDestino, creditos, metodo, monto, nota }) {
  const emailNorm   = emailDestino.toLowerCase().trim()
  const creditosNum = Number(creditos)
  const montoNum    = Number(monto) || 0

  if (!emailNorm)           throw new Error('El email destino es obligatorio.')
  if (creditosNum === 0)    throw new Error('La cantidad de créditos no puede ser 0.')
  if (Math.abs(creditosNum) > 500) throw new Error('La cantidad máxima por operación es 500 créditos.')
  if (creditosNum < 0 && !String(nota || '').trim()) {
    throw new Error('La nota es obligatoria para reversas (créditos negativos).')
  }

  // ── 1. Buscar usuario por email ──────────────────────────────
  // Requiere que el campo `email` esté guardado en users/{uid}
  // (se guarda automáticamente en onAuthStateChanged de AuthContext).
  const usersSnap = await getDocs(
    query(collection(db, 'users'), where('email', '==', emailNorm))
  )

  if (usersSnap.empty) {
    throw new Error(
      `No existe ningún usuario con email "${emailNorm}" en esta app.\n` +
      `Asegúrate de que el docente haya iniciado sesión al menos una vez.`
    )
  }

  const destinoDoc = usersSnap.docs[0]
  const destinoUid = destinoDoc.id
  const userRef    = doc(db, 'users', destinoUid)

  // ── 2. IDs para la operación ─────────────────────────────────
  const acreditacionId  = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const acreditacionRef = doc(db, 'acreditacionesManual', acreditacionId)
  const compraRef       = doc(db, 'users', destinoUid, 'compras', acreditacionId)

  const adminUser  = auth.currentUser
  let saldoNuevo

  // ── 3. Transacción atómica ───────────────────────────────────
  await runTransaction(db, async (tx) => {
    const snap        = await tx.get(userRef)
    const saldoActual = snap.data()?.creditos ?? 0
    saldoNuevo        = saldoActual + creditosNum

    if (saldoNuevo < 0) {
      throw new Error(
        `El saldo resultante sería negativo (${saldoNuevo}). ` +
        `El docente solo tiene ${saldoActual} crédito(s).`
      )
    }

    const registro = {
      tipo:          'manual',
      adminUid:      adminUser?.uid      || '',
      adminEmail:    (adminUser?.email   || '').toLowerCase(),
      destinoUid,
      destinoEmail:  emailNorm,
      creditos:      creditosNum,
      metodo,
      monto:         montoNum,
      nota:          (nota || '').slice(0, 500),
      saldoAntes:    saldoActual,
      saldoDespues:  saldoNuevo,
      fecha:         serverTimestamp(),
    }

    tx.set(userRef,         { creditos: saldoNuevo, email: emailNorm }, { merge: true })
    tx.set(acreditacionRef, registro)
    tx.set(compraRef,       registro)
  })

  return {
    ok:                  true,
    destinoUid,
    destinoEmail:        emailNorm,
    creditosAcreditados: creditosNum,
    saldoNuevo,
    acreditacionId,
  }
}

/**
 * Lista las últimas acreditaciones manuales ordenadas por fecha descendente.
 * @param {number} limitCount
 * @returns {Array}
 */
export async function listarAcreditaciones(limitCount = 100) {
  const q = query(
    collection(db, 'acreditacionesManual'),
    orderBy('fecha', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    id:    d.id,
    ...d.data(),
    fecha: d.data().fecha?.toMillis?.() ?? null,
  }))
}
