// Lee el Registro de calificaciones (localStorage) y calcula promedios.
// Modelo plano: cada "registro" = una materia-grupo identificada por un nombre
// (ej. "DEWE 606"), con sus propios alumnos. Usado por la herramienta SWRE.

const KEY = 'registro-cal-v4'

function promedio(arr) {
  const nums = (arr || []).filter(v => v !== '' && v != null && !isNaN(v)).map(Number)
  return nums.length === 0 ? null : nums.reduce((a, b) => a + b, 0) / nums.length
}
function acumulado(proms, activas) {
  let num = 0, den = 0
  for (const c of activas) { const p = proms[c.key]; if (p != null) { num += p * (c.peso / 100); den += c.peso / 100 } }
  return den === 0 ? null : num / den
}
function promParcial(grades, activas) {
  const proms = {}
  for (const c of activas) proms[c.key] = promedio(grades?.[c.key])
  return acumulado(proms, activas)
}
export function promFinal(p, activas) {
  const ps = (p || []).map(g => promParcial(g, activas)).filter(v => v != null)
  return ps.length === 0 ? null : ps.reduce((a, b) => a + b, 0) / ps.length
}
function activasDe(cats) {
  return Object.entries(cats || {}).filter(([, c]) => c.activo).map(([key, c]) => ({ key, ...c }))
}

export function cargarRegistro() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (s && Array.isArray(s.registros)) return { registros: s.registros }
  } catch { /* ignore */ }
  return { registros: [] }
}

/**
 * Promedios (0–10) de cada alumno de un registro.
 * @param registro entrada del Registro ({ alumnos, datos, cats })
 * @param modo 'final' (promedio del semestre) | 0 | 1 | 2 (parcial específico)
 */
export function promediosDeRegistro(registro, modo = 'final') {
  if (!registro) return []
  const activas = activasDe(registro.cats)
  return registro.alumnos.map((a, i) => {
    const p = registro.datos?.[i]?.p
    const promedio = modo === 'final' ? promFinal(p, activas) : promParcial(p?.[modo], activas)
    return { nombre: a.nombre || '', promedio }
  })
}
