// Constantes, enumeraciones y valores por defecto del Modelo 2023 (CONALEP/MCCEMS).

export const MODELO = '2023'

export const TIPOS_CURRICULUM = {
  FUNDAMENTAL: 'fundamental',
  AMPLIADO:    'ampliado',
  LABORAL:     'laboral',
}

export const TIPOS_EVALUACION = {
  HETEROEVALUACION: 'heteroevaluacion',
  COEVALUACION:     'coevaluacion',
  AUTOEVALUACION:   'autoevaluacion',
  MIXTA:            'mixta',
}

export const MODALIDADES = ['Presencial', 'Mixta', 'A distancia', 'Híbrida']
export const MODALIDAD_DEFAULT = 'Presencial'

export const AMBIENTES_SUGERIDOS = [
  'SALON DE CLASES',
  'LABORATORIO DE COMPUTO',
  'TALLER',
  'BIBLIOTECA',
  'EXTERIOR',
  'VISITA DE CAMPO',
  'AULA VIRTUAL',
]

// ─── Expresiones regulares ─────────────────────────────────────
/** Siglema del módulo, ej. "TIC-1", "ADM-3" */
export const REGEX_SIGLEMA       = /^[A-Z]{2,6}[0-9]{0,2}-[0-9]{1,2}$/
export const REGEX_NUM_EMPLEADO  = /^[0-9]{4,15}$/
export const REGEX_GRUPO         = /^[0-9]{4,6}$/
/** Código de RA, ej. "1.1", "2.3" */
export const REGEX_CODIGO_RA     = /^[0-9]+\.[0-9]+$/
/** Código de actividad de evaluación, ej. "1.1.1", "2.3.2" */
export const REGEX_CODIGO_ACT_EVAL = /^[0-9]+\.[0-9]+\.[0-9]+$/

// ─── Heurísticas de distribución temporal ────────────────────
/** Horas máximas de una actividad pequeña (usa solo 1h para inicio/cierre) */
export const UMBRAL_DURACION_ACTIVIDAD   = 6   // horas
export const HORAS_INICIO_CIERRE_CHICO   = 1   // cuando duracion ≤ UMBRAL
export const HORAS_INICIO_CIERRE_GRANDE  = 2   // cuando duracion > UMBRAL

/**
 * Número sugerido de actividades específicas por RA según sus horas.
 * Regla de negocio: al menos 1 por cada ~10 horas, máximo 4.
 */
// REGLA CONALEP: cada actividad específica (propósito) NO puede exceder 7 horas.
export const HORAS_MAX_POR_ACTIVIDAD = 7

/** Calcula cuántas actividades necesita un RA para cumplir el máximo de 7h. */
export function actividadesSugeridasPorRA(horasRA) {
  if (!horasRA || horasRA <= 0) return 1
  return Math.ceil(horasRA / HORAS_MAX_POR_ACTIVIDAD)
}

/**
 * Distribuye las horas de un RA entre actividades de forma uniforme.
 * Garantiza: suma === horasRA, ninguna actividad > 7h, diferencia max = 1h.
 *
 * Ejemplos:
 *   10h → [5, 5]    |   14h → [7, 7]   |   15h → [5, 5, 5]
 *   17h → [6, 6, 5] |   25h → [7, 6, 6, 6]
 */
export function distribuirHorasEntreActividades(horasRA) {
  const n    = actividadesSugeridasPorRA(horasRA)
  const base = Math.floor(horasRA / n)
  const sobra = horasRA - base * n
  // Las primeras `sobra` actividades reciben 1h extra
  return Array.from({ length: n }, (_, i) => base + (i < sobra ? 1 : 0))
}

/**
 * Distribuye las horas de una actividad entre los 3 momentos didácticos.
 * Retorna { inicio, desarrollo, cierre } en horas enteras.
 */
export function distribuirHorasMomentos(duracionHoras) {
  const hIC = duracionHoras > UMBRAL_DURACION_ACTIVIDAD
    ? HORAS_INICIO_CIERRE_GRANDE
    : HORAS_INICIO_CIERRE_CHICO
  const desarrollo = Math.max(1, duracionHoras - hIC * 2)
  return { inicio: hIC, desarrollo, cierre: hIC }
}

// ─── Estructuras vacías ───────────────────────────────────────
export function momentoVacio() {
  return {
    tiempoHoras:                    0,
    ambienteAprendizaje:            'SALON DE CLASES',
    estrategiaEnsenanzaDocente:     '',
    estrategiaAprendizajeAlumno:    '',
    estrategiaEvaluacion:           '',
    recursosMaterialesDidacticos:   '',
    estudioIndependiente: {
      descripcion:   '',
      duracionHoras: 0,
    },
  }
}

export function actividadEspecificaVacia(numero = 1, duracionHoras = 0) {
  const horas = distribuirHorasMomentos(duracionHoras)
  const inicio    = momentoVacio(); inicio.tiempoHoras    = horas.inicio
  const desarrollo = momentoVacio(); desarrollo.tiempoHoras = horas.desarrollo
  const cierre    = momentoVacio(); cierre.tiempoHoras    = horas.cierre
  return {
    numero,
    noSesion:             numero,   // por defecto, sesión = número de propósito
    propositoAprendizaje: '',
    duracionHoras,
    modalidad:            MODALIDAD_DEFAULT,
    contenidoEspecifico:  '',
    fechaInicio:          '',
    fechaFin:             '',
    momentos: { inicio, desarrollo, cierre },
  }
}
