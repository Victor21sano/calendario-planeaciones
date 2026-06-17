import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../firebase'
import BrandLogo from '../components/brand/BrandLogo'

export default function CompraExitosa() {
  const [saldo, setSaldo] = useState(null)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    // El webhook acredita en segundo plano; escuchamos hasta que el saldo suba.
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      setSaldo(snap.data()?.creditos ?? 0)
    })
    return unsub
  }, [])

  return (
    <div className="min-h-screen surface-atmosphere surface-grain flex flex-col px-4">
      <header className="w-full max-w-md mx-auto pt-6 pb-2">
        <Link to="/" className="inline-flex rounded-xl" aria-label="Planea-Pro — inicio">
          <BrandLogo markClassName="w-10 h-10" />
        </Link>
      </header>
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center py-6">
        <div className="card p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-academic-600 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white mb-2">
              ¡Pago recibido!
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tus créditos se están acreditando. Puede tardar unos segundos.
            </p>
          </div>
          {saldo !== null && (
            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 inline-block">
              <p className="text-xs text-slate-400 dark:text-slate-500">Tu saldo actual</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {saldo} {saldo === 1 ? 'crédito' : 'créditos'}
              </p>
            </div>
          )}
          <Link to="/" className="btn-accent w-full justify-center">Ir al inicio</Link>
        </div>
      </div>
    </div>
  )
}
