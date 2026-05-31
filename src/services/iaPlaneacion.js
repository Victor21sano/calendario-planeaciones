/**
 * Servicio cliente para generación automática de planeaciones con IA.
 *
 * MODOS (prioridad automática):
 *   G) Gemini  — VITE_GEMINI_API_KEY en .env.local  (gratuito, recomendado)
 *   B) Anthropic directo — VITE_ANTHROPIC_API_KEY   (de pago, desarrollo)
 *   A) Cloud Function   — sin keys locales           (producción segura)
 *
 * Para usar Gemini (gratis):
 *   1. Ve a https://aistudio.google.com → "Get API key"
 *   2. Crea .env.local con:  VITE_GEMINI_API_KEY=AIza...
 *   3. Reinicia el servidor
 */

import { getFunctions, httpsCallable } from 'firebase/functions'
import { getApp } from 'firebase/app'
import {
  SYSTEM_PROMPT,
  promptExtraccionEstructura,
  promptGenerarRA,
} from './promptPlaneacion'

// Modelos disponibles
const GEMINI_MODEL    = import.meta.env.VITE_GEMINI_MODEL    || 'gemini-2.5-flash'
const ANTHROPIC_MODEL = import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-opus-4-7'
const MAX_TOKENS      = 16000
const MB_LIMIT        = 30

// Pausa entre llamadas para el tier gratuito de Gemini
// gemini-2.5-flash: 10 RPM → 7 s  |  gemini-2.0-flash: 15 RPM → 4.5 s  |  gemini-1.5-pro: 2 RPM → 32 s
const GEMINI_DELAY_MS = GEMINI_MODEL.includes('1.5-pro') ? 32000
  : GEMINI_MODEL.includes('2.5') ? 7000
  : 4500

// ─── Conversión File → base64 ────────────────────────────────
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function fileSizeMB(file) {
  return file.size / (1024 * 1024)
}

const delay = ms => new Promise(r => setTimeout(r, ms))

// ─── Parseo seguro de JSON ────────────────────────────────────
function parseJSON(text) {
  try { return JSON.parse(text) } catch {}

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) { try { return JSON.parse(fenced[1].trim()) } catch {} }

  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)) } catch {}
  }

  throw new Error(
    `No se pudo parsear la respuesta como JSON.\nTexto recibido:\n${text.slice(0, 600)}`
  )
}

// ─── MODO G: Gemini API (Google AI Studio) ────────────────────
// temperature: 0.4 para extracción de estructura (precisión > creatividad)
//              0.7 para generación de secuencia didáctica (creatividad + variación)
async function callGeminiAPI({ systemPrompt, userPrompt, pdfPEBase64, pdfGPEBase64, temperature = 0.7 }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY no está configurada.')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  // gemini-2.5-* gastan "thinking tokens" del presupuesto de salida.
  // Sin desactivarlo, el JSON sale truncado. thinkingBudget: 0 lo apaga.
  const isThinkingModel = GEMINI_MODEL.includes('2.5') || GEMINI_MODEL.includes('3')

  const parts = []
  if (pdfPEBase64) parts.push({ inline_data: { mime_type: 'application/pdf', data: pdfPEBase64 } })
  if (pdfGPEBase64) parts.push({ inline_data: { mime_type: 'application/pdf', data: pdfGPEBase64 } })
  parts.push({ text: userPrompt })

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 65536, // amplio: el RA completo es JSON grande
      responseMimeType: 'application/json', // fuerza JSON válido en la respuesta
      ...(isThinkingModel ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = err?.error?.message || response.statusText
    throw new Error(`Gemini API ${response.status}: ${msg}`)
  }

  const data = await response.json()

  // Chequear bloqueos de seguridad
  const candidate = data.candidates?.[0]
  if (!candidate) {
    const reason = data.promptFeedback?.blockReason
    throw new Error(`Gemini bloqueó la respuesta${reason ? `: ${reason}` : '.'}`)
  }
  if (candidate.finishReason === 'SAFETY') {
    throw new Error('Gemini bloqueó la respuesta por filtros de seguridad.')
  }
  if (candidate.finishReason === 'MAX_TOKENS') {
    throw new Error('La respuesta se cortó por límite de tokens. Reintenta este RA.')
  }

  const text = candidate.content?.parts?.map(p => p.text).filter(Boolean).join('') ?? ''
  if (!text) {
    throw new Error(`Gemini no devolvió texto (finishReason: ${candidate.finishReason || 'desconocido'}).`)
  }
  return text
}

// ─── MODO B: Anthropic API directa ───────────────────────────
async function callAnthropicDirect({ systemPrompt, userPrompt, pdfPEBase64, pdfGPEBase64, temperature = 0.7 }) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY no está configurada.')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS,
      temperature,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          ...(pdfPEBase64 ? [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfPEBase64 }, title: 'Programa de Estudios (PE)' }] : []),
          ...(pdfGPEBase64 ? [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfGPEBase64 }, title: 'Guía Pedagógica y de Evaluación (GPE)' }] : []),
          { type: 'text', text: userPrompt },
        ],
      }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`Anthropic ${response.status}: ${err?.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return data.content[0]?.text ?? ''
}

// ─── MODO A: Cloud Function (requiere créditos) ───────────────
// sessionId opcional: si se pasa, el crédito ya fue descontado por
// iniciarGeneracion y esta llamada solo consume un tick de la sesión.
async function callViaCloudFunction({ systemPrompt, userPrompt, pdfPEBase64, pdfGPEBase64, temperature = 0.7, sessionId }) {
  const fns = getFunctions(getApp(), 'us-central1')
  const fn  = httpsCallable(fns, 'generarPlaneacion', { timeout: 540000 })
  const result = await fn({ systemPrompt, userPrompt, pdfPEBase64, pdfGPEBase64, temperature, sessionId })
  return result.data.text
}

// ─── MODO A (gratis): Cloud Function sin crédito ──────────────
// Solo para extracción de estructura en modo gratuito.
async function callViaCloudFunctionGratis({ systemPrompt, userPrompt, pdfPEBase64, pdfGPEBase64, temperature = 0.4 }) {
  const fns = getFunctions(getApp(), 'us-central1')
  const fn  = httpsCallable(fns, 'extraerEstructura', { timeout: 120000 })
  const result = await fn({ systemPrompt, userPrompt, pdfPEBase64, pdfGPEBase64, temperature })
  return result.data.text
}

// ─── Modos directos con API key en el navegador ───────────────
// SOLO se permiten en desarrollo local (import.meta.env.DEV). En el build de
// producción, cualquier VITE_* queda expuesta en el bundle, así que se ignoran
// y SIEMPRE se usa la Cloud Function (la key vive como secreto del servidor).
const ALLOW_DIRECT_KEYS = import.meta.env.DEV
const tieneGeminiDirecto    = () => ALLOW_DIRECT_KEYS && Boolean(import.meta.env.VITE_GEMINI_API_KEY)
const tieneAnthropicDirecto = () => ALLOW_DIRECT_KEYS && Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY)

// ─── Selector de modo ─────────────────────────────────────────
function getCallFn() {
  if (tieneGeminiDirecto())    return callGeminiAPI
  if (tieneAnthropicDirecto()) return callAnthropicDirect
  return callViaCloudFunction
}

export function getProviderInfo() {
  if (tieneGeminiDirecto()) {
    return { name: 'Gemini', model: GEMINI_MODEL, mode: 'gemini', free: true }
  }
  if (tieneAnthropicDirecto()) {
    return { name: 'Claude', model: ANTHROPIC_MODEL, mode: 'anthropic', free: false }
  }
  return { name: 'Cloud Function', model: ANTHROPIC_MODEL, mode: 'function', free: false }
}

// ─── Extracción de estructura (1ª llamada) ────────────────────
// temperature 0.4: extracción fiel del PE, no creatividad.
// Incluye reintentos para 429 y 503 (sin countdown — la UI ya muestra loader).
async function extractStructure(pdfPEBase64, pdfGPEBase64, sessionId) {
  const callFn    = getCallFn()
  const useGemini = tieneGeminiDirecto()
  const MAX_ATTEMPTS_STRUCTURE = 3
  let lastErr

  for (let attempt = 0; attempt < MAX_ATTEMPTS_STRUCTURE; attempt++) {
    try {
      const text = await callFn({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt:   promptExtraccionEstructura(),
        pdfPEBase64,
        pdfGPEBase64,
        temperature: 0.4,
        sessionId,
      })
      return parseJSON(text)
    } catch (err) {
      lastErr = err
      const isRetryable = /429|quota|rate limit|503|UNAVAILABLE|high demand|overloaded|temporarily/i.test(err.message)
      if (attempt < MAX_ATTEMPTS_STRUCTURE - 1 && isRetryable) {
        const waitMs = calcBackoff(attempt, err.message) || (useGemini ? GEMINI_DELAY_MS * (attempt + 1) : 5000)
        await delay(waitMs)
        continue
      }
      break
    }
  }
  throw lastErr
}

// ─── Generación de un RA (llamada individual) ─────────────────
// No se reenvían los PDFs: el contenido del RA (contenidos, evidencias,
// actividad de evaluación) ya viene extraído literalmente en raInfo desde
// la 1ª llamada. Reenviar los PDFs (1.2 MB) en cada RA satura el límite de
// tokens-por-minuto del free tier y provoca errores 429 aleatorios.
// temperature 0.7: favorece variación en redacción y actividades entre sesiones
// sin sacrificar la estructura ni los términos técnicos del PE.
async function generateRA(raInfo, moduloInfo, practiceOffset, sessionId) {
  const callFn = getCallFn()
  const text = await callFn({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt:   promptGenerarRA({ raInfo, moduloInfo, practiceOffset }),
    temperature: 0.7,
    sessionId,
  })
  return parseJSON(text)
}

// Extrae los segundos sugeridos del mensaje de error 429 de Gemini.
function parseRetryDelay(msg) {
  const m = /retry in ([\d.]+)s/i.exec(msg || '')
  return m ? Math.ceil(parseFloat(m[1]) * 1000) : 0
}

// Backoff exponencial con jitter para evitar thundering herd.
// Si el error 429 incluye un retry-after, usarlo (es el más preciso).
function calcBackoff(attempt, errMsg) {
  const retryAfterMs = parseRetryDelay(errMsg)
  if (retryAfterMs > 0) return retryAfterMs
  const base   = 2000
  const exp    = base * Math.pow(2, attempt)   // 4s, 8s, 16s, 32s...
  const jitter = Math.random() * 1000           // 0–1 s extra
  return Math.min(exp + jitter, 60000)          // techo de 60 s
}

// Espera ms milisegundos llamando onProgress cada segundo con cuenta regresiva.
// errMsg se usa para diferenciar el mensaje entre 429 (cuota) y 503 (sobrecarga).
async function delayWithCountdown(ms, onProgress, progressBase, errMsg = '') {
  if (ms <= 0) return
  const isOverload = /503|UNAVAILABLE|high demand|overloaded|temporarily/i.test(errMsg)
  const end = Date.now() + ms
  while (Date.now() < end) {
    const segsRestantes = Math.ceil((end - Date.now()) / 1000)
    const message = segsRestantes > 1
      ? isOverload
        ? `El servidor de IA está saturado, reintentando en ${segsRestantes}s…`
        : `Esperando cuota de la API, reintentando en ${segsRestantes}s…`
      : 'Retomando la generación…'
    onProgress({ ...progressBase, message, waitSeconds: segsRestantes })
    await delay(Math.min(1000, Math.max(0, end - Date.now())))
  }
}

// ─── Paso 1: Extraer estructura desde los PDFs ───────────────
/**
 * Convierte los PDFs a base64, llama a la IA para extraer la estructura
 * del Programa de Estudios y valida que tenga al menos un RA real.
 * Devuelve la estructura tal como viene de la IA (con modulo.horasTotales).
 */
export async function extraerEstructuraDesdeArchivos(pdfPE, pdfGPE, onProgress, sessionId) {
  const progress = (state) => { try { onProgress?.(state) } catch {} }

  const sizePE  = fileSizeMB(pdfPE)
  const sizeGPE = fileSizeMB(pdfGPE)
  if (sizePE > MB_LIMIT || sizeGPE > MB_LIMIT) {
    throw new Error(`PDFs demasiado grandes (límite ${MB_LIMIT} MB). PE: ${sizePE.toFixed(1)} MB, GPE: ${sizeGPE.toFixed(1)} MB.`)
  }

  progress({ phase: 'converting', message: 'Convirtiendo PDFs a base64...' })
  const [pdfPEBase64, pdfGPEBase64] = await Promise.all([
    fileToBase64(pdfPE),
    fileToBase64(pdfGPE),
  ])

  progress({ phase: 'structure', message: 'Analizando Programa de Estudios con IA...' })
  let estructura
  try {
    estructura = await extractStructure(pdfPEBase64, pdfGPEBase64, sessionId)
  } catch (err) {
    throw new Error(`Error al analizar el PE: ${err.message}`)
  }

  // Validar que la IA realmente extrajo RAs del PDF (no datos inventados)
  const totalRAs = estructura?.unidades?.flatMap(u => u.resultados || []).length ?? 0
  if (totalRAs === 0) {
    throw new Error(
      'No se detectaron resultados de aprendizaje en el PDF. ' +
      'Verifica que el archivo subido sea el Programa de Estudios oficial y no otro documento.'
    )
  }

  progress({
    phase: 'structure',
    message: `Estructura detectada: ${estructura.unidades.length} unidades, ${totalRAs} RAs.`,
    estructura,
  })

  return estructura
}

/**
 * Versión gratuita: extrae solo la estructura del PE sin gastar crédito.
 * Usa la Cloud Function `extraerEstructura` (sin verificación de saldo).
 */
export async function extraerEstructuraGratis(pdfPE, pdfGPE, onProgress) {
  const progress = (state) => { try { onProgress?.(state) } catch {} }

  const sizePE  = fileSizeMB(pdfPE)
  const sizeGPE = fileSizeMB(pdfGPE)
  if (sizePE > MB_LIMIT || sizeGPE > MB_LIMIT) {
    throw new Error(`PDFs demasiado grandes (límite ${MB_LIMIT} MB). PE: ${sizePE.toFixed(1)} MB, GPE: ${sizeGPE.toFixed(1)} MB.`)
  }

  progress({ phase: 'converting', message: 'Convirtiendo PDFs a base64...' })
  const [pdfPEBase64, pdfGPEBase64] = await Promise.all([
    fileToBase64(pdfPE),
    fileToBase64(pdfGPE),
  ])

  progress({ phase: 'structure', message: 'Analizando Programa de Estudios...' })

  // En local (con key) usa el modo normal; en producción usa la Cloud Function gratuita.
  const callFn = tieneGeminiDirecto()
    ? callGeminiAPI
    : tieneAnthropicDirecto()
      ? callAnthropicDirect
      : callViaCloudFunctionGratis

  let estructura
  try {
    const text = await callFn({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt:   promptExtraccionEstructura(),
      pdfPEBase64,
      pdfGPEBase64,
      temperature:  0.4,
    })
    estructura = parseJSON(text)
  } catch (err) {
    throw new Error(`Error al analizar el PE: ${err.message}`)
  }

  const totalRAs = estructura?.unidades?.flatMap(u => u.resultados || []).length ?? 0
  if (totalRAs === 0) {
    throw new Error(
      'No se detectaron resultados de aprendizaje en el PDF. ' +
      'Verifica que el archivo subido sea el Programa de Estudios oficial.'
    )
  }

  progress({ phase: 'structure', message: `Estructura detectada: ${estructura.unidades.length} unidades, ${totalRAs} RAs.` })
  return estructura
}

// ─── Paso 2: Generar planeaciones desde estructura ya extraída ─
/**
 * A partir de una estructura ya validada (devuelta por extraerEstructuraDesdeArchivos),
 * genera la planeación didáctica de cada RA usando la IA.
 * - Los primeros RAs usan 2 intentos (fallan poco).
 * - Los últimos 2 RAs usan 5 intentos (más vulnerables al 429 acumulado).
 * - Backoff exponencial con jitter; respeta el retry-after de Gemini cuando lo envía.
 * - Durante la espera, llama a onProgress cada segundo con cuenta regresiva.
 * Devuelve { rasData, errors }.
 */
export async function generarRAsDesdeEstructura(estructura, onProgress, sessionId) {
  const progress = (state) => { try { onProgress?.(state) } catch {} }
  const useGemini = tieneGeminiDirecto()

  const allRAs = estructura.unidades.flatMap(u =>
    u.resultados.map(r => ({ ...r, unidadNombre: u.nombre, unidadNumero: u.numero, unidadProposito: u.proposito }))
  )
  const total = allRAs.length

  const rasData = {}
  const errors  = {}
  let practiceCounter = 1

  for (let i = 0; i < allRAs.length; i++) {
    const ra = allRAs[i]

    // 5 intentos para todos los RAs: también los primeros pueden topar 503.
    const maxAttempts = 5

    const progressBase = { phase: 'ra', current: i + 1, total, raLabel: ra.raLabel }

    progress({
      ...progressBase,
      message: `Generando resultado de aprendizaje ${i + 1} de ${total}…`,
    })

    // Pausa entre RAs para respetar el límite de Gemini (no es un error, sin errMsg)
    if (useGemini && i > 0) {
      await delayWithCountdown(GEMINI_DELAY_MS, progress, progressBase, '')
    }

    const raInfo = {
      raLabel:             ra.raLabel,
      nombre:              ra.nombre,
      horas:               ra.horas,
      actividadEvaluacion: ra.actividadEvaluacion,
      contenidos:          ra.contenidos,
      evidencias:          ra.evidencias,
      ponderacion:         ra.ponderacion,
      unidadNombre:        ra.unidadNombre,
      unidadNumero:        ra.unidadNumero,
      unidadProposito:     ra.unidadProposito,
    }
    const moduloInfo = {
      nombre:                estructura.modulo.nombre,
      proposito:             estructura.modulo.proposito,
      semestre:              estructura.modulo.semestre,
      competencia:           estructura.modulo.competencia,
      competenciasGenericas: estructura.competenciasGlobales || '',
      atributos:             estructura.atributosGlobales || '',
    }

    let raData = null, lastErr = null

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Limpiar el mensaje de "esperando" antes de cada intento
        progress({ ...progressBase, message: `Generando resultado de aprendizaje ${i + 1} de ${total}…` })
        raData = await generateRA(raInfo, moduloInfo, practiceCounter, sessionId)
        lastErr = null
        break
      } catch (err) {
        lastErr = err
        const isRetryable = /429|quota|rate limit|503|UNAVAILABLE|high demand|overloaded|temporarily/i.test(err.message)
        if (attempt < maxAttempts - 1 && isRetryable) {
          const waitMs = calcBackoff(attempt, err.message) || (useGemini ? GEMINI_DELAY_MS * (attempt + 1) : 5000)
          await delayWithCountdown(waitMs, progress, progressBase, err.message)
          continue
        }
        break
      }
    }

    if (raData) {
      rasData[ra.raLabel] = raData
      practiceCounter += (raData.practicas?.length || 0)
    } else {
      errors[ra.raLabel] = lastErr?.message || 'Error desconocido'
      rasData[ra.raLabel] = null
    }
  }

  progress({
    phase: 'done',
    message: `Generación completada. ${total - Object.keys(errors).length}/${total} RAs generados.`,
    errors: Object.keys(errors).length > 0 ? errors : null,
  })

  return { rasData, errors }
}

// ─── Función combinada (extracción + generación en un paso) ────
export async function generarTodasLasPlaneaciones(pdfPE, pdfGPE, onProgress, sessionId) {
  const estructura = await extraerEstructuraDesdeArchivos(pdfPE, pdfGPE, onProgress, sessionId)
  const { rasData, errors } = await generarRAsDesdeEstructura(estructura, onProgress, sessionId)
  return { estructura, rasData, errors }
}

// ─── Reintento individual ─────────────────────────────────────
export async function regenerarRA(raInfo, moduloInfo, practiceOffset = 1) {
  return generateRA(raInfo, moduloInfo, practiceOffset)
}

// ─── Construcción de unidades desde estructura AI ────────────
export function buildUnidadesFromAI(aiUnidades) {
  return aiUnidades.map((u, ui) => {
    const uid = Date.now() + ui * 1000
    return {
      id: uid,
      nombre: u.nombre,
      subunidades: u.resultados.map((r, ri) => ({
        id: `${uid}.${ri + 1}`,
        nombre: r.nombre,
        horas: String(r.horas),
      })),
    }
  })
}

// Compat — GeneradorIA lo usa para decidir el aviso de modo
export function isDirectMode() {
  return tieneGeminiDirecto() || tieneAnthropicDirecto()
}
