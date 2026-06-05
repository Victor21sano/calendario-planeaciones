import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import DatosDocenteForm from './DatosDocenteForm'
import PlaneacionForm from './PlaneacionForm'
import PlaneacionPreview from './PlaneacionPreview'
import GeneradorIA from './GeneradorIA'
import ModalSinCreditos from './ModalSinCreditos'
import { buildUnidadesFromAI, regenerarRA } from '../services/iaPlaneacion'

const LS_KEY = id => `planeacion_didactica_v1_${id}`

function fechaHoyEspanol() {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
}

const DEFAULT_DOCENTE = { nombre: '', plantel: '', coordinador: '' }
const DEFAULT_MODULO  = { nombre: '', proposito: '', competencia: 'Profesional', semestre: '' }
const DEFAULT_RA = () => ({
  fechaElaboracion: fechaHoyEspanol(),
  nombreCompleto: '',
  actividadEvaluacion: '',
  contenidos: '',
  evidencias: '',
  ponderacion: '',
  competenciasGenericas: '',
  atributos: '',
  modalidad: 'Presencial',
  propositoAprendizaje: '',
  aprendizajeEsperado: '',
  productoEsperado: '',
  socioemocional: { dimension: '', leccion: '', duracion: '' },
  numSesiones: 1,
  sesiones: [defaultSesion(1, 1)],
  practicas: [],
})

function defaultSesion(num, total) {
  return {
    numero: `${num}/${total}`,
    duracion: '',
    apertura:  { ensenanza: '', aprendizaje: '', evaluacion: 'Diagnóstica. Autoevaluación.',  ambiente: 'Salón de clases. Centro de cómputo.', recursos: '' },
    desarrollo:{ ensenanza: '', aprendizaje: '', evaluacion: 'Formativa. Heteroevaluación.',  ambiente: 'Salón de clases. Centro de cómputo.', recursos: '' },
    cierre:    { ensenanza: '', aprendizaje: '', evaluacion: 'Sumativa. Heteroevaluación.',   ambiente: 'Salón de clases. Centro de cómputo.', recursos: '' },
  }
}

function formatFechaDisplay(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return format(new Date(y, m - 1, d), "d 'de' MMMM 'de' yyyy", { locale: es })
}

function buildRAList(unidades) {
  const list = []
  unidades.forEach((u, ui) => {
    (u.subunidades || []).forEach((su, si) => {
      list.push({
        raLabel: `${ui + 1}.${si + 1}`,
        unidadIdx: ui + 1,
        unidadId: u.id,
        unidadNombre: u.nombre,
        subunidadId: su.id,
        subunidadNombre: su.nombre,
        horas: su.horas || 0,
      })
    })
  })
  return list
}

function getRangoFechas(resultado, subunidadId) {
  if (!resultado) return { fechaInicio: null, fechaFin: null }
  const row = resultado.planeacion.find(r => r.subunidadId === subunidadId)
  if (!row) return { fechaInicio: null, fechaFin: null }
  return { fechaInicio: row.fechaInicio, fechaFin: row.fechaFin }
}

export default function PlaneacionGeneradorSection({
  materiaId, unidades, resultado, onUpdateUnidades, onHorasTotales, onHorasSemana,
  pendingGenerationResult, onPendingResultApplied,
  onGeneratedComplete,
  modoManualInicial = false,
  pagada = true,
  modelo = '2018',
}) {
  const navigate = useNavigate()
  const raList = buildRAList(unidades || [])

  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY(materiaId))
      return saved ? JSON.parse(saved) : { datosDocente: DEFAULT_DOCENTE, modulo: DEFAULT_MODULO, unidadesData: {} }
    } catch { return { datosDocente: DEFAULT_DOCENTE, modulo: DEFAULT_MODULO, unidadesData: {} } }
  })

  const [activeTab, setActiveTab]   = useState(raList[0]?.raLabel || '')
  const [viewMode, setViewMode]     = useState({})
  const [savedFlash, setSavedFlash] = useState(false)
  // raLabel → { generado: bool } for badge display
  const [iaStatus, setIaStatus]     = useState({})
  // raLabel → error message for failed generations
  const [iaErrors, setIaErrors]     = useState({})
  // estructura from last AI run (needed for per-RA retries)
  const [iaEstructura, setIaEstructura] = useState(null)
  // raLabel currently being retried (null = none)
  const [retryingRA, setRetryingRA] = useState(null)
  // Modal de sin créditos y modo gratuito
  // modoManualInicial viene de DashboardPage cuando el usuario eligió "modo gratuito"
  const [mostrarModalSinCreditos, setMostrarModalSinCreditos] = useState(false)
  const [modoGratuito, setModoGratuito]                       = useState(modoManualInicial)

  useEffect(() => {
    try { localStorage.setItem(LS_KEY(materiaId), JSON.stringify(data)) } catch {}
  }, [data, materiaId])

  // Update activeTab when raList changes (after AI creates units)
  useEffect(() => {
    if (raList.length > 0 && !raList.find(r => r.raLabel === activeTab)) {
      setActiveTab(raList[0].raLabel)
    }
  }, [raList.length])

  // Apply generated data from the onboarding flow (passed via prop instead of GeneradorIA)
  useEffect(() => {
    if (pendingGenerationResult) {
      applyGeneratedData(pendingGenerationResult)
      onPendingResultApplied?.()
    }
  }, [pendingGenerationResult]) // eslint-disable-line

  // ─── Data helpers ────────────────────────────────────────────
  function getUnidadData(unidadId) {
    return data.unidadesData[unidadId] || { proposito: '', subunidadesData: {} }
  }
  function getRAData(unidadId, subunidadId) {
    const ud = getUnidadData(unidadId)
    return ud.subunidadesData[subunidadId] || DEFAULT_RA()
  }
  function setRAData(unidadId, subunidadId, raData) {
    setData(prev => ({
      ...prev,
      unidadesData: {
        ...prev.unidadesData,
        [unidadId]: {
          ...getUnidadData(unidadId),
          subunidadesData: { ...(getUnidadData(unidadId).subunidadesData || {}), [subunidadId]: raData },
        },
      },
    }))
  }
  function setUnidadProposito(unidadId, proposito) {
    setData(prev => ({
      ...prev,
      unidadesData: { ...prev.unidadesData, [unidadId]: { ...getUnidadData(unidadId), proposito } },
    }))
  }

  // ─── AI generation callback ───────────────────────────────────
  function applyGeneratedData(result) {
    const { estructura, rasData, errors } = result
    if (!estructura) return

    // Sumar horas desde los RAs individuales (más fiable que modulo.horasTotales que la IA puede maleer)
    const horasDesdeRAs = (estructura.unidades || [])
      .flatMap(u => u.resultados || [])
      .reduce((s, r) => s + (Number(r.horas) || 0), 0)
    const horasTotales = horasDesdeRAs || estructura.modulo?.horasTotales || 0
    if (horasTotales > 0) onHorasTotales?.(horasTotales)

    // Si la IA leyó "horasSemana" directo del PE, usarlo con prioridad (evita el 3.666... de una mala suma)
    const horasSemanaDelPE = estructura.modulo?.horasSemana
    if (horasSemanaDelPE > 0) onHorasSemana?.(horasSemanaDelPE)

    // Confirmar si la nueva estructura reemplaza una existente con número diferente de RAs
    const currentCount = raList.length
    const newCount = estructura.unidades.flatMap(u => u.resultados || []).length
    if (currentCount > 0 && currentCount !== newCount) {
      const ok = window.confirm(
        `El Programa de Estudios tiene ${newCount} resultado(s) de aprendizaje, ` +
        `pero la estructura actual tiene ${currentCount}.\n\n` +
        `¿Reemplazar la estructura y el contenido existente?`
      )
      if (!ok) return
    }

    // 1. Reconstruir la estructura del Planificador DESDE el PE (autorrellenar).
    //    Esto reemplaza cualquier estructura vieja en memoria (1.1–2.2 de pruebas).
    //    No toca semestre/horasSemana/vacaciones: esos los pone el docente a mano.
    const newUnidades = buildUnidadesFromAI(estructura.unidades)
    onUpdateUnidades(newUnidades)

    // 2. raLabel → item desde la estructura NUEVA (no la vieja).
    const raMap = {}
    buildRAList(newUnidades).forEach(item => { raMap[item.raLabel] = item })

    const newIaStatus = {}
    Object.entries(rasData).forEach(([raLabel, raData]) => {
      if (raData && raMap[raLabel]) newIaStatus[raLabel] = { generado: true }
    })

    // 3. Construir unidadesData sobre la estructura nueva (ids frescos y consistentes).
    const nextUnidadesData = {}
    Object.entries(rasData).forEach(([raLabel, raData]) => {
      if (!raData) return // RA fallido
      const raItem = raMap[raLabel]
      if (!raItem) return

      const aiUnidad = estructura.unidades.find(u => u.numero === raItem.unidadIdx)
      const existing = nextUnidadesData[raItem.unidadId] || { proposito: '', subunidadesData: {} }
      nextUnidadesData[raItem.unidadId] = {
        ...existing,
        proposito: aiUnidad?.proposito || existing.proposito || '',
        subunidadesData: {
          ...existing.subunidadesData,
          [raItem.subunidadId]: { ...DEFAULT_RA(), ...raData },
        },
      }
    })

    setData(prev => ({
      ...prev,
      modulo: { ...prev.modulo, ...estructura.modulo },
      unidadesData: nextUnidadesData,
    }))
    setIaStatus(newIaStatus)
    setIaErrors(errors || {})
    setIaEstructura(estructura)
    onGeneratedComplete?.()

    // Cambiar a la vista previa del primer RA generado con éxito
    const firstLabel = Object.keys(rasData).find(l => rasData[l] && raMap[l])
    if (firstLabel) {
      setActiveTab(firstLabel)
      setViewMode(prev => ({ ...prev, [firstLabel]: 'preview' }))
    }
  }

  // ─── Per-RA retry ─────────────────────────────────────────────
  async function handleRetryRA(raLabel) {
    if (!iaEstructura || retryingRA) return
    setRetryingRA(raLabel)

    let raInfo = null
    for (const u of iaEstructura.unidades) {
      const r = u.resultados.find(r => r.raLabel === raLabel)
      if (r) {
        raInfo = {
          raLabel: r.raLabel,
          nombre: r.nombre,
          horas: r.horas,
          actividadEvaluacion: r.actividadEvaluacion,
          contenidos: r.contenidos,
          evidencias: r.evidencias,
          ponderacion: r.ponderacion,
          unidadNombre: u.nombre,
          unidadNumero: u.numero,
          unidadProposito: u.proposito,
        }
        break
      }
    }
    if (!raInfo) { setRetryingRA(null); return }

    const moduloInfo = {
      nombre: iaEstructura.modulo.nombre,
      proposito: iaEstructura.modulo.proposito,
      semestre: iaEstructura.modulo.semestre,
      competencia: iaEstructura.modulo.competencia,
      competenciasGenericas: iaEstructura.competenciasGlobales || '',
      atributos: iaEstructura.atributosGlobales || '',
    }

    // Count practices in all preceding RAs to compute numbering offset
    const allRALabels = iaEstructura.unidades.flatMap(u => u.resultados.map(r => r.raLabel))
    const idx = allRALabels.indexOf(raLabel)
    let practiceOffset = 1
    for (let i = 0; i < idx; i++) {
      const prevItem = raList.find(r => r.raLabel === allRALabels[i])
      if (prevItem) {
        practiceOffset += (getRAData(prevItem.unidadId, prevItem.subunidadId).practicas?.length || 0)
      }
    }

    try {
      const newRAData = await regenerarRA(raInfo, moduloInfo, practiceOffset)
      const raItem = raList.find(r => r.raLabel === raLabel)
      if (raItem) {
        const aiUnidad = iaEstructura.unidades.find(u => u.numero === raItem.unidadIdx)
        setData(prev => ({
          ...prev,
          unidadesData: {
            ...prev.unidadesData,
            [raItem.unidadId]: {
              ...(prev.unidadesData[raItem.unidadId] || { proposito: '', subunidadesData: {} }),
              proposito: aiUnidad?.proposito || prev.unidadesData[raItem.unidadId]?.proposito || '',
              subunidadesData: {
                ...(prev.unidadesData[raItem.unidadId]?.subunidadesData || {}),
                [raItem.subunidadId]: { ...DEFAULT_RA(), ...newRAData },
              },
            },
          },
        }))
        setIaStatus(prev => ({ ...prev, [raLabel]: { generado: true } }))
        setIaErrors(prev => { const next = { ...prev }; delete next[raLabel]; return next })
      }
    } catch (err) {
      setIaErrors(prev => ({ ...prev, [raLabel]: err.message }))
    } finally {
      setRetryingRA(null)
    }
  }

  // ─── Export/import JSON ───────────────────────────────────────
  function exportJSON() {
    // BOM UTF-8 para que editores de Windows no interpreten el archivo como
    // Windows-1252 (evita el mojibake "DiseÃ±o" / "â¢").
    const blob = new Blob(['﻿' + JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `planeacion-${materiaId}-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  function importJSON(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(String(ev.target.result).replace(/^﻿/, ''))
        if (parsed.datosDocente && parsed.modulo) {
          setData(parsed)
          setSavedFlash(true)
          setTimeout(() => setSavedFlash(false), 2000)
        }
      } catch { alert('Archivo JSON inválido') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ─── Empty state ──────────────────────────────────────────────
  const showEmptyState = raList.length === 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">Generador de Planeación Didáctica</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Sube tus PDFs para generar automáticamente, o llena los formularios manualmente.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {savedFlash && <span className="text-xs text-success-600 dark:text-success-400 font-semibold">Importado ✓</span>}
          <label className="btn-secondary text-xs py-1.5 cursor-pointer gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Importar JSON
            <input type="file" accept=".json" className="hidden" onChange={importJSON} />
          </label>
          <button onClick={exportJSON} className="btn-secondary text-xs py-1.5 gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Exportar JSON
          </button>
        </div>
      </div>

      {/* Panel IA — oculto en modo gratuito */}
      {!modoGratuito && (
        <GeneradorIA
          onGenerated={applyGeneratedData}
          onUpdateUnidades={onUpdateUnidades}
          raList={raList}
          onSinCreditos={() => setMostrarModalSinCreditos(true)}
          modelo={modelo}
          materiaId={materiaId}
        />
      )}

      {/* Banner modo gratuito */}
      {modoGratuito && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Modo manual activo</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Llena los formularios manualmente. La generación con IA requiere créditos.</p>
            </div>
          </div>
          <button
            onClick={() => setModoGratuito(false)}
            className="btn-secondary text-xs py-1.5 flex-shrink-0"
          >
            Activar IA
          </button>
        </div>
      )}

      {/* Modal sin créditos */}
      {mostrarModalSinCreditos && (
        <ModalSinCreditos
          onComprar={() => navigate('/comprar-creditos')}
          onModoGratuito={() => {
            setMostrarModalSinCreditos(false)
            setModoGratuito(true)
          }}
          onCerrar={() => setMostrarModalSinCreditos(false)}
        />
      )}

      {/* Datos Docente + Módulo */}
      <DatosDocenteForm
        datosDocente={data.datosDocente}
        modulo={data.modulo}
        onChangeDatosDocente={dd => setData(p => ({ ...p, datosDocente: dd }))}
        onChangeModulo={m => setData(p => ({ ...p, modulo: m }))}
      />

      {/* Empty state */}
      {showEmptyState && (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-info-50 dark:from-primary-900/20 dark:to-info-900/20 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-primary-300 dark:text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Sin resultados de aprendizaje</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">
            Sube los PDFs arriba para generar automáticamente (incluyendo la estructura), o define las unidades manualmente en "Planificador de Horarios".
          </p>
        </div>
      )}

      {/* RA Tabs */}
      {!showEmptyState && (
        <div className="card overflow-hidden">
          {/* Tab nav */}
          <div className="flex overflow-x-auto border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30 px-2 pt-2 gap-1 no-print">
            {raList.map((ra, tabIdx) => (
              <button
                key={ra.raLabel}
                onClick={() => { setActiveTab(ra.raLabel); setViewMode(p => ({ ...p, [ra.raLabel]: p[ra.raLabel] || 'form' })) }}
                style={{ animationDelay: `${Math.min(tabIdx * 40, 320)}ms` }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-sm font-semibold animate-stagger-fade
                  ${activeTab === ra.raLabel
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 border border-b-transparent border-slate-200 dark:border-white/10 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`}
              >
                RA {ra.raLabel}
                {iaStatus[ra.raLabel]?.generado && (
                  <span className="w-1.5 h-1.5 rounded-full bg-success-400 flex-shrink-0" title="Generado con IA" />
                )}
                {iaErrors[ra.raLabel] && (
                  <span className="w-1.5 h-1.5 rounded-full bg-warning-400 flex-shrink-0" title="Error de generación — usa Reintentar" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {(() => {
            const activeRA = raList.find(r => r.raLabel === activeTab) || raList[0]
            if (!activeRA) return null
            const mode = viewMode[activeTab] || 'form'
            const { fechaInicio, fechaFin } = getRangoFechas(resultado, activeRA.subunidadId)
            const ud = getUnidadData(activeRA.unidadId)
            const raData = getRAData(activeRA.unidadId, activeRA.subunidadId)

            return (
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{activeRA.unidadNombre}</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                      {activeRA.subunidadNombre || `Resultado de Aprendizaje ${activeRA.raLabel}`}
                    </p>
                    {fechaInicio && (
                      <p className="text-xs text-primary-500 dark:text-primary-400 mt-0.5">
                        {formatFechaDisplay(fechaInicio)} – {formatFechaDisplay(fechaFin)} · {activeRA.horas} hrs
                      </p>
                    )}
                    {iaStatus[activeTab]?.generado && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success-600 dark:text-success-400 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-success-400" />Generado con IA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <button
                      onClick={() => setViewMode(p => ({ ...p, [activeTab]: 'form' }))}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors ${mode === 'form' ? 'bg-primary-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >Formulario</button>
                    <button
                      onClick={() => setViewMode(p => ({ ...p, [activeTab]: 'preview' }))}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors ${mode === 'preview' ? 'bg-primary-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >Vista Previa</button>
                  </div>
                </div>

                {/* Error + retry banner */}
                {iaErrors[activeTab] && (
                  <div className="mb-4 p-3 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/40 flex items-start gap-3">
                    <svg className="w-4 h-4 text-warning-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-warning-800 dark:text-warning-300 mb-0.5">No se generó este RA correctamente</p>
                      <p className="text-[10px] text-warning-600 dark:text-warning-400 font-mono break-all line-clamp-2">{iaErrors[activeTab].slice(0, 140)}</p>
                    </div>
                    <button
                      onClick={() => handleRetryRA(activeTab)}
                      disabled={!!retryingRA}
                      className="btn-secondary text-xs py-1 gap-1.5 flex-shrink-0 disabled:opacity-50"
                    >
                      <svg className={`w-3.5 h-3.5 ${retryingRA === activeTab ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {retryingRA === activeTab ? 'Reintentando…' : 'Reintentar con IA'}
                    </button>
                  </div>
                )}

                {retryingRA === activeTab ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400 dark:text-slate-500">
                    <svg className="w-10 h-10 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <p className="text-sm font-medium">Regenerando RA {activeTab} con IA…</p>
                    <p className="text-xs">Esto puede tomar unos segundos</p>
                  </div>
                ) : mode === 'form' ? (
                  <PlaneacionForm
                    raData={raData}
                    onChange={d => setRAData(activeRA.unidadId, activeRA.subunidadId, d)}
                    unidadNombre={activeRA.unidadNombre}
                    unidadProposito={ud.proposito || ''}
                    onChangeUnidadProposito={p => setUnidadProposito(activeRA.unidadId, p)}
                    subunidadNombre={activeRA.subunidadNombre}
                    subunidadHoras={activeRA.horas}
                    raLabel={activeRA.raLabel}
                    fechaInicio={fechaInicio ? formatFechaDisplay(fechaInicio) : null}
                    fechaFin={fechaFin ? formatFechaDisplay(fechaFin) : null}
                  />
                ) : (
                  <PlaneacionPreview
                    raLabel={activeRA.raLabel}
                    raData={raData}
                    unidadNombre={activeRA.unidadNombre}
                    unidadIdx={activeRA.unidadIdx}
                    unidadProposito={ud.proposito || ''}
                    modulo={data.modulo}
                    datosDocente={data.datosDocente}
                    fechaInicio={fechaInicio}
                    fechaFin={fechaFin}
                    horas={activeRA.horas}
                    pagada={pagada}
                  />
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
