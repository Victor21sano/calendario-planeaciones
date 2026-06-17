// Catálogo de paquetes y lógica de precio promocional.
// FUENTE DE VERDAD del precio: el servidor cobra según ESTA fecha, no según el
// contador del cliente (que es solo visual). 1 planeación = 100 créditos.
//
// Promo de lanzamiento vigente hasta el 1 de agosto de 2026, 00:00 hora de
// México (UTC-6). Al pasar esa fecha el precio vuelve al normal en automático.
const PROMO_FIN = new Date('2026-08-01T06:00:00Z')

// precioMXN = precio normal (de base); precioPromoMXN = precio de lanzamiento.
const PAQUETES = {
  p100: { creditos: 100, precioMXN: 100, precioPromoMXN: 100 },
  p300: { creditos: 300, precioMXN: 270, precioPromoMXN: 200 },
  p500: { creditos: 500, precioMXN: 400, precioPromoMXN: 300 },
}

// Precio MXN vigente para un paquete según la fecha (promo hasta PROMO_FIN).
function precioVigente(paquete, ahora = new Date()) {
  return ahora < PROMO_FIN ? paquete.precioPromoMXN : paquete.precioMXN
}

module.exports = { PROMO_FIN, PAQUETES, precioVigente }
