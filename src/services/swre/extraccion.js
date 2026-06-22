// Lee la estructura SWRE desde una captura de pantalla (IA Gemini vía Cloud Function).
// Cobra 25 créditos mediante el sistema de sesiones (flujo 'swre'); reembolsa si falla.

import { httpsCallable } from 'firebase/functions'
import { functions } from '../../firebase'
import { iniciarSesionGeneracion, finalizarSesionGeneracion } from '../creditosService'

const extraerFn = httpsCallable(functions, 'extraerEstructuraSWRE', { timeout: 120000 })
const reusoFn = httpsCallable(functions, 'confirmarReusoSWRE', { timeout: 30000 })

/**
 * Cobra 25 créditos por CONVERTIR un parcial (fija la selección de PF elegida).
 * No usa IA: reutiliza la estructura ya escaneada. Marca la sesión como exitosa
 * en el servidor para que el cobro sea definitivo (no reembolsable).
 */
export async function cobrarConversionSWRE() {
  const sessionId = await iniciarSesionGeneracion('swre')   // descuenta 25 créditos
  try {
    await reusoFn({ sessionId })
    await finalizarSesionGeneracion(sessionId, true)
  } catch (err) {
    await finalizarSesionGeneracion(sessionId, false)   // reembolsa si algo falla
    throw err
  }
}

function fileToB64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = e => resolve(e.target.result.split(',')[1])
    r.onerror = reject
    r.readAsDataURL(file)
  })
}
function limpiarJSON(t) {
  const s = String(t || '').trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(s)
}

/**
 * Sube la captura, cobra 25 créditos y devuelve las AE extraídas.
 * @returns {Promise<Array<{ porcentaje:number, pesos:number[] }>>}
 */
export async function extraerEstructuraDesdeImagen(file) {
  const b64 = await fileToB64(file)
  const sessionId = await iniciarSesionGeneracion('swreScan')   // GRATIS: el cobro va al convertir el parcial
  try {
    const res = await extraerFn({ imagenBase64: b64, imagenMime: file.type, sessionId })
    await finalizarSesionGeneracion(sessionId, true)
    const data = limpiarJSON(res.data?.text)
    const aes = Array.isArray(data?.aes) ? data.aes : []
    return aes
      .map(ae => ({ porcentaje: Number(ae.porcentaje) || 0, pesos: (ae.pesos || []).map(Number).filter(n => !isNaN(n) && n > 0) }))
      .filter(ae => ae.pesos.length > 0)
  } catch (err) {
    await finalizarSesionGeneracion(sessionId, false)   // reembolsa
    throw err
  }
}
