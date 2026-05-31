import { AlignmentType } from 'docx'
import { tabla, celda, fila } from '../utiles/helpers.js'
import { ANCHO_CONTENIDO, COL, COLORES } from '../utiles/constantes.js'

export function tablaDatosEspecifico(actividad = {}) {
  return tabla([
    // Encabezado
    fila([
      celda({
        texto:      'Datos Específico',
        anchoTwips: ANCHO_CONTENIDO,
        sombreado:  COLORES.fondoHeader,
        negrita:    true,
        alineacion: AlignmentType.CENTER,
      }),
    ]),

    // Propósito (fila completa)
    fila([
      celda({
        partes:     [{ texto: 'Propósito del Aprendizaje: ', negrita: true }, { texto: actividad.propositoAprendizaje || '—' }],
        anchoTwips: ANCHO_CONTENIDO,
      }),
    ]),

    // Duración | Modalidad
    fila([
      celda({
        partes:     [{ texto: 'Duración: ', negrita: true }, { texto: `${actividad.duracionHoras ?? '—'} Horas` }],
        anchoTwips: COL.datosEq[0],
      }),
      celda({
        partes:     [{ texto: 'Modalidad: ', negrita: true }, { texto: actividad.modalidad || '—' }],
        anchoTwips: COL.datosEq[1],
      }),
    ]),

    // Contenido Específico (multilinea con \n → TextRun break)
    fila([
      celda({
        texto:      'Contenido Específico:\n' + (actividad.contenidoEspecifico || '—'),
        anchoTwips: ANCHO_CONTENIDO,
        multilinea: true,
      }),
    ]),

    // Fecha Inicio | Fecha Fin
    fila([
      celda({
        partes:     [{ texto: 'Fecha Inicio: ', negrita: true }, { texto: actividad.fechaInicio || '—' }],
        anchoTwips: COL.datosEq[0],
      }),
      celda({
        partes:     [{ texto: 'Fecha Fin: ', negrita: true }, { texto: actividad.fechaFin || '—' }],
        anchoTwips: COL.datosEq[1],
      }),
    ]),
  ])
}
