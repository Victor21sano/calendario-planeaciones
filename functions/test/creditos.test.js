// Tests de integración del sistema de créditos contra el emulador de Firestore.
//
// Ejecutar con el emulador levantado:
//   npm run test:emu        (functions/)
// que equivale a:
//   firebase emulators:exec --only firestore --project demo-planea 'vitest run'
//
// Probamos las dos funciones donde se mueve el dinero y que NO llaman a la IA:
//   - iniciarGeneracion  → cálculo de costo, anticipo horario→completa, saldo, admin
//   - finalizarGeneracion → reembolso server-owned (anti-abuso), ledger, idempotencia
// El estado de la sesión (exitos/llamadas) se siembra directo en Firestore para
// simular "la IA respondió" sin tener que invocar a ningún proveedor.

// describe/it/expect/afterAll son globales (vitest.config.js → globals: true).

// firebase-functions-test en modo offline: solo necesitamos wrap() de callables v2.
const fft = require('firebase-functions-test')()
const fns = require('../index')
const {
  uniqueUid,
  seedUser,
  getCreditos,
  seedLedger,
  getLedger,
  seedSession,
  getSession,
  reqUsuario,
  reqAdmin,
  expectHttpsError,
} = require('./helpers')

const iniciar  = fft.wrap(fns.iniciarGeneracion)
const finalizar = fft.wrap(fns.finalizarGeneracion)

afterAll(() => fft.cleanup())

// ───────────────────────────────────────────────────────────────
describe('iniciarGeneracion — costo y anticipo', () => {
  it('cobra 25 por el flujo "horario" y abre la sesión con su tope', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 100)

    const { sessionId } = await iniciar(reqUsuario(uid, { tipoFlujo: 'horario', materiaId: 'm1' }))

    expect(await getCreditos(uid)).toBe(75)
    const ses = await getSession(uid, sessionId)
    expect(ses.estado).toBe('activa')
    expect(ses.tipoFlujo).toBe('horario')
    expect(ses.costo).toBe(25)
    expect(ses.creditoDescontado).toBe(true)
    expect(ses.maxLlamadas).toBe(8)
    expect(ses.llamadas).toBe(0)
    expect(ses.exitos).toBe(0)
  })

  it('cobra 100 por el flujo "completa" sin anticipo', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 150)

    const { sessionId } = await iniciar(reqUsuario(uid, { tipoFlujo: 'completa', materiaId: 'm1' }))

    expect(await getCreditos(uid)).toBe(50)
    const ses = await getSession(uid, sessionId)
    expect(ses.costo).toBe(100)
    expect(ses.maxLlamadas).toBe(60)
  })

  it('aplica el anticipo: "completa" tras un horario pagado solo cobra 75', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 100)
    await seedLedger(uid, 'm1', { horarioPagado: true, completaPagada: false })

    const { sessionId } = await iniciar(reqUsuario(uid, { tipoFlujo: 'completa', materiaId: 'm1' }))

    expect(await getCreditos(uid)).toBe(25) // 100 - (100 - 25)
    const ses = await getSession(uid, sessionId)
    expect(ses.costo).toBe(75)
  })

  it('no aplica el anticipo dos veces: si la completa ya se pagó, cobra 100', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 100)
    await seedLedger(uid, 'm1', { horarioPagado: true, completaPagada: true })

    const { sessionId } = await iniciar(reqUsuario(uid, { tipoFlujo: 'completa', materiaId: 'm1' }))

    expect(await getCreditos(uid)).toBe(0)
    expect((await getSession(uid, sessionId)).costo).toBe(100)
  })

  it('sin materiaId no hay anticipo aunque exista ledger de otra materia', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 100)
    await seedLedger(uid, 'm1', { horarioPagado: true, completaPagada: false })

    // El cliente no manda materiaId → cobra completa íntegra.
    const { sessionId } = await iniciar(reqUsuario(uid, { tipoFlujo: 'completa' }))

    expect(await getCreditos(uid)).toBe(0)
    expect((await getSession(uid, sessionId)).costo).toBe(100)
  })

  it('un tipoFlujo desconocido cae al default "completa" (cobra 100)', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 100)

    const { sessionId } = await iniciar(reqUsuario(uid, { tipoFlujo: 'pirata' }))

    expect(await getCreditos(uid)).toBe(0)
    const ses = await getSession(uid, sessionId)
    expect(ses.tipoFlujo).toBe('completa')
    expect(ses.costo).toBe(100)
  })
})

// ───────────────────────────────────────────────────────────────
describe('iniciarGeneracion — saldo, admin y auth', () => {
  it('rechaza por saldo insuficiente sin tocar el saldo', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 10) // < 25

    const err = await expectHttpsError(
      iniciar(reqUsuario(uid, { tipoFlujo: 'horario', materiaId: 'm1' })),
      'failed-precondition',
    )
    expect(err.code).toBe('failed-precondition')
    expect(await getCreditos(uid)).toBe(10) // intacto
  })

  it('el admin tiene saldo infinito: delta 0 y la sesión no descuenta', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 5) // saldo bajo a propósito

    const { sessionId } = await iniciar(reqAdmin(uid, { tipoFlujo: 'completa', materiaId: 'm1' }))

    expect(await getCreditos(uid)).toBe(5) // no baja
    const ses = await getSession(uid, sessionId)
    expect(ses.admin).toBe(true)
    expect(ses.creditoDescontado).toBe(false)
    expect(ses.costo).toBe(0)
  })

  it('rechaza si no hay autenticación', async () => {
    const err = await expectHttpsError(
      iniciar({ data: { tipoFlujo: 'horario' } }),
      'unauthenticated',
    )
    expect(err.code).toBe('unauthenticated')
  })
})

// ───────────────────────────────────────────────────────────────
describe('finalizarGeneracion — reembolso server-owned', () => {
  it('reembolsa el costo si la sesión no tuvo ninguna generación exitosa', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 75) // ya se le descontaron 25
    await seedSession(uid, 's1', {
      estado: 'activa', exitos: 0, creditoDescontado: true, costo: 25,
      tipoFlujo: 'horario', materiaId: 'm1', admin: false,
    })

    const res = await finalizar(reqUsuario(uid, { sessionId: 's1', exito: false }))

    expect(res.reembolsado).toBe(true)
    expect(await getCreditos(uid)).toBe(100) // 75 + 25
    expect((await getSession(uid, 's1')).estado).toBe('reembolsada')
    // No debe marcar la materia como pagada si se reembolsó.
    expect(await getLedger(uid, 'm1')).toBeNull()
  })

  it('NO reembolsa si hubo al menos una generación exitosa y marca el ledger', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 0) // ya se descontaron los 25 del horario
    await seedSession(uid, 's1', {
      estado: 'activa', exitos: 1, creditoDescontado: true, costo: 25,
      tipoFlujo: 'horario', materiaId: 'm1', admin: false,
    })

    const res = await finalizar(reqUsuario(uid, { sessionId: 's1', exito: true }))

    expect(res.reembolsado).toBe(false)
    expect(await getCreditos(uid)).toBe(0) // crédito consumido
    expect((await getSession(uid, 's1')).estado).toBe('completada')
    expect(await getLedger(uid, 'm1')).toMatchObject({ horarioPagado: true })
  })

  it('SEGURIDAD: el cliente NO controla el reembolso (exito:false + exitos≥1 → no reembolsa)', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 0)
    await seedSession(uid, 's1', {
      estado: 'activa', exitos: 3, creditoDescontado: true, costo: 100,
      tipoFlujo: 'completa', materiaId: 'm1', admin: false,
    })

    // El cliente miente: ya generó su planeación pero pide reembolso.
    const res = await finalizar(reqUsuario(uid, { sessionId: 's1', exito: false }))

    expect(res.reembolsado).toBe(false)
    expect(await getCreditos(uid)).toBe(0) // el crédito se queda consumido
    expect((await getSession(uid, 's1')).estado).toBe('cerrada')
    expect(await getLedger(uid, 'm1')).toMatchObject({ completaPagada: true })
  })

  it('es idempotente: finalizar dos veces no reembolsa de nuevo', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 75)
    await seedSession(uid, 's1', {
      estado: 'activa', exitos: 0, creditoDescontado: true, costo: 25,
      tipoFlujo: 'horario', materiaId: 'm1', admin: false,
    })

    const r1 = await finalizar(reqUsuario(uid, { sessionId: 's1' }))
    const r2 = await finalizar(reqUsuario(uid, { sessionId: 's1' }))

    expect(r1.reembolsado).toBe(true)
    expect(r2.reembolsado).toBe(false) // ya estaba 'reembolsada' → no-op
    expect(await getCreditos(uid)).toBe(100) // solo un reembolso
  })

  it('rechaza si la sesión no existe', async () => {
    const uid = uniqueUid()
    await seedUser(uid, 50)

    const err = await expectHttpsError(
      finalizar(reqUsuario(uid, { sessionId: 'no-existe' })),
      'not-found',
    )
    expect(err.code).toBe('not-found')
  })

  it('rechaza si no hay autenticación', async () => {
    const err = await expectHttpsError(
      finalizar({ data: { sessionId: 's1' } }),
      'unauthenticated',
    )
    expect(err.code).toBe('unauthenticated')
  })
})
