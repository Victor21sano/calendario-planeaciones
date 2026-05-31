import { copiarTablaHTML } from '../../utils/copiarTabla'

// ─── Estilos de tabla inline (Word-compatible, mismo patrón que Modelo 2018) ─
const TS   = { borderCollapse: 'collapse', width: '100%', fontFamily: 'Calibri, Arial, sans-serif', fontSize: '10pt' }
const TH   = { border: '1px solid #CBD5E1', padding: '5px 8px', backgroundColor: '#F1F5F9', color: '#0F172A', fontWeight: 'bold', textAlign: 'left', verticalAlign: 'top' }
const TD   = { border: '1px solid #CBD5E1', padding: '5px 8px', color: '#0F172A', textAlign: 'left', verticalAlign: 'top' }
const THC  = { ...TH, textAlign: 'center' }
const TDC  = { ...TD, textAlign: 'center' }
const TITLE = { ...TH, backgroundColor: '#1E293B', color: '#FFFFFF', textAlign: 'center', fontSize: '11pt' }
const MOMENTO_BG = { inicio: '#EDE9FE', desarrollo: '#D1FAE5', cierre: '#FEF3C7' }

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]))

// ─── Botón copiar ─────────────────────────────────────────────────────────────
function BtnCopiar({ getHTML, label = 'Copiar', bloqueado = false }) {
  const handle = async () => {
    if (bloqueado) return
    const html = typeof getHTML === 'function' ? getHTML() : getHTML
    await copiarTablaHTML(html)
  }
  return (
    <button onClick={handle} disabled={bloqueado}
      className="text-[10px] font-medium px-2 py-1 rounded border border-slate-200 dark:border-slate-700
        text-slate-500 dark:text-slate-400 hover:text-primary-600 hover:border-primary-400
        disabled:opacity-40 disabled:cursor-not-allowed transition-colors no-print">
      {label}
    </button>
  )
}

// ─── Tabla wrapper con título + botón copiar ──────────────────────────────────
function Tabla({ titulo, children, getHTML, bloqueado }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between no-print">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{titulo}</span>
        <BtnCopiar getHTML={getHTML} label="Copiar" bloqueado={bloqueado} />
      </div>
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  )
}

// ─── Tabla cabecera docente ───────────────────────────────────────────────────
function TablaDocente({ docente = {}, bloqueado }) {
  const html = () => `<table style="border-collapse:collapse;width:100%;font-family:Calibri,Arial;font-size:10pt">
    <tr><th style="border:1px solid #CBD5E1;padding:5px 8px;background:#F1F5F9;font-weight:bold;text-align:center">Nombre</th>
        <th style="border:1px solid #CBD5E1;padding:5px 8px;background:#F1F5F9;font-weight:bold;text-align:center">Núm. Empleado</th>
        <th style="border:1px solid #CBD5E1;padding:5px 8px;background:#F1F5F9;font-weight:bold;text-align:center">Plantel</th></tr>
    <tr><td style="border:1px solid #CBD5E1;padding:5px 8px;text-align:center">${esc(docente.nombre)}</td>
        <td style="border:1px solid #CBD5E1;padding:5px 8px;text-align:center">${esc(docente.numEmpleado)}</td>
        <td style="border:1px solid #CBD5E1;padding:5px 8px;text-align:center">${esc(docente.plantel)}</td></tr>
  </table>`
  return (
    <Tabla titulo="Datos del docente" getHTML={html} bloqueado={bloqueado}>
      <table style={TS}><tbody>
        <tr><th style={THC}>Nombre</th><th style={THC}>Núm. Empleado</th><th style={THC}>Plantel</th></tr>
        <tr><td style={TDC}>{docente.nombre||'—'}</td><td style={TDC}>{docente.numEmpleado||'—'}</td><td style={TDC}>{docente.plantel||'—'}</td></tr>
      </tbody></table>
    </Tabla>
  )
}

// ─── Tabla cabecera módulo ────────────────────────────────────────────────────
function TablaModulo({ modulo = {}, grupo = {}, bloqueado }) {
  const mgm = `2023 - ${grupo?.numero || '—'} - ${modulo?.siglema || '—'}`
  return (
    <Tabla titulo="Módulo" getHTML={() => `<table style="border-collapse:collapse;width:100%"><tr><td>Datos módulo</td></tr></table>`} bloqueado={bloqueado}>
      <table style={TS}><tbody>
        <tr><th style={THC}>Modelo - Grupo - Módulo</th><th style={TH}>Competencia del Módulo</th><th style={THC}>Semestre</th></tr>
        <tr><td style={TDC}>{mgm}</td><td style={TD}>{modulo?.competenciaModulo||'—'}</td><td style={TDC}>{modulo?.semestre||'—'}</td></tr>
      </tbody></table>
    </Tabla>
  )
}

// ─── Tabla unidad ─────────────────────────────────────────────────────────────
function TablaUnidad({ unidad = {}, bloqueado }) {
  return (
    <Tabla titulo="Unidad" getHTML={() => ''} bloqueado={bloqueado}>
      <table style={TS}><tbody>
        <tr><th style={TH}>No. y Nombre de Unidad</th><th style={TH}>Propósito de la Unidad</th></tr>
        <tr><td style={TD}>{unidad.nombre||'—'}</td><td style={{...TD,whiteSpace:'pre-wrap'}}>{unidad.proposito||'—'}</td></tr>
      </tbody></table>
    </Tabla>
  )
}

// ─── Tabla RA ─────────────────────────────────────────────────────────────────
function TablaRA({ ra = {}, mostrarEvidencia = true, bloqueado }) {
  const ev = ra.actividadEvaluacion || {}
  return (
    <Tabla titulo="Resultado y Actividad de Aprendizaje" getHTML={() => ''} bloqueado={bloqueado}>
      <table style={TS}><tbody>
        <tr><td colSpan={4} style={TITLE}>RESULTADO Y ACTIVIDAD DE APRENDIZAJE</td></tr>
        <tr><th style={TH}>Resultado de Aprendizaje</th><th style={THC}>Duración (hrs)</th><th style={TH}>Actividad de Evaluación</th>{mostrarEvidencia && <th style={TH}>Evidencia</th>}</tr>
        <tr>
          <td style={{...TD,whiteSpace:'pre-wrap'}}>{ra.titulo||'—'}</td>
          <td style={TDC}>{ra.duracionHoras||'—'}</td>
          <td style={{...TD,whiteSpace:'pre-wrap'}}>{ev.descripcion||'—'}</td>
          {mostrarEvidencia && <td style={TD}>{ev.evidencia||'—'}</td>}
        </tr>
      </tbody></table>
    </Tabla>
  )
}

// ─── Tabla datos específicos ──────────────────────────────────────────────────
function TablaDatosEspecifico({ actividad = {}, bloqueado }) {
  return (
    <Tabla titulo="Datos Específico" getHTML={() => ''} bloqueado={bloqueado}>
      <table style={TS}><tbody>
        <tr><td colSpan={4} style={TITLE}>DATOS ESPECÍFICO</td></tr>
        <tr><th style={TH}>Propósito del Aprendizaje</th><th style={THC}>Duración (hrs)</th><th style={TH}>Modalidad</th><th style={TH}>Fechas</th></tr>
        <tr>
          <td style={{...TD,whiteSpace:'pre-wrap'}}>{actividad.propositoAprendizaje||'—'}</td>
          <td style={TDC}>{actividad.duracionHoras||'—'}</td>
          <td style={TDC}>{actividad.modalidad||'—'}</td>
          <td style={TD}>{actividad.fechaInicio||'—'} → {actividad.fechaFin||'—'}</td>
        </tr>
        <tr><th style={TH} colSpan={4}>Contenido Específico</th></tr>
        <tr><td style={{...TD,whiteSpace:'pre-wrap'}} colSpan={4}>{actividad.contenidoEspecifico||'—'}</td></tr>
      </tbody></table>
    </Tabla>
  )
}

// ─── Tabla momento (Inicio/Desarrollo/Cierre) — 6 columnas estilo 2018 ────────
function TablaMomento({ tipo, momento = {}, bloqueado }) {
  const titulo   = tipo === 'inicio' ? 'INICIO' : tipo === 'desarrollo' ? 'DESARROLLO' : 'CIERRE'
  const bg       = MOMENTO_BG[tipo] || '#F1F5F9'
  const hdrStyle = { ...TH, backgroundColor: bg, textAlign: 'center' }
  const estudio  = momento.estudioIndependiente || {}
  const textoEst = estudio.descripcion
    ? `${estudio.descripcion} (${estudio.duracionHoras || 0} hrs)`
    : '—'

  return (
    <Tabla titulo={titulo} getHTML={() => ''} bloqueado={bloqueado}>
      <table style={TS}><tbody>
        <tr>
          <td colSpan={6} style={{ ...TITLE, backgroundColor: bg, color: '#0F172A', fontWeight: 'bold', textAlign: 'center', fontSize: '10pt' }}>
            {titulo} — {momento.tiempoHoras || '—'} Horas
          </td>
        </tr>
        <tr>
          <th style={hdrStyle}>Ambiente</th>
          <th style={hdrStyle}>Estrategia Enseñanza (Docente)</th>
          <th style={hdrStyle}>Estrategia Aprendizaje (Alumno)</th>
          <th style={hdrStyle}>Evaluación</th>
          <th style={hdrStyle}>Recursos</th>
          <th style={hdrStyle}>Est. Independiente</th>
        </tr>
        <tr>
          <td style={{ ...TD, verticalAlign: 'top', width: '10%' }}>{momento.ambienteAprendizaje||'—'}</td>
          <td style={{ ...TD, whiteSpace: 'pre-wrap', width: '22%' }}>{momento.estrategiaEnsenanzaDocente||'—'}</td>
          <td style={{ ...TD, whiteSpace: 'pre-wrap', width: '22%' }}>{momento.estrategiaAprendizajeAlumno||'—'}</td>
          <td style={{ ...TD, whiteSpace: 'pre-wrap', width: '18%' }}>{momento.estrategiaEvaluacion||'—'}</td>
          <td style={{ ...TD, width: '16%' }}>{momento.recursosMaterialesDidacticos||'—'}</td>
          <td style={{ ...TD, width: '12%' }}>{textoEst}</td>
        </tr>
      </tbody></table>
    </Tabla>
  )
}

// ─── Página completa ──────────────────────────────────────────────────────────
/**
 * Una "página" de planeación Modelo 2023 en formato tabular estilo 2018.
 * Si `bloqueada === true`, muestra PaywallOverlay encima.
 */
export default function PaginaActividad({ cabecera, unidad, ra, actividad, numeroPagina, totalPaginas, esPrimeraActividadDelRA = true, bloqueada = false }) {
  const bloq = bloqueada

  const htmlPaginaCompleta = () => {
    const el = document.getElementById(`pag-2023-${numeroPagina}`)
    return el ? el.innerHTML : ''
  }

  return (
    <div className="relative preview-2023-pagina">
      <article
        id={`pag-2023-${numeroPagina}`}
        className="mx-auto max-w-full md:max-w-[960px] bg-white dark:bg-slate-900
                   rounded-xl border border-slate-200 dark:border-slate-800
                   p-4 md:p-6 space-y-4 print:shadow-none print:border-0 print:rounded-none"
      >
        {/* Barra superior */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 no-print">
          <span>
            Página {numeroPagina} / {totalPaginas} · RA {ra?.codigo} · Propósito {actividad?.numero}
            {actividad?.noSesion ? ` · Sesión ${actividad.noSesion}` : ''}
          </span>
          <BtnCopiar getHTML={htmlPaginaCompleta} label="Copiar página completa" bloqueado={bloq} />
        </div>

        {/* Título oficial */}
        <div className="border-b-2 border-emerald-600 pb-2">
          <p className="text-lg font-light text-slate-800 dark:text-slate-100">
            Formato de Planeación Didáctica
          </p>
        </div>

        <TablaDocente docente={cabecera?.docente} bloqueado={bloq} />
        <TablaModulo  modulo={cabecera?.modulo} grupo={cabecera?.grupo} bloqueado={bloq} />
        <TablaUnidad  unidad={unidad} bloqueado={bloq} />
        <TablaRA      ra={ra} mostrarEvidencia={esPrimeraActividadDelRA} bloqueado={bloq} />
        <TablaDatosEspecifico actividad={actividad} bloqueado={bloq} />
        <TablaMomento tipo="inicio"     momento={actividad?.momentos?.inicio}     bloqueado={bloq} />
        <TablaMomento tipo="desarrollo" momento={actividad?.momentos?.desarrollo} bloqueado={bloq} />
        <TablaMomento tipo="cierre"     momento={actividad?.momentos?.cierre}     bloqueado={bloq} />
      </article>

      {/* Paywall overlay */}
      {bloqueada && (
        <div className="absolute inset-0 z-10 backdrop-blur-sm bg-white/70 dark:bg-slate-900/70
                        flex items-center justify-center rounded-xl">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700
                          p-6 max-w-sm mx-4 text-center space-y-4 animate-scale-in">
            <div className="w-12 h-12 mx-auto rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">Contenido bloqueado</p>
            <p className="text-sm text-slate-500">Adquiere créditos para desbloquear todas las actividades.</p>
            <a href="/comprar-creditos" className="btn-primary w-full justify-center py-2.5 text-sm">Adquirir créditos</a>
          </div>
        </div>
      )}
    </div>
  )
}
