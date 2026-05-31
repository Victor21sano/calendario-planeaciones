import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Actualiza los datos del perfil docente en Firestore.
 * Solo escribe los campos de perfil; no toca creditos, rol, etc.
 */
export async function actualizarPerfilDocente(uid, datos) {
  const userRef = doc(db, 'users', uid)
  await setDoc(userRef, {
    nombre:      datos.nombre?.trim()      || '',
    numEmpleado: datos.numEmpleado?.trim() || '',
    plantel:     datos.plantel?.trim()     || '',
    updatedAt:   serverTimestamp(),
  }, { merge: true })
}

/**
 * Verifica que el perfil tenga los datos necesarios para crear materias Modelo 2023.
 * @param {object} perfil — el objeto perfilDocente del AuthContext
 */
export function tieneDatosCompletos2023(perfil) {
  return Boolean(
    perfil?.nombre?.trim() &&
    perfil?.numEmpleado?.trim() &&
    /^[0-9]{4,15}$/.test(perfil.numEmpleado?.trim() || '') &&
    perfil?.plantel?.trim()
  )
}
