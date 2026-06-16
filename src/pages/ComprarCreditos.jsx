import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import BrandLogo from '../components/brand/BrandLogo'
import { crearSesionCheckout } from '../services/stripeService'

// Fin de la promo de lanzamiento: 1 de agosto 2026, 00:00 hora de México (UTC-6).
// DEBE coincidir con PROMO_FIN en functions/precios.js, que es quien cobra de verdad.
// Este contador es solo visual; el servidor decide el precio según su propia fecha.
const PROMO_FIN = new Date('2026-08-01T06:00:00Z')

// precio = normal (de base); precioPromo = precio de lanzamiento.
const PAQUETES = [
  { id: 'p100', creditos: 100, etiqueta: '1 planeación',  precio: 100, precioPromo: 100 },
  { id: 'p300', creditos: 300, etiqueta: '3 planeaciones', precio: 270, precioPromo: 200 },
  { id: 'p500', creditos: 500, etiqueta: '5 planeaciones', precio: 400, precioPromo: 300 },
]

function descomponerTiempo(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return {
    dias:  Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    min:   Math.floor((s % 3600) / 60),
    seg:   s % 60,
  }
}

export default function ComprarCreditos() {
  const { creditos } = useAuth()
  const [cargandoId, setCargandoId] = useState(null)
  const [error, setError] = useState(null)

  // Tic cada segundo para la cuenta regresiva de la promo.
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const msRestante = PROMO_FIN.getTime() - ahora
  const enPromo = msRestante > 0
  const t = descomponerTiempo(msRestante)

  async function pagar(paqueteId) {
    setError(null)
    setCargandoId(paqueteId)
    try {
      const { url } = await crearSesionCheckout(paqueteId)
      window.location.assign(url)
    } catch (e) {
      console.error('[ComprarCreditos] error al iniciar pago:', e)
      setError('No se pudo iniciar el pago. Intenta de nuevo.')
      setCargandoId(null)
    }
  }

  return (
    <div className="min-h-screen surface-atmosphere surface-grain flex flex-col px-4">
      <header className="w-full max-w-md mx-auto pt-6 pb-2">
        <Link
          to="/"
          className="inline-flex rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          aria-label="Planea-Pro — volver al inicio"
        >
          <BrandLogo markClassName="w-10 h-10" />
        </Link>
      </header>
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center py-6">
        <div className="card p-8 text-center space-y-6">

          {/* Icono */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-academic-600 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          {/* Saldo actual */}
          {creditos !== null && (
            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 inline-block">
              <p className="text-xs text-slate-400 dark:text-slate-500">Tu saldo actual</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {creditos} {creditos === 1 ? 'crédito' : 'créditos'}
              </p>
            </div>
          )}

          {/* Mensaje */}
          <div>
            <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Adquiere créditos
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Los créditos se adquieren directamente con el administrador de tu plantel.
              El pago se realiza en persona y los créditos se acreditan al instante.
            </p>
          </div>

          {/* Precio */}
          <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/40 text-left space-y-2">
            <p className="text-xs font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wide">
              Precio
            </p>
            <p className="text-2xl font-extrabold text-primary-700 dark:text-primary-300">
              1 crédito = $1 MXN
            </p>
            <ul className="text-xs text-primary-600 dark:text-primary-400 space-y-1">
              <li>• Planeación completa: <strong>100 créditos</strong></li>
              <li>• Solo horario automático: <strong>25 créditos</strong> (anticipo de la completa)</li>
              <li>• Completa después del horario: <strong>75 créditos</strong></li>
            </ul>
          </div>

          {/* Banner de promo de lanzamiento con cuenta regresiva */}
          {enPromo && (
            <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800/40 text-center space-y-2">
              <p className="text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wide">
                🎉 Precios de lanzamiento
              </p>
              <div className="flex items-center justify-center gap-2" aria-label="Tiempo restante de la promoción">
                {[
                  { v: t.dias,  l: 'días' },
                  { v: t.horas, l: 'hrs' },
                  { v: t.min,   l: 'min' },
                  { v: t.seg,   l: 'seg' },
                ].map((u, i) => (
                  <div key={i} className="px-2 py-1 rounded-lg bg-white/70 dark:bg-slate-800/70 min-w-[3rem]">
                    <p className="text-lg font-extrabold tabular-nums text-accent-700 dark:text-accent-300 leading-none">
                      {String(u.v).padStart(2, '0')}
                    </p>
                    <p className="text-[10px] text-accent-500 dark:text-accent-400">{u.l}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-accent-600 dark:text-accent-400">
                Termina el 1 de agosto. Después vuelven los precios normales.
              </p>
            </div>
          )}

          {/* Pago con tarjeta (Stripe) */}
          <div className="space-y-3 text-left">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Pago con tarjeta
            </p>
            {PAQUETES.map((p) => {
              const conDescuento = enPromo && p.precioPromo < p.precio
              const precioMostrar = enPromo ? p.precioPromo : p.precio
              return (
              <button
                key={p.id}
                type="button"
                disabled={cargandoId !== null}
                onClick={() => pagar(p.id)}
                className="btn-accent w-full justify-between gap-3 py-3 text-sm disabled:opacity-60"
              >
                <span className="font-semibold">{p.creditos} créditos</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs opacity-80">{p.etiqueta}</span>
                  <span className="font-extrabold">
                    {cargandoId === p.id ? 'Redirigiendo…' : (
                      <>
                        {conDescuento && (
                          <span className="line-through opacity-60 mr-1 font-semibold">${p.precio}</span>
                        )}
                        ${precioMostrar} MXN
                      </>
                    )}
                  </span>
                </span>
              </button>
              )
            })}
            {error && (
              <p className="text-xs font-semibold text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Pago seguro procesado por Stripe. Tus créditos se acreditan automáticamente.
            </p>
          </div>

          {/* Separador respaldo manual */}
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            o paga por transferencia
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Pago por transferencia manual */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Pago por transferencia
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-slate-400 dark:text-slate-500">Nombre</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">Aresdev</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400 dark:text-slate-500">CLABE</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-100 select-all">1271 8000 2469 805980</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400 dark:text-slate-500">Concepto</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 select-all">Pagodecreditos</span>
              </div>
            </div>
          </div>

          {/* WhatsApp: enviar comprobante */}
          <a
            href="https://wa.me/524641100054?text=Hola,%20envío%20mi%20comprobante%20de%20pago%20de%20créditos%20de%20Planea-Pro."
            target="_blank"
            rel="noopener noreferrer"
            className="btn-accent w-full justify-center gap-2 py-3 text-sm"
            style={{ background: '#25D366', borderColor: '#25D366' }}
          >
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Enviar comprobante por WhatsApp
          </a>

          {/* Instrucción */}
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 text-left">
            <p className="font-semibold text-slate-700 dark:text-slate-300">¿Cómo funciona?</p>
            <p>1. Realiza la transferencia con los datos de arriba.</p>
            <p>2. Toma captura de tu comprobante de envío.</p>
            <p>3. Envíala por WhatsApp con el botón verde.</p>
            <p>4. Tus créditos se acreditan en cuanto se confirme el pago.</p>
            <p>5. Recarga esta página — el saldo se actualiza solo.</p>
          </div>

          <Link to="/" className="btn-secondary w-full justify-center">
            Volver al inicio
          </Link>

        </div>
      </div>
    </div>
  )
}
