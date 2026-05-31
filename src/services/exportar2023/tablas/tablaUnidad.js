import { tabla, celda, fila } from '../utiles/helpers.js'
import { ANCHO_CONTENIDO, COLORES } from '../utiles/constantes.js'

export function tablaUnidad(unidad = {}) {
  return tabla([
    fila([
      celda({
        partes: [
          { texto: 'No. y Nombre de Unidad de Aprendizaje: ', negrita: true },
          { texto: unidad.nombre || '—' },
        ],
        columnSpan: 1,
        anchoTwips: ANCHO_CONTENIDO,
      }),
    ]),
    fila([
      celda({
        partes: [
          { texto: 'Propósito de la Unidad: ', negrita: true },
          { texto: unidad.proposito || '—' },
        ],
        anchoTwips: ANCHO_CONTENIDO,
      }),
    ]),
  ])
}
