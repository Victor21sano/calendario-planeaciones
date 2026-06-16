# Spec: Asistente Estímulo Docente — Integración en PLANEA-PRO

**Fecha:** 2026-06-16  
**Estado:** Aprobado  

## Contexto

El "Asistente Estímulo Docente" es una herramienta standalone (vanilla HTML/JS) para que docentes CONALEP lleven control de requisitos del Estímulo al Desempeño Docente 2-2526. Se integra en PLANEA-PRO como funcionalidad gratuita, portada a React con el sistema de diseño existente.

---

## Decisiones de diseño

| Pregunta | Decisión |
|---|---|
| Acceso | Solo usuarios registrados (ruta protegida) |
| Entrada | Tarjeta en el Dashboard |
| Persistencia | localStorage (key existente preservada) |
| Implementación | Puerto completo a React con tokens PLANEA-PRO |

---

## 1. Estructura de archivos

```
src/pages/
  EstimuloDocentePage.jsx          ← página principal (lazy import en App.jsx)
  estimulo/
    data.js                        ← sections[], scoreRubric{}, factorMeta{}
    useEstimuloState.js            ← hook: estado, persistencia, scoring, export
    components/
      ReqCard.jsx                  ← tarjeta de requisito individual
      ScorePanel.jsx               ← estimador de puntaje + desglose por factor
      StatusBar.jsx                ← barra sticky: progreso + acciones
      FechasPanel.jsx              ← aside: fechas clave, nav, docs fuente

public/docs/
  convocatoria-estimulo-2526.pdf   ← copia de la convocatoria original
  cedula-edd.pdf                   ← copia del formato Cédula EDD
```

---

## 2. Enrutamiento

En `src/App.jsx`:

```jsx
const EstimuloDocentePage = lazy(() => import('./pages/EstimuloDocentePage'))

// Dentro de <Route element={<ProtectedRoute />}>:
<Route path="/asistente-estimulo" element={<EstimuloDocentePage />} />
```

---

## 3. Tarjeta en el Dashboard (`DashboardPage.jsx`)

Se agrega una sección `<section>` etiquetada "Herramientas" al final de `<main>`, siempre visible (no depende de si hay materias). Contiene una sola tarjeta con:

- Chip "Herramienta gratuita"
- Icono de checklist
- Título: "Asistente Estímulo Docente 2-2526"
- Descripción: "Checklist + estimador de puntaje para el trámite semestral CONALEP."
- Barra de progreso leída desde `localStorage` key `asistente-estimulo-docente-v1` al montar. Si no hay datos, muestra "Sin iniciar".
- Botón `<Link to="/asistente-estimulo">` con clase `btn-primary`

La tarjeta usa `card card-spotlight` igual que las tarjetas de materia, con un borde superior `border-t-2 border-brand-400` como diferenciador visual.

---

## 4. Layout de `EstimuloDocentePage`

```
[Header PLANEA-PRO sticky — BrandLogo + MenuUsuario]

[Hero section]
  - Eyebrow: "CONALEP Guanajuato · Semestre 2-2526"
  - H1 (Fraunces): "Asistente Estímulo Docente"
  - Descripción
  - Card de avance: X% completado

[<StatusBar /> sticky bajo el header]
  - Barra de progreso
  - "Puntos: X / 800 · Nivel Y"
  - Botones: Imprimir | Exportar CSV | Reiniciar

[<main> grid de dos columnas: aside + contenido]

  aside (sticky, `top-28` aprox — header h-14 + statusbar h-14):
    <FechasPanel />
      - Fechas clave (8 ítems)
      - Navegación anchor por sección
      - Nota de uso recomendado
      - Links a PDFs en /docs/

  contenido:
    <ScorePanel />
      - Subtítulo orientativo
      - Puntaje total X / 800
      - Nivel estimado + UMAs
      - Barra de progreso de puntaje
      - Desglose Factor 1 / Factor 2 / Factor 3
    
    Buscador (input type="search")
    
    Filtros (botones toggle):
      Todos | Pendientes | Completos | Obligatorios | Puntuables
    
    Secciones generadas desde data.js:
      Cada sección = <section> con header + lista de <ReqCard />
      Botones "Marcar sección" / "Desmarcar sección"
    
    Empty state si no hay resultados
    
    Textarea "Notas personales" (persistida en localStorage)

[Link "← Volver al dashboard" al pie]
```

**Responsive:** en mobile (< md), `aside` se colapsa arriba del contenido en una sola columna, igual que el original.

---

## 5. Datos (`data.js`)

Exporta las tres constantes extraídas sin modificación del `index.html` original:

```js
export const sections = [...]      // 8 secciones, 34 items
export const scoreRubric = {...}   // 18 rubrics con opciones y puntos
export const factorMeta = {...}    // Factor 1: max 520, Factor 2: max 200, Factor 3: max 80
```

---

## 6. Hook `useEstimuloState`

```js
const {
  checks, scores, notes,
  filter, search,
  setFilter, setSearch,
  toggleCheck,
  setScore,
  setNotes,
  resetAll,           // abre modal de confirmación (no window.confirm)
  totalProgress,      // { done, total, pct }
  scoreResult,        // { total, factors, level: string, umas: number }
  exportCsv,
} = useEstimuloState()
```

**Persistencia:** `localStorage.setItem('asistente-estimulo-docente-v1', JSON.stringify({checks, scores, notes, updatedAt}))` en cada cambio. La key es idéntica a la del tool standalone para no perder avance previo.

**`scoreResult`:** calcula total sumando `scoreValueFor(itemId)` sobre todos los rubrics, y resuelve nivel según rangos de la convocatoria (301-400 = I, 401-500 = II, 501-600 = III, 601-700 = IV, 701-800 = V).

**`exportCsv`:** genera blob CSV con los mismos campos del original y dispara descarga.

---

## 7. Componentes

### `ReqCard`
Props: `item`, `sectionTitle`, `done`, `scoreValue`, `onToggle`, `onScoreChange`

Renderiza: deadline row, chips (Obligatorio/Puntuable/Verificación), título clicable como label, descripción, callout opcional, details/summary con detalles, score control (select) si el item tiene rubric.

### `ScorePanel`
Props: `scoreResult`

Renderiza: puntaje total, nivel + UMAs, barra de progreso, grid de 3 factor-boxes.

### `StatusBar`
Props: `totalProgress`, `scoreResult`, `onPrint`, `onExport`, `onReset`

Sticky bajo el header (usa `top-14` o el valor del header height). Barra de progreso + texto de puntos + tres botones de acción.

### `FechasPanel`
Sin props. Fechas clave hardcodeadas (semestre 2-2526). Links a PDFs. Nav de anchors generada desde `sections`.

### `ConfirmResetModal`
Props: `onConfirm`, `onCancel`

Modal de confirmación para el botón Reiniciar. Sigue el patrón de modales existentes (backdrop, `animate-scale-in`, focus trap). Reemplaza `window.confirm`.

---

## 8. Adaptación de tokens de diseño

| Original | PLANEA-PRO |
|---|---|
| `--brand` / verde `#047857` | `brand-600` / `brand-700` |
| Chip "Obligatorio" (rojo) | `bg-danger-50 text-danger-700 border-danger-200` |
| Chip "Puntuable" (azul) | `bg-info-50 text-info-700 border-info-200` |
| Chip "Verificación" (ámbar) | `bg-warning-50 text-warning-700 border-warning-200` |
| `button` primario | `btn-primary` |
| `button.secondary` | `btn-secondary` |
| `button.danger` | variante `bg-danger-50 text-danger-600` |
| Tipografía h1/h2 | `font-display` (Fraunces) |
| Score control border blue | `border-info-200 bg-info-50` |

---

## 9. Print

Los estilos `@media print` del original se agregan a `src/index.css` bajo el selector `.estimulo-page` para no contaminar el resto de la app. El wrapper raíz de `EstimuloDocentePage` lleva la clase `estimulo-page`.

---

## 10. Modal de confirmación para Reiniciar

En lugar de `window.confirm`, se muestra un modal inline pequeño con:
- "¿Borrar todo el avance guardado en este navegador?"
- Botones: "Cancelar" (btn-secondary) | "Sí, reiniciar" (bg-danger-600 text-white)

El modal sigue el patrón de los modales existentes en PLANEA-PRO (portal en `<body>`, backdrop blur, `animate-scale-in`).

---

## 11. Out of scope

- Sincronización con Firebase Firestore
- Persistencia del avance entre dispositivos
- Actualización automática de fechas del tool para semestres futuros
- Notificaciones de fechas próximas
