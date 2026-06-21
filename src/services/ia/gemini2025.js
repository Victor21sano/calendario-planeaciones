/**
 * Llamadas a Gemini para el Modelo 2025 mediante Cloud Functions.
 *
 * Diferencia principal vs gemini2023.js:
 *   - Solo se recibe UN PDF (el PE integrado). No hay GPE separada.
 *   - Se reutiliza la Cloud Function generarGemini2023 pasando pdfGPEBase64: null.
 */

import { httpsCallable } from 'firebase/functions'
import { functions } from '../../firebase.js'
import { PROMPT_ESTRUCTURA_2025 } from './prompts2025/promptEstructura2025.js'
import { PROMPT_ACTIVIDADES_2025 } from './prompts2025/promptActividades2025.js'

const MODEL_ESTRUCTURA  = import.meta.env.VITE_GEMINI_MODEL_ESTRUCTURA  || 'gemini-2.5-flash'
const MODEL_ACTIVIDADES = import.meta.env.VITE_GEMINI_MODEL_ACTIVIDADES || 'gemini-2.5-flash'

const generarGeminiCallable   = httpsCallable(functions, 'generarGemini2023', { timeout: 540000 })
const iniciarGeneracionFn     = httpsCallable(functions, 'iniciarGeneracion')
const finalizarGeneracionFn   = httpsCallable(functions, 'finalizarGeneracion')

/**
 * Abre una sesión de generación 2025 en el servidor (descuenta 1 crédito).
 * Lanza HttpsError 'failed-precondition' si el saldo es insuficiente.
 */
export async function iniciarSesion2025(materiaId = null) {
  const res = await iniciarGeneracionFn({ tipoFlujo: 'completa', materiaId })
  return res.data?.sessionId
}

/**
 * Cierra la sesión. exito=false reembolsa el crédito.
 * No lanza para no romper el flujo principal.
 */
export async function finalizarSesion2025(sessionId, exito) {
  if (!sessionId) return
  try {
    await finalizarGeneracionFn({ sessionId, exito })
  } catch (err) {
    console.error('[gemini2025] Error al finalizar sesión:', err.message)
  }
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function limpiarJSON(texto) {
  let t = String(texto || '').trim()
  t = t.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  t = t.replace(/^```\s*/i,    '').replace(/```\s*$/i, '').trim()
  return JSON.parse(t)
}

async function llamarGemini({ textoPrompt, pdfBase64, temperature, maxOutputTokens, modelo, sessionId }) {
  const modeloEfectivo = modelo || MODEL_ESTRUCTURA
  const MAX_INTENTOS   = 5
  let   lastErr

  for (let intento = 0; intento < MAX_INTENTOS; intento++) {
    if (intento > 0) {
      const espera = Math.min(60000, 4000 * Math.pow(2, intento - 1))
      await new Promise(r => setTimeout(r, espera))
    }

    try {
      const res = await generarGeminiCallable({
        userPrompt:    textoPrompt,
        pdfPEBase64:   pdfBase64,
        pdfGPEBase64:  null,           // Modelo 2025: sin GPE
        temperature,
        maxOutputTokens,
        model:         modeloEfectivo,
        sessionId,
      })

      const texto = res.data?.text || ''
      if (!texto) throw new Error('Gemini devolvió respuesta vacía.')
      return limpiarJSON(texto)
    } catch (err) {
      lastErr = err
      const msg = err.message || ''
      const isRetryable = /429|quota|rate limit|503|UNAVAILABLE|high demand|overloaded|temporarily/i.test(msg)
      if (!isRetryable) throw err
    }
  }

  throw lastErr
}

/**
 * Prompt 1 — Extrae la estructura de la asignatura desde el PE integrado 2025.
 *
 * @param {File}   pdfPE        — PE integrado (único archivo)
 * @param {object} datosDocente — { nombre, numEmpleado, plantel }
 * @param {object} calendario   — { fechaInicioSemestre, fechaFinSemestre, diasNoLaborables }
 * @param {string} sessionId
 * @returns {Promise<Object>}   — objeto planeacion2025 con propositosFormativos[]
 */
export async function extraerEstructura2025(pdfPE, datosDocente, calendario, sessionId) {
  const b64PE = await fileToBase64(pdfPE)

  const contextoJSON = JSON.stringify({ docente: datosDocente, calendario }, null, 2)
  const prompt = PROMPT_ESTRUCTURA_2025.replace('{{DATOS_DOCENTE_JSON}}', contextoJSON)

  return await llamarGemini({
    pdfBase64:      b64PE,
    textoPrompt:    prompt,
    temperature:    0.2,
    maxOutputTokens: 8192,
    modelo:         MODEL_ESTRUCTURA,
    sessionId,
  })
}

/**
 * Prompt 2 — Genera las sesiones didácticas para un Propósito Formativo.
 *
 * @param {{ pdfPE, cabecera, pfObjetivo, parametros, sessionId }} opts
 * @returns {Promise<Array>}  — array de sesiones didácticas
 */
export async function generarSesionesParaPF2025({ pdfPE, cabecera, pfObjetivo, parametros = {}, sessionId }) {
  const b64PE = await fileToBase64(pdfPE)

  const contexto = {
    cabecera,
    pfObjetivo: {
      ...pfObjetivo,
      sesiones: undefined,   // no pasar sesiones previas al prompt
    },
    parametros: {
      sesionesObjetivo: 3,
      modalidadDefault: 'Presencial',
      ...parametros,
    },
  }
  const contextoJSON = JSON.stringify(contexto, null, 2)
  const prompt = PROMPT_ACTIVIDADES_2025.replace('{{CONTEXTO_JSON}}', contextoJSON)

  const resultado = await llamarGemini({
    pdfBase64:       b64PE,
    textoPrompt:     prompt,
    temperature:     0.75,
    maxOutputTokens: 16384,
    modelo:          MODEL_ACTIVIDADES,
    sessionId,
  })

  if (Array.isArray(resultado)) return resultado
  if (Array.isArray(resultado?.sesiones)) return resultado.sesiones
  return []
}
