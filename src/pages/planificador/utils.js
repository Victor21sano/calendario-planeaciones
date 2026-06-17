// Helpers puros y constantes del PlanificadorPage.
// Extraídos de PlanificadorPage.jsx sin cambios de comportamiento.

// Convierte planeacion2023.unidades → formato del Planificador { id, nombre, subunidades }
export function extraerUnidadesDesde2023(planeacion2023) {
  if (!planeacion2023?.unidades) return []
  return planeacion2023.unidades.map((u, ui) => ({
    id: `u2023_${ui + 1}`,
    nombre: u.nombre || `Unidad ${ui + 1}`,
    subunidades: (u.ras || []).map((ra, ri) => {
      // El prompt 2023 guarda el nombre del RA en `titulo` (no en `nombre`)
      const nombreRA = ra.titulo || ra.nombre || ''
      return {
        id: `u2023_${ui + 1}_s_${ri + 1}`,
        nombre: ra.codigo ? `${ra.codigo} ${nombreRA}`.trim() : (nombreRA || `RA ${ri + 1}`),
        horas: ra.duracionHoras || 0,
      }
    }),
  }))
}

export function sumarHorasUnidades(unidades = []) {
  return unidades
    .flatMap(u => u.subunidades || [])
    .reduce((s, su) => s + (Number(su.horas) || 0), 0)
}

export function nombreMateriaDesdeSiglema(planeacion2023) {
  const siglema = planeacion2023?.cabecera?.modulo?.siglema || ''
  const match = String(siglema).match(/([A-Z0-9]{3,})-\d{2}\b/i)
  return match ? match[1].toUpperCase() : ''
}

export function debeAutonombrarMateria(nombreActual) {
  const nombre = String(nombreActual || '').trim().toLowerCase()
  return !nombre || nombre === 'nueva materia'
}

// Clave de sessionStorage para guardar los PDFs (base64) y poder generar al pagar sin re-subir
export const PDFS_KEY = id => `planea_pdfs_${id}`

// Reconstruye un File a partir de base64 (para regenerar sin re-subir PDFs)
export function base64ToFile(b64, name) {
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new File([arr], name, { type: 'application/pdf' })
}

// Expande períodos vacacionales {fechaInicio, fechaFin} a fechas individuales
export function expandirPeriodosVacacionales(periodosVacacionales = []) {
  const fechas = []
  for (const p of periodosVacacionales) {
    if (!p.fechaInicio || !p.fechaFin) continue
    const inicio = new Date(p.fechaInicio + 'T12:00:00')
    const fin    = new Date(p.fechaFin    + 'T12:00:00')
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      fechas.push(d.toISOString().slice(0, 10))
    }
  }
  return fechas
}

export const DARK_KEY = 'planeacion_dark_mode'
