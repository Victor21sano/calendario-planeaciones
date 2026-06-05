import { useCallback, useRef } from 'react'
import { useReducedMotion } from './useReducedMotion'

/**
 * Resalte radial que sigue el cursor sobre una card.
 * Aplica el ref y onMouseMove a un elemento con la clase `.card-spotlight`
 * (que define el ::before con el gradiente en var(--spot-x/--spot-y)).
 */
export function useSpotlight() {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  const onMouseMove = useCallback(
    (e) => {
      if (reduced) return
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--spot-x', `${e.clientX - r.left}px`)
      el.style.setProperty('--spot-y', `${e.clientY - r.top}px`)
    },
    [reduced]
  )

  return { ref, onMouseMove }
}
