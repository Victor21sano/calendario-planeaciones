// Tests de la lógica de precio promocional (puro, sin red ni Firestore).
//   npm run test:emu  (o vitest run)
// describe/it/expect son globales (vitest.config.js → globals: true).

const { PAQUETES, PROMO_FIN, precioVigente } = require('../precios')

const ANTES   = new Date(PROMO_FIN.getTime() - 1000) // 1 s antes del corte
const DESPUES = new Date(PROMO_FIN.getTime() + 1000) // 1 s después del corte

describe('precioVigente — promo vs normal por fecha', () => {
  it('antes del corte cobra el precio promo', () => {
    expect(precioVigente(PAQUETES.p300, ANTES)).toBe(200)
    expect(precioVigente(PAQUETES.p500, ANTES)).toBe(300)
  })

  it('en o después del corte cobra el precio normal', () => {
    expect(precioVigente(PAQUETES.p300, DESPUES)).toBe(270)
    expect(precioVigente(PAQUETES.p500, DESPUES)).toBe(400)
    expect(precioVigente(PAQUETES.p300, PROMO_FIN)).toBe(270) // límite exacto = normal
  })

  it('p100 cuesta lo mismo en promo y normal', () => {
    expect(precioVigente(PAQUETES.p100, ANTES)).toBe(100)
    expect(precioVigente(PAQUETES.p100, DESPUES)).toBe(100)
  })
})
