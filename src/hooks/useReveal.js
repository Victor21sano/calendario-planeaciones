import { useEffect, useRef } from 'react'
import { useReducedMotion } from './useReducedMotion'

/**
 * Entrada al hacer scroll: añade .is-revealed cuando el elemento entra
 * al viewport (una sola vez). Aplicar el ref a un elemento con la clase
 * `.reveal` o `.reveal-stagger`.
 * Con prefers-reduced-motion el elemento nace revelado.
 */
export function useReveal() {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      el.classList.add('is-revealed')
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reduced])

  return ref
}
