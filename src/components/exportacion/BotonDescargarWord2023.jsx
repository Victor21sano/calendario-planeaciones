import { useState } from 'react'
import { exportarPlaneacion2023 } from '../../services/exportar2023'
import { validarPlaneacionCompleta2023 } from '../../modelos/2023/validador.js'

/**
 * Botón "Descargar Word" para planeaciones Modelo 2023.
 * Valida antes de exportar y avisa si hay advertencias.
 */
export default function BotonDescargarWord2023({ planeacion, className = '' }) {
  const [descargando, setDescargando] = useState(false)

  async function handleDescargar() {
    if (descargando) return
    setDescargando(true)
    try {
      // Validación previa (no bloqueante — el usuario decide si continúa)
      const { ok, errores } = validarPlaneacionCompleta2023(planeacion)
      if (!ok && errores.length > 0) {
        const lista = errores.slice(0, 5).join('\n') + (errores.length > 5 ? `\n…y ${errores.length - 5} más.` : '')
        const continuar = window.confirm(
          `La planeación tiene ${errores.length} advertencia${errores.length > 1 ? 's' : ''}:\n\n${lista}\n\n¿Descargar de todos modos?`
        )
        if (!continuar) return
      }

      await exportarPlaneacion2023(planeacion)
    } catch (err) {
      console.error('[BotonDescargarWord2023]', err)
      window.alert('No se pudo generar el archivo Word: ' + err.message)
    } finally {
      setDescargando(false)
    }
  }

  return (
    <button
      onClick={handleDescargar}
      disabled={descargando}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white
        bg-gradient-to-r from-violet-600 to-primary-600
        hover:from-violet-500 hover:to-primary-500
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-sm hover:shadow-md transition-all duration-200
        ${className}`}
    >
      {descargando ? (
        /* Spinner */
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"/>
        </svg>
      ) : (
        /* Download icon */
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )}
      {descargando ? 'Generando…' : 'Descargar Word'}
    </button>
  )
}
