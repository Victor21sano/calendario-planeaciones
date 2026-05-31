import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Hook que llama a `guardar(datos)` automáticamente cuando `datos` cambia,
 * con un debounce de `delayMs` (default 1500ms).
 *
 * estado: 'sincronizado' | 'guardando' | 'sin_guardar' | 'error'
 */
export function useAutoGuardado(datos, guardar, delayMs = 1500) {
  const [estado, setEstado] = useState('sincronizado')
  const [ultimoGuardado, setUltimoGuardado] = useState(null)
  const timerRef      = useRef(null)
  const datosRef      = useRef(datos)
  const primerRender  = useRef(true)

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false
      datosRef.current = datos
      return
    }

    if (JSON.stringify(datos) === JSON.stringify(datosRef.current)) return
    datosRef.current = datos
    setEstado('sin_guardar')

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      setEstado('guardando')
      try {
        await guardar(datos)
        setEstado('sincronizado')
        setUltimoGuardado(new Date())
      } catch (err) {
        console.error('[useAutoGuardado] Error al guardar:', err)
        setEstado('error')
      }
    }, delayMs)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [datos, guardar, delayMs])

  const forzarGuardado = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setEstado('guardando')
    try {
      await guardar(datosRef.current)
      setEstado('sincronizado')
      setUltimoGuardado(new Date())
    } catch {
      setEstado('error')
    }
  }, [guardar])

  return { estado, ultimoGuardado, forzarGuardado }
}
