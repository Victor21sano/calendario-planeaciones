import { Document, Footer, Packer, Paragraph, TextRun, AlignmentType, PageNumber } from 'docx'
import { saveAs }                    from 'file-saver'
import { cargarLogo }                from './utiles/estilos.js'
import { paginaActividad2023 }       from './paginaActividad2023.js'
import { PAGINA, FUENTES, TAMANOS, COLORES } from './utiles/constantes.js'

/**
 * Genera y descarga un archivo .docx con la planeación completa del Modelo 2023.
 *
 * @param {Object} planeacion - objeto planeacion2023 completo
 * @param {Object} [opciones]
 * @param {string} [opciones.nombreArchivo] - sin extensión
 */
export async function exportarPlaneacion2023(planeacion, opciones = {}) {
  if (!planeacion?.cabecera || !planeacion?.unidades) {
    throw new Error('La planeación está vacía o es inválida.')
  }

  // Cargar logo una sola vez (null si no está disponible)
  const logoBuffer = await cargarLogo()

  // Aplanar todas las actividades con su contexto
  const paginas = []
  for (const unidad of (planeacion.unidades || [])) {
    for (const ra of (unidad.ras || [])) {
      const acts = ra.actividadesEspecificas || []
      if (acts.length === 0) continue
      acts.forEach((actividad, idx) => {
        paginas.push({ unidad, ra, actividad, esPrimeraActividadDelRA: idx === 0 })
      })
    }
  }

  if (paginas.length === 0) {
    throw new Error('La planeación no tiene actividades específicas. Genera o edita las actividades antes de exportar.')
  }

  // Construir el cuerpo del documento
  const bodyChildren = []
  paginas.forEach((p, i) => {
    const elems = paginaActividad2023({
      cabecera:               planeacion.cabecera,
      unidad:                 p.unidad,
      ra:                     p.ra,
      actividad:              p.actividad,
      esPrimeraActividadDelRA: p.esPrimeraActividadDelRA,
      esPrimeraPagina:        i === 0,
      logoBuffer,
    })
    bodyChildren.push(...elems)
  })

  // Footer con número de página y fecha
  const fechaHoy = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children:  [
          new TextRun({ text: `Planea-Pro · ${fechaHoy} · Página `, font: FUENTES.cuerpo, size: TAMANOS.minimo, color: COLORES.textoMuted }),
          new TextRun({ children: [PageNumber.CURRENT], font: FUENTES.cuerpo, size: TAMANOS.minimo, color: COLORES.textoMuted }),
          new TextRun({ text: ' de ',                  font: FUENTES.cuerpo, size: TAMANOS.minimo, color: COLORES.textoMuted }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FUENTES.cuerpo, size: TAMANOS.minimo, color: COLORES.textoMuted }),
        ],
      }),
    ],
  })

  // Documento
  const doc = new Document({
    creator:     'Planea-Pro',
    title:       `Planeación ${planeacion.cabecera.modulo?.siglema || '2023'}`,
    description: 'Planeación didáctica CONALEP Modelo 2023 generada con Planea-Pro',
    sections:    [{
      properties: {
        page: {
          size:   { width: PAGINA.ancho, height: PAGINA.alto },
          margin: { top: PAGINA.margenTop, bottom: PAGINA.margenBottom, left: PAGINA.margenLeft, right: PAGINA.margenRight },
        },
      },
      footers:  { default: footer },
      children: bodyChildren,
    }],
  })

  const blob = await Packer.toBlob(doc)

  const nombre = opciones.nombreArchivo
    || `Planeacion_${planeacion.cabecera.modulo?.siglema || '2023'}_${planeacion.cabecera.docente?.numEmpleado || 'doc'}.docx`

  saveAs(blob, nombre)
}
