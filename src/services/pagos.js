import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

const crearPreferenciaPagoFn = httpsCallable(functions, 'crearPreferenciaPago')

/**
 * Crea una preferencia de pago en Mercado Pago y devuelve la URL de checkout.
 * @param {string} paqueteId  - ID del paquete (p1, p3, p5)
 * @returns {{ initPoint: string, preferenceId: string }}
 */
export async function iniciarPago(paqueteId) {
  const result = await crearPreferenciaPagoFn({ paqueteId })
  return result.data
}
