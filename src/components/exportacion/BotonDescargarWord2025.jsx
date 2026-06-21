import { useState } from 'react'
import { exportarPlaneacion2025 } from '../../services/exportar2025'

/**
 * Botón "Descargar Word" para planeaciones Modelo 2025 (formato oficial de impresión).
 * Recibe el objeto nativo planeacion2025.
 */
export default function BotonDescargarWord2025({ planeacion, className = '' }) {
  const [descargando, setDescargando] = useState(false)

  async function handleDescargar() {
    if (descargando) return
    setDescargando(true)
    try {
      await exportarPlaneacion2025(planeacion)
    } catch (err) {
      console.error('[BotonDescargarWord2025]', err)
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
        bg-gradient-to-r from-info-600 to-primary-600
        hover:from-info-500 hover:to-primary-500
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-sm hover:shadow-md transition-all duration-200
        ${className}`}
    >
      {descargando ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )}
      {descargando ? <span className="text-shimmer">Generando…</span> : 'Descargar Word'}
    </button>
  )
}
