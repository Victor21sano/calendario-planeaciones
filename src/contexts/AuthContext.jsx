import { createContext, useContext, useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

const AuthContext = createContext()

// Lista de emails con saldo infinito (solo para UI; las decisiones de seguridad
// las toma el servidor comparando el token verificado de Firebase Auth).
const ADMIN_EMAILS = ['victor20sano@gmail.com']

function calcularEsAdmin(user) {
  if (!user) return false
  const email = (user.email || '').toLowerCase().trim()
  if (!ADMIN_EMAILS.includes(email)) return false
  // En producción exigir que el email esté verificado en Firebase Auth.
  // En desarrollo omitir el requisito para no bloquear pruebas locales.
  // Fix definitivo: ejecutar scripts/marcarAdminVerificado.js una sola vez.
  if (import.meta.env.PROD && !user.emailVerified) return false
  return true
}

// ─── Firestore helpers (perfil del docente en users/{uid}) ────
async function loadPerfil(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? snap.data() : {}
  } catch { return {} }
}

async function savePerfil(uid, data) {
  try {
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    if (snap.exists()) await updateDoc(ref, data)
    else await setDoc(ref, data)
  } catch (err) { console.error('Error guardando perfil:', err) }
}

export function AuthProvider({ children }) {
  const [user,          setUser]          = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [perfilDocente, setPerfilDocente] = useState({})
  // null = cargando, número = saldo real (0 = modo gratis)
  const [creditos,      setCreditos]      = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        const perfil = await loadPerfil(currentUser.uid)
        // Guardar email en Firestore si aún no está guardado.
        // Necesario para que el admin pueda buscar usuarios por email desde el cliente.
        if (currentUser.email && !perfil.email) {
          await savePerfil(currentUser.uid, { email: currentUser.email.toLowerCase() })
          perfil.email = currentUser.email.toLowerCase()
        }
        setPerfilDocente(perfil)
      } else {
        setPerfilDocente({})
        setCreditos(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Suscripción en tiempo real al saldo de créditos
  // Así el saldo se actualiza solo cuando el webhook de MP acredita un pago pendiente.
  useEffect(() => {
    if (!user) { setCreditos(null); return }
    const ref = doc(db, 'users', user.uid)
    const unsub = onSnapshot(
      ref,
      snap => setCreditos(snap.data()?.creditos ?? 0),
      ()   => setCreditos(0),
    )
    return unsub
  }, [user])

  // Registro básico (sin nombre)
  const signup = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password)

  // Registro con nombre completo: guarda en Auth displayName + Firestore
  const signupWithProfile = async (email, password, displayName) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    const perfil = { email: email.toLowerCase() }
    if (displayName?.trim()) {
      const name = displayName.trim()
      await updateProfile(credential.user, { displayName: name })
      perfil.nombre = name
    }
    await savePerfil(credential.user.uid, perfil)
    setPerfilDocente(prev => ({ ...prev, ...perfil }))
    return credential
  }

  const login         = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const loginWithGoogle = () => signInWithPopup(auth, googleProvider)
  const logout        = () => signOut(auth)
  const resetPassword = (email) => sendPasswordResetEmail(auth, email)

  // Actualiza el perfil del docente (plantel, nombre, etc.) en Firestore
  const updatePerfilDocente = async (data) => {
    if (!user) return
    await savePerfil(user.uid, data)
    setPerfilDocente(prev => ({ ...prev, ...data }))
  }

  const esAdmin = calcularEsAdmin(user)
  // sinCreditosDisponibles: el usuario no puede generar NUEVAS planeaciones con IA.
  // No bloquea planeaciones ya generadas (esas se controlan por materia.pagada).
  // null (cargando) → no restringir todavía para evitar parpadeos.
  const sinCreditosDisponibles = creditos !== null && !esAdmin && creditos <= 0

  const value = {
    user,
    loading,
    esAdmin,
    creditos,
    sinCreditosDisponibles,
    // modoGratis se mantiene exportado para compatibilidad histórica.
    // Ya NO bloquea contenido de planeaciones — cada materia tiene su propio flag `pagada`.
    modoGratis: false,
    perfilDocente,
    signup,
    signupWithProfile,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updatePerfilDocente,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
