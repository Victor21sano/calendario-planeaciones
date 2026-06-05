import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/**
 * Cuenta animada desde el valor previo hacia `value` (easeOutCubic).
 * Si el valor no es numérico o el usuario pidió menos movimiento, lo
 * muestra tal cual sin animar.
 */
export default function AnimatedNumber({ value, duration = 800, className = '' }) {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(Number(value) || 0)
  const rafRef = useRef()

  useEffect(() => {
    const target = Number(value)
    if (reduced || Number.isNaN(target)) {
      setDisplay(value)
      return
    }
    const from = Number(fromRef.current) || 0
    if (from === target) {
      setDisplay(target)
      return
    }
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration, reduced])

  return <span className={className}>{display}</span>
}
