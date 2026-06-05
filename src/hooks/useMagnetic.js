import { useCallback, useRef } from 'react'
import { useReducedMotion } from './useReducedMotion'

/**
 * Atracción magnética sutil hacia el cursor. Se aplica a un *wrapper*
 * (no al botón) para no pisar las transformaciones hover/active del botón.
 * Devuelve handlers para un <span> contenedor.
 */
export function useMagnetic(strength = 6) {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  const onMouseMove = useCallback(
    (e) => {
      if (reduced) return
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
      const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`
    },
    [reduced, strength]
  )

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (el) el.style.transform = ''
  }, [])

  return { ref, onMouseMove, onMouseLeave }
}
