// Motor de conversión a formato SWRE (sábana CONALEP).
// Problema inverso: dado el promedio del alumno (0–10), asignar una LETRA por
// indicador de modo que el "Aprovechamiento" que calcula la sábana iguale (o
// supere por lo mínimo) ese promedio (escalado al % de las AE incluidas).
//
// Aritmética EXACTA (sin redondeo por celda) en escala interna ×10000 del
// aprovechamiento (0–100). El DP se reduce por el GCD para mantenerse rápido.
// Valores oficiales: N/P=0, I=50, S=60, B=80, E=100.

export const NIVELES_DEFAULT = { 'N/P': 0, I: 50, S: 60, B: 80, E: 100 }
export const ORDEN_NIVELES = ['N/P', 'I', 'S', 'B', 'E']

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t } return a }
const lcm = (a, b) => (a && b ? (a / gcd(a, b)) * b : (a || b || 1))

export function sumaPorcentajeAE(estructura) {
  return (estructura.grupos || []).reduce((s, g) => s + (Number(g.aePorcentaje) || 0), 0)
}

// Nº de indicadores (columnas) de la estructura.
export function contarIndicadores(estructura) {
  return (estructura.grupos || []).reduce((s, g) => s + (g.pesosIndicadores?.length || 0), 0)
}

// Unidades NORMALIZADAS por AE: los pesos de cada AE se tratan como proporciones
// que suman 100% del AE (en SWRE siempre suman 100; si la IA lee mal y suman ≠100,
// se normaliza para que el % del AE mande). U_i = ae% × w_i × L / W_AE (entero,
// W_AE | L). La contribución al aprovechamiento (escala ×(L·100)) es value × U_i.
// aprovechamiento = Σ(value·U_i) / (L·100). Devuelve { units, L }.
export function unidadesDeEstructura(estructura) {
  const grupos = estructura.grupos || []
  const sumas = grupos.map(g => (g.pesosIndicadores || []).reduce((s, w) => s + (Number(w) || 0), 0) || 1)
  let L = 1
  for (const W of sumas) L = lcm(L, W)
  const units = []
  grupos.forEach((g, gi) => {
    const ae = Number(g.aePorcentaje) || 0
    const W = sumas[gi]
    for (const w of g.pesosIndicadores || []) units.push(ae * (Number(w) || 0) * (L / W))
  })
  return { units, L }
}

/**
 * Asigna letras por indicador para alcanzar `objetivo` (escala ×10000 del
 * aprovechamiento). Devuelve { niveles, score } con score en la misma escala.
 */
export function optimizarNiveles(objetivo, units, niveles = NIVELES_DEFAULT, pisos = null) {
  const letras = ORDEN_NIVELES.filter(l => l in niveles)
  if (units.length === 0) return { niveles: [], score: 0 }

  // GCD de todas las contribuciones posibles y el objetivo → reduce el espacio de estados.
  let G = objetivo || 0
  for (const u of units) for (const l of letras) G = gcd(G, niveles[l] * u)
  if (!G) G = 1
  const obj = Math.round(objetivo / G)
  const contrib = (l, u) => (niveles[l] * u) / G   // entero exacto (divisible por G)

  let states = new Map([[0, { levels: [], cost: 0 }]])
  for (let i = 0; i < units.length; i++) {
    const u = units[i]
    const piso = pisos?.[i]
    const pisoRank = piso ? ORDEN_NIVELES.indexOf(piso) : -1
    const opciones = pisoRank >= 0 ? letras.filter(l => ORDEN_NIVELES.indexOf(l) >= pisoRank) : letras
    const next = new Map()
    for (const [score, st] of states) {
      for (const l of opciones) {
        const ns = score + contrib(l, u)
        const nc = st.cost + ORDEN_NIVELES.indexOf(l)
        const prev = next.get(ns)
        if (!prev || nc < prev.cost) next.set(ns, { levels: [...st.levels, l], cost: nc })
      }
    }
    states = next
  }

  let best = null
  for (const [score, st] of states) {
    if (score >= obj) { if (!best || score < best.score || (score === best.score && st.cost < best.cost)) best = { score, ...st } }
  }
  if (!best) for (const [score, st] of states) { if (!best || score > best.score || (score === best.score && st.cost < best.cost)) best = { score, ...st } }
  return { niveles: best.levels, score: best.score * G }
}

/**
 * Convierte un promedio (0–10) a letras. El objetivo se escala al % de las AE
 * incluidas (acumulativo): si las AE suman 20% y el promedio es 10, apunta a un
 * aprovechamiento de 20.0 (no 100). Los pesos de cada AE se normalizan a 100.
 */
export function promedioASWRE(promedio, estructura, pisos = null) {
  const sumaAE = sumaPorcentajeAE(estructura)
  const { units, L } = unidadesDeEstructura(estructura)
  const factor = L * 100   // escala interna del aprovechamiento (0–100)
  const objetivo = Math.round((Number(promedio) || 0) * sumaAE * L * 10)
  const { niveles, score } = optimizarNiveles(objetivo, units, estructura.niveles || NIVELES_DEFAULT, pisos)
  return { letras: niveles, aprovechamiento: score / factor, objetivo: objetivo / factor }
}

/** Convierte una lista de alumnos {nombre, promedio} a filas de letras (todas las AE). */
export function convertirGrupo(alumnos, estructura) {
  const nIndicadores = contarIndicadores(estructura)
  const filas = (alumnos || []).map(a => {
    const { letras, aprovechamiento, objetivo } = promedioASWRE(a.promedio, estructura)
    return { nombre: a.nombre, promedio: Number(a.promedio) || 0, objetivo, aprovechamiento, letras }
  })
  return { filas, nIndicadores }
}

/**
 * Convierte llenando SOLO las AE seleccionadas (segmento del parcial). Las AE no
 * seleccionadas quedan VACÍAS (''), conservando todas las columnas para alinear
 * el pegado en SWRE. El objetivo se escala al % de las AE elegidas.
 * @param seleccion boolean[] paralelo a estructura.grupos (true = se llena)
 */
export function convertirGrupoSegmento(alumnos, estructura, seleccion) {
  const grupos = estructura.grupos || []
  const sub = { niveles: estructura.niveles || NIVELES_DEFAULT, grupos: grupos.filter((_, i) => seleccion[i]) }
  const nIndicadores = grupos.reduce((s, g) => s + (g.pesosIndicadores?.length || 0), 0)

  const filas = (alumnos || []).map(a => {
    const r = sub.grupos.length ? promedioASWRE(a.promedio ?? 0, sub) : { letras: [], aprovechamiento: 0 }
    const full = []
    let idx = 0
    grupos.forEach((g, i) => {
      const n = g.pesosIndicadores?.length || 0
      for (let k = 0; k < n; k++) full.push(seleccion[i] ? (r.letras[idx++] ?? '') : '')
    })
    return { nombre: a.nombre, promedio: Number(a.promedio) || 0, aprovechamiento: r.aprovechamiento, letras: full }
  })
  return { filas, nIndicadores }
}
