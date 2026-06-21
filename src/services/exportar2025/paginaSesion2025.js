import { AlignmentType } from 'docx'
import { tabla, fila, celda, espacio, saltoPagina } from '../exportar2023/utiles/helpers.js'
import { tituloOficial } from '../exportar2023/utiles/estilos.js'
import { tablaCabeceraDocente } from '../exportar2023/tablas/tablaCabeceraDocente.js'
import { COL, COLORES } from '../exportar2023/utiles/constantes.js'
import { cajaSimple, cajaDoble, cajaSeccion, formatTiempo, etiquetaCurriculum } from './helpers2025.js'

// ─── Tabla "Modelo-Grupo-Asignatura | Currículum | Semestre" ──
function tablaModeloGrupoAsignatura(cabecera = {}) {
  const asig  = cabecera.asignatura || {}
  const grupo = cabecera.grupo?.numero || ''
  const valMGA = `2025 - ${grupo} - ${asig.nombre || ''}`
  return tabla([
    fila([
      celda({ texto: 'Modelo-Grupo-Asignatura',     anchoTwips: COL.modulo[0], sombreado: COLORES.fondoHeader, negrita: true, alineacion: AlignmentType.CENTER }),
      celda({ texto: 'Curriculum al que pertenece',  anchoTwips: COL.modulo[1], sombreado: COLORES.fondoHeader, negrita: true, alineacion: AlignmentType.CENTER }),
      celda({ texto: 'Semestre',                     anchoTwips: COL.modulo[2], sombreado: COLORES.fondoHeader, negrita: true, alineacion: AlignmentType.CENTER }),
    ]),
    fila([
      celda({ texto: valMGA,                                  anchoTwips: COL.modulo[0], alineacion: AlignmentType.CENTER }),
      celda({ texto: etiquetaCurriculum(asig.tipoCurriculum), anchoTwips: COL.modulo[1], alineacion: AlignmentType.CENTER }),
      celda({ texto: String(asig.semestre ?? ''),             anchoTwips: COL.modulo[2], alineacion: AlignmentType.CENTER }),
    ]),
  ])
}

// ─── Un momento (Inicio/Desarrollo/Cierre) ───────────────────
function bloqueMomento(titulo, momento = {}, esCierre = false) {
  const est = momento.estudioIndependiente || {}
  const elems = [
    cajaSeccion(titulo),
    cajaSimple('Tiempo', formatTiempo(momento.tiempoHoras)),
    espacio(60),
    cajaSimple('Estrategia de Enseñanza (Docente)', momento.estrategiaEnsenanzaDocente),
    espacio(60),
    cajaSimple('Estrategia de Aprendizaje (Alumno)', momento.estrategiaAprendizajeAlumno),
    espacio(60),
    cajaSimple('Estrategia de Evaluación', momento.estrategiaEvaluacion),
    espacio(60),
    cajaSimple('Tipo de Evaluación', momento.tipoEvaluacion),
    espacio(60),
    cajaSimple('Instrumento de Evaluación', momento.instrumentoEvaluacion),
    espacio(60),
    cajaSimple('Evidencia de Aprendizaje', momento.evidenciaAprendizaje),
    espacio(60),
    cajaSimple('Ambiente de Aprendizaje', momento.ambienteAprendizaje),
    espacio(60),
    cajaSimple('Recursos y materiales didácticos', momento.recursosMaterialesDidacticos),
    espacio(120),
    cajaSeccion('Estudio Independiente'),
    cajaSimple(esCierre ? 'Actividades' : 'Estudio independiente', est.descripcion || ''),
    espacio(60),
    cajaSimple('Duración', formatTiempo(est.duracionHoras)),
    espacio(120),
  ]
  return elems
}

/**
 * Devuelve el array de elementos docx de UNA sesión del Modelo 2025
 * en el formato oficial de impresión (lista vertical de cajas).
 *
 * @param {{ cabecera, pf, sesion, esPrimeraSesionDelPF, esPrimeraPagina, logoBuffer }} args
 */
export function paginaSesion2025({ cabecera, pf, sesion, esPrimeraSesionDelPF, esPrimeraPagina, logoBuffer }) {
  const elems = []
  if (!esPrimeraPagina) elems.push(saltoPagina())

  const asig   = cabecera.asignatura || {}
  const meta   = cabecera.metaEducativa || {}
  const ambito = meta.ambito || asig.ambito || ''
  const ev     = pf.actividadEvaluacion || {}
  const contenidos = (pf.contenidosFormativos || []).map(c => `• ${c}`).join('\n')

  // ── Cabecera ──
  elems.push(tituloOficial(logoBuffer))
  elems.push(espacio(80))
  elems.push(tablaCabeceraDocente(cabecera.docente))
  elems.push(espacio(80))
  elems.push(tablaModeloGrupoAsignatura(cabecera))
  elems.push(espacio(80))
  elems.push(cajaSimple('Meta educativa', `${ambito}\n${meta.texto || ''}`))

  // ── Datos Específico ──
  elems.push(cajaSeccion('Datos Específico'))
  elems.push(cajaSimple('Duración del proposito', String(pf.horas ?? '')))
  elems.push(espacio(60))
  elems.push(cajaSimple('Propósito formativo', pf.texto))
  elems.push(espacio(60))
  elems.push(cajaSimple('Contenido formativo', contenidos))
  elems.push(espacio(60))
  elems.push(cajaSimple('Actividad de Evaluación', ev.descripcion))
  if (esPrimeraSesionDelPF) {
    elems.push(espacio(60))
    elems.push(cajaSimple('Evidencia a recopilar', ev.evidencia))
  }
  elems.push(espacio(60))
  elems.push(cajaDoble('Duración', `${sesion.duracionHoras ?? ''} Horas`, 'Modalidad', sesion.modalidad || ''))
  elems.push(espacio(60))
  elems.push(cajaDoble('Fecha Inicio', sesion.fechaInicio || '', 'Fecha Fin', sesion.fechaFin || ''))
  elems.push(espacio(60))
  elems.push(cajaSimple('Elemento transversal', sesion.elementoTransversal || ''))

  // ── Momentos ──
  elems.push(...bloqueMomento('Inicio',     sesion.momentos?.inicio))
  elems.push(...bloqueMomento('Desarrollo', sesion.momentos?.desarrollo))
  elems.push(...bloqueMomento('Cierre',     sesion.momentos?.cierre, true))

  return elems
}
