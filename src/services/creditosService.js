/**
 * Servicio de créditos (cliente).
 *
 * El cliente YA NO modifica el saldo directamente: toda generación pagada
 * abre una "sesión de generación" en el servidor, que descuenta 1 crédito de
 * forma atómica, valida cada llamada de IA y reembolsa si el flujo falla.
 * Las reglas de Firestore impiden que el cliente altere el campo `creditos`.
 *
 * Flujo de uso:
 *   const sessionId = await iniciarSesionGeneracion()   // descuenta 1 crédito
 *   ... generar (pasando sessionId a cada llamada de IA) ...
 *   await finalizarSesionGeneracion(sessionId, exito)    // confirma o reembolsa
 */

import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

const iniciarGeneracionFn   = httpsCallable(functions, 'iniciarGeneracion')
const finalizarGeneracionFn = httpsCallable(functions, 'finalizarGeneracion')

/**
 * Abre una sesión de generación y descuenta 1 crédito en el servidor (atómico).
 * Devuelve el sessionId a pasar en cada llamada de IA del flujo.
 * Lanza HttpsError 'failed-precondition' si el saldo es insuficiente.
 */
export async function iniciarSesionGeneracion(tipoFlujo = 'completa') {
  const res = await iniciarGeneracionFn({ tipoFlujo })
  return res.data?.sessionId
}

/**
 * Cierra la sesión. El servidor decide el reembolso (solo si la sesión no
 * produjo ninguna salida de IA exitosa); `exito` solo etiqueta el estado.
 * Nunca lanza: el cierre no debe romper el flujo principal.
 * Devuelve { ok, reembolsado } o null si el cierre falló.
 */
export async function finalizarSesionGeneracion(sessionId, exito) {
  if (!sessionId) return null
  try {
    const res = await finalizarGeneracionFn({ sessionId, exito })
    return res.data || null
  } catch (err) {
    console.error('[creditosService] Error al finalizar sesión:', err.message)
    return null
  }
}
