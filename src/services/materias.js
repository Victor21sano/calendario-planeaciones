import { db } from '../firebase'
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'

// ─── Constantes de modelo ─────────────────────────────────────
export const MODELO_2018 = '2018'
export const MODELO_2023 = '2023'

/** Devuelve el modelo de la materia; retrocompatible: ausencia de campo → 2018. */
export function getModeloMateria(materia) {
  return materia?.modelo || MODELO_2018
}

export function esModelo2023(materia) {
  return getModeloMateria(materia) === MODELO_2023
}

const getMateriasRef = (uid) => collection(db, `users/${uid}/materias`)

export const fetchMaterias = async (uid) => {
  if (!uid) throw new Error('Usuario no autenticado')
  const colRef = getMateriasRef(uid)
  const q = query(colRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const fetchMateria = async (uid, materiaId) => {
  if (!uid) throw new Error('Usuario no autenticado')
  const docRef = doc(db, `users/${uid}/materias/${materiaId}`)
  const snapshot = await getDoc(docRef)
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export const addMateria = async (uid, materiaData) => {
  if (!uid) throw new Error('Usuario no autenticado')
  const colRef = getMateriasRef(uid)
  const docRef = await addDoc(colRef, {
    ...materiaData,
    modelo: materiaData.modelo || MODELO_2018,  // garantizar campo siempre
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export const updateMateria = async (uid, materiaId, updatedData) => {
  if (!uid) throw new Error('Usuario no autenticado')
  const docRef = doc(db, `users/${uid}/materias/${materiaId}`)
  await updateDoc(docRef, {
    ...updatedData,
    updatedAt: serverTimestamp(),
  })
}

export const deleteMateria = async (uid, materiaId) => {
  if (!uid) throw new Error('Usuario no autenticado')
  const docRef = doc(db, `users/${uid}/materias/${materiaId}`)
  await deleteDoc(docRef)
}

/** Guarda la planeación 2023 completa dentro del documento de la materia. */
export const actualizarMateriaConPlaneacion2023 = async (uid, materiaId, planeacion) => {
  if (!uid) throw new Error('Usuario no autenticado')

  // Advertencia preventiva: Firestore tiene límite de ~1 MB por documento
  const tamanoBytes = JSON.stringify(planeacion).length
  if (tamanoBytes > 900_000) {
    console.warn(
      `[actualizarMateriaConPlaneacion2023] Planeación muy grande: ${tamanoBytes} bytes. ` +
      'Si supera 1 MB fallará el guardado. Considera dividir en subcolección por RA.'
    )
  }

  const docRef = doc(db, `users/${uid}/materias/${materiaId}`)
  await updateDoc(docRef, {
    modelo:         MODELO_2023,
    planeacion2023: planeacion,
    updatedAt:      serverTimestamp(),
  })
}

export const duplicarMateria = async (uid, materiaId) => {
  const materia = await fetchMateria(uid, materiaId)
  if (!materia) throw new Error('Materia no encontrada')
  
  // Remove id and timestamps from the copy
  const { id, createdAt, updatedAt, ...rest } = materia
  
  return addMateria(uid, {
    ...rest,
    nombre: `${rest.nombre} (Copia)`,
  })
}
