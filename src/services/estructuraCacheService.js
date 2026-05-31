/**
 * Caché de estructuras de módulo en Firestore.
 *
 * Colección: /estructurasCache/{siglema}
 * - Lectura abierta para usuarios autenticados.
 * - Escritura con validación de shape (solo siglema, estructura, updatedAt).
 *
 * En este Paso 3, la escritura a caché está DESACTIVADA (comentada).
 * Activar en Paso 4 tras validar varias generaciones exitosas.
 * TTL: 90 días (si el módulo se actualiza antes, se sobreescribirá manualmente).
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'

const COLECCION = 'estructurasCache'
const TTL_MS    = 1000 * 60 * 60 * 24 * 90   // 90 días

/**
 * Devuelve la estructura cacheada para el siglema dado, o null si no existe / expiró.
 * Los datos del docente y calendario NO se guardan en caché (son por-docente).
 */
export async function obtenerEstructuraCacheada(siglema) {
  try {
    if (!siglema) return null
    const snap = await getDoc(doc(db, COLECCION, siglema))
    if (!snap.exists()) return null
    const data = snap.data()
    if (!data?.estructura) return null
    const guardadoMs = data.updatedAt?.toMillis?.() || 0
    if (Date.now() - guardadoMs > TTL_MS) return null
    return data.estructura
  } catch (err) {
    console.warn('[estructuraCacheService] Error leyendo caché:', err.message)
    return null
  }
}

/**
 * Guarda la estructura en caché (sin datos personales del docente ni calendario).
 * Catch silencioso — no debe romper el flujo principal.
 *
 * TODO (Paso 4): descomentarla después de validar varias generaciones exitosas.
 */
export async function guardarEstructuraEnCache(siglema, estructura) {
  // DESACTIVADO en Paso 3 — activar tras validación
  console.debug('[estructuraCacheService] Guardado en caché desactivado en este paso. siglema:', siglema)

  // try {
  //   if (!siglema || !estructura) return
  //   const limpia = JSON.parse(JSON.stringify(estructura))
  //   if (limpia.cabecera) {
  //     delete limpia.cabecera.docente
  //     delete limpia.cabecera.calendario
  //   }
  //   await setDoc(doc(db, COLECCION, siglema), {
  //     siglema,
  //     estructura: limpia,
  //     updatedAt:  serverTimestamp(),
  //   })
  // } catch (err) {
  //   console.warn('[estructuraCacheService] Error guardando caché:', err.message)
  // }
}
