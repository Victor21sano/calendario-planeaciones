# Sistema de Reveal + Pulido Editorial en Páginas Públicas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animaciones de entrada sobrias (scroll-reveal + hero escalonado) y pulido editorial en las 3 páginas SEO y Login, usando solo el sistema "Archivo Vivo" existente.

**Architecture:** Un hook `useReveal` (IntersectionObserver, patrón idéntico a `useMagnetic`/`useSpotlight`) añade `.is-revealed` a elementos con clase `.reveal`. CSS puro para transiciones (curva `--spring` existente). El hero anima al cargar con keyframes (`.reveal-hero`). Cero dependencias nuevas, cero cambios de lógica.

**Tech Stack:** React 18, Tailwind (tokens Archivo Vivo), CSS custom properties existentes (`--spring`).

**Spec:** `docs/superpowers/specs/2026-06-09-reveal-paginas-publicas-design.md`

**Restricción dura:** NO tocar `services/`, `contexts/`, `modelos/`, ni hooks de lógica. Solo presentación.

**Verificación (no hay test runner en este proyecto):** cada task se verifica con `npm run build` (debe pasar limpio) y la verificación visual final usa Chrome DevTools MCP.

---

### Task 1: Clases CSS del sistema de reveal

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Añadir clases reveal al final de `@layer components`** (después de `.badge`, línea ~399)

```css
  /*
   * REVEAL — entrada al hacer scroll (sobrio, estilo editorial).
   * El hook useReveal añade .is-revealed vía IntersectionObserver.
   * Solo opacity/transform: el contenido permanece en el árbol de
   * accesibilidad desde el primer render.
   */
  .reveal {
    opacity: 0;
    transform: translateY(14px);
    transition: opacity 550ms var(--spring), transform 550ms var(--spring);
  }
  .reveal.is-revealed {
    opacity: 1;
    transform: translateY(0);
  }

  /*
   * REVEAL-STAGGER — los hijos directos entran escalonados (80ms entre sí,
   * hasta 6 hijos). Para listas <ol>/<ul>/<dl> de las páginas SEO.
   */
  .reveal-stagger > * {
    opacity: 0;
    transform: translateY(14px);
    transition: opacity 550ms var(--spring), transform 550ms var(--spring);
  }
  .reveal-stagger.is-revealed > * {
    opacity: 1;
    transform: translateY(0);
  }
  .reveal-stagger.is-revealed > *:nth-child(2) { transition-delay: 80ms; }
  .reveal-stagger.is-revealed > *:nth-child(3) { transition-delay: 160ms; }
  .reveal-stagger.is-revealed > *:nth-child(4) { transition-delay: 240ms; }
  .reveal-stagger.is-revealed > *:nth-child(5) { transition-delay: 320ms; }
  .reveal-stagger.is-revealed > *:nth-child(6) { transition-delay: 400ms; }

  /*
   * REVEAL-HERO — entrada al CARGAR la página (no por scroll).
   * H1 primero, subtítulo +120ms, tercer elemento +240ms.
   */
  .reveal-hero {
    animation: revealHero 600ms var(--spring) both;
  }
  .reveal-hero-delay-1 { animation-delay: 120ms; }
  .reveal-hero-delay-2 { animation-delay: 240ms; }
```

- [ ] **Step 2: Añadir keyframes** junto a `@keyframes textShimmer` (línea ~481, fuera de los layers)

```css
@keyframes revealHero {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 3: Añadir al bloque `prefers-reduced-motion: reduce` existente** (el de línea ~486 que ya anula `.text-shimmer`)

```css
  /* Reveal: contenido visible sin animación */
  .reveal,
  .reveal-stagger > * {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
  .reveal-hero,
  .reveal-hero-delay-1,
  .reveal-hero-delay-2 {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
```

- [ ] **Step 4: Verificar compilación Tailwind sin bundler**

Run: `node node_modules/tailwindcss/lib/cli.js -c tailwind.config.js -i src/index.css -o /tmp/out.css && grep -c "reveal" /tmp/out.css`
Expected: compila sin error; grep devuelve >0

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "feat(css): clases reveal/reveal-stagger/reveal-hero con reduced-motion"
```

---

### Task 2: Hook useReveal

**Files:**
- Create: `src/hooks/useReveal.js`

- [ ] **Step 1: Crear el hook** (patrón idéntico a `useSpotlight`)

```js
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
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: limpio (~4s, sin errores)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useReveal.js
git commit -m "feat(hooks): useReveal — scroll reveal con IntersectionObserver"
```

---

### Task 3: Aplicar a PlaneacionesConalep.jsx

**Files:**
- Modify: `src/pages/PlaneacionesConalep.jsx`

Cambios: fondo → `.surface-atmosphere` (elimina `to-teal-50` ad-hoc); H1 a 5xl/6xl con `.reveal-hero`; subtítulo `.reveal-hero-delay-1`; cada sección de contenido con `useReveal()` + `.reveal`; lista `<ol>`/`<dl>` con `.reveal-stagger`; CTAs → `.btn-accent`/`.btn-secondary`.

- [ ] **Step 1: Reemplazar el archivo completo con:**

```jsx
import { Link } from 'react-router-dom'
import BrandLogo from '../components/brand/BrandLogo'
import { useReveal } from '../hooks/useReveal'

export default function PlaneacionesConalep() {
  const revealQue = useReveal()
  const revealComo = useReveal()
  const revealFaq = useReveal()
  const revealCta = useReveal()

  return (
    <div className="min-h-screen surface-atmosphere">
      <header className="mx-auto max-w-4xl px-4 py-6">
        <BrandLogo markClassName="w-10 h-10" />
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-20">
        <article>
          <h1 className="reveal-hero font-display text-5xl sm:text-6xl font-semibold tracking-tight text-slate-900 dark:text-white mt-10">
            Planeaciones Didácticas para CONALEP
          </h1>
          <p className="reveal-hero reveal-hero-delay-1 mt-5 text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
            Planea Pro genera automáticamente planeaciones didácticas en formato 2023 para docentes CONALEP. En minutos, no en horas.
          </p>

          <section className="mt-12 space-y-8">
            <div ref={revealQue} className="reveal">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">¿Qué incluye una planeación CONALEP formato 2023?</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                El formato oficial 2023 incluye: datos del docente y módulo, unidad de competencia, resultado de aprendizaje,
                datos específicos (propósito, duración, modalidad, fechas), y los tres momentos didácticos: inicio, desarrollo y cierre.
                Cada momento documenta ambiente de aprendizaje, estrategias de enseñanza y aprendizaje, evaluación, recursos y estudio independiente.
              </p>
            </div>

            <div ref={revealComo} className="reveal">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Cómo genera Planea Pro tu planeación</h2>
              <ol className="reveal-stagger is-revealed mt-3 space-y-2 text-slate-600 dark:text-slate-400 list-decimal list-inside leading-relaxed">
                <li>Subes tu PE (Programa de Estudio) y GPE (Guía de Práctica Educativa)</li>
                <li>La IA extrae módulos, unidades, resultados de aprendizaje y competencias</li>
                <li>Genera las sesiones en formato 2023 con actividades coherentes</li>
                <li>Exportas a Word listo para entregar o ajustar</li>
              </ol>
            </div>

            <div ref={revealFaq} className="reveal">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Preguntas frecuentes</h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">¿Funciona para todos los módulos CONALEP?</dt>
                  <dd className="mt-1 text-slate-600 dark:text-slate-400">Sí. Funciona con cualquier módulo que tenga PE y GPE disponibles. La IA se adapta al contenido específico de cada módulo.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">¿Puedo editar la planeación generada?</dt>
                  <dd className="mt-1 text-slate-600 dark:text-slate-400">Sí. La exportación a Word (.docx) permite editar cualquier campo antes de entregar.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">¿Es gratuito?</dt>
                  <dd className="mt-1 text-slate-600 dark:text-slate-400">Planea Pro ofrece una primera planeación gratis. Las siguientes usan créditos con precios accesibles para docentes.</dd>
                </div>
              </dl>
            </div>
          </section>

          <div ref={revealCta} className="reveal mt-12 flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="btn-accent justify-center px-6 py-3 text-base">
              Generar mi primera planeación gratis
            </Link>
            <Link to="/login" className="btn-secondary justify-center px-6 py-3 text-base">
              Iniciar sesión
            </Link>
          </div>
        </article>
      </main>
    </div>
  )
}
```

**Nota:** el `<ol>` lleva `is-revealed` fijo: sus hijos se escalonan cuando el `<div>` padre (que tiene el ref) se revela — pero como `.reveal-stagger` es un elemento distinto al del observer, se marca revelado de inicio y el stagger ocurre junto con el fade del padre. Si el efecto en navegador no escalona visiblemente, mover el ref `revealComo` directamente al `<ol>` (quitar `is-revealed` fijo) y dejar el `<div>` sin `.reveal`.

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: limpio

- [ ] **Step 3: Commit**

```bash
git add src/pages/PlaneacionesConalep.jsx
git commit -m "feat(seo): reveal + pulido editorial en PlaneacionesConalep"
```

---

### Task 4: Aplicar a GeneradorPlaneacionesIA.jsx

**Files:**
- Modify: `src/pages/GeneradorPlaneacionesIA.jsx`

Mismos cambios que Task 3. Archivo completo:

- [ ] **Step 1: Reemplazar el archivo completo con:**

```jsx
import { Link } from 'react-router-dom'
import BrandLogo from '../components/brand/BrandLogo'
import { useReveal } from '../hooks/useReveal'

export default function GeneradorPlaneacionesIA() {
  const revealQue = useReveal()
  const revealVentajas = useReveal()
  const revealFaq = useReveal()
  const revealCta = useReveal()

  return (
    <div className="min-h-screen surface-atmosphere">
      <header className="mx-auto max-w-4xl px-4 py-6">
        <BrandLogo markClassName="w-10 h-10" />
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-20">
        <article>
          <h1 className="reveal-hero font-display text-5xl sm:text-6xl font-semibold tracking-tight text-slate-900 dark:text-white mt-10">
            Generador de Planeaciones Didácticas con IA para CONALEP
          </h1>
          <p className="reveal-hero reveal-hero-delay-1 mt-5 text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
            Planea Pro usa inteligencia artificial para leer tu PE y GPE, y generar automáticamente una planeación didáctica completa en formato 2023.
          </p>

          <section className="mt-12 space-y-8">
            <div ref={revealQue} className="reveal">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">¿Qué hace la IA de Planea Pro?</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                El modelo de IA analiza el Programa de Estudio (PE) y la Guía de Práctica Educativa (GPE) para extraer
                automáticamente las competencias, resultados de aprendizaje, contenidos específicos y actividades propuestas.
                Con esa información, construye sesiones de aprendizaje estructuradas siguiendo el formato oficial 2023 de CONALEP.
              </p>
            </div>

            <div ref={revealVentajas} className="reveal">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Ventajas del generador con IA</h2>
              <ul className="reveal-stagger is-revealed mt-3 space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside leading-relaxed">
                <li>Reduce de horas a minutos la elaboración de planeaciones</li>
                <li>Respeta la estructura oficial del Modelo 2023 en cada campo</li>
                <li>Genera los tres momentos didácticos (inicio, desarrollo, cierre) con coherencia interna</li>
                <li>Exporta en formato Word compatible con las plantillas oficiales</li>
                <li>Regeneración gratuita si el resultado no cumple tus expectativas</li>
              </ul>
            </div>

            <div ref={revealFaq} className="reveal">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Preguntas frecuentes sobre el generador IA</h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">¿La IA inventa contenido o usa mi PE/GPE real?</dt>
                  <dd className="mt-1 text-slate-600 dark:text-slate-400">Usa el contenido de tus documentos. La IA no inventa módulos ni competencias — lee y estructura lo que está en tu PE y GPE.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">¿Qué formato de archivo acepta?</dt>
                  <dd className="mt-1 text-slate-600 dark:text-slate-400">Acepta PDF. Sube tu PE y tu GPE en PDF y el sistema extrae el contenido automáticamente.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">¿Puedo regenerar si no me gusta el resultado?</dt>
                  <dd className="mt-1 text-slate-600 dark:text-slate-400">Sí. La primera regeneración es gratuita. Planea Pro reconoce cuando la calidad no es satisfactoria.</dd>
                </div>
              </dl>
            </div>
          </section>

          <div ref={revealCta} className="reveal mt-12 flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="btn-accent justify-center px-6 py-3 text-base">
              Probar el generador gratis
            </Link>
            <Link to="/login" className="btn-secondary justify-center px-6 py-3 text-base">
              Iniciar sesión
            </Link>
          </div>
        </article>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: limpio

- [ ] **Step 3: Commit**

```bash
git add src/pages/GeneradorPlaneacionesIA.jsx
git commit -m "feat(seo): reveal + pulido editorial en GeneradorPlaneacionesIA"
```

---

### Task 5: Aplicar a HorarioDocenteConalep.jsx

**Files:**
- Modify: `src/pages/HorarioDocenteConalep.jsx`

Mismos cambios. Archivo completo:

- [ ] **Step 1: Reemplazar el archivo completo con:**

```jsx
import { Link } from 'react-router-dom'
import BrandLogo from '../components/brand/BrandLogo'
import { useReveal } from '../hooks/useReveal'

export default function HorarioDocenteConalep() {
  const revealQue = useReveal()
  const revealComo = useReveal()
  const revealFaq = useReveal()
  const revealCta = useReveal()

  return (
    <div className="min-h-screen surface-atmosphere">
      <header className="mx-auto max-w-4xl px-4 py-6">
        <BrandLogo markClassName="w-10 h-10" />
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-20">
        <article>
          <h1 className="reveal-hero font-display text-5xl sm:text-6xl font-semibold tracking-tight text-slate-900 dark:text-white mt-10">
            Horario Semestral para Docentes CONALEP — Generación Automática
          </h1>
          <p className="reveal-hero reveal-hero-delay-1 mt-5 text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
            Planea Pro calcula automáticamente el horario semestral por módulo, distribuyendo las horas según el PE y las fechas del ciclo escolar.
          </p>

          <section className="mt-12 space-y-8">
            <div ref={revealQue} className="reveal">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">¿Qué es el horario semestral CONALEP?</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                El horario semestral CONALEP distribuye las horas totales del módulo entre las semanas del ciclo escolar,
                asignando fechas de inicio y fin a cada resultado de aprendizaje y sus actividades. Es un requisito de
                entrega para la coordinación académica del plantel.
              </p>
            </div>

            <div ref={revealComo} className="reveal">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Cómo genera Planea Pro tu horario</h2>
              <ol className="reveal-stagger is-revealed mt-3 space-y-2 text-slate-600 dark:text-slate-400 list-decimal list-inside leading-relaxed">
                <li>Defines el rango de fechas del semestre (fecha inicio y fin)</li>
                <li>Indicas los días de la semana que tienes clase y las horas por día</li>
                <li>Planea Pro distribuye automáticamente las horas del PE respetando la carga horaria</li>
                <li>El horario se integra con la planeación didáctica para que las fechas sean coherentes</li>
              </ol>
            </div>

            <div ref={revealFaq} className="reveal">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Preguntas frecuentes</h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">¿El horario respeta días festivos?</dt>
                  <dd className="mt-1 text-slate-600 dark:text-slate-400">Planea Pro toma en cuenta los días hábiles al calcular la distribución. Puedes ajustar manualmente si hay días especiales en tu plantel.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">¿El horario se incluye en la exportación a Word?</dt>
                  <dd className="mt-1 text-slate-600 dark:text-slate-400">Sí. La exportación completa incluye el horario semestral y la planeación didáctica en un solo documento Word.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">¿Funciona con grupos de distintos turnos?</dt>
                  <dd className="mt-1 text-slate-600 dark:text-slate-400">Sí. Puedes configurar múltiples grupos con horarios distintos dentro de la misma cuenta.</dd>
                </div>
              </dl>
            </div>
          </section>

          <div ref={revealCta} className="reveal mt-12 flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="btn-accent justify-center px-6 py-3 text-base">
              Generar mi horario gratis
            </Link>
            <Link to="/login" className="btn-secondary justify-center px-6 py-3 text-base">
              Iniciar sesión
            </Link>
          </div>
        </article>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: limpio

- [ ] **Step 3: Commit**

```bash
git add src/pages/HorarioDocenteConalep.jsx
git commit -m "feat(seo): reveal + pulido editorial en HorarioDocenteConalep"
```

---

### Task 6: Escalonar la entrada en LoginPage

**Files:**
- Modify: `src/pages/LoginPage.jsx:51,61,90`

LoginPage ya tiene `animate-slide-up` en 3 elementos (hero móvil línea 51, panel desktop línea 61, card línea 90). Solo se añade delay escalonado. RegisterPage ya cumple (una sola card animada) — sin cambios.

- [ ] **Step 1: Añadir `animationDelay` inline a panel y card**

En línea 61 (panel desktop), cambiar:
```jsx
<section className="hidden animate-slide-up lg:block">
```
por:
```jsx
<section className="hidden animate-slide-up lg:block">
```
(sin cambio — el panel entra primero, a 0ms)

En línea 90 (card del formulario), cambiar:
```jsx
<div className="card relative z-10 w-full max-w-md justify-self-center p-8 animate-slide-up">
```
por:
```jsx
<div className="card relative z-10 w-full max-w-md justify-self-center p-8 animate-slide-up" style={{ animationDelay: '120ms' }}>
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: limpio

- [ ] **Step 3: Commit**

```bash
git add src/pages/LoginPage.jsx
git commit -m "feat(login): entrada escalonada panel→card (120ms)"
```

---

### Task 7: Verificación visual completa

**Files:** ninguno (solo verificación)

- [ ] **Step 1: Levantar dev server**

Run: `npm run dev` (en background)
Expected: vite sirve en localhost:5173

- [ ] **Step 2: Verificar las 4 páginas con Chrome DevTools MCP**

Abrir `http://localhost:5173/planeaciones-conalep`, `/generador-planeaciones-ia`, `/horario-docente-conalep`, `/login`. En cada una:
- Screenshot inicial: hero visible con H1 grande, fondo atmosphere (sin teal plano)
- Scroll hasta el CTA: secciones aparecen con fade-up; CTA coral (btn-accent) con shine al hover
- Verificar que NO hay layout shift (CLS) por el reveal

- [ ] **Step 3: Verificar reduced-motion**

Con `emulate` (chrome-devtools MCP) activar `prefers-reduced-motion: reduce`, recargar `/planeaciones-conalep`:
Expected: todo el contenido visible de inmediato, sin animaciones

- [ ] **Step 4: Lighthouse accesibilidad**

Run: `lighthouse_audit` (chrome-devtools MCP) sobre `/planeaciones-conalep` local
Expected: Accesibilidad 100 (se mantiene)

- [ ] **Step 5: Commit final si hubo ajustes, y reportar resultados al usuario**

---

## Self-Review (hecho al escribir el plan)

1. **Spec coverage:** hook (Task 2) ✓, CSS (Task 1) ✓, 3 páginas SEO (Tasks 3-5) ✓, Login/Register (Task 6, Register ya cumplía) ✓, verificación (Task 7) ✓.
2. **Placeholders:** ninguno — código completo en cada step.
3. **Consistencia de tipos:** `useReveal()` devuelve `ref` directo (no objeto), usado igual en Tasks 3-5. Clases CSS de Task 1 coinciden con las usadas en Tasks 3-6.
