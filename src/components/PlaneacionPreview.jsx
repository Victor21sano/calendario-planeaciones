import { useState } from 'react'
import { copiarElemento, copiarVariosElementos } from '../utils/copiarTabla'
import { useAuth } from '../contexts/AuthContext'

// ─── Inline styles for Word-compatible tables ─────────────────
// Se añade color: '#1a1a1a' explícito en TH y TD para que las tablas
// siempre muestren texto oscuro sobre fondos claros, independientemente
// del tema de la app (modo oscuro hereda color claro del body sin este fix).
const TS    = { borderCollapse: 'collapse', width: '100%', fontFamily: 'Arial, sans-serif', fontSize: '10pt', tableLayout: 'fixed' }
const TH    = { border: '1px solid #000', padding: '5px 8px', backgroundColor: '#D9E1F2', color: '#1a1a1a', fontWeight: 'bold', textAlign: 'left', verticalAlign: 'top' }
const TD    = { border: '1px solid #000', padding: '5px 8px', color: '#1a1a1a', textAlign: 'left', verticalAlign: 'top' }
const THL   = { ...TH, backgroundColor: '#BDD7EE', textAlign: 'center', fontSize: '9pt', textTransform: 'uppercase', letterSpacing: '1px' }
const TITLE = { ...TH, backgroundColor: '#1F4E79', color: '#FFFFFF', textAlign: 'center', fontSize: '11pt', letterSpacing: '1px' }
const SUBTH = { ...TH, backgroundColor: '#D6E4F0', fontSize: '8.5pt', textAlign: 'center' }

const PHASE_BG = {
  apertura:  '#BDD7EE',
  desarrollo: '#E2EFDA',
  cierre:    '#FCE4D6',
}
const PHASE_SUBTH = {
  apertura:  '#D6ECF8',
  desarrollo: '#EEF7E8',
  cierre:    '#FDF0E8',
}

function meses(dateStr) {
  if (!dateStr) return '—'
  const MONTHS = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d} DE ${MONTHS[m - 1]} DE ${y}`
}

// ─── CopyButton ───────────────────────────────────────────────
function CopyButton({ elementId, label = 'Copiar tabla' }) {
  const { modoGratis } = useAuth()
  const [copied,  setCopied]  = useState(false)
  const [blocked, setBlocked] = useState(false)

  async function handleCopy() {
    if (modoGratis) {
      setBlocked(true)
      setTimeout(() => setBlocked(false), 2500)
      return
    }
    await copiarElemento(elementId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      title={modoGratis ? 'Compra créditos para copiar este contenido' : undefined}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 no-print
        ${blocked
          ? 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300 border border-warning-300 dark:border-warning-700'
          : copied
            ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 border border-success-300 dark:border-success-700'
            : modoGratis
              ? 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 cursor-not-allowed'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400'
        }`}
    >
      {blocked ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
      ) : copied ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      ) : modoGratis ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      )}
      {blocked ? 'Desbloquear →' : copied ? 'Copiado' : label}
    </button>
  )
}

// ─── TableBlock: wrapper with label + copy button ─────────────
function TableBlock({ id, num, title, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between no-print">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Tabla {num} — {title}
        </span>
        <CopyButton elementId={id} />
      </div>
      <div id={id} className="overflow-x-auto">
        {children}
      </div>
    </div>
  )
}

// ─── Fase block for secuencia ─────────────────────────────────
function FaseTabla({ id, num, fase, sesion, contenidos }) {
  const phaseBg = PHASE_BG[fase]
  const phaseSubBg = PHASE_SUBTH[fase]
  const label = fase.toUpperCase()
  const data = sesion[fase]

  return (
    <TableBlock id={id} num={num} title={`${label} — Sesión ${sesion.numero}`}>
      <table style={TS}>
        <tbody>
          <tr>
            <td colSpan="6" style={{ ...THL, backgroundColor: phaseBg }}>
              {label} — SESIÓN {sesion.numero} ({sesion.duracion} hrs)
            </td>
          </tr>
          <tr>
            {['Contenido Específico','Enseñanza','Aprendizaje','Evaluación','Ambiente de aprendizaje','Recursos y materiales didácticos'].map(h => (
              <th key={h} style={{ ...SUBTH, backgroundColor: phaseSubBg, width: '16.6%' }}>{h}</th>
            ))}
          </tr>
          <tr>
            <td style={{ ...TD, whiteSpace: 'pre-wrap', fontSize: '9pt' }}>{contenidos || '—'}</td>
            <td style={{ ...TD, whiteSpace: 'pre-wrap' }}>{data?.ensenanza || '—'}</td>
            <td style={{ ...TD, whiteSpace: 'pre-wrap' }}>{data?.aprendizaje || '—'}</td>
            <td style={{ ...TD }}>{data?.evaluacion || '—'}</td>
            <td style={{ ...TD }}>{data?.ambiente || 'Salón de clases.'}</td>
            <td style={{ ...TD, whiteSpace: 'pre-wrap' }}>{data?.recursos || '—'}</td>
          </tr>
        </tbody>
      </table>
    </TableBlock>
  )
}

// ─── Main component ───────────────────────────────────────────
export default function PlaneacionPreview({
  raLabel,
  raData,
  unidadNombre,
  unidadIdx,
  unidadProposito,
  modulo,
  datosDocente,
  fechaInicio,
  fechaFin,
  horas,
  pagada = true,   // false solo si la materia fue creada en modo manual gratuito
}) {
  const { esAdmin } = useAuth()
  // modoGratis es LOCAL a esta materia: no depende del saldo actual del usuario.
  // Así una planeación pagada nunca queda bloqueada aunque el saldo baje a 0.
  const modoGratis = !esAdmin && !pagada
  const pid = `prev-${raLabel.replace('.', '-')}`
  const sesiones = raData.sesiones || []

  // Build list of all table element IDs for "copy all"
  const allIds = []
  const addId = (suffix) => { const id = `${pid}-${suffix}`; allIds.push(id); return id }

  const [copiedAll,  setCopiedAll]  = useState(false)
  const [blockedAll, setBlockedAll] = useState(false)

  async function copyAll() {
    if (modoGratis) {
      setBlockedAll(true)
      setTimeout(() => setBlockedAll(false), 2500)
      return
    }
    await copiarVariosElementos(allIds)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2500)
  }

  // Pre-compute IDs so allIds is populated in render order
  const ids = {
    t1: addId('t1'), t2: addId('t2'), t3: addId('t3'), t4: addId('t4'),
    t5: addId('t5'), t6: addId('t6'), t7: addId('t7'), t8: addId('t8'),
    t9: addId('t9'), t10: addId('t10'),
  }
  const sesionIds = sesiones.flatMap((_, si) => ['apertura','desarrollo','cierre'].map(f => addId(`ses${si}-${f}`)))
  const t_practicas = addId('practicas')
  const t_firmas = addId('firmas')
  const t_resumen = addId('resumen')
  let tableCounter = 0
  const tn = () => ++tableCounter

  return (
    <div className="relative space-y-6">

      {/* Marca de agua en modo gratis */}
      {modoGratis && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none flex items-center justify-center"
        >
          <span
            className="text-[9rem] font-black tracking-[0.2em] uppercase whitespace-nowrap rotate-[-30deg]"
            style={{ color: 'rgba(100,116,139,0.07)' }}
          >
            PLANEA PRO
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Vista Previa — RA {raLabel}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {sesiones.length > 0 ? `${10 + sesiones.length * 3 + 3} tablas` : '13 tablas base'} · Haz clic en "Copiar tabla" para pegar en Word
          </p>
        </div>
        <button
          onClick={copyAll}
          title={modoGratis ? 'Compra créditos para copiar las tablas' : undefined}
          className={`btn-primary gap-2 no-print ${
            blockedAll ? 'from-warning-500 to-warning-600'
            : copiedAll ? 'from-success-600 to-success-700'
            : modoGratis ? 'opacity-60 cursor-not-allowed'
            : ''
          }`}
        >
          {blockedAll || modoGratis ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          {blockedAll ? 'Compra créditos para desbloquear'
            : copiedAll ? 'Copiada toda la planeación'
            : modoGratis ? 'Bloqueado — Comprar créditos'
            : 'Copiar toda la planeación'}
        </button>
      </div>

      {/* Banner modo gratis */}
      {modoGratis && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/40 no-print">
          <svg className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-warning-800 dark:text-warning-200">Vista previa — Contenido bloqueado</p>
            <p className="text-xs text-warning-700 dark:text-warning-300 mt-0.5">
              Esta es una vista previa de la planeación. Compra créditos para generar el contenido completo con IA y copiarlo a tu formato.
            </p>
          </div>
          <a href="/comprar-creditos" className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning-500 hover:bg-warning-600 text-white text-xs font-semibold transition-colors">
            Comprar créditos
          </a>
        </div>
      )}

      {/* ── Tabla 1: Título / Fecha ── */}
      <TableBlock id={ids.t1} num={tn()} title="Título y Fecha de elaboración">
        <table style={TS}>
          <tbody>
            <tr>
              <td colSpan="2" style={TITLE}>PLANEACIÓN DIDÁCTICA POR RESULTADO DE APRENDIZAJE</td>
            </tr>
            <tr>
              <th style={{ ...TH, width: '40%' }}>Fecha de elaboración:</th>
              <td style={TD}>{raData.fechaElaboracion || '—'}</td>
            </tr>
          </tbody>
        </table>
      </TableBlock>

      {/* ── Tabla 2: Plantel / Docente ── */}
      <TableBlock id={ids.t2} num={tn()} title="Plantel y Docente">
        <table style={TS}>
          <tbody>
            <tr>
              <th style={{ ...TH, width: '25%' }}>Nombre del plantel:</th>
              <td style={{ ...TD, width: '25%' }}>{datosDocente.plantel || '—'}</td>
              <th style={{ ...TH, width: '25%' }}>Nombre del docente:</th>
              <td style={{ ...TD, width: '25%' }}>{datosDocente.nombre || '—'}</td>
            </tr>
          </tbody>
        </table>
      </TableBlock>

      {/* ── Tabla 3: Módulo ── */}
      <TableBlock id={ids.t3} num={tn()} title="Datos del Módulo">
        <table style={TS}>
          <tbody>
            <tr>
              <th style={{ ...TH, width: '30%' }}>Nombre del módulo:</th>
              <th style={{ ...TH, width: '10%' }}>Semestre:</th>
              <th style={{ ...TH, width: '20%' }}>Competencia:</th>
              <th style={{ ...TH, width: '40%' }}>Propósito del módulo:</th>
            </tr>
            <tr>
              <td style={TD}>{modulo.nombre || '—'}</td>
              <td style={{ ...TD, textAlign: 'center' }}>{modulo.semestre || '—'}</td>
              <td style={TD}>{modulo.competencia || 'Profesional'}</td>
              <td style={{ ...TD, whiteSpace: 'pre-wrap' }}>{modulo.proposito || '—'}</td>
            </tr>
          </tbody>
        </table>
      </TableBlock>

      {/* ── Tabla 4: Unidad ── */}
      <TableBlock id={ids.t4} num={tn()} title="Unidad de Aprendizaje">
        <table style={TS}>
          <tbody>
            <tr>
              <th style={{ ...TH, width: '40%' }}>Número y nombre de la unidad de aprendizaje:</th>
              <th style={{ ...TH, width: '60%' }}>Propósito de la unidad:</th>
            </tr>
            <tr>
              <td style={TD}>Unidad {unidadIdx}. {unidadNombre || '—'}</td>
              <td style={{ ...TD, whiteSpace: 'pre-wrap' }}>{unidadProposito || '—'}</td>
            </tr>
          </tbody>
        </table>
      </TableBlock>

      {/* ── Tabla 5: Competencias genéricas ── */}
      <TableBlock id={ids.t5} num={tn()} title="Competencias Genéricas y Atributos">
        <table style={TS}>
          <tbody>
            <tr>
              <th style={{ ...TH, width: '40%' }}>Competencia Genérica:</th>
              <th style={{ ...TH, width: '60%' }}>Atributos:</th>
            </tr>
            <tr>
              <td style={TD}>{raData.competenciasGenericas || '—'}</td>
              <td style={TD}>{raData.atributos || '—'}</td>
            </tr>
          </tbody>
        </table>
      </TableBlock>

      {/* ── Tabla 6: Resultado de Aprendizaje ── */}
      <TableBlock id={ids.t6} num={tn()} title="Resultado de Aprendizaje">
        <table style={TS}>
          <tbody>
            <tr>
              <th style={{ ...TH, width: '50%' }}>Resultado de aprendizaje:</th>
              <th style={{ ...TH, width: '10%' }}>Duración:</th>
              <th style={{ ...TH, width: '40%' }}>Actividad de evaluación:</th>
            </tr>
            <tr>
              <td style={{ ...TD, whiteSpace: 'pre-wrap' }}>{raData.nombreCompleto || raData.subunidadNombre || '—'}</td>
              <td style={{ ...TD, textAlign: 'center' }}>{horas} hrs</td>
              <td style={{ ...TD, whiteSpace: 'pre-wrap' }}>{raData.actividadEvaluacion || '—'}</td>
            </tr>
          </tbody>
        </table>
      </TableBlock>

      {/* ── Tabla 7: Socioemocional ── */}
      <TableBlock id={ids.t7} num={tn()} title="Dimensión Socioemocional">
        <table style={TS}>
          <tbody>
            <tr>
              <th style={{ ...TH, width: '40%' }}>Dimensión Socioemocional / Habilidad Socioemocional:</th>
              <th style={{ ...TH, width: '40%' }}>Número y nombre de la lección:</th>
              <th style={{ ...TH, width: '20%' }}>Duración en minutos:</th>
            </tr>
            <tr>
              <td style={TD}>{raData.socioemocional?.dimension || '—'}</td>
              <td style={TD}>{raData.socioemocional?.leccion || '—'}</td>
              <td style={{ ...TD, textAlign: 'center' }}>{raData.socioemocional?.duracion || '—'}</td>
            </tr>
          </tbody>
        </table>
      </TableBlock>

      {/* ── Tabla 8: Propósito / Sesiones ── */}
      <TableBlock id={ids.t8} num={tn()} title="Propósito de Aprendizaje por Sesión">
        <table style={TS}>
          <tbody>
            <tr>
              <th style={{ ...TH, width: '60%' }}>Propósito de aprendizaje:</th>
              <th style={{ ...TH, width: '20%' }}>Número de sesión:</th>
              <th style={{ ...TH, width: '20%' }}>Duración:</th>
            </tr>
            {sesiones.length > 0 ? sesiones.map((ses, i) => (
              <tr key={i}>
                {i === 0 && <td rowSpan={sesiones.length} style={{ ...TD, whiteSpace: 'pre-wrap' }}>{raData.propositoAprendizaje || '—'}</td>}
                <td style={{ ...TD, textAlign: 'center' }}>{ses.numero}</td>
                <td style={{ ...TD, textAlign: 'center' }}>{ses.duracion}</td>
              </tr>
            )) : (
              <tr>
                <td style={{ ...TD, whiteSpace: 'pre-wrap' }}>{raData.propositoAprendizaje || '—'}</td>
                <td style={{ ...TD, textAlign: 'center' }}>—</td>
                <td style={{ ...TD, textAlign: 'center' }}>—</td>
              </tr>
            )}
          </tbody>
        </table>
      </TableBlock>

      {/* ── Tabla 9: Aprendizaje esperado / Producto ── */}
      <TableBlock id={ids.t9} num={tn()} title="Aprendizaje Esperado y Producto">
        <table style={TS}>
          <tbody>
            <tr>
              <th style={{ ...TH, width: '50%' }}>Aprendizaje esperado:</th>
              <th style={{ ...TH, width: '50%' }}>Producto esperado / Evidencia a recopilar:</th>
            </tr>
            <tr>
              <td style={{ ...TD, whiteSpace: 'pre-wrap' }}>{raData.aprendizajeEsperado || '—'}</td>
              <td style={{ ...TD, whiteSpace: 'pre-wrap' }}>{raData.productoEsperado || raData.evidencias || '—'}</td>
            </tr>
          </tbody>
        </table>
      </TableBlock>

      {/* ── Tabla 10: Modalidad ── */}
      <TableBlock id={ids.t10} num={tn()} title="Modalidad de Aprendizaje">
        <table style={TS}>
          <tbody>
            <tr>
              <th style={{ ...TH, width: '40%' }}>Modalidad de aprendizaje:</th>
              <td style={TD}>{raData.modalidad || 'Presencial'}</td>
            </tr>
          </tbody>
        </table>
      </TableBlock>

      {/* ── Tablas 11+: Secuencia Didáctica por sesión ── */}
      {sesiones.length === 0 && (
        <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-center text-sm text-slate-500 dark:text-slate-400">
          Configura al menos una sesión en el formulario para ver la secuencia didáctica.
        </div>
      )}

      {sesiones.map((ses, si) => (
        ['apertura','desarrollo','cierre'].map((fase, fi) => {
          const idKey = sesionIds[si * 3 + fi]
          return (
            <FaseTabla
              key={`${si}-${fase}`}
              id={idKey}
              num={tn()}
              fase={fase}
              sesion={ses}
              contenidos={raData.contenidos}
            />
          )
        })
      ))}

      {/* ── Tabla Prácticas ── */}
      <TableBlock id={t_practicas} num={tn()} title="Programación de Prácticas">
        <table style={TS}>
          <tbody>
            <tr>
              <th style={TH}>Contenido</th>
              <th style={TH}>Nombre de la práctica</th>
              <th style={TH}>Objetivo</th>
              <th style={TH}>Evaluación</th>
              <th style={TH}>Recursos / Fecha</th>
            </tr>
            {(raData.practicas || []).length > 0
              ? (raData.practicas || []).map((p, i) => (
                <tr key={i}>
                  <td style={TD}>{p.contenido || '—'}</td>
                  <td style={TD}>{p.nombre || '—'}</td>
                  <td style={{ ...TD, whiteSpace: 'pre-wrap' }}>{p.objetivo || '—'}</td>
                  <td style={TD}>{p.evaluacion || '—'}</td>
                  <td style={TD}>{p.recursos || '—'}</td>
                </tr>
              ))
              : (
                <tr>
                  <td colSpan="5" style={{ ...TD, textAlign: 'center', color: '#888' }}>Sin prácticas registradas</td>
                </tr>
              )
            }
          </tbody>
        </table>
      </TableBlock>

      {/* ── Tabla Firmas ── */}
      <TableBlock id={t_firmas} num={tn()} title="Firmas">
        <table style={TS}>
          <tbody>
            <tr>
              <th style={{ ...TH, width: '40%' }}>Elaboró:</th>
              <td style={{ ...TD, width: '10%' }}></td>
              <th style={{ ...TH, width: '40%' }}>Validó:</th>
            </tr>
            <tr>
              <td style={{ ...TD, height: '50px', textAlign: 'center', verticalAlign: 'bottom' }}>
                {datosDocente.nombre || '___________________________'}
              </td>
              <td style={TD}></td>
              <td style={{ ...TD, height: '50px', textAlign: 'center', verticalAlign: 'bottom' }}>
                {datosDocente.coordinador || '___________________________'}
              </td>
            </tr>
          </tbody>
        </table>
      </TableBlock>

      {/* ── Tabla Resumen de Sesiones ── */}
      <TableBlock id={t_resumen} num={tn()} title="Resumen de Sesiones">
        <table style={TS}>
          <tbody>
            <tr>
              <th style={{ ...TH, width: '33%', textAlign: 'center' }}>Número de sesión:</th>
              <th style={{ ...TH, width: '33%', textAlign: 'center' }}>Duración parcial:</th>
              <th style={{ ...TH, width: '33%', textAlign: 'center' }}>Duración total (RA):</th>
            </tr>
            {sesiones.length > 0
              ? sesiones.map((ses, i) => (
                <tr key={i}>
                  <td style={{ ...TD, textAlign: 'center' }}>{ses.numero}</td>
                  <td style={{ ...TD, textAlign: 'center' }}>{ses.duracion} hrs</td>
                  <td style={{ ...TD, textAlign: 'center' }}>{horas} hrs</td>
                </tr>
              ))
              : (
                <tr>
                  <td colSpan="3" style={{ ...TD, textAlign: 'center' }}>—</td>
                </tr>
              )
            }
          </tbody>
        </table>
      </TableBlock>

    </div>
  )
}
