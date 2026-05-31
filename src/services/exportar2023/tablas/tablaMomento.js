import { AlignmentType } from 'docx'
import { tabla, celda, fila } from '../utiles/helpers.js'
import { COL, COLORES, ANCHO_CONTENIDO } from '../utiles/constantes.js'

const CFG = {
  inicio:     { titulo: 'Inicio',     fondo: COLORES.fondoInicio },
  desarrollo: { titulo: 'Desarrollo', fondo: COLORES.fondoDesarrollo },
  cierre:     { titulo: 'Cierre',     fondo: COLORES.fondoCierre },
}

function filaEtiquetaValor(etiqueta, valor) {
  return fila([
    celda({ partes: [{ texto: etiqueta + ':', negrita: true }], anchoTwips: COL.momento[0] }),
    celda({ texto: String(valor ?? '—'), anchoTwips: COL.momento[1] }),
  ])
}

export function tablaMomento(tipo, momento = {}) {
  const cfg      = CFG[tipo] || { titulo: tipo, fondo: COLORES.fondoHeader }
  const estudio  = momento.estudioIndependiente || {}
  const textoEst = estudio.descripcion
    ? `${estudio.descripcion} (${estudio.duracionHoras || 0} hrs)`
    : '—'

  return tabla([
    // Fila título con sombreado de color
    fila([
      celda({ texto: cfg.titulo,                                sombreado: cfg.fondo, negrita: true, alineacion: AlignmentType.CENTER, anchoTwips: COL.momento[0] }),
      celda({ partes: [{ texto: 'Tiempo: ', negrita: true }, { texto: `${momento.tiempoHoras ?? '—'} Horas` }], sombreado: cfg.fondo, anchoTwips: COL.momento[1] }),
    ]),
    filaEtiquetaValor('Ambiente de Aprendizaje',            momento.ambienteAprendizaje),
    filaEtiquetaValor('Estrategia de Enseñanza (Docente)',  momento.estrategiaEnsenanzaDocente),
    filaEtiquetaValor('Estrategia de Aprendizaje (Alumno)', momento.estrategiaAprendizajeAlumno),
    filaEtiquetaValor('Estrategia de Evaluación',           momento.estrategiaEvaluacion),
    filaEtiquetaValor('Recursos y Materiales Didácticos',   momento.recursosMaterialesDidacticos),
    filaEtiquetaValor('Estudio Independiente',              textoEst),
  ])
}
