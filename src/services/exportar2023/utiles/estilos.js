import { Paragraph, TextRun, AlignmentType, ImageRun } from 'docx'
import { COLORES, FUENTES, TAMANOS } from './constantes.js'

/**
 * Título oficial "Formato de Planeación Didáctica." con línea verde inferior.
 * logoBuffer puede ser null — en ese caso solo muestra el texto.
 */
export function tituloOficial(logoBuffer) {
  const corrido = []

  if (logoBuffer) {
    corrido.push(
      new ImageRun({
        data:           logoBuffer,
        type:           'png',
        transformation: { width: 110, height: 35 },
      })
    )
    corrido.push(new TextRun({ text: '   ' }))
  }

  corrido.push(
    new TextRun({
      text:  'Formato de Planeación Didáctica.',
      font:  FUENTES.encabezado,
      size:  TAMANOS.titulo,
      color: COLORES.texto,
    })
  )

  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing:   { before: 0, after: 200 },
    border:    {
      bottom: { style: 'single', size: 12, color: COLORES.acentoCONALEP, space: 4 },
    },
    children: corrido,
  })
}

/**
 * Carga el logo PNG como ArrayBuffer.
 * Retorna null si falla (el documento sigue siendo válido sin logo).
 */
export async function cargarLogo() {
  try {
    // Vite: el import con ?url devuelve la URL del asset en el bundle.
    const mod = await import('../assets/conalep-logo.png?url')
    const url = mod.default
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    // Logo no disponible — el documento se genera sin él
    return null
  }
}
