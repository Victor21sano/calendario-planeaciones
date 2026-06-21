import { Document, Footer, Packer, Paragraph, TextRun, AlignmentType, PageNumber } from 'docx'
import { saveAs } from 'file-saver'
import { cargarLogo } from '../exportar2023/utiles/estilos.js'
import { PAGINA, FUENTES, TAMANOS, COLORES } from '../exportar2023/utiles/constantes.js'
import { paginaSesion2025 } from './paginaSesion2025.js'

/**
 * Genera y descarga un .docx con la planeación completa del Modelo 2025
 * en el formato oficial de impresión (lista vertical de cajas).
 *
 * @param {Object} planeacion2025 - objeto nativo planeacion2025
 * @param {Object} [opciones]
 * @param {string} [opciones.nombreArchivo] - sin extensión
 */
export async function exportarPlaneacion2025(planeacion2025, opciones = {}) {
  if (!planeacion2025?.cabecera || !planeacion2025?.propositosFormativos) {
    throw new Error('La planeación 2025 está vacía o es inválida.')
  }

  const logoBuffer = await cargarLogo()

  // cabecera enriquecida con la meta educativa (que vive a nivel raíz)
  const cabecera = { ...planeacion2025.cabecera, metaEducativa: planeacion2025.metaEducativa }

  // Aplanar todas las sesiones con su PF
  const paginas = []
  for (const pf of (planeacion2025.propositosFormativos || [])) {
    const sesiones = pf.sesiones || []
    sesiones.forEach((sesion, idx) => {
      paginas.push({ pf, sesion, esPrimeraSesionDelPF: idx === 0 })
    })
  }

  if (paginas.length === 0) {
    throw new Error('La planeación no tiene sesiones. Genera o edita las sesiones antes de exportar.')
  }

  const bodyChildren = []
  paginas.forEach((p, i) => {
    bodyChildren.push(...paginaSesion2025({
      cabecera,
      pf:                   p.pf,
      sesion:               p.sesion,
      esPrimeraSesionDelPF: p.esPrimeraSesionDelPF,
      esPrimeraPagina:      i === 0,
      logoBuffer,
    }))
  })

  const fechaHoy = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children:  [
          new TextRun({ text: `Planea-Pro · ${fechaHoy} · Página `, font: FUENTES.cuerpo, size: TAMANOS.minimo, color: COLORES.textoMuted }),
          new TextRun({ children: [PageNumber.CURRENT],     font: FUENTES.cuerpo, size: TAMANOS.minimo, color: COLORES.textoMuted }),
          new TextRun({ text: ' de ',                       font: FUENTES.cuerpo, size: TAMANOS.minimo, color: COLORES.textoMuted }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FUENTES.cuerpo, size: TAMANOS.minimo, color: COLORES.textoMuted }),
        ],
      }),
    ],
  })

  const siglema = planeacion2025.cabecera?.asignatura?.siglema || '2025'
  const doc = new Document({
    creator:     'Planea-Pro',
    title:       `Planeación ${siglema}`,
    description: 'Planeación didáctica CONALEP Modelo 2025 generada con Planea-Pro',
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
    || `Planeacion_${siglema}_${planeacion2025.cabecera?.docente?.numEmpleado || 'doc'}.docx`
  saveAs(blob, nombre)
}
