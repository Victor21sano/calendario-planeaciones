import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { acreditarCreditoManual, listarAcreditaciones } from '../services/adminService'

// ─── Constantes ───────────────────────────────────────────────
const METODOS = [
  { value: 'efectivo',      label: 'Efectivo',       color: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300' },
  { value: 'transferencia', label: 'Transferencia',  color: 'bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-300' },
  { value: 'cortesia',      label: 'Cortesía',       color: 'bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-300' },
  { value: 'otro',          label: 'Otro',            color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
]

const METODO_COLOR = Object.fromEntries(METODOS.map(m => [m.value, m.color]))
const METODO_LABEL = Object.fromEntries(METODOS.map(m => [m.value, m.label]))

const CREDITOS_RAPIDOS = [1, 3, 5]

function fmt(ts) {
  if (!ts) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ts))
}

// ─── Modal de confirmación ────────────────────────────────────
function ConfirmModal({ data, onConfirm, onCancel, loading }) {
  const esNegativo = data.creditos < 0
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm card p-6 space-y-5 animate-scale-in">
        <div className={`flex items-center gap-3 p-4 rounded-xl ${esNegativo ? 'bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/40' : 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/40'}`}>
          <svg className={`w-8 h-8 flex-shrink-0 ${esNegativo ? 'text-danger-500' : 'text-primary-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {esNegativo
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>}
          </svg>
          <div>
            <p className={`text-sm font-bold ${esNegativo ? 'text-danger-800 dark:text-danger-200' : 'text-primary-800 dark:text-primary-200'}`}>
              {esNegativo ? 'REVERSAR — Quitar créditos' : 'Confirmar acreditación'}
            </p>
            <p className={`text-xs mt-0.5 ${esNegativo ? 'text-danger-600 dark:text-danger-400' : 'text-primary-600 dark:text-primary-400'}`}>
              {data.creditos > 0 ? '+' : ''}{data.creditos} crédito{Math.abs(data.creditos) !== 1 ? 's' : ''} a {data.emailDestino}
            </p>
          </div>
        </div>

        <div className="text-xs space-y-1.5 text-slate-500 dark:text-slate-400">
          <div className="flex justify-between">
            <span>Método:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{METODO_LABEL[data.metodo]}</span>
          </div>
          {data.monto > 0 && (
            <div className="flex justify-between">
              <span>Monto:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">${data.monto} MXN</span>
            </div>
          )}
          {data.nota && (
            <div className="flex justify-between gap-4">
              <span className="flex-shrink-0">Nota:</span>
              <span className="font-medium text-slate-600 dark:text-slate-300 text-right break-words">{data.nota.slice(0, 80)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary flex-1 justify-center disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed ${esNegativo ? 'btn-danger' : 'btn-primary'}`}
          >
            {loading
              ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              : esNegativo ? 'Sí, quitar' : 'Confirmar'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Formulario de acreditación ───────────────────────────────
function FormAcreditar({ onSuccess }) {
  const [email,    setEmail]    = useState('')
  const [creditos, setCreditos] = useState(1)
  const [metodo,   setMetodo]   = useState('efectivo')
  const [monto,    setMonto]    = useState('')
  const [nota,     setNota]     = useState('')
  const [pending,  setPending]  = useState(null)  // datos a confirmar
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  const esNegativo   = creditos < 0
  const montoDisabled = metodo === 'cortesia'

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!email.trim()) { setError('El email es obligatorio.'); return }
    if (creditos === 0) { setError('La cantidad no puede ser 0.'); return }
    if (esNegativo && !nota.trim()) { setError('La nota es obligatoria para ajustes negativos.'); return }
    setPending({ emailDestino: email.trim(), creditos, metodo, monto: montoDisabled ? 0 : Number(monto) || 0, nota })
  }

  async function handleConfirm() {
    if (!pending) return
    setLoading(true)
    try {
      const result = await acreditarCreditoManual(pending)
      setSuccess(`Acreditado: ${result.creditosAcreditados > 0 ? '+' : ''}${result.creditosAcreditados} crédito(s) a ${result.destinoEmail}. Nuevo saldo: ${result.saldoNuevo}. ID: ${result.acreditacionId}`)
      setEmail(''); setCreditos(1); setMonto(''); setNota('')
      setPending(null)
      onSuccess?.()
    } catch (err) {
      // err.code: 'functions/permission-denied', 'functions/not-found', 'functions/internal', etc.
      const code = err.code?.replace('functions/', '') || 'error'
      const msg  = err.message || 'Error desconocido'

      const mensajesAmigables = {
        'permission-denied':  'Sin permisos de admin. Verifica que tu email esté verificado en Firebase Auth.',
        'not-found':          msg, // el msg dice qué email no existe
        'invalid-argument':   msg,
        'failed-precondition': msg,
        'unauthenticated':    'No estás autenticado. Vuelve a iniciar sesión.',
        'internal':           `Error interno del servidor (${msg}). Revisa los logs de Firebase Console → Functions → acreditarCreditoManual.`,
      }

      setError(mensajesAmigables[code] || `${code}: ${msg}`)
      setPending(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {pending && (
        <ConfirmModal
          data={pending}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
          loading={loading}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
            Email del docente *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="docente@plantel.edu.mx"
            className="input-base"
          />
        </div>

        {/* Cantidad */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
            Cantidad de créditos *
            <span className="ml-1 font-normal text-slate-400">(negativo = reversa)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              required
              value={creditos}
              onChange={e => setCreditos(Number(e.target.value))}
              min={-500}
              max={500}
              className={`input-base w-28 text-center font-bold text-lg ${esNegativo ? 'border-danger-300 dark:border-danger-700 text-danger-700 dark:text-danger-400' : ''}`}
            />
            <div className="flex gap-1.5">
              {CREDITOS_RAPIDOS.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCreditos(n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors
                    ${creditos === n
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                >
                  +{n}
                </button>
              ))}
            </div>
          </div>
          {esNegativo && (
            <p className="mt-1.5 text-xs font-semibold text-danger-600 dark:text-danger-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              Reversa: se quitarán {Math.abs(creditos)} crédito(s). Nota obligatoria.
            </p>
          )}
        </div>

        {/* Método + Monto */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">Método *</label>
            <select
              value={metodo}
              onChange={e => setMetodo(e.target.value)}
              className="input-base"
            >
              {METODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
              Monto recibido (MXN)
            </label>
            <input
              type="number"
              value={montoDisabled ? '' : monto}
              onChange={e => setMonto(e.target.value)}
              disabled={montoDisabled}
              min={0}
              placeholder={montoDisabled ? 'Cortesía — $0' : '100'}
              className="input-base disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Nota */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
            Nota {esNegativo && <span className="text-danger-500">*</span>}
            <span className="ml-1 font-normal text-slate-400">(comprobante, motivo, etc.)</span>
          </label>
          <textarea
            value={nota}
            onChange={e => setNota(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Ej. Pagó en plantel el viernes 29/05, comprobante #123"
            className="input-base resize-none"
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5 text-right">{nota.length}/500</p>
        </div>

        {/* Errores / Éxito */}
        {error && (
          <div className="p-3 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/40 text-xs font-medium text-danger-700 dark:text-danger-300 animate-slide-down">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800/40 text-xs font-medium text-success-700 dark:text-success-300 animate-slide-down">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed ${esNegativo ? 'btn-danger text-sm py-2.5' : 'btn-primary text-sm py-2.5'}`}
        >
          {esNegativo ? 'Reversar créditos' : 'Acreditar créditos'}
        </button>
      </form>
    </>
  )
}

// ─── Tabla de historial ───────────────────────────────────────
function Historial({ refreshSignal }) {
  const [items,      setItems]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [filterEmail,  setFilterEmail]  = useState('')
  const [filterMetodo, setFilterMetodo] = useState('')

  const cargar = useCallback(async (limit = 100) => {
    setLoading(true)
    setError('')
    try {
      const data = await listarAcreditaciones(limit)
      setItems(data)
    } catch (err) {
      setError(err.message || 'Error al cargar historial.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar, refreshSignal])

  const filtrados = items.filter(item => {
    const matchEmail  = !filterEmail  || item.destinoEmail?.includes(filterEmail.toLowerCase())
    const matchMetodo = !filterMetodo || item.metodo === filterMetodo
    return matchEmail && matchMetodo
  })

  // Suma de ingresos del mes actual
  const ahora    = new Date()
  const delMes   = filtrados.filter(it => {
    if (!it.fecha) return false
    const d = new Date(it.fecha)
    return d.getFullYear() === ahora.getFullYear() && d.getMonth() === ahora.getMonth() && it.creditos > 0
  })
  const ingresosMes = delMes.reduce((s, it) => s + (it.monto || 0), 0)
  const credMes     = delMes.reduce((s, it) => s + it.creditos, 0)

  return (
    <div className="space-y-4">
      {/* Métricas del mes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Acreditaciones este mes', value: delMes.length },
          { label: 'Créditos vendidos (mes)', value: credMes },
          { label: 'Ingresos estimados (mes)', value: `$${ingresosMes.toLocaleString('es-MX')} MXN` },
        ].map(m => (
          <div key={m.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{m.value}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={filterEmail}
          onChange={e => setFilterEmail(e.target.value)}
          placeholder="Filtrar por email..."
          className="input-base flex-1 text-xs"
        />
        <select
          value={filterMetodo}
          onChange={e => setFilterMetodo(e.target.value)}
          className="input-base sm:w-40 text-xs"
        >
          <option value="">Todos los métodos</option>
          {METODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <button
          onClick={() => cargar(200)}
          className="btn-secondary text-xs py-2 gap-1.5 flex-shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Actualizar
        </button>
      </div>

      {/* Estado */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-7 h-7 border-4 border-slate-200 dark:border-slate-700 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 text-xs text-danger-700 dark:text-danger-300">{error}</div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          {filtrados.length === 0 ? (
            <p className="text-center py-10 text-sm text-slate-400 dark:text-slate-500">
              {items.length === 0 ? 'Sin acreditaciones aún.' : 'Sin resultados para ese filtro.'}
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  {['Fecha', 'Docente', 'Créditos', 'Método', 'Monto', 'Saldo', 'Nota'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtrados.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    style={{ animationDelay: `${Math.min(idx * 20, 200)}ms` }}
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-500 dark:text-slate-400">{fmt(item.fecha)}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-300 max-w-[160px] truncate" title={item.destinoEmail}>{item.destinoEmail}</td>
                    <td className={`px-3 py-2.5 font-bold text-center ${item.creditos > 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                      {item.creditos > 0 ? '+' : ''}{item.creditos}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${METODO_COLOR[item.metodo] || ''}`}>
                        {METODO_LABEL[item.metodo] || item.metodo}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">
                      {item.monto > 0 ? `$${item.monto}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {item.saldoAntes} → {item.saldoDespues}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 dark:text-slate-500 max-w-[200px] truncate" title={item.nota}>{item.nota || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export default function AdminPage() {
  const { user } = useAuth()
  const [refreshSignal, setRefreshSignal] = useState(0)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-info-500 to-primary-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h1 className="font-extrabold text-base text-slate-800 dark:text-white">Panel Admin</h1>
            </div>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">{user?.email}</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full space-y-8">

        {/* ── Formulario ── */}
        <section>
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Acreditar créditos</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Venta en persona (efectivo o transferencia). El docente ve el saldo actualizado al instante.
            </p>
          </div>
          <div className="card p-6">
            <FormAcreditar onSuccess={() => setRefreshSignal(s => s + 1)} />
          </div>
        </section>

        {/* ── Historial ── */}
        <section>
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Historial de acreditaciones</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Últimas 100 operaciones manuales ordenadas por fecha.
            </p>
          </div>
          <div className="card p-5">
            <Historial refreshSignal={refreshSignal} />
          </div>
        </section>

      </main>
    </div>
  )
}
