import { useEffect, useState } from 'react'

/**
 * Detecta la preferencia prefers-reduced-motion del sistema para que las
 * animaciones controladas por JS (spotlight, magnético, contador) puedan
 * desactivarse igual que las animaciones CSS.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
