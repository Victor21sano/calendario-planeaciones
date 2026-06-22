import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import BrandLogo from '../components/brand/BrandLogo'
import MenuUsuario from '../components/dashboard/MenuUsuario'
import { cargarRegistro, promediosDeRegistro } from '../services/registro/datos'
import { convertirGrupoSegmento, NIVELES_DEFAULT } from '../services/swre/conversion'
import { extraerEstructuraDesdeImagen, cobrarConversionSWRE } from '../services/swre/extraccion'
import { cargarEstructuraGuardada, guardarEstructura, guardarConversion } from '../services/swre/almacen'

const fmt = v => (v == null ? '—' : v.toFixed(1))
const parsePesos = txt => String(txt || '').split(/[,\s]+/).map(s => Number(s)).filter(n => !isNaN(n) && n > 0)
const nombreParcial = p => (p === 'final' ? 'Acumulado (final)' : `Parcial ${p + 1}`)
const fechaCorta = iso => { try { return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return '' } }

export default function ConvertirSWREPage() {
  const { user, logout, esAdmin, perfilDocente } = useAuth()
  const inicialAvatar = (perfilDocente?.nombre || user?.displayName || user?.email || '?').trim().charAt(0).toUpperCase()

  const { registros } = useMemo(cargarRegistro, [])
  const [registroId, setRegistroId] = useState(registros[0]?.id || '')
  const registro = registros.find(r => r.id === registroId) || registros[0] || null

  const navigate = useNavigate()
  // Estructura SWRE — SOLO se obtiene por IA desde la captura (sin captura manual)
  const [aes, setAes] = useState([])
  const [copiado, setCopiado] = useState(false)
  const [extrayendo, setExtrayendo] = useState(false)
  const [errorIA, setErrorIA] = useState('')
  const [parcial, setParcial] = useState(0)   // 0|1|2 = parcial · 'final' = acumulado del semestre
  const [seleccion, setSeleccion] = useState([])   // PF a convertir (editable ANTES de convertir)
  const [saved, setSaved] = useState(null)         // entrada guardada del registro (estructura + conversiones)
  const [cobrando, setCobrando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)  // modal de confirmación de destino antes de convertir
  const [forzarFlujo, setForzarFlujo] = useState(false)  // "Generar nueva conversión": abre el flujo aunque el parcial ya esté convertido

  // Al cambiar de destino (registro/parcial) se sale del modo "nueva conversión".
  useEffect(() => { setForzarFlujo(false) }, [registroId, parcial])

  // Cargar el escaneo guardado de este registro exacto.
  useEffect(() => {
    setErrorIA(''); setConfirmar(false)
    const e = cargarEstructuraGuardada(registroId)
    if (e?.aes?.length) {
      setAes(e.aes.map(ae => ({ porcentaje: ae.porcentaje, pesos: (ae.pesos || []).join(', ') })))
      setSeleccion(e.aes.map(() => true))
      setSaved(e)
    } else {
      setAes([]); setSeleccion([]); setSaved(null)
    }
  }, [registroId])

  // Escaneo: solo lee la estructura con IA y la guarda para ESTE registro. El cobro va al convertir.
  async function leerCaptura(file) {
    if (!file || extrayendo || !registroId) return
    setExtrayendo(true); setErrorIA('')
    try {
      const extraidas = await extraerEstructuraDesdeImagen(file)
      if (extraidas.length === 0) { setErrorIA('No se detectaron Actividades de Evaluación en la captura. Asegúrate de incluir las filas con "AE (%)" y los pesos.'); return }
      setAes(extraidas.map(ae => ({ porcentaje: ae.porcentaje, pesos: ae.pesos.join(', ') })))
      setSeleccion(extraidas.map(() => true))
      const e = guardarEstructura(registroId, extraidas)
      setSaved(e)
    } catch (err) {
      if (err?.code === 'functions/failed-precondition') { setErrorIA('No se pudo iniciar la lectura. Intenta de nuevo.') }
      else setErrorIA(err?.message || 'No se pudo leer la captura. Intenta de nuevo.')
    } finally { setExtrayendo(false) }
  }

  // Ejecuta la conversión ya confirmada: cobra 25 cr y FIJA la selección de PF para ESTE registro/parcial.
  async function ejecutarConversion() {
    if (cobrando || !registroId) return
    if (seleccion.filter(Boolean).length === 0) { setErrorIA('Marca al menos un PF/AE para convertir.'); return }
    setCobrando(true); setErrorIA('')
    try {
      await cobrarConversionSWRE()
      const e = guardarConversion(registroId, parcial, seleccion)
      setSaved({ ...e })
      setConfirmar(false)
      setForzarFlujo(false)   // muestra el resultado guardado tras convertir
    } catch (err) {
      if (err?.code === 'functions/failed-precondition') { setErrorIA('Necesitas 25 créditos para convertir este parcial.'); navigate('/comprar-creditos') }
      else setErrorIA(err?.message || 'No se pudo convertir el parcial. Intenta de nuevo.')
    } finally { setCobrando(false) }
  }

  const finales = useMemo(() => (registro ? promediosDeRegistro(registro, parcial) : []), [registro, parcial])

  const estructura = useMemo(() => ({
    niveles: NIVELES_DEFAULT,
    grupos: aes.map(ae => ({ aePorcentaje: Number(ae.porcentaje) || 0, pesosIndicadores: parsePesos(ae.pesos) })),
  }), [aes])

  const tieneEstructura = aes.length > 0
  const parcialConv = saved?.parciales?.[parcial] || null
  const convertido = Array.isArray(parcialConv?.seleccion) && parcialConv.seleccion.length === aes.length
  // Selección efectiva: si el parcial ya se convirtió, va BLOQUEADA (la pagada); si no, la editable.
  const seleccionEfectiva = convertido ? parcialConv.seleccion : seleccion

  const sumaSel = aes.reduce((s, ae, i) => s + (seleccionEfectiva[i] ? (Number(ae.porcentaje) || 0) : 0), 0)
  const nSel = seleccionEfectiva.filter(Boolean).length
  const nIndicadores = estructura.grupos.reduce((s, g) => s + g.pesosIndicadores.length, 0)
  const estructuraOk = aes.length > 0 && nSel > 0 && sumaSel > 0 && estructura.grupos.every(g => g.pesosIndicadores.length > 0)

  const resultado = useMemo(() => (estructuraOk && finales.length ? convertirGrupoSegmento(finales.map(f => ({ nombre: f.nombre, promedio: f.promedio ?? 0 })), estructura, seleccionEfectiva) : null), [estructuraOk, finales, estructura, seleccionEfectiva])

  const toggleAE = i => { if (!convertido) setSeleccion(prev => prev.map((s, j) => (j === i ? !s : s))) }

  // Vista: resultado guardado (parcial convertido y no se pidió "nueva") vs. flujo de nueva conversión.
  const mostrarFlujo = !convertido || forzarFlujo
  const pfConvertidos = convertido ? parcialConv.seleccion.map((s, i) => (s ? `AE ${i + 1}` : null)).filter(Boolean).join(', ') : ''

  async function copiar(soloIndicadores) {
    if (!resultado) return
    // Solo las AE marcadas tienen letra; las no marcadas son ''. Copiar únicamente las llenas.
    const tsv = resultado.filas.map(f => {
      const llenas = f.letras.filter(l => l !== '')
      return (soloIndicadores ? llenas : [f.nombre, ...llenas]).join('\t')
    }).join('\n')
    try { await navigator.clipboard.writeText(tsv); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch { /* ignore */ }
  }

  const sinRegistro = registros.length === 0
  const inp = 'rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30'

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
          <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80 mb-1">Herramienta premium</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">Convertir a formato SWRE</h1>
          <p className="mt-1 text-sm opacity-90 max-w-2xl">Toma los promedios finales del Registro y genera las letras (N/P · I · S · B · E) para copiar y pegar en la sábana de SWRE.</p>
        </div>
      </div>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-4">
        {sinRegistro ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">Primero captura calificaciones en el <Link to="/registro-calificaciones" className="font-semibold text-brand-700 dark:text-brand-300 hover:underline">Registro de calificaciones</Link>.</p>
          </div>
        ) : (
          <>
            {/* Registro / Parcial */}
            <div className="flex flex-wrap items-center gap-3">
              {mostrarFlujo && <span className="text-[11px] font-bold uppercase tracking-wide text-brand-600 dark:text-brand-300">Paso 1 · Destino</span>}
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Registro:</span>
              <select value={registroId} onChange={e => setRegistroId(e.target.value)} className={inp + ' max-w-[45vw]'}>
                {registros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Parcial:</span>
              <select value={parcial} onChange={e => setParcial(e.target.value === 'final' ? 'final' : Number(e.target.value))} className={inp}>
                <option value={0}>Parcial 1</option>
                <option value={1}>Parcial 2</option>
                <option value={2}>Parcial 3</option>
                <option value="final">Acumulado (final)</option>
              </select>
              <span className="text-xs text-slate-500 dark:text-slate-400">{finales.filter(f => f.promedio != null).length} alumnos con promedio</span>
              {tieneEstructura && (
                convertido
                  ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">✓ {nombreParcial(parcial)} convertido</span>
                  : <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{nombreParcial(parcial)} · 25 cr</span>
              )}
            </div>

            {!mostrarFlujo ? (
              /* ===================== RESULTADO GUARDADO ===================== */
              <>
                <section className="card p-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Conversión guardada
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {registro?.nombre} · {nombreParcial(parcial)} · PF: <strong className="text-slate-700 dark:text-slate-200">{pfConvertidos}</strong> ({sumaSel}% del año)
                    </p>
                  </div>
                  <button onClick={() => setForzarFlujo(true)} className="btn-accent text-sm gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Generar nueva conversión
                  </button>
                </section>

                <section className="card overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Letras para SWRE</h2>
                    <button onClick={() => copiar(true)} disabled={!resultado} className="btn-accent text-xs gap-1.5 disabled:opacity-40">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      {copiado ? '✓ Copiado' : 'Copiar (solo indicadores)'}
                    </button>
                  </div>
                  {!estructuraOk ? (
                    <p className="p-6 text-sm text-slate-500 dark:text-slate-400">No hay alumnos con promedio en este parcial.</p>
                  ) : (
                    <div className="overflow-auto max-h-[60vh]">
                      <table className="border-collapse text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800">
                          <tr>
                            <th className="sticky left-0 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-left text-xs font-bold text-slate-500 border-r border-b border-slate-200 dark:border-slate-700">Alumno</th>
                            <th className="px-2 py-2 text-center text-xs font-bold text-slate-500 border-r border-b border-slate-200 dark:border-slate-700">Aprov.</th>
                            {Array.from({ length: nIndicadores }, (_, k) => (<th key={k} className="px-1 py-2 text-center text-[10px] font-semibold text-slate-400 border-r border-b border-slate-100 dark:border-slate-800 min-w-[34px]">{k + 1}</th>))}
                          </tr>
                        </thead>
                        <tbody>
                          {resultado.filas.map((f, idx) => (
                            <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                              <td className="sticky left-0 bg-white dark:bg-slate-900 px-3 py-1 text-sm text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">{f.nombre || <span className="text-slate-400 italic">—</span>}</td>
                              <td className="px-2 py-1 text-center text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{fmt(f.aprovechamiento)}</td>
                              {f.letras.map((l, k) => (<td key={k} className="px-1 py-1 text-center text-xs font-medium text-slate-700 dark:text-slate-200 border-r border-slate-50 dark:border-slate-800/60">{l}</td>))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="px-4 py-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                    Valores: N/P=0 · I=50 · S=60 · B=80 · E=100. "Aprov." es lo que acumula el alumno en los PF convertidos ({sumaSel}% del año) según su promedio del parcial. En SWRE pega solo las columnas de indicadores.
                  </div>
                </section>
              </>
            ) : (
              /* ===================== FLUJO: NUEVA CONVERSIÓN ===================== */
              <section className="card p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Paso 2 · Estructura y PF a convertir</h2>
                  <label className={`btn-accent text-xs gap-1.5 cursor-pointer ${extrayendo ? 'opacity-60 pointer-events-none' : ''}`}>
                    {extrayendo
                      ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z" /></svg>
                      : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    {extrayendo ? 'Leyendo captura…' : (saved ? 'Volver a escanear' : 'Subir captura de SWRE')}
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => { leerCaptura(e.target.files?.[0]); e.target.value = '' }} />
                  </label>
                </div>
                {saved ? (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span><strong>Estructura guardada</strong> de este registro (escaneada el {fechaCorta(saved.actualizado)}). Se reutiliza para todos los parciales. Solo vuelve a escanear si cambió tu sábana.</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sube una <strong>captura de tu sábana en SWRE</strong> (la fila con las AE y sus % y pesos) para detectar tu estructura. Después eliges qué PF convertir; cada parcial cuesta 25 créditos.
                  </p>
                )}
                {errorIA && <p className="text-xs text-danger-600 dark:text-danger-400">{errorIA}</p>}

                {convertido ? (
                  <div className="rounded-xl border-2 border-dashed border-amber-200 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-900/10 p-6 text-center space-y-2">
                    <p className="text-sm text-slate-700 dark:text-slate-200">El <strong>{nombreParcial(parcial)}</strong> de <strong>{registro?.nombre}</strong> ya está convertido.</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Cambia el <strong>registro</strong> o el <strong>parcial</strong> arriba para generar una conversión nueva.</p>
                    <button onClick={() => setForzarFlujo(false)} className="text-xs font-semibold text-brand-700 dark:text-brand-300 hover:underline">Ver la conversión guardada de este parcial</button>
                  </div>
                ) : aes.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Aún no has subido una captura. Pulsa <strong>“Subir captura de SWRE”</strong> para detectar tu estructura.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">¿Qué PF/RA conviertes en el {nombreParcial(parcial)}?</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{nSel}/{aes.length} PF · {sumaSel}% del año · {nIndicadores} columnas</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aes.map((ae, i) => {
                        const marcado = !!seleccion[i]
                        return (
                          <button key={i} onClick={() => toggleAE(i)}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${marcado ? 'border-brand-400 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20' : 'border-slate-200 dark:border-slate-700 opacity-50'}`}>
                            <input type="checkbox" checked={marcado} readOnly className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 pointer-events-none" />
                            <span className="font-bold text-slate-700 dark:text-slate-200">AE {i + 1} · {ae.porcentaje}%</span>
                            <span className="text-slate-500 dark:text-slate-400 tabular-nums">{ae.pesos}</span>
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Marca <strong>solo los PF que se califican en este parcial</strong> ({sumaSel}% del año). Al convertir, esta selección <strong>queda fija</strong> y solo se llenan esas columnas. Ej.: en el Parcial 1 marca solo PF1 y PF2.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <button onClick={() => { setErrorIA(''); setConfirmar(true) }} disabled={cobrando || nSel === 0} className="btn-accent text-sm gap-2 disabled:opacity-50">
                        Convertir {nombreParcial(parcial)} · 25 créditos
                      </button>
                      <span className="text-[11px] text-slate-400">Fija los {nSel} PF marcados para este parcial.</span>
                    </div>
                  </>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* Confirmación de destino: el docente verifica registro + parcial antes de cobrar */}
      {confirmar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => !cobrando && setConfirmar(false)}>
          <div className="card max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Confirma qué vas a convertir</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Revisa que el destino sea el correcto. Cada registro tiene su propia estructura.</p>
            <dl className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              <div className="flex justify-between px-4 py-2"><dt className="text-slate-500">Registro</dt><dd className="font-semibold text-slate-800 dark:text-slate-100">{registro?.nombre || '—'}</dd></div>
              <div className="flex justify-between px-4 py-2"><dt className="text-slate-500">Parcial</dt><dd className="font-semibold text-slate-800 dark:text-slate-100">{nombreParcial(parcial)}</dd></div>
              <div className="flex justify-between px-4 py-2"><dt className="text-slate-500">PF a convertir</dt><dd className="font-semibold text-slate-800 dark:text-slate-100 text-right">{aes.map((_, i) => (seleccion[i] ? `AE ${i + 1}` : null)).filter(Boolean).join(', ')} · {sumaSel}%</dd></div>
            </dl>
            <p className="text-xs text-slate-500 dark:text-slate-400">Se cobrarán <strong>25 créditos</strong> y estos PF quedarán <strong>fijos</strong> para este parcial.</p>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setConfirmar(false)} disabled={cobrando} className="text-sm font-semibold px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50">Cancelar</button>
              <button onClick={ejecutarConversion} disabled={cobrando} className="btn-accent text-sm gap-2 disabled:opacity-60">
                {cobrando
                  ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z" /></svg> Convirtiendo…</>
                  : <>Convertir · 25 créditos</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
