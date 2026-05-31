import { AlignmentType } from 'docx'
import { tabla, celda, fila } from '../utiles/helpers.js'
import { ANCHO_CONTENIDO, COLORES } from '../utiles/constantes.js'

/**
 * Tabla "Resultado y Actividad de Aprendizaje".
 * Si `mostrarEvidencia === false`, omite la fila de evidencia
 * (para actividades 2, 3… del mismo RA).
 */
export function tablaRA(ra = {}, mostrarEvidencia = true) {
  const ev = ra.actividadEvaluacion || {}
  const filas = [
    fila([
      celda({
        texto:      'Resultado y Actividad de Aprendizaje',
        anchoTwips: ANCHO_CONTENIDO,
        sombreado:  COLORES.fondoHeader,
        negrita:    true,
        alineacion: AlignmentType.CENTER,
      }),
    ]),
    fila([
      celda({
        partes:     [{ texto: 'Resultado de Aprendizaje: ', negrita: true }, { texto: ra.titulo || '—' }],
        anchoTwips: ANCHO_CONTENIDO,
      }),
    ]),
    fila([
      celda({
        partes:     [{ texto: 'Duración del Resultado (en horas): ', negrita: true }, { texto: String(ra.duracionHoras ?? '—') }],
        anchoTwips: ANCHO_CONTENIDO,
      }),
    ]),
    fila([
      celda({
        partes:     [{ texto: 'Actividad de Evaluación: ', negrita: true }, { texto: ev.descripcion || '—' }],
        anchoTwips: ANCHO_CONTENIDO,
      }),
    ]),
  ]

  if (mostrarEvidencia) {
    filas.push(fila([
      celda({
        partes:     [{ texto: 'Evidencia a recopilar: ', negrita: true }, { texto: ev.evidencia || '—' }],
        anchoTwips: ANCHO_CONTENIDO,
      }),
    ]))
  }

  return tabla(filas)
}
