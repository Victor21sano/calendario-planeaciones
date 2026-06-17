import { useState } from 'react'
import PaginaActividad from './PaginaActividad'

// ─── Colores de RA (igual paleta que los stagger del 2018) ────
const PALETA_RA = [
  'bg-info-500 dark:bg-info-600',
  'bg-success-500 dark:bg-success-600',
  'bg-warning-500 dark:bg-warning-600',
  'bg-pink-500 dark:bg-pink-600',
  'bg-info-500 dark:bg-info-600',
  'bg-danger-500 dark:bg-danger-600',
]

/**
 * Vista previa del Modelo 2023 con navegación por RA (igual que Modelo 2018).
 *
 * Jerarquía visual:
 *   Tabs de RA (1.1, 1.2, 2.1…) → sub-tabs de propósito (P1, P2…)
 *   → contenido de la actividad (tablas estilo 2018)
 */
export default function PreviewModelo2023({ planeacion, pagada = true, esAdmin = false }) {

  if (!planeacion?.cabecera || !planeacion?.unidades) {
    return (
      <div className="text-center py-16 text-slate-500 dark:text-slate-400 space-y-2">
        <p className="text-sm font-medium">No hay planeación disponible.</p>
        <p className="text-xs">Genera la planeación desde la pantalla de subida de PDFs.</p>
      </div>
    )
  }

  // Aplanar todos los RAs con su unidad para los tabs
  const rasConUnidad = []
  for (const unidad of (planeacion.unidades || [])) {
    for (const ra of (unidad.ras || [])) {
      rasConUnidad.push({ ra, unidad })
    }
  }

  if (rasConUnidad.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 dark:text-slate-400">
        <p className="text-sm font-medium">La planeación no tiene Resultados de Aprendizaje.</p>
      </div>
    )
  }

  const [raActivo,     setRaActivo]     = useState(rasConUnidad[0]?.ra.codigo || '')
  const [propActivo,   setPropActivo]   = useState(0)

  const seleccion  = rasConUnidad.find(r => r.ra.codigo === raActivo) || rasConUnidad[0]
  const props      = seleccion?.ra.actividadesEspecificas || []
  const desbloqueado = pagada || esAdmin

  // Calcular numeración global de páginas
  let paginaGlobal = 0
  const totalPaginas = rasConUnidad.reduce(
    (s, r) => s + (r.ra.actividadesEspecificas?.length || 0), 0
  )
  const paginaInicial = rasConUnidad
    .slice(0, rasConUnidad.findIndex(r => r.ra.codigo === raActivo))
    .reduce((s, r) => s + (r.ra.actividadesEspecificas?.length || 0), 0)

  return (
    <div className="card overflow-hidden">

      {/* ── Tabs de RA — misma tira que el Planificador de Horarios ── */}
      <div className="flex overflow-x-auto border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30 px-2 pt-2 gap-1 no-print">
        {rasConUnidad.map(({ ra }, idx) => {
          const activo = ra.codigo === raActivo
          const color  = PALETA_RA[idx % PALETA_RA.length]
          const tieneActiv = (ra.actividadesEspecificas?.length || 0) > 0
          return (
            <button
              key={ra.codigo}
              onClick={() => { setRaActivo(ra.codigo); setPropActivo(0) }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-sm font-semibold transition-all duration-200
                ${activo
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 border border-b-transparent border-slate-200 dark:border-white/10 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
            >
              RA {ra.codigo}
              {tieneActiv && (
                <span className={`w-1.5 h-1.5 rounded-full ${activo ? color : 'bg-slate-300 dark:bg-slate-600'}`} />
              )}
              {!tieneActiv && (
                <span className="text-[10px] text-warning-500">⚠</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Contenido del RA activo ─────────────────────────────── */}
      {seleccion && (
        <div>

          {/* Info del RA */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 no-print">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{seleccion.unidad.nombre}</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                {seleccion.ra.titulo || seleccion.ra.nombre}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {seleccion.ra.duracionHoras}h · Actividad de evaluación: {seleccion.ra.actividadEvaluacion?.codigo}
                {seleccion.ra.actividadEvaluacion?.ponderacion ? ` (${seleccion.ra.actividadEvaluacion.ponderacion}%)` : ''}
              </p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 text-right flex-shrink-0">
              <p>{props.length} propósito{props.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Sin actividades */}
          {props.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
              <svg className="w-10 h-10 mb-3 text-slate-300 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-sm font-medium">Este RA no tiene propósitos generados.</p>
              <p className="text-xs mt-1">Genera la planeación completa o edita manualmente.</p>
            </div>
          )}

          {/* Sub-tabs de propósito */}
          {props.length > 0 && (
            <>
              {/* Sub-tabs solo si hay más de 1 propósito */}
              {props.length > 1 && (
                <div className="flex items-center gap-1 px-5 pt-3 pb-0 no-print flex-wrap">
                  {props.map((prop, i) => (
                    <button
                      key={i}
                      onClick={() => setPropActivo(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                        ${propActivo === i
                          ? 'bg-primary-600 text-white'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                      Propósito {prop.numero || i + 1}
                      {prop.noSesion ? ` · Sesión ${prop.noSesion}` : ''}
                    </button>
                  ))}
                </div>
              )}

              {/* Propósito activo */}
              <div className="p-5">
                <PaginaActividad
                  cabecera={planeacion.cabecera}
                  unidad={seleccion.unidad}
                  ra={seleccion.ra}
                  actividad={props[propActivo] || props[0]}
                  numeroPagina={paginaInicial + propActivo + 1}
                  totalPaginas={totalPaginas}
                  esPrimeraActividadDelRA={propActivo === 0}
                  bloqueada={!desbloqueado && (paginaInicial + propActivo) > 0}
                />

                {/* Navegación entre propósitos */}
                {props.length > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 no-print">
                    <button
                      onClick={() => setPropActivo(i => Math.max(0, i - 1))}
                      disabled={propActivo === 0}
                      className="btn-secondary text-xs py-1.5 gap-1.5 disabled:opacity-40"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Propósito anterior
                    </button>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {propActivo + 1} / {props.length}
                    </span>
                    <button
                      onClick={() => setPropActivo(i => Math.min(props.length - 1, i + 1))}
                      disabled={propActivo === props.length - 1}
                      className="btn-secondary text-xs py-1.5 gap-1.5 disabled:opacity-40"
                    >
                      Propósito siguiente
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
