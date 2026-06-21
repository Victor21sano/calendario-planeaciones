import { copiarTablaHTML } from '../../utils/copiarTabla'

const TERMINOLOGIA_DEFAULT = {
  modelo: '2023', unidad: 'Unidad', ra: 'Resultado de Aprendizaje', raCorto: 'RA',
  actividad: 'Propósito', tituloFormato: 'Formato de Planeación Didáctica',
}

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

// ─── Tabla cabecera módulo / asignatura ───────────────────────────────────────
function TablaModulo({ modulo = {}, grupo = {}, bloqueado, t = TERMINOLOGIA_DEFAULT }) {
  const es2025   = t.modelo === '2025'
  const palabra  = es2025 ? 'Asignatura' : 'Módulo'
  const mgm      = `${t.modelo} - ${grupo?.numero || '—'} - ${modulo?.siglema || '—'}`
  const colProp  = es2025 ? 'Meta educativa' : 'Competencia del Módulo'
  return (
    <Tabla titulo={palabra} getHTML={() => `<table style="border-collapse:collapse;width:100%"><tr><td>Datos ${palabra.toLowerCase()}</td></tr></table>`} bloqueado={bloqueado}>
      <table style={TS}><tbody>
        <tr><th style={THC}>Modelo - Grupo - {palabra}</th><th style={TH}>{colProp}</th><th style={THC}>Semestre</th></tr>
        <tr><td style={TDC}>{mgm}</td><td style={{...TD,whiteSpace:'pre-wrap'}}>{modulo?.competenciaModulo||'—'}</td><td style={TDC}>{modulo?.semestre||'—'}</td></tr>
      </tbody></table>
    </Tabla>
  )
}

// ─── Tabla unidad / ámbito ────────────────────────────────────────────────────
function TablaUnidad({ unidad = {}, bloqueado, t = TERMINOLOGIA_DEFAULT }) {
  return (
    <Tabla titulo={t.unidad} getHTML={() => ''} bloqueado={bloqueado}>
      <table style={TS}><tbody>
        <tr><th style={TH}>No. y Nombre de {t.unidad}</th><th style={TH}>Propósito del {t.unidad}</th></tr>
        <tr><td style={TD}>{unidad.nombre||'—'}</td><td style={{...TD,whiteSpace:'pre-wrap'}}>{unidad.proposito||'—'}</td></tr>
      </tbody></table>
    </Tabla>
  )
}

// ─── Tabla RA / Propósito Formativo ───────────────────────────────────────────
function TablaRA({ ra = {}, mostrarEvidencia = true, bloqueado, t = TERMINOLOGIA_DEFAULT }) {
  const ev = ra.actividadEvaluacion || {}
  const tituloTabla = `${t.ra} y Actividad de Evaluación`
  return (
    <Tabla titulo={tituloTabla} getHTML={() => ''} bloqueado={bloqueado}>
      <table style={TS}><caption className="sr-only">{tituloTabla}</caption><tbody>
        <tr><td colSpan={4} style={TITLE} aria-hidden="true">{tituloTabla.toUpperCase()}</td></tr>
        <tr><th scope="col" style={TH}>{t.ra}</th><th scope="col" style={THC}>Duración (hrs)</th><th scope="col" style={TH}>Actividad de Evaluación</th>{mostrarEvidencia && <th scope="col" style={TH}>Evidencia</th>}</tr>
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
      <table style={TS}><caption className="sr-only">Datos Específico</caption><tbody>
        <tr><td colSpan={4} style={TITLE} aria-hidden="true">DATOS ESPECÍFICO</td></tr>
        <tr><th scope="col" style={TH}>Propósito del Aprendizaje</th><th scope="col" style={THC}>Duración (hrs)</th><th scope="col" style={TH}>Modalidad</th><th scope="col" style={TH}>Fechas</th></tr>
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
      <table style={TS}><caption className="sr-only">{titulo}</caption><tbody>
        <tr>
          <td colSpan={6} aria-hidden="true" style={{ ...TITLE, backgroundColor: bg, color: '#0F172A', fontWeight: 'bold', textAlign: 'center', fontSize: '10pt' }}>
            {titulo} — {momento.tiempoHoras || '—'} Horas
          </td>
        </tr>
        <tr>
          <th scope="col" style={hdrStyle}>Ambiente</th>
          <th scope="col" style={hdrStyle}>Estrategia Enseñanza (Docente)</th>
          <th scope="col" style={hdrStyle}>Estrategia Aprendizaje (Alumno)</th>
          <th scope="col" style={hdrStyle}>Evaluación</th>
          <th scope="col" style={hdrStyle}>Recursos</th>
          <th scope="col" style={hdrStyle}>Est. Independiente</th>
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
export default function PaginaActividad({ cabecera, unidad, ra, actividad, numeroPagina, totalPaginas, esPrimeraActividadDelRA = true, bloqueada = false, terminologia = TERMINOLOGIA_DEFAULT }) {
  const bloq = bloqueada
  const t = { ...TERMINOLOGIA_DEFAULT, ...terminologia }

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
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 no-print">
          <span>
            Página {numeroPagina} / {totalPaginas} · {t.raCorto} {ra?.codigo} · {t.actividad} {actividad?.numero}
            {actividad?.noSesion ? ` · Sesión ${actividad.noSesion}` : ''}
          </span>
          <BtnCopiar getHTML={htmlPaginaCompleta} label="Copiar página completa" bloqueado={bloq} />
        </div>

        {/* Título oficial */}
        <div className="border-b-2 border-success-600 pb-2">
          <p className="text-lg font-light text-slate-800 dark:text-slate-100">
            {t.tituloFormato}
          </p>
        </div>

        <TablaDocente docente={cabecera?.docente} bloqueado={bloq} />
        <TablaModulo  modulo={cabecera?.modulo} grupo={cabecera?.grupo} bloqueado={bloq} t={t} />
        <TablaUnidad  unidad={unidad} bloqueado={bloq} t={t} />
        <TablaRA      ra={ra} mostrarEvidencia={esPrimeraActividadDelRA} bloqueado={bloq} t={t} />
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
            <div className="w-12 h-12 mx-auto rounded-full bg-info-100 dark:bg-info-900/40 flex items-center justify-center">
              <svg className="w-6 h-6 text-info-600 dark:text-info-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">Contenido bloqueado</p>
            <p className="text-sm text-slate-500">Adquiere créditos para desbloquear todas las actividades.</p>
            <a href="/comprar-creditos" className="btn-accent w-full justify-center py-2.5 text-sm">Adquirir créditos</a>
          </div>
        </div>
      )}
    </div>
  )
}
