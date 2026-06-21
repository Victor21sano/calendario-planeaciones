// Adaptador entre el modelo de datos 2025 (propositosFormativos/sesiones) y la
// "forma 2023" (unidades/ras/actividadesEspecificas) que consumen los componentes
// preview2023, editor2023 y exportar2023.
//
// El esquema de hoja (momentos: inicio/desarrollo/cierre) es idéntico entre
// ambos modelos, así que solo hay que remapear el contenedor y la cabecera, y
// adjuntar un objeto de terminología para que las etiquetas muestren PF/Ámbito/Sesión.

export const TERMINOLOGIA_2025 = {
  modelo:        '2025',
  unidad:        'Ámbito',
  ra:            'Propósito Formativo',
  raCorto:       'PF',
  actividad:     'Sesión',   // singular, capitalizado
  tituloFormato: 'Formato de Planeación Didáctica — Modelo 2025',
}

// Etiquetas por defecto (Modelo 2023) para que los componentes funcionen igual
// cuando no se les pasa terminología.
export const TERMINOLOGIA_2023 = {
  modelo:        '2023',
  unidad:        'Unidad',
  ra:            'Resultado de Aprendizaje',
  raCorto:       'RA',
  actividad:     'Propósito',   // singular, capitalizado
  tituloFormato: 'Formato de Planeación Didáctica',
}

/**
 * Convierte un objeto planeacion2025 a la forma 2023 que esperan los componentes.
 * No muta la entrada.
 *
 * @param {Object} planeacion2025
 * @returns {Object} { modelo:'2025', terminologia, cabecera, metaEducativa, unidades }
 */
export function adaptar2025aVista(planeacion2025) {
  if (!planeacion2025) return null

  const cab        = planeacion2025.cabecera || {}
  const asignatura = cab.asignatura || {}
  const meta       = planeacion2025.metaEducativa || {}
  const ambito     = meta.ambito || asignatura.ambito || 'Ámbito'

  const ras = (planeacion2025.propositosFormativos || []).map((pf, i) => ({
    numero:                 pf.numero ?? i + 1,
    codigo:                 pf.codigo,
    titulo:                 pf.texto,
    duracionHoras:          pf.horas,
    ponderacion:            pf.ponderacion,
    actividadEvaluacion:    pf.actividadEvaluacion,
    actividadesEspecificas: pf.sesiones || [],
  }))

  const horasAmbito = ras.reduce((s, ra) => s + (Number(ra.duracionHoras) || 0), 0)

  return {
    modelo:        '2025',
    terminologia:  TERMINOLOGIA_2025,
    metaEducativa: meta,
    cabecera: {
      docente:    cab.docente,
      grupo:      cab.grupo,
      calendario: cab.calendario,
      asignatura,
      // "modulo" sintético para reutilizar tablas/validaciones del 2023
      modulo: {
        siglema:           asignatura.siglema,
        nombre:            asignatura.nombre,
        semestre:          asignatura.semestre,
        horasSemana:       asignatura.horasSemana,
        horasTotales:      asignatura.horasTotales,
        tipoCurriculum:    asignatura.tipoCurriculum,
        recursoOArea:      ambito,
        competenciaModulo: meta.texto,
        proposito:         meta.texto,
      },
    },
    unidades: [{
      numero:        1,
      nombre:        ambito,
      proposito:     meta.texto,
      duracionHoras: horasAmbito,
      ras,
    }],
  }
}

/**
 * Reconstruye un objeto planeacion2025 a partir de la vista editada (forma 2023)
 * y el planeacion2025 original (para conservar campos que el editor no toca:
 * contenidosFormativos, estrategiasAprendizaje, rubrica, numero).
 *
 * @param {Object} vista           — forma 2023 editada
 * @param {Object} original2025    — planeacion2025 previa
 * @returns {Object} nuevo planeacion2025
 */
export function vista2023a2025(vista, original2025) {
  if (!vista) return original2025

  const pfsOriginales = original2025?.propositosFormativos || []
  const porCodigo = new Map(pfsOriginales.map(pf => [pf.codigo, pf]))

  const ras = vista.unidades?.[0]?.ras || []
  const propositosFormativos = ras.map((ra, i) => {
    const previo = porCodigo.get(ra.codigo) || pfsOriginales[i] || {}
    return {
      ...previo,
      codigo:              ra.codigo ?? previo.codigo,
      texto:               ra.titulo ?? previo.texto,
      horas:               ra.duracionHoras ?? previo.horas,
      ponderacion:         ra.ponderacion ?? previo.ponderacion,
      actividadEvaluacion: ra.actividadEvaluacion ?? previo.actividadEvaluacion,
      sesiones:            ra.actividadesEspecificas ?? previo.sesiones ?? [],
    }
  })

  const vMod  = vista.cabecera?.modulo || {}
  const asigPrev = original2025?.cabecera?.asignatura || {}
  const metaPrev = original2025?.metaEducativa || {}
  // "competenciaModulo" de la vista 2023 corresponde a la meta educativa en 2025
  const metaEducativa = vMod.competenciaModulo != null
    ? { ...metaPrev, texto: vMod.competenciaModulo }
    : metaPrev

  return {
    ...original2025,
    modelo:        '2025',
    metaEducativa,
    cabecera: {
      ...(original2025?.cabecera || {}),
      docente:    vista.cabecera?.docente    ?? original2025?.cabecera?.docente,
      grupo:      vista.cabecera?.grupo       ?? original2025?.cabecera?.grupo,
      calendario: vista.cabecera?.calendario  ?? original2025?.cabecera?.calendario,
      asignatura: {
        ...asigPrev,
        siglema:      vMod.siglema      ?? asigPrev.siglema,
        nombre:       vMod.nombre       ?? asigPrev.nombre,
        semestre:     vMod.semestre     ?? asigPrev.semestre,
        horasSemana:  vMod.horasSemana  ?? asigPrev.horasSemana,
        horasTotales: vMod.horasTotales ?? asigPrev.horasTotales,
      },
    },
    propositosFormativos,
  }
}
