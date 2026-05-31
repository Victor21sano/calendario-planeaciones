/**
 * Llamadas a Gemini para el Modelo 2023 mediante Cloud Functions.
 *
 * La API key se guarda como secreto del servidor:
 *   firebase functions:secrets:set GEMINI_API_KEY
 */

import { httpsCallable } from 'firebase/functions'
import { functions } from '../../firebase.js'
import { PROMPT_ESTRUCTURA_2023 } from './prompts2023/promptEstructura.js'
import { PROMPT_ACTIVIDADES_2023 } from './prompts2023/promptActividades.js'

const MODEL_ESTRUCTURA = import.meta.env.VITE_GEMINI_MODEL_ESTRUCTURA || 'gemini-2.5-flash'
const MODEL_ACTIVIDADES = import.meta.env.VITE_GEMINI_MODEL_ACTIVIDADES || 'gemini-2.5-flash'
const generarGemini2023Fn = httpsCallable(functions, 'generarGemini2023', { timeout: 540000 })

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function limpiarJSON(texto) {
  let t = String(texto || '').trim()
  t = t.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  t = t.replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(t)
}

async function llamarGemini({
  sistemPrompt = null,
  partesInlineData = [],
  textoPrompt,
  temperature,
  maxOutputTokens,
  modelo,
}) {
  const modeloEfectivo = modelo || MODEL_ESTRUCTURA
  const MAX_INTENTOS = 5
  let lastErr

  for (let intento = 0; intento < MAX_INTENTOS; intento++) {
    if (intento > 0) {
      const espera = Math.min(60000, 4000 * Math.pow(2, intento - 1))
      await new Promise(r => setTimeout(r, espera))
    }

    try {
      const res = await generarGemini2023Fn({
        systemPrompt: sistemPrompt,
        userPrompt: textoPrompt,
        pdfPEBase64: partesInlineData[0] || null,
        pdfGPEBase64: partesInlineData[1] || null,
        temperature,
        maxOutputTokens,
        model: modeloEfectivo,
      })

      const texto = res.data?.text || ''
      if (!texto) throw new Error('Gemini devolvio respuesta vacia.')
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
 * Prompt 1: extrae la estructura del modulo.
 *
 * @param {File} pdfPE
 * @param {File} pdfGPE
 * @param {{ nombre, numEmpleado, plantel }} datosDocente
 * @param {{ fechaInicioSemestre, fechaFinSemestre, diasNoLaborables }} calendario
 * @returns {Promise<Object>}
 */
export async function extraerEstructura2023(pdfPE, pdfGPE, datosDocente, calendario) {
  const [b64PE, b64GPE] = await Promise.all([fileToBase64(pdfPE), fileToBase64(pdfGPE)])

  const contextoJSON = JSON.stringify({ docente: datosDocente, calendario }, null, 2)
  const prompt = PROMPT_ESTRUCTURA_2023.replace('{{DATOS_DOCENTE_JSON}}', contextoJSON)

  return await llamarGemini({
    partesInlineData: [b64PE, b64GPE],
    textoPrompt: prompt,
    temperature: 0.2,
    maxOutputTokens: 8192,
    modelo: MODEL_ESTRUCTURA,
  })
}

/**
 * Prompt 2: genera las actividades especificas para un RA.
 *
 * @param {{ pdfPE, pdfGPE, cabecera, raObjetivo, parametros }} opts
 * @returns {Promise<Array>}
 */
export async function generarActividadesParaRA2023({ pdfPE, pdfGPE, cabecera, raObjetivo, parametros = {} }) {
  const [b64PE, b64GPE] = await Promise.all([fileToBase64(pdfPE), fileToBase64(pdfGPE)])

  const contexto = {
    cabecera,
    raObjetivo: {
      ...raObjetivo,
      actividadesEspecificas: undefined,
    },
    parametros: {
      actividadesObjetivo: 2,
      modalidadDefault: 'Presencial',
      ...parametros,
    },
  }
  const contextoJSON = JSON.stringify(contexto, null, 2)
  const prompt = PROMPT_ACTIVIDADES_2023.replace('{{CONTEXTO_JSON}}', contextoJSON)

  const resultado = await llamarGemini({
    partesInlineData: [b64PE, b64GPE],
    textoPrompt: prompt,
    temperature: 0.75,
    maxOutputTokens: 16384,
    modelo: MODEL_ACTIVIDADES,
  })

  if (Array.isArray(resultado)) return resultado
  if (Array.isArray(resultado?.actividadesEspecificas)) return resultado.actividadesEspecificas
  return []
}
