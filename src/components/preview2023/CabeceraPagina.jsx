import BotonCopiarTabla from './BotonCopiarTabla'

const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/**
 * Cabecera repetible por página del Modelo 2023.
 * Contiene: logo CONALEP, título, tabla Docente, tabla Módulo, bloque Unidad.
 */
export default function CabeceraPagina({ cabecera, unidad, bloqueado = false }) {
  const { docente, modulo, grupo } = cabecera

  const modeloGrupoModulo = [
    '2023',
    grupo?.numero || '—',
    modulo?.siglema || '—',
  ].join(' - ')

  return (
    <div className="space-y-3">

      {/* Encabezado oficial */}
      <div className="flex items-center gap-4 pb-3 border-b-2 border-success-600">
        <img
          src="/conalep-logo.svg"
          alt="CONALEP"
          className="h-12 flex-shrink-0"
          onError={e => { e.target.style.display = 'none' }}
        />
        <h2 className="text-xl font-light text-slate-800 dark:text-slate-100 leading-tight">
          Formato de Planeación Didáctica
        </h2>
      </div>

      {/* Tabla Docente */}
      <div className="flex items-start gap-2">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800">
                <th className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-left font-semibold">Nombre</th>
                <th className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-left font-semibold">Núm. de Empleado</th>
                <th className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-left font-semibold">Plantel</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white dark:bg-slate-900/50">
                <td className="border border-slate-300 dark:border-slate-600 px-3 py-1.5">{docente?.nombre || '—'}</td>
                <td className="border border-slate-300 dark:border-slate-600 px-3 py-1.5">{docente?.numEmpleado || '—'}</td>
                <td className="border border-slate-300 dark:border-slate-600 px-3 py-1.5">{docente?.plantel || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <BotonCopiarTabla
          bloqueado={bloqueado}
          etiqueta="Docente"
          getHTML={() => `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial;font-size:11pt;width:100%">
            <tr style="background:#f8fafc"><th>Nombre</th><th>Núm. de Empleado</th><th>Plantel</th></tr>
            <tr><td>${esc(docente?.nombre)}</td><td>${esc(docente?.numEmpleado)}</td><td>${esc(docente?.plantel)}</td></tr>
          </table>`}
        />
      </div>

      {/* Tabla Módulo */}
      <div className="flex items-start gap-2">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800">
                <th className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-left font-semibold">Modelo - Grupo - Módulo</th>
                <th className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-left font-semibold">Competencia del Módulo</th>
                <th className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-center font-semibold w-20">Semestre</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white dark:bg-slate-900/50">
                <td className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 font-mono text-xs">{modeloGrupoModulo}</td>
                <td className="border border-slate-300 dark:border-slate-600 px-3 py-1.5">{modulo?.competenciaModulo || '—'}</td>
                <td className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-center">{modulo?.semestre || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <BotonCopiarTabla
          bloqueado={bloqueado}
          etiqueta="Módulo"
          getHTML={() => `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial;font-size:11pt;width:100%">
            <tr style="background:#f8fafc"><th>Modelo - Grupo - Módulo</th><th>Competencia del Módulo</th><th>Semestre</th></tr>
            <tr><td>${esc(modeloGrupoModulo)}</td><td>${esc(modulo?.competenciaModulo)}</td><td style="text-align:center">${modulo?.semestre || '—'}</td></tr>
          </table>`}
        />
      </div>

      {/* Unidad y Propósito */}
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-1 text-sm">
          <div className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 bg-white dark:bg-slate-900/50">
            <span className="font-semibold">No. y Nombre de Unidad de Aprendizaje: </span>
            {unidad?.nombre || '—'}
          </div>
          <div className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 bg-white dark:bg-slate-900/50">
            <span className="font-semibold">Propósito de la Unidad: </span>
            {unidad?.proposito || '—'}
          </div>
        </div>
        <BotonCopiarTabla
          bloqueado={bloqueado}
          etiqueta="Unidad"
          getHTML={() => `<div style="font-family:Arial;font-size:11pt">
            <p style="border:1px solid #cbd5e1;padding:6px"><strong>No. y Nombre de Unidad de Aprendizaje:</strong> ${esc(unidad?.nombre)}</p>
            <p style="border:1px solid #cbd5e1;padding:6px"><strong>Propósito de la Unidad:</strong> ${esc(unidad?.proposito)}</p>
          </div>`}
        />
      </div>
    </div>
  )
}
