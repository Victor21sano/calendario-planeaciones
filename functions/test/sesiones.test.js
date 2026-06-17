// Tests de los TOPES de sesión (consumirLlamadaSesion) contra el emulador.
//
// consumirLlamadaSesion es un helper interno no exportado; solo se alcanza vía
// los endpoints de IA. CLAVE: corre ANTES de chequear las API keys / llamar a la
// IA, así que todas las rutas de RECHAZO (cap, TTL, inactiva, no-encontrada,
// candado de flujo) lanzan sin tocar ningún proveedor → no hace falta mockear IA.
// Para probar el INCREMENTO exitoso se pasa un arg inválido (userPrompt ausente),
// que se valida DESPUÉS de consumirLlamadaSesion: la llamada se incrementa y el
// endpoint corta en la validación de args, sin llegar a la IA.
//
// Correr con: cd functions && npm run test:emu  (requiere JDK).

const fft = require('firebase-functions-test')()
const fns = require('../index')
const {
  Timestamp,
  uniqueUid,
  seedSession,
  getSession,
  reqUsuario,
  expectHttpsError,
} = require('./helpers')

const generarGemini2023 = fft.wrap(fns.generarGemini2023)
const generarPlaneacion = fft.wrap(fns.generarPlaneacion)

afterAll(() => fft.cleanup())

// Sesión activa base; los tests sobreescriben lo que necesiten.
function sesionActiva(over = {}) {
  return {
    estado: 'activa',
    tipoFlujo: 'completa',
    maxLlamadas: 8,
    llamadas: 0,
    createdAt: Timestamp.fromMillis(Date.now()), // reciente → no expirada
    creditoDescontado: true,
    costo: 100,
    ...over,
  }
}

// ───────────────────────────────────────────────────────────────
describe('consumirLlamadaSesion — rutas de rechazo (vía generarGemini2023, sin IA)', () => {
  it('rechaza al alcanzar el tope de llamadas (resource-exhausted) sin incrementar', async () => {
    const uid = uniqueUid()
    await seedSession(uid, 's1', sesionActiva({ llamadas: 8, maxLlamadas: 8 }))

    const err = await expectHttpsError(
      generarGemini2023(reqUsuario(uid, { sessionId: 's1' })),
      'resource-exhausted',
    )
    expect(err.code).toBe('resource-exhausted')
    expect((await getSession(uid, 's1')).llamadas).toBe(8) // intacto
  })

  it('rechaza una sesión expirada por TTL (deadline-exceeded)', async () => {
    const uid = uniqueUid()
    // 31 min > SESION_TTL_MS (30 min)
    await seedSession(uid, 's1', sesionActiva({ createdAt: Timestamp.fromMillis(Date.now() - 31 * 60_000) }))

    const err = await expectHttpsError(
      generarGemini2023(reqUsuario(uid, { sessionId: 's1' })),
      'deadline-exceeded',
    )
    expect(err.code).toBe('deadline-exceeded')
  })

  it('rechaza una sesión que ya no está activa (failed-precondition)', async () => {
    const uid = uniqueUid()
    await seedSession(uid, 's1', sesionActiva({ estado: 'completada' }))

    const err = await expectHttpsError(
      generarGemini2023(reqUsuario(uid, { sessionId: 's1' })),
      'failed-precondition',
    )
    expect(err.code).toBe('failed-precondition')
  })

  it('rechaza una sesión inexistente (permission-denied)', async () => {
    const uid = uniqueUid()
    const err = await expectHttpsError(
      generarGemini2023(reqUsuario(uid, { sessionId: 'no-existe' })),
      'permission-denied',
    )
    expect(err.code).toBe('permission-denied')
  })

  it('rechaza si falta el sessionId (invalid-argument)', async () => {
    const uid = uniqueUid()
    const err = await expectHttpsError(
      generarGemini2023(reqUsuario(uid, {})),
      'invalid-argument',
    )
    expect(err.code).toBe('invalid-argument')
  })

  it('rechaza si no hay autenticación (unauthenticated)', async () => {
    const err = await expectHttpsError(
      generarGemini2023({ data: { sessionId: 's1' } }),
      'unauthenticated',
    )
    expect(err.code).toBe('unauthenticated')
  })
})

// ───────────────────────────────────────────────────────────────
describe('consumirLlamadaSesion — incremento y frontera del tope', () => {
  it('una llamada válida incrementa el contador (y corta en validación de args, sin IA)', async () => {
    const uid = uniqueUid()
    await seedSession(uid, 's1', sesionActiva({ llamadas: 0, maxLlamadas: 8 }))

    // Sin userPrompt: consumirLlamadaSesion corre primero (incrementa), luego la
    // validación de args lanza invalid-argument — antes de tocar la IA.
    const err = await expectHttpsError(
      generarGemini2023(reqUsuario(uid, { sessionId: 's1' })),
      'invalid-argument',
    )
    expect(err.code).toBe('invalid-argument')
    expect((await getSession(uid, 's1')).llamadas).toBe(1) // incrementó
  })

  it('cuenta hasta el tope y luego lo bloquea (7→8 ok, el siguiente resource-exhausted)', async () => {
    const uid = uniqueUid()
    await seedSession(uid, 's1', sesionActiva({ llamadas: 7, maxLlamadas: 8 }))

    // Llega al tope: incrementa 7→8 y corta en validación de args.
    await expectHttpsError(generarGemini2023(reqUsuario(uid, { sessionId: 's1' })), 'invalid-argument')
    expect((await getSession(uid, 's1')).llamadas).toBe(8)

    // Ya en el tope: la siguiente se rechaza.
    const err = await expectHttpsError(generarGemini2023(reqUsuario(uid, { sessionId: 's1' })), 'resource-exhausted')
    expect(err.code).toBe('resource-exhausted')
    expect((await getSession(uid, 's1')).llamadas).toBe(8)
  })
})

// ───────────────────────────────────────────────────────────────
describe('candado por tipo de flujo (vía generarPlaneacion → permite completa/horario)', () => {
  it('rechaza usar una sesión regenRA contra generarPlaneacion (permission-denied)', async () => {
    const uid = uniqueUid()
    await seedSession(uid, 's1', sesionActiva({ tipoFlujo: 'regenRA' }))

    // generarPlaneacion valida prompts antes de consumir → pasamos prompts válidos.
    const err = await expectHttpsError(
      generarPlaneacion(reqUsuario(uid, { sessionId: 's1', systemPrompt: 's', userPrompt: 'u' })),
      'permission-denied',
    )
    expect(err.code).toBe('permission-denied')
    expect((await getSession(uid, 's1')).llamadas).toBe(0) // no incrementó (rechazada)
  })
})
