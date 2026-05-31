import { TIPOS_CURRICULUM } from './constantes.js'

/**
 * Detecta el tipo de currículum a partir del texto extraído del PE.
 * Devuelve 'fundamental' | 'ampliado' | 'laboral' | null (si no se puede inferir).
 */
export function detectarTipoCurriculum(textoPE) {
  if (!textoPE || typeof textoPE !== 'string') return null
  const t = textoPE.toLowerCase()

  const candidatos = [
    { tipo: TIPOS_CURRICULUM.FUNDAMENTAL, pos: t.indexOf('currículum fundamental') },
    { tipo: TIPOS_CURRICULUM.FUNDAMENTAL, pos: t.indexOf('curriculum fundamental') },
    { tipo: TIPOS_CURRICULUM.AMPLIADO,    pos: t.indexOf('currículum ampliado') },
    { tipo: TIPOS_CURRICULUM.AMPLIADO,    pos: t.indexOf('curriculum ampliado') },
    { tipo: TIPOS_CURRICULUM.LABORAL,     pos: t.indexOf('currículum laboral') },
    { tipo: TIPOS_CURRICULUM.LABORAL,     pos: t.indexOf('curriculum laboral') },
  ]
    .filter(c => c.pos !== -1)
    .sort((a, b) => a.pos - b.pos)

  return candidatos.length > 0 ? candidatos[0].tipo : null
}

/**
 * Detecta el recurso sociocognitivo/socioemocional o área de conocimiento
 * del currículum (relevante para fundamental y ampliado).
 * Devuelve el valor como string, o null si no se encuentra.
 */
export function detectarRecursoOArea(textoPE) {
  if (!textoPE || typeof textoPE !== 'string') return null

  const patronesBusqueda = [
    /recurso sociocognitivo\s*:\s*(.+)/i,
    /recurso socioemocional\s*:\s*(.+)/i,
    /área de conocimiento\s*:\s*(.+)/i,
    /area de conocimiento\s*:\s*(.+)/i,
    /ámbito\s*:\s*(.+)/i,
    /ambito\s*:\s*(.+)/i,
    /recurso\s*:\s*(.+)/i,
  ]

  for (const patron of patronesBusqueda) {
    const match = textoPE.match(patron)
    if (match && match[1]) {
      return match[1].trim().replace(/\s+/g, ' ')
    }
  }
  return null
}

/**
 * Compone la cadena `competenciaModulo` según las decisiones del análisis técnico.
 *
 * - Laboral:     texto literal del PE (si se proporciona), o "Currículum laboral"
 * - Fundamental: "Currículum fundamental — <recursoOArea>"
 * - Ampliado:    "Currículum ampliado — <recursoOArea>"
 * - null:        "Sin clasificar"
 */
export function componerCompetenciaModulo(tipoCurriculum, recursoOArea, textoLiteralPE = null) {
  if (tipoCurriculum === TIPOS_CURRICULUM.LABORAL) {
    return textoLiteralPE?.trim() || 'Currículum laboral'
  }
  if (tipoCurriculum === TIPOS_CURRICULUM.FUNDAMENTAL) {
    return `Currículum fundamental — ${recursoOArea?.trim() || 'Sin recurso especificado'}`
  }
  if (tipoCurriculum === TIPOS_CURRICULUM.AMPLIADO) {
    return `Currículum ampliado — ${recursoOArea?.trim() || 'Sin recurso especificado'}`
  }
  return 'Sin clasificar'
}

/**
 * Detecta tipo + recurso en un solo paso y compone el texto de competencia.
 * Atajo conveniente para el Paso 3 (integración IA).
 *
 * @returns {{ tipoCurriculum, recursoOArea, competenciaModulo }}
 */
export function analizarCurriculumDesdePDF(textoPE) {
  const tipoCurriculum = detectarTipoCurriculum(textoPE)
  const recursoOArea   = detectarRecursoOArea(textoPE)
  const competenciaModulo = componerCompetenciaModulo(tipoCurriculum, recursoOArea)
  return { tipoCurriculum, recursoOArea, competenciaModulo }
}
