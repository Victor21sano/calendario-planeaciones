# SEO Técnico Planea Pro — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar el SEO on-page de planea-pro.com.mx para maximizar visibilidad orgánica en búsquedas de docentes CONALEP.

**Architecture:** App React SPA servida por Firebase Hosting. Google ve `/login` como la página principal (raíz redirige a login para no-autenticados). Las mejoras SEO son exclusivamente en archivos de presentación (páginas públicas, index.html, sitemap, robots.txt) — sin tocar lógica de negocio.

**Tech Stack:** React 18, Vite, Firebase Hosting, Tailwind CSS (`darkMode: 'class'`), React Router v6

---

## Estado actual (ya completado esta sesión)

| Tarea | Estado |
|-------|--------|
| `<title>` → "Planea Pro — Planificador Docente con IA para CONALEP" | ✅ done |
| `<meta name="description">` actualizado | ✅ done |
| Open Graph + Twitter Cards actualizados | ✅ done |
| JSON-LD (SoftwareApplication + Organization) | ✅ done |
| Favicons: .ico, .svg, -48.png, -192.png, apple-touch-icon.png | ✅ done |
| `/public/site.webmanifest` | ✅ done |
| `/public/robots.txt` (ya existía, válido) | ✅ done |
| `/public/sitemap.xml` (ya existía, incompleto) | pendiente actualizar |

---

## Mapa de archivos a tocar

| Archivo | Rol |
|---------|-----|
| `src/pages/LoginPage.jsx` | Añadir "Planea Pro" en H1 + body text |
| `src/App.jsx` | Registrar rutas públicas de las nuevas páginas SEO |
| `src/pages/PlaneacionesConalep.jsx` | **Crear** — landing /planeaciones-conalep |
| `src/pages/GeneradorPlaneacionesIA.jsx` | **Crear** — landing /generador-planeaciones-ia |
| `src/pages/HorarioDocenteConalep.jsx` | **Crear** — landing /horario-docente-conalep |
| `public/sitemap.xml` | Añadir rutas rastreables, quitar rutas protegidas |
| `docs/SEO_NOTES.md` | **Crear** — registro de trabajo SEO para referencia futura |

**REGLA INAMOVIBLE:** No tocar `services/`, `modelos/`, `hooks/`, `contexts/`, `functions/`, `exportar2023/`, ni prompts de IA.

---

### Task 1: Corrección del H1 en LoginPage — incluir nombre de marca

**Files:**
- Modify: `src/pages/LoginPage.jsx:68-73`

**Problema:** El `<h1>` desktop (línea 68) no menciona "Planea Pro". Google indexa este H1 como el encabezado principal de la app. La línea 72 usa "Planea-Pro" (con guión) en vez de "Planea Pro".

- [ ] **Step 1: Leer el bloque del H1 y el párrafo**

```bash
sed -n '61,74p' "src/pages/LoginPage.jsx"
```
Confirmar las líneas exactas del `<h1>` y el `<p>` que sigue.

- [ ] **Step 2: Modificar el H1 — añadir nombre de marca antes de la proposición**

Reemplazar el `<h1>` actual (líneas 68-70):
```jsx
// ANTES:
<h1 className="font-display text-[2.75rem] font-semibold leading-[1.08] tracking-tight text-slate-950 dark:text-white">
  Convierte PE y GPE en <span className="italic text-accent-600 dark:text-accent-400">planeaciones listas</span> para revisar y exportar.
</h1>
```

Por:
```jsx
// DESPUÉS:
<h1 className="font-display text-[2.75rem] font-semibold leading-[1.08] tracking-tight text-slate-950 dark:text-white">
  <span className="block text-[1.35rem] font-bold text-brand-700 dark:text-brand-300 mb-1">Planea Pro</span>
  Convierte PE y GPE en <span className="italic text-accent-600 dark:text-accent-400">planeaciones listas</span> para revisar y exportar.
</h1>
```

- [ ] **Step 3: Corregir "Planea-Pro" por "Planea Pro" en el párrafo (línea ~72)**

```jsx
// ANTES:
Planea-Pro te ayuda a ordenar documentos oficiales...
// DESPUÉS:
Planea Pro te ayuda a ordenar documentos oficiales...
```

- [ ] **Step 4: Actualizar también el botón de submit (línea ~165)**

```jsx
// ANTES:
{loading ? 'Preparando tu espacio...' : 'Entrar a Planea-Pro'}
// DESPUÉS:
{loading ? 'Preparando tu espacio...' : 'Entrar a Planea Pro'}
```

- [ ] **Step 5: Commit**

```bash
git add "src/pages/LoginPage.jsx"
git commit -m "seo: add Planea Pro brand name to H1 and body copy in LoginPage"
```

---

### Task 2: Corregir sitemap.xml — rutas reales rastreables

**Files:**
- Modify: `public/sitemap.xml`

**Problema actual:** El sitemap incluye `/comprar-creditos` que es una ruta PROTEGIDA (Google no puede rastrearla). No incluye `/login` que es la página que Google SÍ indexa.

- [ ] **Step 1: Reemplazar sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Página principal (Google rastrea /login al ser redirigido desde /) -->
  <url>
    <loc>https://planea-pro.com.mx/login</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <lastmod>2026-06-09</lastmod>
  </url>
  <url>
    <loc>https://planea-pro.com.mx/register</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <lastmod>2026-06-09</lastmod>
  </url>
  <!-- Páginas SEO temáticas -->
  <url>
    <loc>https://planea-pro.com.mx/planeaciones-conalep</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
    <lastmod>2026-06-09</lastmod>
  </url>
  <url>
    <loc>https://planea-pro.com.mx/generador-planeaciones-ia</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
    <lastmod>2026-06-09</lastmod>
  </url>
  <url>
    <loc>https://planea-pro.com.mx/horario-docente-conalep</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <lastmod>2026-06-09</lastmod>
  </url>
</urlset>
```

- [ ] **Step 2: Commit**

```bash
git add "public/sitemap.xml"
git commit -m "seo: update sitemap with crawlable routes and new SEO pages"
```

---

### Task 3: Crear página SEO — /planeaciones-conalep

**Files:**
- Create: `src/pages/PlaneacionesConalep.jsx`

Esta página captura búsquedas como "planeaciones CONALEP formato 2023", "planeación didáctica CONALEP", "planeación módulo CONALEP". Es 100% contenido estático — cero lógica de negocio.

- [ ] **Step 1: Crear el componente**

```jsx
// src/pages/PlaneacionesConalep.jsx
import { Link } from 'react-router-dom'
import BrandLogo from '../components/brand/BrandLogo'

export default function PlaneacionesConalep() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-slate-900">
      <header className="mx-auto max-w-4xl px-4 py-6">
        <BrandLogo markClassName="w-10 h-10" />
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-20">
        <article>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mt-10">
            Planeaciones Didácticas para CONALEP
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
            Planea Pro genera automáticamente planeaciones didácticas en formato 2023 para docentes CONALEP. En minutos, no en horas.
          </p>

          <section className="mt-12 space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">¿Qué incluye una planeación CONALEP formato 2023?</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                El formato oficial 2023 incluye: datos del docente y módulo, unidad de competencia, resultado de aprendizaje,
                datos específicos (propósito, duración, modalidad, fechas), y los tres momentos didácticos: inicio, desarrollo y cierre.
                Cada momento documenta ambiente de aprendizaje, estrategias de enseñanza y aprendizaje, evaluación, recursos y estudio independiente.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Cómo genera Planea Pro tu planeación</h2>
              <ol className="mt-3 space-y-2 text-slate-600 dark:text-slate-400 list-decimal list-inside leading-relaxed">
                <li>Subes tu PE (Programa de Estudio) y GPE (Guía de Práctica Educativa)</li>
                <li>La IA extrae módulos, unidades, resultados de aprendizaje y competencias</li>
                <li>Genera las sesiones en formato 2023 con actividades coherentes</li>
                <li>Exportas a Word listo para entregar o ajustar</li>
              </ol>
            </div>

            <div>
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

          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-6 py-3 text-base font-semibold text-white hover:bg-teal-800 transition-colors">
              Generar mi primera planeación gratis
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 px-6 py-3 text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Iniciar sesión
            </Link>
          </div>
        </article>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: No hay tests para páginas de contenido estático — verificar que el archivo existe y tiene JSX válido**

```bash
grep -c "export default" "src/pages/PlaneacionesConalep.jsx"
```
Esperado: `1`

- [ ] **Step 3: Commit**

```bash
git add "src/pages/PlaneacionesConalep.jsx"
git commit -m "seo: add /planeaciones-conalep landing page"
```

---

### Task 4: Crear página SEO — /generador-planeaciones-ia

**Files:**
- Create: `src/pages/GeneradorPlaneacionesIA.jsx`

Captura: "generador planeaciones IA CONALEP", "planeación con inteligencia artificial CONALEP", "IA planeación didáctica".

- [ ] **Step 1: Crear el componente**

```jsx
// src/pages/GeneradorPlaneacionesIA.jsx
import { Link } from 'react-router-dom'
import BrandLogo from '../components/brand/BrandLogo'

export default function GeneradorPlaneacionesIA() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-slate-900">
      <header className="mx-auto max-w-4xl px-4 py-6">
        <BrandLogo markClassName="w-10 h-10" />
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-20">
        <article>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mt-10">
            Generador de Planeaciones Didácticas con IA para CONALEP
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
            Planea Pro usa inteligencia artificial para leer tu PE y GPE, y generar automáticamente una planeación didáctica completa en formato 2023.
          </p>

          <section className="mt-12 space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">¿Qué hace la IA de Planea Pro?</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                El modelo de IA analiza el Programa de Estudio (PE) y la Guía de Práctica Educativa (GPE) para extraer
                automáticamente las competencias, resultados de aprendizaje, contenidos específicos y actividades propuestas.
                Con esa información, construye sesiones de aprendizaje estructuradas siguiendo el formato oficial 2023 de CONALEP.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Ventajas del generador con IA</h2>
              <ul className="mt-3 space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside leading-relaxed">
                <li>Reduce de horas a minutos la elaboración de planeaciones</li>
                <li>Respeta la estructura oficial del Modelo 2023 en cada campo</li>
                <li>Genera los tres momentos didácticos (inicio, desarrollo, cierre) con coherencia interna</li>
                <li>Exporta en formato Word compatible con las plantillas oficiales</li>
                <li>Regeneración gratuita si el resultado no cumple tus expectativas</li>
              </ul>
            </div>

            <div>
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

          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-6 py-3 text-base font-semibold text-white hover:bg-teal-800 transition-colors">
              Probar el generador gratis
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 px-6 py-3 text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Iniciar sesión
            </Link>
          </div>
        </article>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verificar**

```bash
grep -c "export default" "src/pages/GeneradorPlaneacionesIA.jsx"
```
Esperado: `1`

- [ ] **Step 3: Commit**

```bash
git add "src/pages/GeneradorPlaneacionesIA.jsx"
git commit -m "seo: add /generador-planeaciones-ia landing page"
```

---

### Task 5: Crear página SEO — /horario-docente-conalep

**Files:**
- Create: `src/pages/HorarioDocenteConalep.jsx`

Captura: "horario docente CONALEP", "horario semestral CONALEP", "horario automático CONALEP".

- [ ] **Step 1: Crear el componente**

```jsx
// src/pages/HorarioDocenteConalep.jsx
import { Link } from 'react-router-dom'
import BrandLogo from '../components/brand/BrandLogo'

export default function HorarioDocenteConalep() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-slate-900">
      <header className="mx-auto max-w-4xl px-4 py-6">
        <BrandLogo markClassName="w-10 h-10" />
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-20">
        <article>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mt-10">
            Horario Semestral para Docentes CONALEP — Generación Automática
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
            Planea Pro calcula automáticamente el horario semestral por módulo, distribuyendo las horas según el PE y las fechas del ciclo escolar.
          </p>

          <section className="mt-12 space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">¿Qué es el horario semestral CONALEP?</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                El horario semestral CONALEP distribuye las horas totales del módulo entre las semanas del ciclo escolar,
                asignando fechas de inicio y fin a cada resultado de aprendizaje y sus actividades. Es un requisito de
                entrega para la coordinación académica del plantel.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Cómo genera Planea Pro tu horario</h2>
              <ol className="mt-3 space-y-2 text-slate-600 dark:text-slate-400 list-decimal list-inside leading-relaxed">
                <li>Defines el rango de fechas del semestre (fecha inicio y fin)</li>
                <li>Indicas los días de la semana que tienes clase y las horas por día</li>
                <li>Planea Pro distribuye automáticamente las horas del PE respetando la carga horaria</li>
                <li>El horario se integra con la planeación didáctica para que las fechas sean coherentes</li>
              </ol>
            </div>

            <div>
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

          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-6 py-3 text-base font-semibold text-white hover:bg-teal-800 transition-colors">
              Generar mi horario gratis
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 px-6 py-3 text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Iniciar sesión
            </Link>
          </div>
        </article>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verificar**

```bash
grep -c "export default" "src/pages/HorarioDocenteConalep.jsx"
```
Esperado: `1`

- [ ] **Step 3: Commit**

```bash
git add "src/pages/HorarioDocenteConalep.jsx"
git commit -m "seo: add /horario-docente-conalep landing page"
```

---

### Task 6: Registrar rutas SEO en App.jsx

**Files:**
- Modify: `src/App.jsx:7-17` (imports y rutas públicas)

**IMPORTANTE:** Solo se tocan los `import` y el bloque `<Routes>` — no la lógica de auth ni los ProtectedRoute.

- [ ] **Step 1: Añadir imports de las 3 páginas SEO (junto a los otros imports de auth, líneas 7-9)**

```jsx
// Añadir después de ResetPasswordPage import:
import PlaneacionesConalep       from './pages/PlaneacionesConalep'
import GeneradorPlaneacionesIA   from './pages/GeneradorPlaneacionesIA'
import HorarioDocenteConalep     from './pages/HorarioDocenteConalep'
```

- [ ] **Step 2: Añadir las 3 rutas en el bloque de rutas públicas (después de línea 41 `/reset-password`)**

```jsx
<Route path="/planeaciones-conalep"       element={<PlaneacionesConalep />} />
<Route path="/generador-planeaciones-ia"  element={<GeneradorPlaneacionesIA />} />
<Route path="/horario-docente-conalep"    element={<HorarioDocenteConalep />} />
```

El bloque de rutas públicas debe quedar:
```jsx
{/* Rutas públicas */}
<Route path="/login"                      element={<LoginPage />} />
<Route path="/register"                   element={<RegisterPage />} />
<Route path="/reset-password"             element={<ResetPasswordPage />} />
<Route path="/planeaciones-conalep"       element={<PlaneacionesConalep />} />
<Route path="/generador-planeaciones-ia"  element={<GeneradorPlaneacionesIA />} />
<Route path="/horario-docente-conalep"    element={<HorarioDocenteConalep />} />
```

- [ ] **Step 3: Verificar que no se rompió nada**

```bash
grep -n "PlaneacionesConalep\|GeneradorPlaneacionesIA\|HorarioDocenteConalep" "src/App.jsx"
```
Esperado: 6 líneas (3 imports + 3 rutas).

- [ ] **Step 4: Commit**

```bash
git add "src/App.jsx"
git commit -m "seo: register public SEO landing page routes"
```

---

### Task 7: Crear SEO_NOTES.md — registro de trabajo y monitoreo

**Files:**
- Create: `docs/SEO_NOTES.md`

- [ ] **Step 1: Crear el archivo**

```markdown
# SEO — Planea Pro (planea-pro.com.mx)

## Estado a 2026-06-09

### Posición actual en Google
- "planea pro" → posición #2 (Meta Search Console)
- Sin Knowledge Panel ni logo aún (favicon recién desplegado)

### Cambios aplicados esta sesión

#### index.html
- `<title>` → "Planea Pro — Planificador Docente con IA para CONALEP"
- `<meta description>` → empieza con "Planea Pro:" (keyword match)
- `<meta keywords>` → planea pro, planificador docente CONALEP, planeación IA
- JSON-LD: SoftwareApplication + Organization con alternateName "Planea-Pro"
- Favicons: favicon.ico (16+32+48), favicon.svg, favicon-48.png, favicon-192.png, apple-touch-icon.png
- site.webmanifest: name "Planea Pro", theme_color #0F766E

#### LoginPage.jsx (de facto homepage — ProtectedRoute redirige crawlers aquí)
- H1 desktop: añadido "Planea Pro" como eyebrow sobre la proposición principal
- Párrafo: "Planea-Pro" → "Planea Pro" (consistencia de marca)
- Botón submit: "Entrar a Planea-Pro" → "Entrar a Planea Pro"

#### Páginas SEO (nuevas rutas públicas)
- `/planeaciones-conalep` → PlaneacionesConalep.jsx
- `/generador-planeaciones-ia` → GeneradorPlaneacionesIA.jsx
- `/horario-docente-conalep` → HorarioDocenteConalep.jsx

#### sitemap.xml
- Eliminada `/comprar-creditos` (ruta protegida, no rastreable)
- Añadida `/login` (priority 1.0, la página real que Google indexa)
- Añadida `/register` (priority 0.6)
- Añadidas 3 páginas SEO (priority 0.8–0.9)

#### robots.txt (sin cambios — ya era correcto)
```
User-agent: *
Allow: /
Disallow: /materia/
Disallow: /perfil
Sitemap: https://planea-pro.com.mx/sitemap.xml
```

## Monitoreo

### Google Search Console
- URL: https://search.google.com/search-console/
- Propiedad verificada: planea-pro.com.mx
- Acción post-deploy: Herramientas → Solicitar indexación para:
  - https://planea-pro.com.mx/login
  - https://planea-pro.com.mx/planeaciones-conalep
  - https://planea-pro.com.mx/generador-planeaciones-ia
  - https://planea-pro.com.mx/horario-docente-conalep
- Acción: Mapas del sitio → Enviar https://planea-pro.com.mx/sitemap.xml

### Señales de progreso esperadas (4–12 semanas)
- Favicon visible en resultados de búsqueda (2–4 sem)
- Nuevas páginas SEO indexadas (2–6 sem)
- Mejora de posición para keywords de cola larga (4–12 sem)

## Qué NO fue tocado (regla del proyecto)
- `services/`, `modelos/`, `hooks/`, `contexts/`, `functions/`, `exportar2023/`
- Prompts de IA
- Lógica de auth (Firebase)
- Componentes de lógica del planificador
```

- [ ] **Step 2: Commit**

```bash
git add "docs/SEO_NOTES.md"
git commit -m "docs: add SEO_NOTES.md with audit summary and monitoring guide"
```

---

### Task 8: Build + Verify + Deploy

**Files:** ninguno — solo comandos

**Directorio:** `/home/emmanuel/Datos/Archivos/Documentos/PLANEA-PRO/APP CALENDARIO PLANEACIONES FINAL/APP CALENDARIO PLANEACIONES`

- [ ] **Step 1: Build limpio**

```bash
npm run build
```
Esperado: `✓ built in ~4s`, sin errores TypeScript ni Vite. El output va a `dist/`.

- [ ] **Step 2: Verificar que las rutas SEO están en el bundle**

```bash
ls dist/assets/ | grep -i "Planeaciones\|Generador\|Horario" | head -5
```
Esperado: chunks JS para los 3 componentes (lazy-split por Vite).

**NOTA:** Los 3 componentes SEO son imports directos (no `lazy()`), así que irán en el chunk principal o en un chunk compartido con LoginPage.

- [ ] **Step 3: Deploy a Firebase Hosting**

```bash
firebase deploy --only hosting
```
Esperado: `Deploy complete!` con URL `https://planea-pro.com.mx`.

- [ ] **Step 4: Verificar las rutas en producción con curl**

```bash
curl -sI "https://planea-pro.com.mx/planeaciones-conalep" | grep -E "HTTP|content-type|location"
curl -sI "https://planea-pro.com.mx/generador-planeaciones-ia" | grep -E "HTTP|content-type|location"
curl -sI "https://planea-pro.com.mx/horario-docente-conalep" | grep -E "HTTP|content-type|location"
```
Esperado: `HTTP/2 200` en los tres (Firebase SPA sirve `index.html` para cualquier ruta).

- [ ] **Step 5: Verificar sitemap accesible**

```bash
curl -s "https://planea-pro.com.mx/sitemap.xml" | grep "<loc>"
```
Esperado: 5 URLs en la respuesta.

- [ ] **Step 6: Solicitar indexación en Search Console (acción manual del usuario)**

En https://search.google.com/search-console/: usar "Inspección de URL" para cada URL nueva y hacer click en "Solicitar indexación".

---

## Self-Review

### Cobertura del spec original (15 tareas)

| # | Tarea del spec | Estado en este plan |
|---|----------------|---------------------|
| 1 | Title tag | ✅ ya hecho |
| 2 | Meta description | ✅ ya hecho |
| 3 | Open Graph + Twitter | ✅ ya hecho |
| 4 | JSON-LD estructurado | ✅ ya hecho |
| 5 | Favicon / webmanifest | ✅ ya hecho |
| 6 | robots.txt | ✅ ya hecho (existía correcto) |
| 7 | sitemap.xml | Task 2 |
| 8 | H1 con brand name | Task 1 |
| 9 | Contenido SEO en landing | Tasks 3-5 (páginas nuevas) |
| 10 | Páginas SEO temáticas | Tasks 3-5 |
| 11 | Rutas registradas | Task 6 |
| 12 | Sitemap con nuevas rutas | Task 2 |
| 13 | Accessibility (alt/buttons) | No pendiente — 100/100 ya logrado 2026-06-08 |
| 14 | SEO_NOTES.md | Task 7 |
| 15 | Build + Deploy + Search Console | Task 8 |

### Placeholders: ninguno detectado
### Consistencia de tipos: no aplica (solo JSX/HTML/XML)
### Regla "sin tocar lógica": verificada — ninguna tarea toca services/, hooks/, contexts/, functions/, exportar2023/ ni prompts de IA
