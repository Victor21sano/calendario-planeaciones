import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

// ─── Planteles CONALEP Guanajuato ─────────────────────────────
const DON_BOSCO = 'Bachillerato Tecnológico y Centro de Capacitación Laboral Don Bosco A. C.'

const PLANTELES = [
  'Acámbaro',
  DON_BOSCO,
  'Celaya',
  'Cortazar',
  'Felipe Benicio Martínez Chapa',
  'Irapuato',
  'Irapuato II',
  'León II',
  'León III',
  'Moroleón',
  'Pénjamo',
  'Salamanca',
  'Salvatierra',
  'San Felipe',
  'San José Iturbide',
  'Silao',
  'Valle de Santiago',
]

// Convierte nombre raw → nombre para mostrar en la planeación
function formatPlantel(raw) {
  if (!raw) return ''
  if (raw === DON_BOSCO) return raw
  return `CONALEP ${raw}`
}

// Extrae el nombre raw del valor formateado (para pre-seleccionar el dropdown)
function rawPlantel(formatted) {
  if (!formatted) return ''
  if (formatted.startsWith('CONALEP ')) return formatted.slice(8)
  return formatted
}

// ─── Field components ─────────────────────────────────────────
function Field({ label, value, onChange, placeholder = '', type = 'text', readOnly = false, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={readOnly ? undefined : e => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`input-base ${readOnly ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-default' : ''}`}
      />
      {hint && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="input-base">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function TextareaField({ label, value, onChange, placeholder = '', rows = 3 }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="input-base resize-y"
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
export default function DatosDocenteForm({ datosDocente, modulo, onChangeDatosDocente, onChangeModulo }) {
  const { user, perfilDocente, updatePerfilDocente } = useAuth()
  const [docenteOpen, setDocenteOpen] = useState(true)
  const [moduloOpen,  setModuloOpen]  = useState(true)

  // Auto-llenar nombre desde el perfil de Auth si el campo está vacío
  useEffect(() => {
    const profileName = user?.displayName || perfilDocente?.nombre
    if (profileName && !datosDocente.nombre) {
      onChangeDatosDocente({ ...datosDocente, nombre: profileName })
    }
  }, [user?.displayName, perfilDocente?.nombre]) // eslint-disable-line

  // Auto-llenar plantel desde el perfil si el campo está vacío
  useEffect(() => {
    const rawName = perfilDocente?.plantel
    if (rawName && !datosDocente.plantel) {
      onChangeDatosDocente({ ...datosDocente, plantel: formatPlantel(rawName) })
    }
  }, [perfilDocente?.plantel]) // eslint-disable-line

  function setDocente(key, val) { onChangeDatosDocente({ ...datosDocente, [key]: val }) }
  function setModulo(key, val)  { onChangeModulo({ ...modulo, [key]: val }) }

  async function handlePlantelChange(rawName) {
    setDocente('plantel', formatPlantel(rawName))
    // Guardar el plantel seleccionado en el perfil para reutilizar en otras materias
    await updatePerfilDocente({ plantel: rawName })
  }

  const selectedRaw = rawPlantel(datosDocente.plantel || '')
  const isNameFromProfile = !!(user?.displayName || perfilDocente?.nombre)

  return (
    <div className="space-y-4">
      {/* ── Datos del Docente ────────────────────────────────── */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setDocenteOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Datos del Docente</span>
          </div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${docenteOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {docenteOpen && (
          <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-white/5 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre del docente — viene del login */}
              <Field
                label="Nombre del docente"
                value={datosDocente.nombre || ''}
                onChange={v => setDocente('nombre', v)}
                placeholder="Lic. Juan Pérez García"
                hint={isNameFromProfile ? 'Tomado de tu cuenta. Editable si necesitas cambiarlo aquí.' : ''}
              />

              {/* Plantel — dropdown con lista de CONALEP Guanajuato */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nombre del plantel
                </label>
                <select
                  value={selectedRaw}
                  onChange={e => handlePlantelChange(e.target.value)}
                  className="input-base"
                >
                  <option value="">— Selecciona un plantel —</option>
                  {PLANTELES.map(p => (
                    <option key={p} value={p}>{formatPlantel(p)}</option>
                  ))}
                </select>
                {perfilDocente?.plantel && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Guardado en tu perfil para todas las materias.
                  </p>
                )}
              </div>
            </div>

            <Field
              label="Nombre del coordinador / validador"
              value={datosDocente.coordinador || ''}
              onChange={v => setDocente('coordinador', v)}
              placeholder="Lic. Carlos Núñez Ledesma"
            />
          </div>
        )}
      </div>

      {/* ── Datos del Módulo ──────────────────────────────────── */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setModuloOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Datos del Módulo (Programa de Estudios)</span>
          </div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${moduloOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {moduloOpen && (
          <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-white/5 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Field
                  label="Nombre del módulo"
                  value={modulo.nombre || ''}
                  onChange={v => setModulo('nombre', v)}
                  placeholder="Diseño y elaboración de páginas web"
                />
              </div>
              <Field
                label="Semestre"
                value={modulo.semestre || ''}
                onChange={v => setModulo('semestre', v)}
                placeholder="6"
              />
            </div>
            <TextareaField
              label="Propósito del módulo"
              value={modulo.proposito || ''}
              onChange={v => setModulo('proposito', v)}
              placeholder="Desarrollar sitios web de acuerdo con..."
              rows={3}
            />
            <Select
              label="Competencia"
              value={modulo.competencia || 'Profesional'}
              onChange={v => setModulo('competencia', v)}
              options={['Profesional', 'Disciplinar']}
            />
          </div>
        )}
      </div>
    </div>
  )
}
