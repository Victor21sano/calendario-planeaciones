import { AlignmentType } from 'docx'
import { tabla, celda, fila } from '../utiles/helpers.js'
import { COL, COLORES } from '../utiles/constantes.js'

export function tablaCabeceraModulo(modulo = {}, grupo = {}) {
  const modeloGrupoModulo = [
    '2023',
    grupo?.numero || '—',
    modulo?.siglema || '—',
  ].join(' - ')

  return tabla([
    fila([
      celda({ texto: 'Modelo - Grupo - Módulo', anchoTwips: COL.modulo[0], sombreado: COLORES.fondoHeader, negrita: true, alineacion: AlignmentType.CENTER }),
      celda({ texto: 'Competencia del Módulo',  anchoTwips: COL.modulo[1], sombreado: COLORES.fondoHeader, negrita: true, alineacion: AlignmentType.CENTER }),
      celda({ texto: 'Semestre',                anchoTwips: COL.modulo[2], sombreado: COLORES.fondoHeader, negrita: true, alineacion: AlignmentType.CENTER }),
    ]),
    fila([
      celda({ texto: modeloGrupoModulo,                  anchoTwips: COL.modulo[0], alineacion: AlignmentType.CENTER }),
      celda({ texto: modulo?.competenciaModulo || '—',   anchoTwips: COL.modulo[1] }),
      celda({ texto: String(modulo?.semestre || '—'),    anchoTwips: COL.modulo[2], alineacion: AlignmentType.CENTER }),
    ]),
  ])
}
