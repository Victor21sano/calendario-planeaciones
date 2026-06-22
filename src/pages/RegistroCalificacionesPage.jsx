import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import BrandLogo from '../components/brand/BrandLogo'
import MenuUsuario from '../components/dashboard/MenuUsuario'
import { generarRegistroSemestreXLSX } from '../services/registroCalificaciones'

const KEY = 'registro-cal-v4'
const KEY_VIEJA = 'registro-cal-grupos-v3'   // migración del modelo Grupo→Materias
const NUM_PARCIALES = 3
const genId = () => (globalThis.crypto?.randomUUID?.() || `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
const clone = o => JSON.parse(JSON.stringify(o))

const CATS_INICIALES = {
  trab: { activo: true, label: 'Trabajos',  short: 'T', n: 3, peso: 40 },
  proy: { activo: true, label: 'Proyectos', short: 'P', n: 3, peso: 30 },
  exam: { activo: true, label: 'Exámenes',  short: 'E', n: 3, peso: 30 },
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0))

// ── Estructuras ───────────────────────────────────────────────
function reshapeGrades(prev, cats) {
  const g = {}
  for (const [k, c] of Object.entries(cats)) {
    const arr = prev?.[k] || []
    g[k] = Array.from({ length: c.n }, (_, j) => arr[j] ?? '')
  }
  return g
}
function reshapeDatos(datos, numAlumnos, cats) {
  const out = []
  for (let i = 0; i < numAlumnos; i++) {
    const prev = datos?.[i]
    out.push({ p: Array.from({ length: NUM_PARCIALES }, (_, pi) => reshapeGrades(prev?.p?.[pi], cats)) })
  }
  return out
}
function reshapeMetaParcial(prev, cats) {
  const o = {}
  for (const [k, c] of Object.entries(cats)) o[k] = Array.from({ length: c.n }, (_, i) => ({ t: prev?.[k]?.[i]?.t || '', f: prev?.[k]?.[i]?.f || '' }))
  return o
}
const reshapeMeta = (meta, cats) => Array.from({ length: NUM_PARCIALES }, (_, pi) => reshapeMetaParcial(meta?.[pi], cats))

// Un "registro" = una materia-grupo identificada por un solo nombre (ej. "DEWE 606").
function nuevoRegistro(nombre, numAlumnos = 45, catsCfg) {
  const cats = clone(catsCfg || CATS_INICIALES)
  return { id: genId(), nombre: nombre || 'Registro', cats, alumnos: Array.from({ length: numAlumnos }, () => ({ nombre: '' })), datos: reshapeDatos([], numAlumnos, cats), meta: reshapeMeta([], cats) }
}

// ── Cálculos ──────────────────────────────────────────────────
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
function promFinal(p, activas) {
  const ps = (p || []).map(g => promParcial(g, activas)).filter(v => v != null)
  return ps.length === 0 ? null : ps.reduce((a, b) => a + b, 0) / ps.length
}
function semColor(v) {
  if (v == null) return ''
  if (v < 6) return 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300'
  if (v < 8) return 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300'
  return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
}
function semLabel(v) {
  if (v == null) return ''
  if (v < 6) return 'Reprobado'
  if (v < 8) return 'En riesgo'
  return 'Aprobado'
}
const fmt = v => (v == null ? '—' : v.toFixed(1))
function fmtFecha(iso) {
  if (!iso) return ''
  const [, m, d] = String(iso).split('-')
  return d && m ? `${d}/${m}` : iso
}
function hoyISO() {
  const d = new Date(); const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

function normalizaRegistro(r) {
  const cats = { ...CATS_INICIALES, ...r.cats }
  const alumnos = (r.alumnos || []).map(a => ({ nombre: a?.nombre || '' }))
  const al = alumnos.length ? alumnos : [{ nombre: '' }]
  return { id: r.id || genId(), nombre: r.nombre || 'Registro', cats, alumnos: al, datos: reshapeDatos(r.datos || [], al.length, cats), meta: reshapeMeta(r.meta, cats) }
}

function cargarEstado() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (s && Array.isArray(s.registros) && s.registros.length) {
      const registros = s.registros.map(normalizaRegistro)
      const activo = registros.some(r => r.id === s.registroActivoId) ? s.registroActivoId : registros[0].id
      return { registros, registroActivoId: activo }
    }
    // Migración del modelo anterior (Grupo→Materias): cada materia-grupo se vuelve un registro.
    const old = JSON.parse(localStorage.getItem(KEY_VIEJA) || 'null')
    if (old && Array.isArray(old.grupos) && Array.isArray(old.materias)) {
      const registros = []
      for (const m of old.materias) {
        const g = old.grupos.find(gg => gg.id === m.grupoId)
        if (!g) continue
        registros.push(normalizaRegistro({
          nombre: `${m.nombre || 'Materia'} ${g.nombre || ''}`.trim(),
          cats: m.cats, alumnos: g.alumnos, datos: m.datos, meta: m.meta,
        }))
      }
      if (registros.length) return { registros, registroActivoId: registros[0].id }
    }
  } catch { /* ignore */ }
  return { registros: [], registroActivoId: null }
}

// ── Asistente para crear un registro (identificador + forma de calificar) ──
function AsistenteRegistro({ onCrear, onCerrar, puedeCerrar }) {
  const [paso, setPaso] = useState(1)
  const [nombre, setNombre] = useState('')
  const [numAlumnos, setNumAlumnos] = useState(45)
  const [cats, setCats] = useState(clone(CATS_INICIALES))

  const activas = Object.entries(cats).filter(([, c]) => c.activo)
  const suma = activas.reduce((s, [, c]) => s + (Number(c.peso) || 0), 0)
  const p1 = nombre.trim() && numAlumnos > 0
  const p2 = activas.length > 0 && suma === 100 && activas.every(([, c]) => c.n > 0)

  const inp = 'rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30'
  const setCatC = (k, campo, v) => setCats(prev => ({ ...prev, [k]: { ...prev[k], [campo]: v } }))

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => puedeCerrar && onCerrar()} onKeyDown={e => { if (e.key === 'Escape' && puedeCerrar) onCerrar() }}>
      <div role="dialog" aria-modal="true" aria-labelledby="asistente-title" className="card w-full max-w-lg p-6 animate-scale-in max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 id="asistente-title" className="font-display text-xl font-bold text-slate-900 dark:text-white">Crear registro</h2>
          {puedeCerrar && <button onClick={onCerrar} aria-label="Cerrar" className="text-slate-400 hover:text-slate-600"><svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
        </div>
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-5">
          {[1, 2].map(n => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${paso >= n ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>{n}</span>
              {n < 2 && <span className={`h-0.5 flex-1 rounded ${paso > n ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        {paso === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Paso 1 — Identifica tu registro</p>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Nombre (materia y grupo)</span>
              <input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. DEWE 606" className={inp + ' w-full'} />
              <span className="block text-xs text-slate-400">Úsalo como identificador: materia + grupo (ej. “DEWE 606”, “INAI 601”).</span>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Número de alumnos</span>
              <input type="number" min={1} max={200} value={numAlumnos} onChange={e => setNumAlumnos(clamp(e.target.value, 1, 200))} className={inp + ' w-28'} />
            </label>
          </div>
        )}

        {paso === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">Paso 2 — ¿Cómo calificas? (lo puedes ajustar después)</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Los <strong>ámbitos</strong> son las categorías con las que calificas (trabajos, proyectos, exámenes). Marca las que uses y reparte el peso para que sume 100%.</p>
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              <span>Ámbito</span><span className="text-center w-16">Columnas</span><span className="text-center w-16">Peso %</span>
            </div>
            {Object.entries(cats).map(([k, c]) => (
              <div key={k} className={`grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border p-2.5 ${c.activo ? 'border-brand-200 bg-brand-50/40 dark:border-brand-800 dark:bg-brand-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={c.activo} onChange={e => setCatC(k, 'activo', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{c.label}</span>
                </label>
                <input type="number" min={1} max={100} value={c.n} disabled={!c.activo} onChange={e => setCatC(k, 'n', clamp(e.target.value, 1, 100))} className={inp + ' w-16 text-center disabled:opacity-40'} />
                <input type="number" min={0} max={100} value={c.peso} disabled={!c.activo} onChange={e => setCatC(k, 'peso', clamp(e.target.value, 0, 100))} className={inp + ' w-16 text-center disabled:opacity-40'} />
              </div>
            ))}
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-slate-600 dark:text-slate-300">Ponderación total</span>
              <span className={suma === 100 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}>{suma}% / 100%</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setPaso(p => Math.max(1, p - 1))} disabled={paso === 1} className="btn-secondary text-sm disabled:opacity-40">Atrás</button>
          {paso < 2
            ? <button onClick={() => setPaso(2)} disabled={!p1} className="btn-accent text-sm disabled:opacity-50">Siguiente</button>
            : <button onClick={() => onCrear({ nombre: nombre.trim(), numAlumnos: clamp(numAlumnos, 1, 200), cats })} disabled={!p2} className="btn-accent text-sm disabled:opacity-50">Crear registro</button>}
        </div>
      </div>
    </div>
  )
}

// ── Fila de captura ───────────────────────────────────────────
const Fila = memo(function Fila({ idx, nombre, datos, parcial, activas, onNombre, onGrade }) {
  const grades = datos.p[parcial]
  const proms = {}
  for (const c of activas) proms[c.key] = promedio(grades[c.key])
  const acum = acumulado(proms, activas)
  const tdInput = 'w-full px-0.5 py-1 text-center text-sm tabular-nums bg-transparent border-0 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-brand-50 dark:focus:bg-brand-900/30'
  const alumno = nombre?.trim() || `alumno ${idx + 1}`
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800">
      <td className="sticky left-0 z-10 w-[40px] min-w-[40px] bg-white dark:bg-slate-900 px-2 py-1 text-center text-xs text-slate-500 border-r border-slate-200 dark:border-slate-700">{idx + 1}</td>
      <th scope="row" className="sticky left-[40px] z-10 bg-white dark:bg-slate-900 px-1 py-1 border-r border-slate-200 dark:border-slate-700 font-normal">
        <input type="text" value={nombre} placeholder="Nombre…" aria-label={`Nombre del alumno ${idx + 1}`} onChange={e => onNombre(idx, e.target.value)}
          className="w-40 px-2 py-1 text-sm bg-transparent border-0 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-brand-50 dark:focus:bg-brand-900/30 text-slate-900 dark:text-slate-100" />
      </th>
      {activas.map(c => grades[c.key].map((v, gi) => (
        <td key={`${c.key}-${gi}`} className="px-0 py-0 border-r border-slate-50 dark:border-slate-800/60">
          <input type="number" min={0} max={10} step={0.1} value={v} inputMode="decimal" aria-label={`${c.label} ${gi + 1}, ${alumno}`}
            onChange={e => onGrade(idx, parcial, c.key, gi, e.target.value)} className={tdInput + ' text-slate-800 dark:text-slate-200'} />
        </td>
      )))}
      {activas.map(c => (
        <td key={`prom-${c.key}`} title={semLabel(proms[c.key])} className={`px-2 py-1 text-center text-sm font-semibold tabular-nums border-r border-slate-200 dark:border-slate-700 ${semColor(proms[c.key])}`}>{fmt(proms[c.key])}</td>
      ))}
      <td title={semLabel(acum)} className={`px-2 py-1 text-center text-sm font-bold tabular-nums ${semColor(acum)}`}>{fmt(acum)}</td>
    </tr>
  )
})

export default function RegistroCalificacionesPage() {
  const { user, logout, esAdmin, perfilDocente } = useAuth()
  const inicialAvatar = (perfilDocente?.nombre || user?.displayName || user?.email || '?').trim().charAt(0).toUpperCase()

  const inicial = useMemo(cargarEstado, [])
  const [registros, setRegistros] = useState(inicial.registros)
  const [registroActivoId, setRegistroActivoId] = useState(inicial.registroActivoId)
  const [tab, setTab] = useState(0)
  const [exportando, setExportando] = useState(false)
  const [configAbierta, setConfigAbierta] = useState(false)
  const [guardado, setGuardado] = useState('idle')
  const [mostrarAsistente, setMostrarAsistente] = useState(inicial.registros.length === 0)
  const [editId, setEditId] = useState(null)   // columna cuyo título se está editando
  const [pegarTexto, setPegarTexto] = useState(null)  // null = modal cerrado; string = abierto
  const primeraVez = useRef(true)

  const registroIdRef = useRef(registroActivoId); useEffect(() => { registroIdRef.current = registroActivoId }, [registroActivoId])

  const hayRegistros = registros.length > 0
  const registro = useMemo(() => registros.find(r => r.id === registroActivoId) || registros[0] || null, [registros, registroActivoId])
  const numAlumnos = registro?.alumnos.length || 0
  const cats = registro?.cats || CATS_INICIALES
  const meta = registro?.meta || reshapeMeta([], CATS_INICIALES)

  const updateRegistro = useCallback(fn => setRegistros(prev => prev.map(r => (r.id === registroIdRef.current ? fn(r) : r))), [])

  useEffect(() => {
    if (primeraVez.current) { primeraVez.current = false; return }
    setGuardado('guardando')
    const t = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify({ registros, registroActivoId })); setGuardado('guardado') } catch { setGuardado('idle') }
    }, 600)
    return () => clearTimeout(t)
  }, [registros, registroActivoId])

  useEffect(() => {
    if (guardado !== 'guardado') return
    const t = setTimeout(() => setGuardado('idle'), 2200)
    return () => clearTimeout(t)
  }, [guardado])

  const activas = useMemo(() => Object.entries(cats).filter(([, c]) => c.activo).map(([key, c]) => ({ key, ...c })), [cats])
  const sumaPesos = activas.reduce((s, c) => s + (Number(c.peso) || 0), 0)
  const totalCols = activas.reduce((s, c) => s + c.n, 0)

  // ── Edición ──
  const onNombre = useCallback((idx, valor) => {
    updateRegistro(r => { const al = r.alumnos.slice(); al[idx] = { ...al[idx], nombre: valor }; return { ...r, alumnos: al } })
  }, [updateRegistro])

  const onGrade = useCallback((idx, parcial, key, gi, valor) => {
    const v = valor === '' ? '' : String(clamp(valor, 0, 10))
    updateRegistro(r => {
      const datos = r.datos.slice()
      const d = { ...datos[idx], p: datos[idx].p.slice() }
      const par = { ...d.p[parcial] }
      const arr = par[key].slice(); arr[gi] = v; par[key] = arr
      d.p[parcial] = par; datos[idx] = d
      let meta = r.meta
      if (v !== '' && !(r.meta[parcial]?.[key]?.[gi]?.f)) {
        meta = r.meta.slice()
        const mp = { ...meta[parcial] }; const marr = mp[key].slice(); marr[gi] = { ...marr[gi], f: hoyISO() }; mp[key] = marr; meta[parcial] = mp
      }
      return { ...r, datos, meta }
    })
  }, [updateRegistro])

  const onTitulo = useCallback((parcial, key, i, value) => {
    const t = String(value || '').toUpperCase()   // títulos siempre en mayúsculas
    updateRegistro(r => {
      const meta = r.meta.slice(); const mp = { ...meta[parcial] }; const arr = mp[key].slice()
      arr[i] = { ...arr[i], t }; mp[key] = arr; meta[parcial] = mp
      return { ...r, meta }
    })
  }, [updateRegistro])

  function cambiarNumAlumnos(v) {
    const n = clamp(v, 1, 200)
    updateRegistro(r => ({ ...r, alumnos: Array.from({ length: n }, (_, i) => r.alumnos[i] || { nombre: '' }), datos: reshapeDatos(r.datos, n, r.cats) }))
  }
  function aplicarPegarAlumnos() {
    const nombres = String(pegarTexto || '')
      .split(/\r?\n/).map(s => s.replace(/\t/g, ' ').trim()).filter(Boolean)
    if (nombres.length === 0) { setPegarTexto(null); return }
    const tieneNombres = registro.alumnos.some(a => a.nombre?.trim())
    if (tieneNombres && !window.confirm(`Esto reemplazará la lista de alumnos de "${registro.nombre}" con ${nombres.length} nombres pegados. ¿Continuar?`)) return
    const n = clamp(nombres.length, 1, 200)
    updateRegistro(r => ({ ...r, alumnos: Array.from({ length: n }, (_, i) => ({ nombre: nombres[i] || '' })), datos: reshapeDatos(r.datos, n, r.cats) }))
    setPegarTexto(null)
  }
  function setCatCampo(key, campo, valor) {
    updateRegistro(r => {
      const cats2 = { ...r.cats, [key]: { ...r.cats[key], [campo]: valor } }
      const upd = { ...r, cats: cats2 }
      if (campo === 'n') { upd.datos = reshapeDatos(r.datos, r.datos.length, cats2); upd.meta = reshapeMeta(r.meta, cats2) }
      return upd
    })
  }
  function agregarColumna(key) { if (cats[key].n < 100) setCatCampo(key, 'n', cats[key].n + 1) }
  function eliminarColumna(key, i) {
    if (cats[key].n <= 1) return
    updateRegistro(r => {
      const cats2 = { ...r.cats, [key]: { ...r.cats[key], n: r.cats[key].n - 1 } }
      const datos = r.datos.map(d => ({ ...d, p: d.p.map(g => ({ ...g, [key]: g[key].filter((_, j) => j !== i) })) }))
      const meta = r.meta.map(par => ({ ...par, [key]: par[key].filter((_, j) => j !== i) }))
      return { ...r, cats: cats2, datos, meta }
    })
  }
  function restablecer() {
    if (!window.confirm('¿Restablecer los ámbitos de este registro a 3 columnas cada uno? Se conservan las primeras calificaciones; se quitan las columnas extra.')) return
    updateRegistro(r => { const cats2 = clone(CATS_INICIALES); return { ...r, cats: cats2, datos: reshapeDatos(r.datos, r.datos.length, cats2), meta: reshapeMeta(r.meta, cats2) } })
  }

  // ── Registros ──
  function crearRegistroConfig({ nombre, numAlumnos: na, cats: catsCfg }) {
    const r = nuevoRegistro(nombre, na, catsCfg)
    setRegistros(prev => [...prev, r])
    setRegistroActivoId(r.id); setTab(0); setMostrarAsistente(false)
  }
  function renombrarRegistro() {
    const nombre = window.prompt('Nuevo nombre del registro (materia y grupo, ej. DEWE 606):', registro.nombre)
    if (nombre === null) return
    updateRegistro(r => ({ ...r, nombre: nombre.trim() || r.nombre }))
  }
  function eliminarRegistro() {
    if (registros.length <= 1) { window.alert('Debe quedar al menos un registro.'); return }
    if (!window.confirm(`¿Eliminar el registro "${registro.nombre}" y sus calificaciones?`)) return
    const rid = registroIdRef.current
    setRegistros(prev => {
      const next = prev.filter(r => r.id !== rid)
      setRegistroActivoId(next[0].id); setTab(0)
      return next
    })
  }

  async function handleExportar() {
    if (exportando || sumaPesos !== 100 || activas.length === 0) return
    setExportando(true)
    try {
      const alumnos = registro.alumnos.map((a, i) => ({ nombre: a.nombre, p: registro.datos[i]?.p }))
      await generarRegistroSemestreXLSX({
        numAlumnos, alumnos, meta, nombreArchivo: registro.nombre,
        categorias: activas.map(c => ({ key: c.key, label: c.label.toUpperCase(), short: c.short, n: c.n, peso: c.peso })),
      })
    } catch (err) { console.error('[RegistroCalificaciones] export', err) } finally { setExportando(false) }
  }

  const inputCfg = 'w-16 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-40'
  const selectCls = 'rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 max-w-[55vw]'
  const iconBtn = 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
  const TABS = [{ k: 0, label: 'Parcial 1' }, { k: 1, label: 'Parcial 2' }, { k: 2, label: 'Parcial 3' }, { k: 'resumen', label: 'Resumen' }]

  return (
    <div className="min-h-screen surface-atmosphere flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-brand-100/60 dark:border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <BrandLogo className="flex-shrink-0" markClassName="w-8 h-8" />
          <MenuUsuario inicial={inicialAvatar} esAdmin={esAdmin} onLogout={logout} />
        </div>
      </header>

      <div className="bg-gradient-to-r from-brand-800 to-brand-600 text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold opacity-80 hover:opacity-100 mb-3">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Volver al panel
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80 mb-1">Herramienta gratuita</p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">Registro de calificaciones</h1>
              <p className="mt-1 text-sm opacity-90">Un registro por materia y grupo (ej. DEWE 606) · 3 parciales · promedio del parcial y final con semáforo · se guarda en este navegador.</p>
            </div>
            <button onClick={handleExportar} disabled={!hayRegistros || exportando || sumaPesos !== 100 || activas.length === 0}
              className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 px-4 py-2 text-sm font-semibold backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {exportando
                ? <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z" /></svg>
                : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
              {exportando ? 'Exportando…' : 'Exportar a Excel'}
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-4">
        {!hayRegistros ? (
          <div className="card p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2a4 4 0 014-4h4M9 5h6m-6 4h6m-8 8H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v6" /></svg>
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Crea tu primer registro</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">Te guiamos en 2 pasos: el identificador (materia y grupo, ej. “DEWE 606”) y cómo calificas (ámbitos y porcentajes).</p>
            <button onClick={() => setMostrarAsistente(true)} className="btn-accent mt-5 gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Crear mi primer registro
            </button>
          </div>
        ) : (
        <>
        {/* Registro activo */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Registro:</span>
          <select value={registroActivoId} onChange={e => { setRegistroActivoId(e.target.value); setTab(0) }} className={selectCls}>
            {registros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
          <button onClick={renombrarRegistro} title="Renombrar registro" aria-label="Renombrar registro" className={iconBtn + ' hover:text-brand-600'}>
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={eliminarRegistro} title="Eliminar registro" aria-label="Eliminar registro" className={iconBtn + ' hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20'}>
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
          <button onClick={() => setMostrarAsistente(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-brand-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg> Nuevo registro
          </button>
          <button onClick={() => setPegarTexto('')} title="Pegar la lista de alumnos copiada de Excel" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Pegar alumnos
          </button>
        </div>

        {/* Configuración */}
        <section className="card">
          <button onClick={() => setConfigAbierta(o => !o)} className="w-full flex items-center justify-between px-5 py-3">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Configuración
              <span className="ml-2 font-normal text-xs text-slate-500 dark:text-slate-400">
                {numAlumnos} alumnos · {activas.map(c => `${c.label} ${c.peso}%`).join(' · ') || 'sin ámbitos'} · igual para los 3 parciales
              </span>
            </span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${configAbierta ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {configAbierta && (
            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <label className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 w-56">Número de alumnos</span>
                <input type="number" min={1} max={200} value={numAlumnos} onChange={e => cambiarNumAlumnos(e.target.value)} className={inputCfg} />
              </label>
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <span>Ámbito</span><span className="text-center w-16">Cantidad</span><span className="text-center w-16">Peso %</span>
              </div>
              {Object.entries(cats).map(([key, c]) => (
                <div key={key} className={`grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border p-2.5 ${c.activo ? 'border-brand-200 bg-brand-50/40 dark:border-brand-800 dark:bg-brand-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input type="checkbox" checked={c.activo} onChange={e => setCatCampo(key, 'activo', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{c.label}</span>
                  </label>
                  <input type="number" min={1} max={100} value={c.n} disabled={!c.activo} onChange={e => setCatCampo(key, 'n', clamp(e.target.value, 1, 100))} className={inputCfg} />
                  <input type="number" min={0} max={100} value={c.peso} disabled={!c.activo} onChange={e => setCatCampo(key, 'peso', clamp(e.target.value, 0, 100))} className={inputCfg} />
                </div>
              ))}
              <div className="flex items-center justify-between text-sm font-semibold pt-1">
                <span className="text-slate-600 dark:text-slate-300">Ponderación total (por parcial)</span>
                <span className={sumaPesos === 100 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}>{sumaPesos}% / 100%</span>
              </div>
              {sumaPesos !== 100 && <p className="text-xs text-danger-600 dark:text-danger-400">Los pesos de los ámbitos activos deben sumar 100%.</p>}
              <div className="pt-1">
                <button onClick={restablecer} title="Restablece los ámbitos de este registro a 3 columnas cada uno. Conserva las primeras calificaciones; quita las columnas extra." className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-danger-600 dark:text-slate-400 dark:hover:text-danger-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Restablecer
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Pestañas */}
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
          {TABS.map(t => (
            <button key={String(t.k)} onClick={() => setTab(t.k)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg -mb-px border-b-2 transition-colors ${tab === t.k ? 'border-brand-500 text-brand-700 dark:text-brand-300' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab !== 'resumen' ? (
          <section className="card overflow-hidden">
            <div className="overflow-auto max-h-[70vh]" tabIndex={0} role="region" aria-label={`Captura de calificaciones — ${registro.nombre}, ${TABS[tab].label}`}>
              <table className="border-collapse text-sm">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-slate-50 dark:bg-slate-800">
                    <th className="sticky left-0 z-30 w-[40px] min-w-[40px] bg-slate-50 dark:bg-slate-800 px-2 py-2 text-xs font-bold text-slate-500 border-r border-b border-slate-200 dark:border-slate-700" rowSpan={2}>#</th>
                    <th className="sticky left-[40px] z-30 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-left text-xs font-bold text-slate-500 border-r border-b border-slate-200 dark:border-slate-700" rowSpan={2}>Nombre del alumno</th>
                    {activas.map(c => (
                      <th key={c.key} colSpan={c.n} className="px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-white bg-brand-600 border-r border-b border-brand-700">
                        <span className="inline-flex items-center gap-2">
                          {c.label} ({c.n})
                          <button type="button" onClick={() => agregarColumna(c.key)} title={`Agregar ${c.label.toLowerCase()}`} className="inline-flex items-center gap-0.5 rounded-md bg-white/20 hover:bg-white/35 px-1.5 py-0.5 text-[10px] font-bold normal-case transition-colors">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg> Agregar
                          </button>
                        </span>
                      </th>
                    ))}
                    {activas.map(c => (<th key={`ph-${c.key}`} className="px-2 py-1.5 text-center text-[10px] font-bold uppercase text-accent-700 bg-accent-50 dark:bg-accent-900/30 dark:text-accent-300 border-r border-b border-slate-200 dark:border-slate-700" rowSpan={2}>Prom.<br/>{c.label}<br/>{c.peso}%</th>))}
                    <th className="px-2 py-1.5 text-center text-[11px] font-bold uppercase text-white bg-accent-600 border-b border-accent-700" rowSpan={2}>Prom.<br/>del parcial</th>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-800">
                    {activas.map(c => Array.from({ length: c.n }, (_, k) => {
                      const m = meta[tab]?.[c.key]?.[k] || { t: '', f: '' }
                      const base = `${c.short}${k + 1}`
                      const id = `${tab}-${c.key}-${k}`
                      return (
                        <th key={`${c.key}-h-${k}`} className="group relative align-bottom border-r border-b border-slate-100 dark:border-slate-800 min-w-[44px] h-[126px] p-0">
                          {c.n > 1 && (
                            <button type="button" onClick={() => eliminarColumna(c.key, k)} title="Eliminar columna" aria-label={`Eliminar columna ${m.t || base}`} className="absolute top-0 right-0 z-20 hidden group-hover:flex group-focus-within:flex focus:flex h-4 w-4 items-center justify-center rounded-bl bg-danger-100 text-danger-600 hover:bg-danger-200 dark:bg-danger-900/40 dark:text-danger-300">
                              <svg aria-hidden="true" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          )}
                          {editId === id ? (
                            <input
                              autoFocus type="text" value={m.t} placeholder={base}
                              onChange={e => onTitulo(tab, c.key, k, e.target.value)}
                              onBlur={() => setEditId(null)}
                              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditId(null) }}
                              className="absolute top-1 left-1/2 -translate-x-1/2 z-30 w-32 rounded border border-brand-400 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-center text-slate-900 dark:text-slate-100 shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                            />
                          ) : (
                            <button type="button" onClick={() => setEditId(id)} title={`${m.t || base} · clic para editar`}
                              className="flex h-full w-full flex-col items-center justify-end gap-1 pb-1 hover:bg-brand-50/60 dark:hover:bg-brand-900/20">
                              <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                className={`max-h-[92px] overflow-hidden whitespace-nowrap text-[11px] font-semibold leading-tight ${m.t ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
                                {m.t || base}
                              </span>
                              <span className="text-[9px] leading-none text-brand-600 dark:text-brand-400">{fmtFecha(m.f)}</span>
                            </button>
                          )}
                        </th>
                      )
                    }))}
                  </tr>
                </thead>
                <tbody>
                  {registro.alumnos.map((a, idx) => (
                    <Fila key={idx} idx={idx} nombre={a.nombre} datos={registro.datos[idx]} parcial={tab} activas={activas} onNombre={onNombre} onGrade={onGrade} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              {registro.nombre} · {totalCols} columnas · semáforo: 🔴 menos de 6 (reprobado) · 🟡 6–7 (en riesgo) · 🟢 8–10 (aprobado) · guardado en este navegador.
            </div>
          </section>
        ) : (
          <section className="card overflow-hidden">
            <div className="overflow-auto max-h-[70vh]" tabIndex={0} role="region" aria-label={`Resumen de promedios — ${registro.nombre}`}>
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-2 py-2 text-xs font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700 w-[40px]">#</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">Nombre del alumno</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">Parcial 1</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">Parcial 2</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">Parcial 3</th>
                    <th className="px-3 py-2 text-center text-xs font-bold uppercase text-accent-700 dark:text-accent-300 border-b border-slate-200 dark:border-slate-700">Promedio final</th>
                  </tr>
                </thead>
                <tbody>
                  {registro.alumnos.map((a, idx) => {
                    const p = registro.datos[idx]?.p || []
                    const ps = p.map(g => promParcial(g, activas))
                    const final = promFinal(p, activas)
                    return (
                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="px-2 py-1.5 text-center text-xs text-slate-500">{idx + 1}</td>
                        <td className="px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100">{a.nombre || <span className="text-slate-400 italic">—</span>}</td>
                        {ps.map((v, i) => (<td key={i} className={`px-3 py-1.5 text-center text-sm font-semibold tabular-nums ${semColor(v)}`}>{fmt(v)}</td>))}
                        <td className={`px-3 py-1.5 text-center text-base font-bold tabular-nums ${semColor(final)}`}>{fmt(final)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              {registro.nombre} · Promedio final = promedio de los parciales con calificación.
            </div>
          </section>
        )}

        {/* Crear otro registro */}
        <div className="pt-2">
          <button onClick={() => setMostrarAsistente(true)} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Crear otro registro
          </button>
        </div>
        </>
        )}
      </main>

      {/* Asistente de creación de registro */}
      {mostrarAsistente && (
        <AsistenteRegistro onCrear={crearRegistroConfig} onCerrar={() => setMostrarAsistente(false)} puedeCerrar={hayRegistros} />
      )}

      {/* Pegar alumnos desde Excel */}
      {pegarTexto !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setPegarTexto(null)} onKeyDown={e => { if (e.key === 'Escape') setPegarTexto(null) }}>
          <div role="dialog" aria-modal="true" aria-labelledby="pegar-title" className="card w-full max-w-lg p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 id="pegar-title" className="font-display text-xl font-bold text-slate-900 dark:text-white">Pegar alumnos</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Copia la columna de nombres en Excel y pégala aquí (un nombre por línea). Reemplazará la lista de <strong>{registro?.nombre}</strong> y ajustará el número de alumnos.
            </p>
            <textarea
              autoFocus value={pegarTexto} onChange={e => setPegarTexto(e.target.value)} rows={10}
              placeholder={'JUAN PÉREZ LÓPEZ\nMARÍA GONZÁLEZ RUIZ\n…'}
              className="mt-3 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-y"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {String(pegarTexto).split(/\r?\n/).map(s => s.trim()).filter(Boolean).length} alumnos detectados
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPegarTexto(null)} className="btn-secondary text-sm">Cancelar</button>
                <button onClick={aplicarPegarAlumnos} className="btn-accent text-sm">Aplicar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificación de autoguardado */}
      {guardado !== 'idle' && (
        <div className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ring-1 animate-fade-in bg-white text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-white/10" aria-live="polite">
          {guardado === 'guardando' ? (
            <>
              <svg className="h-4 w-4 animate-spin text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z" /></svg>
              Guardando…
            </>
          ) : (
            <>
              <svg className="h-4 w-4 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              Cambios guardados
            </>
          )}
        </div>
      )}
    </div>
  )
}
