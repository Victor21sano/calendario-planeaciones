# Diseño: Sistema de Reveal + Pulido Editorial en Páginas Públicas

**Fecha:** 2026-06-09
**Alcance:** Solo presentación (capa visual). Páginas públicas: 3 páginas SEO + Login/Register.
**Objetivo:** Elevar las páginas públicas al nivel de pulido de sitios premium (estilo sobrio tipo Apple) usando exclusivamente el sistema de diseño "Archivo Vivo" existente, sin librerías nuevas.

## Contexto / Auditoría

Hallazgos en las páginas públicas (`PlaneacionesConalep.jsx`, `GeneradorPlaneacionesIA.jsx`, `HorarioDocenteConalep.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`):

1. Cero animación de entrada — todo el contenido aparece de golpe.
2. CTAs inconsistentes con Archivo Vivo — botones con clases inline (`bg-brand-700`) en vez de `.btn-accent` para la acción principal.
3. Color ad-hoc `to-teal-50` en el fondo de las páginas SEO (viola la regla de tokens).
4. `.surface-atmosphere` (ya existente) no se usa en páginas públicas.
5. Jerarquía de hero tímida (`text-4xl`).

## Componente 1: Hook `useReveal`

Archivo: `src/hooks/useReveal.js` (~30 líneas, mismo patrón que `useMagnetic`/`useSpotlight`).

- `IntersectionObserver` que añade la clase `is-revealed` al entrar al viewport.
- Threshold 0.15. Se dispara **una sola vez** (unobserve tras revelar).
- Respeta `useReducedMotion`: si reduced, el elemento nace revelado (clase aplicada de inmediato).
- API: `const ref = useReveal()` → `<section ref={ref} className="reveal">`.

## Componente 2: Clases CSS

En `src/index.css`, `@layer components`, junto a las clases existentes:

- `.reveal` — inicial: `opacity: 0; translateY(14px)`. Con `.is-revealed`: transición a visible, 550ms, curva `--spring` existente.
- `.reveal-stagger` — escalona hijos directos con `transition-delay` incremental de 80ms (hasta 6 hijos).
- `.reveal-hero` — animación al **cargar** (keyframes, no scroll): H1 primero, subtítulo +120ms, CTAs +240ms (variantes `.reveal-hero-delay-1/-2`).
- Bloque `prefers-reduced-motion: reduce`: animaciones anuladas, contenido visible desde el inicio.

Total: ~70 líneas CSS nuevas. Cero scroll listeners, cero dependencias.

## Componente 3: Aplicación por página

### Páginas SEO (las 3, estructura idéntica)
- Fondo: `bg-gradient-to-br from-slate-50 to-teal-50 ...` → `.surface-atmosphere`.
- Hero: H1 a `text-5xl sm:text-6xl`, entrada con `.reveal-hero` escalonada.
- Secciones de contenido: cada bloque con `.reveal`; listas `<ol>`/`<dl>` con `.reveal-stagger`.
- CTAs: principal → `.btn-accent` (conserva `px-6 py-3 text-base`); secundario → `.btn-secondary`.

### Login/Register
- Card del formulario entra con `.reveal-hero` (fade-up al cargar, una vez).
- Sin cambios de estructura ni campos.

## Restricciones

- **No tocar** `services/`, `contexts/`, `modelos/`, hooks de lógica, `services/exportar2023/`.
- Solo tokens del sistema — cero colores ad-hoc nuevos.
- Accesibilidad: el reveal usa solo `opacity/transform`; el contenido permanece en el árbol de accesibilidad desde el render (sin `display:none`/`visibility:hidden`).

## Verificación

1. `npm run build` limpio.
2. Chrome DevTools MCP: abrir las 4 páginas, screenshot, verificar reveal al scroll.
3. Emular `prefers-reduced-motion: reduce` y verificar contenido visible sin animación.
4. Lighthouse: accesibilidad se mantiene en 100.
