/**
 * Cloud Function: generarPlaneacion
 *
 * Proxy seguro entre el cliente (React) y las APIs de IA (Gemini o Anthropic).
 * La key nunca viaja al navegador. En producción, el cliente omite
 * VITE_GEMINI_API_KEY / VITE_ANTHROPIC_API_KEY y usa esta función.
 *
 * Configuración de secretos (una sola vez):
 *   firebase functions:secrets:set GEMINI_API_KEY
 *   firebase functions:secrets:set ANTHROPIC_API_KEY   (si usas Claude como fallback)
 *
 * Despliegue:
 *   firebase deploy --only functions,firestore:rules
 *
 * La función prefiere Gemini; cae en Anthropic si GEMINI_API_KEY no está configurada.
 *
 * Sistema de créditos:
 *   - Cada llamada consume CREDITOS_POR_GENERACION créditos del usuario.
 *   - La cuenta admin (ADMIN_EMAILS) pasa por el mismo flujo pero con delta=0,
 *     por lo que su saldo nunca baja; sirve para probar el flujo completo sin gastar.
 *   - Los créditos se descuentan ANTES de llamar a la IA y se reembolsan si falla.
 */

const { onCall, HttpsError }        = require('firebase-functions/v2/https')
const { setGlobalOptions }          = require('firebase-functions/v2')
const { defineSecret }              = require('firebase-functions/params')
const Anthropic                     = require('@anthropic-ai/sdk')
const OpenAI                        = require('openai')
const { initializeApp }             = require('firebase-admin/app')
const { getFirestore, FieldValue }  = require('firebase-admin/firestore')
const { getAuth: getAdminAuth }     = require('firebase-admin/auth')

initializeApp()
const db = getFirestore()

setGlobalOptions({ region: 'us-central1' })

const GEMINI_API_KEY_SECRET = defineSecret('GEMINI_API_KEY')
const OPENAI_API_KEY_SECRET = defineSecret('OPENAI_API_KEY')

const ANTHROPIC_MODEL = 'claude-opus-4-7'
const GEMINI_MODEL    = 'gemini-2.5-flash'
const OPENAI_MODEL    = 'gpt-4o-mini'
const MAX_TOKENS      = 16000
const GEMINI_2023_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
])

// Límites de entrada (para evitar abuso y exceso de costos)
const MAX_PROMPT_CHARS = 100_000   // ~25 k tokens sistema+usuario, margen generoso
const MAX_PDF_B64_LEN  = 50_000_000 // ~37.5 MB en base64 ≈ ~28 MB de PDF original

// ── Sistema de créditos ────────────────────────────────────────
const CREDITOS_POR_GENERACION = 1

// ── Sesiones de generación 2023 ────────────────────────────────
// El flujo 2023 hace muchas llamadas a la IA (estructura + N RAs) pero
// cuesta 1 solo crédito. Para no cobrar por llamada ni dejar la función
// abierta, el cliente abre una sesión (descuenta 1 crédito), pasa su id
// en cada llamada y la cierra al terminar (confirma o reembolsa).
// Techo de llamadas IA por sesión, SEGÚN EL TIPO DE FLUJO. Acota cuántos prompts
// puede ejecutar 1 crédito y evita que, p. ej., una regeneración de 1 RA disponga
// de decenas de llamadas. El límite se fija en el servidor al abrir la sesión y se
// guarda en la propia sesión; el cliente solo declara el tipo de flujo.
//   completa → 2018/2023 completo: estructura + N RAs (+ reintentos)
//   regenRA  → regeneración de 1 RA (solo reintentos de esa llamada)
const LIMITES_POR_FLUJO = {
  completa: 60,
  regenRA:  8,
}
const DEFAULT_MAX_LLAMADAS = LIMITES_POR_FLUJO.completa
const SESION_TTL_MS        = 30 * 60_000 // 30 min: ventana de vida de una sesión activa

// Emails de administrador con saldo infinito (delta=0 en cada transacción).
// El check de admin ocurre SIEMPRE en el servidor usando el token verificado de Firebase;
// el cliente no puede declararse admin por su cuenta.
const ADMIN_EMAILS = ['victor20sano@gmail.com']

function esAdmin(authContext) {
  if (!authContext || !authContext.token) return false
  const email = (authContext.token.email || '').toLowerCase().trim()
  if (!ADMIN_EMAILS.includes(email)) return false
  // En producción exigir email verificado; en desarrollo omitirlo.
  // Fix definitivo: ejecutar scripts/marcarAdminVerificado.js una sola vez.
  if (process.env.NODE_ENV === 'production' && !authContext.token.email_verified) return false
  return true
}

// ── Helpers de créditos ────────────────────────────────────────
async function descontarCredito(userRef, adminUser) {
  const delta = adminUser ? 0 : -CREDITOS_POR_GENERACION
  await db.runTransaction(async (tx) => {
    const snap   = await tx.get(userRef)
    const actual = snap.data()?.creditos ?? 0
    if (!adminUser && actual < CREDITOS_POR_GENERACION) {
      throw new HttpsError('failed-precondition', 'Saldo insuficiente.')
    }
    tx.set(userRef, { creditos: actual + delta }, { merge: true })
  })
  return delta
}

async function reembolsarCredito(userRef, adminUser) {
  const refundDelta = adminUser ? 0 : CREDITOS_POR_GENERACION
  await db.runTransaction(async (tx) => {
    const snap   = await tx.get(userRef)
    const actual = snap.data()?.creditos ?? 0
    tx.set(userRef, { creditos: actual + refundDelta }, { merge: true })
  }).catch(e => console.error('Error en reembolso de crédito:', e.message))
  return refundDelta
}

async function registrarConsumo(userRef, adminUser, delta, tipo) {
  userRef.collection('consumos').add({
    timestamp: FieldValue.serverTimestamp(),
    cantidad:  CREDITOS_POR_GENERACION,
    delta,
    admin:     adminUser,
    tipo,
  }).catch(e => console.error('Error al registrar consumo (%s):', tipo, e.message))
}

exports.generarPlaneacion = onCall(
  {
    timeoutSeconds: 540,
    memory: '512MiB',
    secrets: [GEMINI_API_KEY_SECRET, OPENAI_API_KEY_SECRET],
    cors: true,
  },
  async (request) => {
    // ── Guardia de autenticación ────────────────────────────────
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión para usar esta función.')
    }

    const adminUser = esAdmin(request.auth)
    const uid       = request.auth.uid
    const userRef   = db.collection('users').doc(uid)

    const { systemPrompt, userPrompt, pdfPEBase64, pdfGPEBase64, temperature = 0.7, sessionId } = request.data || {}

    // Si llega sessionId, el crédito ya se descontó en iniciarGeneracion: esta
    // llamada solo consume un "tick" de la sesión (flujo multi-llamada → 1 crédito).
    // Sin sessionId se mantiene el modo de 1 llamada = 1 crédito (p. ej. regeneración individual).
    const usaSesion = Boolean(sessionId)

    // ── Validación de entrada ───────────────────────────────────
    if (!userPrompt)   throw new HttpsError('invalid-argument', 'Falta el prompt de usuario.')
    if (!systemPrompt) throw new HttpsError('invalid-argument', 'Falta el prompt del sistema.')

    if ((systemPrompt.length + userPrompt.length) > MAX_PROMPT_CHARS) {
      throw new HttpsError('invalid-argument', 'Los prompts superan el tamaño máximo permitido.')
    }
    if (pdfPEBase64  && pdfPEBase64.length  > MAX_PDF_B64_LEN) {
      throw new HttpsError('invalid-argument', 'El PDF del PE supera el tamaño máximo (28 MB).')
    }
    if (pdfGPEBase64 && pdfGPEBase64.length > MAX_PDF_B64_LEN) {
      throw new HttpsError('invalid-argument', 'El PDF de la GPE supera el tamaño máximo (28 MB).')
    }
    if (typeof temperature !== 'number' || temperature < 0 || temperature > 1) {
      throw new HttpsError('invalid-argument', 'La temperatura debe estar entre 0 y 1.')
    }

    // ── Sesión ya pagada: validar y consumir un tick ───────────
    let sessionRef = null
    if (usaSesion) {
      sessionRef = userRef.collection('sesionesGeneracion').doc(sessionId)
      await consumirLlamadaSesion(sessionRef, ['completa'])
    } else {
      // ── Modo 1 llamada = 1 crédito: pre-check rápido de saldo ──
      const userSnap    = await userRef.get()
      const saldoActual = userSnap.data()?.creditos ?? 0
      if (!adminUser && saldoActual < CREDITOS_POR_GENERACION) {
        throw new HttpsError('failed-precondition', 'Saldo insuficiente. Adquiere más créditos para continuar.')
      }
    }

    // ── Selección de proveedor: OpenAI > Gemini > Anthropic ─────
    const openaiKey    = OPENAI_API_KEY_SECRET.value() || process.env.OPENAI_API_KEY
    const geminiKey    = GEMINI_API_KEY_SECRET.value() || process.env.GEMINI_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    if (!openaiKey && !geminiKey && !anthropicKey) {
      console.error('No hay claves de IA configuradas en la Cloud Function.')
      throw new HttpsError('failed-precondition', 'El servicio de IA no está configurado en el servidor.')
    }

    // ── Descuento de crédito (solo modo sin sesión; transacción atómica) ──
    // admin → delta = 0 (saldo intacto, pero la transacción corre igual)
    const delta = usaSesion ? 0 : await descontarCredito(userRef, adminUser)

    // ── Llamada a la IA ─────────────────────────────────────────
    try {
      let text
      if (openaiKey) {
        text = await callOpenAI({ openaiKey, systemPrompt, userPrompt, pdfPEBase64, pdfGPEBase64, temperature })
      } else if (geminiKey) {
        text = await callGemini({ geminiKey, systemPrompt, userPrompt, pdfPEBase64, pdfGPEBase64, temperature })
      } else {
        text = await callAnthropic({ anthropicKey, systemPrompt, userPrompt, pdfPEBase64, pdfGPEBase64, temperature })
      }

      // Registrar consumo exitoso solo en modo sin sesión (la sesión ya lo registró en iniciar).
      if (!usaSesion) registrarConsumo(userRef, adminUser, delta, 'generacion')
      // Con sesión: marcar éxito (await) → habilita el cobro definitivo ANTES de responder.
      else if (sessionRef) await marcarExitoSesion(sessionRef)

      return { text }
    } catch (err) {
      console.error('IA API error (uid=%s):', uid, err.message)

      // En modo sin sesión reembolsamos aquí; con sesión, el reembolso lo hace
      // finalizarGeneracion(exito:false) una sola vez al cerrar el flujo completo.
      if (!usaSesion) {
        const refundDelta = await reembolsarCredito(userRef, adminUser)
        registrarConsumo(userRef, adminUser, refundDelta, 'reembolso')
      }

      throw new HttpsError('internal', 'Error al llamar al servicio de IA. Intenta de nuevo.')
    }
  }
)

// ── Extracción de estructura (modo gratuito, sin crédito) ──────
// Solo hace 1 llamada a la IA para extraer unidades/horas del PE.
// No descuenta crédito. Requiere autenticación para evitar abuso.
exports.extraerEstructura = onCall(
  {
    timeoutSeconds: 120,
    memory: '512MiB',
    secrets: [GEMINI_API_KEY_SECRET, OPENAI_API_KEY_SECRET],
    cors: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión para usar esta función.')
    }

    const { systemPrompt, userPrompt, pdfPEBase64, pdfGPEBase64, temperature = 0.4 } = request.data || {}

    if (!userPrompt)   throw new HttpsError('invalid-argument', 'Falta el prompt de usuario.')
    if (!systemPrompt) throw new HttpsError('invalid-argument', 'Falta el prompt del sistema.')
    if ((systemPrompt.length + userPrompt.length) > MAX_PROMPT_CHARS) {
      throw new HttpsError('invalid-argument', 'Los prompts superan el tamaño máximo permitido.')
    }

    const openaiKey    = OPENAI_API_KEY_SECRET.value() || process.env.OPENAI_API_KEY
    const geminiKey    = GEMINI_API_KEY_SECRET.value() || process.env.GEMINI_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    if (!openaiKey && !geminiKey && !anthropicKey) {
      throw new HttpsError('failed-precondition', 'El servicio de IA no está configurado.')
    }

    try {
      let text
      if (openaiKey) {
        text = await callOpenAI({ openaiKey, systemPrompt, userPrompt, pdfPEBase64, pdfGPEBase64, temperature })
      } else if (geminiKey) {
        text = await callGemini({ geminiKey, systemPrompt, userPrompt, pdfPEBase64, pdfGPEBase64, temperature })
      } else {
        text = await callAnthropic({ anthropicKey, systemPrompt, userPrompt, pdfPEBase64, pdfGPEBase64, temperature })
      }
      return { text }
    } catch (err) {
      console.error('extraerEstructura IA error (uid=%s):', request.auth.uid, err.message)
      throw new HttpsError('internal', 'Error al analizar el PE. Intenta de nuevo.')
    }
  }
)

// ── iniciarGeneracion: abre sesión y descuenta 1 crédito ───────
// Descuento atómico + creación de la sesión en una sola transacción.
// Devuelve { sessionId } que el cliente pasa en cada llamada de IA del flujo
// (sirve tanto al Modelo 2018 como al 2023: ambos son multi-llamada y cuestan 1 crédito).
exports.iniciarGeneracion = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesion para usar esta funcion.')
  }

  const adminUser  = esAdmin(request.auth)
  const uid        = request.auth.uid
  const userRef    = db.collection('users').doc(uid)
  const sessionRef = userRef.collection('sesionesGeneracion').doc()
  const delta      = adminUser ? 0 : -CREDITOS_POR_GENERACION

  // Tipo de flujo declarado por el cliente → fija el límite de llamadas en el servidor.
  const tipoFlujo   = (request.data?.tipoFlujo === 'regenRA') ? 'regenRA' : 'completa'
  const maxLlamadas = LIMITES_POR_FLUJO[tipoFlujo] ?? DEFAULT_MAX_LLAMADAS

  await db.runTransaction(async (tx) => {
    const snap   = await tx.get(userRef)
    const actual = snap.data()?.creditos ?? 0
    if (!adminUser && actual < CREDITOS_POR_GENERACION) {
      throw new HttpsError('failed-precondition', 'Saldo insuficiente. Adquiere más créditos para continuar.')
    }
    tx.set(userRef, { creditos: actual + delta }, { merge: true })
    tx.set(sessionRef, {
      estado:            'activa',
      admin:             adminUser,
      creditoDescontado: !adminUser,
      tipoFlujo,
      maxLlamadas,       // límite fijado en servidor; el cliente no puede ampliarlo después
      llamadas:          0, // intentos de IA (para el tope maxLlamadas)
      exitos:            0, // respuestas de IA exitosas (decide el reembolso, no el cliente)
      createdAt:         FieldValue.serverTimestamp(),
    })
  })

  registrarConsumo(userRef, adminUser, delta, 'generacion')
  return { sessionId: sessionRef.id }
})

// ── finalizarGeneracion: cierra la sesión ──────────────────────
// IMPORTANTE: el reembolso NO depende de un flag del cliente. Reembolsamos solo
// si la sesión no produjo NINGUNA salida de IA exitosa (ses.exitos === 0). Así
// un usuario no puede generar su planeación completa y luego pedir el reembolso:
// si la IA generó algo útil, el crédito se consume aunque el cliente diga 'exito:false'.
// (El parámetro 'exito' del cliente solo se usa para etiquetar el estado final.)
exports.finalizarGeneracion = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesion para usar esta funcion.')
  }

  const { sessionId, exito = true } = request.data || {}
  if (!sessionId || typeof sessionId !== 'string') {
    throw new HttpsError('invalid-argument', 'Falta el identificador de sesión.')
  }

  const uid        = request.auth.uid
  const userRef    = db.collection('users').doc(uid)
  const sessionRef = userRef.collection('sesionesGeneracion').doc(sessionId)

  let reembolsado = false
  await db.runTransaction(async (tx) => {
    const sesSnap = await tx.get(sessionRef)
    if (!sesSnap.exists) throw new HttpsError('not-found', 'Sesión no encontrada.')
    const ses = sesSnap.data()
    if (ses.estado !== 'activa') return // ya cerrada: idempotente

    // Reembolso server-owned: solo si no hubo ninguna generación exitosa.
    const procedeReembolso = (ses.exitos ?? 0) === 0 && ses.creditoDescontado
    if (procedeReembolso) {
      const userSnap = await tx.get(userRef)
      const actual   = userSnap.data()?.creditos ?? 0
      tx.set(userRef, { creditos: actual + CREDITOS_POR_GENERACION }, { merge: true })
    }
    tx.update(sessionRef, {
      estado:    procedeReembolso ? 'reembolsada' : (exito ? 'completada' : 'cerrada'),
      closedAt:  FieldValue.serverTimestamp(),
    })
    reembolsado = procedeReembolso
  })

  if (reembolsado) registrarConsumo(userRef, false, CREDITOS_POR_GENERACION, 'reembolso')
  return { ok: true, reembolsado }
})

// Valida que la sesión exista, sea del usuario, esté activa, no haya
// expirado ni superado el cap de llamadas. Incrementa el contador.
// Corre dentro de una transacción para evitar carreras entre llamadas concurrentes.
async function consumirLlamadaSesion(sessionRef, flujosPermitidos) {
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(sessionRef)
    if (!snap.exists) throw new HttpsError('permission-denied', 'Sesión de generación inválida.')
    const ses = snap.data()
    if (ses.estado !== 'activa') {
      throw new HttpsError('failed-precondition', 'La sesión de generación ya no está activa.')
    }
    // Candado por tipo de flujo: la sesión solo sirve contra los endpoints
    // declarados para su tipoFlujo (p. ej. una sesión 'regenRA' no puede usarse
    // contra el endpoint de generación completa 2018).
    if (!flujosPermitidos.includes(ses.tipoFlujo ?? 'completa')) {
      throw new HttpsError('permission-denied', 'La sesión no es válida para esta operación.')
    }
    const createdMs = ses.createdAt?.toMillis?.() ?? 0
    if (createdMs && Date.now() - createdMs > SESION_TTL_MS) {
      throw new HttpsError('deadline-exceeded', 'La sesión de generación expiró.')
    }
    const tope = ses.maxLlamadas ?? DEFAULT_MAX_LLAMADAS
    if ((ses.llamadas ?? 0) >= tope) {
      throw new HttpsError('resource-exhausted', 'Se superó el número de llamadas permitidas por generación.')
    }
    tx.update(sessionRef, { llamadas: (ses.llamadas ?? 0) + 1 })
  })
}

// Marca una respuesta de IA exitosa en la sesión (incremento atómico).
// CRÍTICO: NO es best-effort. Debe esperarse (await) y propagar el error ANTES
// de devolver el texto al cliente. Así se cierra la condición de carrera: el
// cliente no puede recibir la respuesta y llamar a finalizarGeneracion(exito:false)
// antes de que 'exitos' quede escrito. Si el write falla, lanzamos y NO entregamos
// el texto → el crédito queda reembolsable (no hubo entrega) y no hay abuso posible.
async function marcarExitoSesion(sessionRef) {
  await sessionRef.update({ exitos: FieldValue.increment(1) })
}

exports.generarGemini2023 = onCall(
  {
    timeoutSeconds: 540,
    memory: '512MiB',
    secrets: [GEMINI_API_KEY_SECRET, OPENAI_API_KEY_SECRET],
    cors: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesion para usar esta funcion.')
    }

    // ── Validación de sesión pagada (saldo ya descontado en iniciarGeneracion2023) ──
    const { sessionId } = request.data || {}
    if (!sessionId || typeof sessionId !== 'string') {
      throw new HttpsError('invalid-argument', 'Falta el identificador de sesión de generación.')
    }
    const sessionRef = db.collection('users').doc(request.auth.uid)
      .collection('sesionesGeneracion').doc(sessionId)
    await consumirLlamadaSesion(sessionRef, ['completa', 'regenRA'])

    const {
      systemPrompt = null,
      userPrompt,
      pdfPEBase64,
      pdfGPEBase64,
      temperature = 0.7,
      maxOutputTokens = 8192,
      model = 'gemini-2.5-flash',
    } = request.data || {}

    if (!userPrompt || typeof userPrompt !== 'string') {
      throw new HttpsError('invalid-argument', 'Falta el prompt de usuario.')
    }
    if (systemPrompt !== null && typeof systemPrompt !== 'string') {
      throw new HttpsError('invalid-argument', 'El prompt del sistema no es valido.')
    }
    if (!GEMINI_2023_MODELS.has(model)) {
      throw new HttpsError('invalid-argument', 'Modelo Gemini no permitido.')
    }
    if (typeof temperature !== 'number' || temperature < 0 || temperature > 1) {
      throw new HttpsError('invalid-argument', 'La temperatura debe estar entre 0 y 1.')
    }
    if (!Number.isInteger(maxOutputTokens) || maxOutputTokens < 512 || maxOutputTokens > 65536) {
      throw new HttpsError('invalid-argument', 'maxOutputTokens no es valido.')
    }
    if ((systemPrompt?.length || 0) + userPrompt.length > MAX_PROMPT_CHARS) {
      throw new HttpsError('invalid-argument', 'Los prompts superan el tamano maximo permitido.')
    }
    if (pdfPEBase64 && pdfPEBase64.length > MAX_PDF_B64_LEN) {
      throw new HttpsError('invalid-argument', 'El PDF del PE supera el tamano maximo.')
    }
    if (pdfGPEBase64 && pdfGPEBase64.length > MAX_PDF_B64_LEN) {
      throw new HttpsError('invalid-argument', 'El PDF de la GPE supera el tamano maximo.')
    }

    // ── Selección de proveedor: OpenAI > Gemini ─────────────────
    const openaiKey = OPENAI_API_KEY_SECRET.value() || process.env.OPENAI_API_KEY
    const geminiKey = GEMINI_API_KEY_SECRET.value() || process.env.GEMINI_API_KEY
    if (!openaiKey && !geminiKey) {
      throw new HttpsError('failed-precondition', 'No hay API key de IA configurada (OPENAI_API_KEY o GEMINI_API_KEY).')
    }

    try {
      let text
      if (openaiKey) {
        text = await callOpenAI({
          openaiKey,
          systemPrompt,
          userPrompt,
          pdfPEBase64,
          pdfGPEBase64,
          temperature,
          maxTokens: maxOutputTokens,
        })
      } else {
        text = await callGemini({
          geminiKey,
          systemPrompt,
          userPrompt,
          pdfPEBase64,
          pdfGPEBase64,
          temperature,
          model,
          maxOutputTokens,
        })
      }
      await marcarExitoSesion(sessionRef) // habilita el cobro definitivo ANTES de responder
      return { text }
    } catch (err) {
      console.error('IA 2023 API error (uid=%s):', request.auth.uid, err.message)
      throw new HttpsError('internal', err.message || 'Error al llamar a la IA.')
    }
  }
)

// ── acreditarCreditoManual (solo admin) ───────────────────────
exports.acreditarCreditoManual = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!esAdmin(request.auth)) {
      throw new HttpsError('permission-denied', 'Solo administradores pueden acreditar manualmente.')
    }

    const { emailDestino, creditos, metodo, monto, nota } = request.data || {}

    // Validaciones
    if (!emailDestino || typeof emailDestino !== 'string') {
      throw new HttpsError('invalid-argument', 'Email destino requerido.')
    }
    const emailNorm = emailDestino.toLowerCase().trim()

    const creditosNum = Number(creditos)
    if (!Number.isInteger(creditosNum) || creditosNum === 0 || Math.abs(creditosNum) > 50) {
      throw new HttpsError('invalid-argument', 'Créditos debe ser un entero entre -50 y 50, distinto de 0.')
    }

    const metodosValidos = ['efectivo', 'transferencia', 'cortesia', 'otro']
    if (!metodosValidos.includes(metodo)) {
      throw new HttpsError('invalid-argument', 'Método de pago no válido.')
    }

    const montoNum = (monto === undefined || monto === '') ? 0 : Number(monto)
    if (!Number.isFinite(montoNum) || montoNum < 0 || montoNum > 100000) {
      throw new HttpsError('invalid-argument', 'Monto inválido.')
    }

    // Si es ajuste negativo, la nota es obligatoria
    if (creditosNum < 0 && !String(nota || '').trim()) {
      throw new HttpsError('invalid-argument', 'La nota es obligatoria para ajustes negativos (reversas).')
    }

    // Buscar usuario por email en Firebase Auth
    let userRecord
    try {
      userRecord = await getAdminAuth().getUserByEmail(emailNorm)
    } catch {
      throw new HttpsError('not-found', `No existe usuario con email ${emailNorm}.`)
    }

    const destinoUid = userRecord.uid
    const destinoRef = db.collection('users').doc(destinoUid)

    // ID único para idempotencia y auditoría
    const acreditacionId  = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const acreditacionRef = db.collection('acreditacionesManual').doc(acreditacionId)
    const compraRef       = destinoRef.collection('compras').doc(acreditacionId)

    let saldoNuevo
    await db.runTransaction(async (tx) => {
      const snap        = await tx.get(destinoRef)
      const saldoActual = snap.data()?.creditos ?? 0
      saldoNuevo        = saldoActual + creditosNum

      if (saldoNuevo < 0) {
        throw new HttpsError('failed-precondition', `El saldo resultante sería negativo (${saldoNuevo}). Ajusta la cantidad.`)
      }

      const registro = {
        tipo:          'manual',
        adminUid:      request.auth.uid,
        adminEmail:    (request.auth.token.email || '').toLowerCase(),
        destinoUid,
        destinoEmail:  emailNorm,
        creditos:      creditosNum,
        metodo,
        monto:         montoNum,
        nota:          (nota || '').slice(0, 500),
        saldoAntes:    saldoActual,
        saldoDespues:  saldoNuevo,
        fecha:         FieldValue.serverTimestamp(),
      }

      tx.set(destinoRef,    { creditos: saldoNuevo, email: emailNorm }, { merge: true })
      tx.set(acreditacionRef, registro)
      tx.set(compraRef,     registro)
    })

    return {
      ok: true,
      destinoUid,
      destinoEmail:        emailNorm,
      creditosAcreditados: creditosNum,
      saldoNuevo,
      acreditacionId,
    }
  }
)

// ── listarAcreditacionesManual (solo admin) ───────────────────
exports.listarAcreditacionesManual = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!esAdmin(request.auth)) {
      throw new HttpsError('permission-denied', 'Solo administradores.')
    }
    const limit = Math.min(Number(request.data?.limit) || 50, 200)
    const snap  = await db.collection('acreditacionesManual')
      .orderBy('fecha', 'desc')
      .limit(limit)
      .get()
    return {
      items: snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        fecha: d.data().fecha?.toMillis?.() ?? null,
      })),
    }
  }
)

// ── Gemini via REST (Node 20 tiene fetch nativo) ───────────────
async function callGemini({
  geminiKey,
  systemPrompt,
  userPrompt,
  pdfPEBase64,
  pdfGPEBase64,
  temperature,
  model = GEMINI_MODEL,
  maxOutputTokens = 65536,
}) {
  const isThinking = model.includes('2.5') || model.includes('3')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`

  const parts = []
  if (pdfPEBase64)  parts.push({ inline_data: { mime_type: 'application/pdf', data: pdfPEBase64 } })
  if (pdfGPEBase64) parts.push({ inline_data: { mime_type: 'application/pdf', data: pdfGPEBase64 } })
  parts.push({ text: userPrompt })

  const body = {
    ...(systemPrompt ? { system_instruction: { parts: [{ text: systemPrompt }] } } : {}),
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: 'application/json',
      ...(isThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(`Gemini ${res.status}: ${errData?.error?.message || res.statusText}`)
  }

  const data = await res.json()
  const candidate = data.candidates?.[0]

  if (!candidate) {
    const reason = data.promptFeedback?.blockReason
    throw new Error(`Gemini bloqueó la respuesta${reason ? ': ' + reason : '.'}`)
  }
  if (candidate.finishReason === 'SAFETY') {
    throw new Error('Gemini bloqueó la respuesta por filtros de seguridad.')
  }
  if (candidate.finishReason === 'MAX_TOKENS') {
    throw new Error('La respuesta se cortó por límite de tokens.')
  }

  return candidate.content?.parts?.map(p => p.text).filter(Boolean).join('') ?? ''
}

// ── OpenAI (GPT-4o-mini) ───────────────────────────────────────
// Los PDFs van PRIMERO (prefijo estable) → OpenAI cachea automáticamente
// ese prefijo entre llamadas (mismo PE/GPE) y descuenta ~50% en lo cacheado.
async function callOpenAI({
  openaiKey,
  systemPrompt,
  userPrompt,
  pdfPEBase64,
  pdfGPEBase64,
  temperature,
  maxTokens = 16384,
  model = OPENAI_MODEL,
}) {
  const client = new OpenAI({ apiKey: openaiKey })

  const content = [
    ...(pdfPEBase64  ? [{ type: 'file', file: { filename: 'PE.pdf',  file_data: `data:application/pdf;base64,${pdfPEBase64}`  } }] : []),
    ...(pdfGPEBase64 ? [{ type: 'file', file: { filename: 'GPE.pdf', file_data: `data:application/pdf;base64,${pdfGPEBase64}` } }] : []),
    { type: 'text', text: userPrompt },
  ]

  const messages = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content })

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_completion_tokens: Math.min(maxTokens, 16384),
  })

  const choice = response.choices?.[0]
  if (choice?.finish_reason === 'length') {
    throw new Error('La respuesta se cortó por límite de tokens.')
  }
  return choice?.message?.content ?? ''
}

// ── Anthropic (fallback) ───────────────────────────────────────
async function callAnthropic({ anthropicKey, systemPrompt, userPrompt, pdfPEBase64, pdfGPEBase64, temperature }) {
  const client = new Anthropic({ apiKey: anthropicKey })

  const content = [
    ...(pdfPEBase64  ? [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfPEBase64  }, title: 'Programa de Estudios (PE)'           }] : []),
    ...(pdfGPEBase64 ? [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfGPEBase64 }, title: 'Guía Pedagógica y de Evaluación (GPE)' }] : []),
    { type: 'text', text: userPrompt },
  ]

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_TOKENS,
    temperature,
    system: systemPrompt,
    messages: [{ role: 'user', content }],
  })

  return response.content[0]?.text ?? ''
}
