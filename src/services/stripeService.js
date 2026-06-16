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
