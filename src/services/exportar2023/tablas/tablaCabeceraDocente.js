import { TableRow } from 'docx'
import { AlignmentType } from 'docx'
import { tabla, celda, fila } from '../utiles/helpers.js'
import { COL, COLORES } from '../utiles/constantes.js'

export function tablaCabeceraDocente(docente = {}) {
  return tabla([
    fila([
      celda({ texto: 'Nombre',       anchoTwips: COL.docente[0], sombreado: COLORES.fondoHeader, negrita: true, alineacion: AlignmentType.CENTER }),
      celda({ texto: 'Núm. Empleado', anchoTwips: COL.docente[1], sombreado: COLORES.fondoHeader, negrita: true, alineacion: AlignmentType.CENTER }),
      celda({ texto: 'Plantel',      anchoTwips: COL.docente[2], sombreado: COLORES.fondoHeader, negrita: true, alineacion: AlignmentType.CENTER }),
    ]),
    fila([
      celda({ texto: docente.nombre      || '', anchoTwips: COL.docente[0], alineacion: AlignmentType.CENTER }),
      celda({ texto: docente.numEmpleado || '', anchoTwips: COL.docente[1], alineacion: AlignmentType.CENTER }),
      celda({ texto: docente.plantel     || '', anchoTwips: COL.docente[2], alineacion: AlignmentType.CENTER }),
    ]),
  ])
}
