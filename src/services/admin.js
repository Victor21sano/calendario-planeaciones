import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

const acreditarFn = httpsCallable(functions, 'acreditarCreditoManual')
const listarFn    = httpsCallable(functions, 'listarAcreditacionesManual')

/**
 * Acredita créditos manualmente a un usuario por email.
 * Solo ejecutable por el admin autenticado.
 * @param {{ emailDestino: string, creditos: number, metodo: string, monto: number, nota: string }} params
 */
export async function acreditarCreditoManual({ emailDestino, creditos, metodo, monto, nota }) {
  const res = await acreditarFn({ emailDestino, creditos, metodo, monto, nota })
  return res.data
}

/**
 * Lista las últimas acreditaciones manuales.
 * @param {number} limit Máximo de registros (default 50, máximo 200)
 */
export async function listarAcreditaciones(limit = 50) {
  const res = await listarFn({ limit })
  return res.data.items
}
