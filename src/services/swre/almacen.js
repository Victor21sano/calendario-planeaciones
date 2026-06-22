// Persiste la estructura SWRE escaneada por REGISTRO (materia-grupo) en localStorage,
// para reutilizarla sin volver a usar IA. Para cada parcial guarda la CONVERSIÓN
// pagada: la selección de PF/AE elegida, ya BLOQUEADA (cada parcial cuesta 25 cr y
// fija esos PF; convertir otros PF requiere otro parcial). Consistente con el
// Registro de calificaciones (también localStorage).

const KEY = 'swre-registros-v1'

function leerTodo() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {} } catch { return {} }
}
function escribir(all) {
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* ignore */ }
}

/**
 * Entrada guardada o null:
 * { aes:[{porcentaje,pesos:number[]}], actualizado:ISO,
 *   parciales:{ [p]: { seleccion:boolean[], fecha:ISO } } }
 */
export function cargarEstructuraGuardada(registroId) {
  if (!registroId) return null
  return leerTodo()[registroId] || null
}

/** Guarda/actualiza la estructura escaneada, conservando las conversiones ya pagadas. */
export function guardarEstructura(registroId, aes) {
  if (!registroId) return null
  const all = leerTodo()
  const prev = all[registroId] || {}
  const limpias = (aes || []).map(ae => ({
    porcentaje: Number(ae.porcentaje) || 0,
    pesos: (Array.isArray(ae.pesos) ? ae.pesos : []).map(Number).filter(n => !isNaN(n) && n > 0),
  }))
  all[registroId] = { ...prev, aes: limpias, actualizado: new Date().toISOString(), parciales: prev.parciales || {} }
  escribir(all)
  return all[registroId]
}

/**
 * Registra la conversión PAGADA de un parcial: fija la selección de PF (boolean[]
 * paralelo a aes). Una vez guardada, esos PF quedan bloqueados para ese parcial.
 */
export function guardarConversion(registroId, parcial, seleccion) {
  if (!registroId) return null
  const all = leerTodo()
  const prev = all[registroId] || { aes: [], parciales: {} }
  prev.parciales = { ...(prev.parciales || {}), [parcial]: { seleccion: seleccion.map(Boolean), fecha: new Date().toISOString() } }
  all[registroId] = prev
  escribir(all)
  return prev
}
