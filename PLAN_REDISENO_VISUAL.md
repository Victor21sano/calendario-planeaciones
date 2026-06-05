# Plan de Rediseño Visual — Planea-Pro

> **Objetivo:** Dotar a Planea-Pro de un lenguaje visual nuevo, innovador y distintivo en **todo el flujo**, sin alterar **ninguna** funcionalidad.
> **Alcance:** Las 8 páginas + editor/preview del modelo 2023 + onboarding + modales.
> **Stack:** React 18 · Vite 5 · TailwindCSS 3 · Firebase · React Router 7.

---

## 0. Regla de oro (guardarraíl en cada cambio)

Solo se modifica la **capa de presentación**:

| ✅ SÍ se toca | ❌ NO se toca |
|---------------|---------------|
| `className` en JSX | `services/` (lógica de negocio) |
| `src/index.css` (tokens, componentes CSS) | `contexts/` (estado, auth) |
| `tailwind.config.js` | `modelos/` (schema, validación 2023) |
| `index.html` (fuentes) | `utils/` (cálculos, validaciones) |
| Componentes **presentacionales** nuevos | `hooks/` (autoguardado, etc.) |
| Animaciones / transiciones | `services/exportar2023/` (export a Word = lógica) |
| Layout / estructura visual | Props de datos, flujo de estado, llamadas a IA/Firebase |

**Verificación obligatoria al cerrar cada fase:** `npm run dev` + recorrido manual de la pantalla afectada para confirmar que el comportamiento es idéntico. La exportación a Word se prueba descargando un documento real y comparándolo con el actual.

---

## 1. Diagnóstico del estado actual

El proyecto **no parte de cero**: ya tiene un sistema de diseño relativamente maduro.

**Fortalezas existentes (se conservan y potencian):**
- Tokens CSS en `:root` y `.dark` (`--surface-*`, `--border-*`, `--shadow-*`, curvas de animación).
- Paleta de marca definida en `tailwind.config.js`.
- Dark mode (`darkMode: 'class'`).
- Sistema de motion con curvas spring y asimetría entrada/salida.
- Accesibilidad: `focus-visible`, `prefers-reduced-motion`, `@media (hover:hover)`.
- Estilos `@media print` para la exportación visual.

**Problemas detectados (lo que se corrige):**

| Problema | Evidencia | Impacto |
|----------|-----------|---------|
| **Dos acentos en conflicto** | `primary` (índigo) ×141 vs `brand` (teal) ×105 | La identidad se siente incoherente; el spinner es índigo pero los botones son teal. |
| **~600 colores semánticos sueltos** | `violet` ~100, `rose` ~135, `amber` ~150, `emerald` ~130 | Sin tokens de `success/warning/danger/info`; difícil mantener y sin coherencia. |
| **Escalas definidas pero sin usar** | `academic` ×24, `document` ×26 | Peso muerto en el config; intención de diseño no materializada. |
| **Sin tipografía display** | Solo Plus Jakarta Sans en todos los pesos | Falta jerarquía expresiva; los títulos no tienen carácter. |
| **Higiene del repo** | `temp-impeccable/` (repo clonado dentro del proyecto), ~15 archivos sin commitear | Ruido en el árbol de trabajo. |

---

## 2. Dirección creativa

**Concepto:** *"Espacio de planeación editorial"* — una herramienta que se siente calmada, profesional y con criterio, no como un dashboard genérico de IA. Para docentes CONALEP que pasan horas en ella.

**Principios:**
1. **Un acento, bien usado.** Un color de marca dominante + un acento cálido reservado para CTAs primarios. Se elimina el conflicto índigo/teal.
2. **Jerarquía por tipografía, no por color.** Display font expresiva en títulos; cuerpo legible y neutro.
3. **Profundidad por capas.** Superficies (`sunken → primary → elevated`) y sombras suaves, no bordes duros por todos lados.
4. **Movimiento con intención.** Cada animación comunica algo (entrada, confirmación, transición de contexto). Nada decorativo gratuito.
5. **Anti-genérico.** Se evitan fuentes sobreusadas por IA (Inter, Roboto) y el gradiente morado por defecto — criterio reforzado por las skills `frontend-design` / `impeccable`.

> En el **Paso 4.1** se presentan 2-3 propuestas concretas de paleta + tipografía para que elijas **antes** de propagar al resto de pantallas.

---

## 3. Higiene previa (antes de codear)

1. **Commitear o stashear** los ~15 archivos ya modificados en el árbol de trabajo, para no mezclar trabajo en curso con el rediseño.
2. Crear rama dedicada: `rediseno-visual`.
3. Mover/eliminar `temp-impeccable/` (se confirma contigo antes de borrar).
4. Confirmar que `npm run dev` levanta limpio como línea base.

---

## 4. Fases de ejecución

### Fase 4.1 — Fundación: sistema de diseño unificado *(riesgo cero — solo CSS/config)*

**El cambio de mayor impacto.** Se hace primero y se valida en UNA pantalla antes de propagar.

- [ ] **Unificar el acento de marca.** Elegir una sola escala primaria con carácter. Reasignar `primary` y `brand` a una identidad coherente.
- [ ] **Definir tokens semánticos** en `tailwind.config.js` + `index.css`:
  - `success` (reemplaza `emerald` ad-hoc)
  - `warning` (reemplaza `amber` ad-hoc)
  - `danger` (reemplaza `rose` ad-hoc)
  - `info` / `accent` (reemplaza `violet` ad-hoc, p. ej. barras de progreso)
- [ ] **Tipografía:** añadir display font en `index.html` (`<link>` a Google Fonts) + mapear `fontFamily.display` en el config. Body sigue en Plus Jakarta Sans.
- [ ] **Refinar tokens** de elevación, radios y espaciado; consolidar el sistema de superficies por capas.
- [ ] **Extender motion:** transición de página (route transitions) y stagger de listas.
- [ ] **Entregable:** preparar **2-3 propuestas de dirección** (paleta + tipografía) aplicadas a una pantalla de muestra (Login o Dashboard) para tu elección.

**Archivos:** `tailwind.config.js`, `src/index.css`, `index.html`.

---

### Fase 4.2 — Shell, navegación y estados globales

- [ ] Header / navegación consistente entre páginas autenticadas.
- [ ] `PageLoader` (en `App.jsx`) y skeletons alineados al nuevo sistema.
- [ ] Transiciones de ruta entre páginas (presentacional, sin tocar el routing de `App.jsx`).
- [ ] `ErrorBoundary` con estilo coherente.

**Archivos:** `src/App.jsx` (solo el JSX de `PageLoader`), `components/ErrorBoundary.jsx`, componentes de layout nuevos si hacen falta.

---

### Fase 4.3 — Autenticación (Login · Register · Reset)

Primera impresión del producto. El split-layout actual es buena base.

- [ ] **LoginPage:** hero editorial con la display font, tarjeta de acceso con más profundidad, micro-interacciones en inputs (iconos, focus) y botones.
- [ ] **RegisterPage:** consistencia con Login.
- [ ] **ResetPasswordPage:** misma familia visual.
- [ ] Mantener intactos `useAuth`, `login`, `loginWithGoogle`, navegación y manejo de errores.

**Archivos:** `pages/LoginPage.jsx`, `pages/RegisterPage.jsx`, `pages/ResetPasswordPage.jsx`, `components/brand/*`.

---

### Fase 4.4 — Dashboard

El centro de operaciones del docente.

- [ ] **`MateriaCard`:** jerarquía tipográfica, barra de progreso con token `accent` (en vez de `violet` suelto), badges de modelo/estado coherentes.
- [ ] **`EmptyState`:** ilustración/composición con más vida y CTA claro.
- [ ] **`SkeletonGrid`:** coherente con la card final.
- [ ] **Cabecera del dashboard:** saldo de créditos, perfil, acciones.
- [ ] Lógica de `fetchMaterias`, `deleteMateria`, `duplicarMateria`, navegación: **intacta**.

**Archivos:** `pages/DashboardPage.jsx`, `components/dashboard/*`, `components/badges/MateriaTypeBadge.jsx`, `components/SaldoCreditos.jsx`.

---

### Fase 4.5 — Planificador 2023 (núcleo — la pantalla más compleja, 1397 líneas)

Se aborda en dos sub-bloques por su tamaño.

**4.5a — Editor** (`components/editor2023/`)
- [ ] Chrome del editor (cabecera, navegación entre momentos/RA/actividades).
- [ ] Campos (`CampoTexto`, `CampoTextArea`, `CampoSelect`, `CampoNumero`, `CampoFecha`) con estilo unificado.
- [ ] `BarraAdvertencias`, `IndicadorGuardado`, `ToggleVistaEdicion`: solo estilo.
- [ ] **Sin tocar** `hooks/useAutoGuardado.js` ni la validación.

**4.5b — Preview** (`components/preview2023/`)
- [ ] Documento del modelo 2023 más legible y elegante, **respetando la estructura oficial obligatoria** (cabeceras, momentos, RA, datos específicos).
- [ ] **No romper** los `@media print` ni la maquetación por página (`page-break`).
- [ ] `PaywallOverlay` y `BotonCopiarTabla`: estilo coherente, función intacta.

**Archivos:** `components/editor2023/**`, `components/preview2023/**`, `pages/PlanificadorPage.jsx` (solo presentación).
**⚠️ No se toca** `services/exportar2023/` — la generación del `.docx` es lógica y debe producir el mismo archivo.

---

### Fase 4.6 — Onboarding + modales

- [ ] **SplashScreen**, **LoadingTips**, **SuccessTransition:** pulido de movimiento y composición.
- [ ] **ModalCapturaFechas**, **UploadScreen** (dropzone de PDF): estados visuales (hover, drag, error).
- [ ] **Modales:** `ModalSinCreditos`, `CreateMateriaModal`, `ModeloMateriaModal`, `PerfilIncompletoModal` — familia visual unificada.
- [ ] Lógica de subida de PDF, parsing y créditos: **intacta**.

**Archivos:** `components/onboarding/*`, `components/dashboard/*Modal.jsx`, `components/ModalSinCreditos.jsx`.

---

### Fase 4.7 — Páginas secundarias

- [ ] `PerfilPage`, `ComprarCreditos`, `PagoResultado`, `AdminPage` — aplicar el sistema unificado.
- [ ] Lógica de pagos, perfil y admin: **intacta**.

**Archivos:** `pages/PerfilPage.jsx`, `pages/ComprarCreditos.jsx`, `pages/PagoResultado.jsx`, `pages/AdminPage.jsx`.

---

### Fase 4.8 — Pase final de calidad (QA visual)

- [ ] **Dark mode:** paridad completa en todas las pantallas rediseñadas.
- [ ] **Responsive:** móvil / tablet / desktop.
- [ ] **`prefers-reduced-motion`:** todas las animaciones nuevas respetan la preferencia.
- [ ] **Contraste WCAG AA** en texto y estados.
- [ ] **`@media print`:** confirmar que la vista de impresión/exportación sigue correcta.
- [ ] **Limpieza:** eliminar clases muertas y colores ad-hoc residuales; confirmar que `academic`/`document` se usan o se retiran.

---

## 5. Orden de entrega y validación

```
Paso 0  Higiene del repo (rama + stash + temp-impeccable)
   │
Fase 4.1  Fundación + 2-3 propuestas de dirección  ──►  ✋ TÚ ELIGES dirección
   │
Fase 4.3  Login (pantalla piloto, valida la dirección elegida)  ──►  ✋ TÚ APRUEBAS
   │
Fase 4.2  Shell/navegación
Fase 4.4  Dashboard
Fase 4.5  Planificador (editor + preview)
Fase 4.6  Onboarding + modales
Fase 4.7  Páginas secundarias
Fase 4.8  QA visual final
```

**Punto de control crítico:** No se propaga a las 8 pantallas hasta que apruebes la dirección visual en la fundación + pantalla piloto. Esto minimiza el riesgo de invertir en una dirección equivocada.

---

## 6. Riesgos y mitigación

| Riesgo | Mitigación |
|--------|------------|
| Romper la exportación a Word | No se toca `services/exportar2023/`; se prueba descargando un `.docx` real por fase. |
| Romper la vista de impresión | `@media print` se revisa explícitamente en la Fase 4.8 y tras tocar el preview. |
| Romper comportamiento por cambiar JSX | Solo se editan atributos de presentación; verificación funcional manual al cierre de cada fase. |
| Mezclar con trabajo en curso | Stash/commit de los ~15 archivos modificados antes de empezar. |
| Regresión en dark mode | Cada componente se valida en claro y oscuro antes de cerrar su fase. |

---

## 7. Herramientas de diseño

Durante la implementación se usan las skills instaladas para guiar criterio visual:
- **`frontend-design`** (Anthropic) — dirección estética y anti-genérico.
- **`impeccable`** — modo *product* (app UI / dashboards).
- **`taste`** / **`ui-ux-pro-max`** — refinamiento de layout, tipografía y motion.

---

*Documento de planeación — no modifica código. La implementación comienza tras tu aprobación de la dirección visual (Fase 4.1).*
