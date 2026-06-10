# Spec — Troceo de PlanificadorPage.jsx

**Fecha:** 2026-06-10
**Alcance:** Moderado (helpers + sub-componentes presentacionales + hook de generación)
**Estrategia:** Extracción mecánica pura — **cero cambios de comportamiento**.

## Problema

`src/pages/PlanificadorPage.jsx` tiene **1,385 líneas**: mezcla helpers puros,
sub-componentes presentacionales, ~25 piezas de estado, 9 efectos, la
orquestación de generación (IA + créditos) y ~374 líneas de render. Es difícil
de mantener y razonar.

## Objetivo

Reducir el archivo a ~750 líneas extrayendo tres grupos con costuras claras,
**sin tocar la lógica** (mover código carácter por carácter, solo cablear
params/imports). No se modifican `services/`, `contexts/` ni `modelos/`.

## Estructura nueva (co-locada)

```
src/pages/planificador/
  utils.js                 # helpers puros + constantes
  components/
    Stepper.jsx
    Toast.jsx
    AlertBanner.jsx
  useFlujoGeneracion.js    # motor de generación (hook)
src/pages/PlanificadorPage.jsx   # 1385 -> ~750 L
```

## Unidades a extraer

### 1. `utils.js` (riesgo nulo — funciones puras)
- `extraerUnidadesDesde2023`, `sumarHorasUnidades`, `nombreMateriaDesdeSiglema`,
  `debeAutonombrarMateria`, `base64ToFile`, `expandirPeriodosVacacionales`
- Constantes `PDFS_KEY`, `DARK_KEY`
- La página las importa.

### 2. `components/` (riesgo muy bajo — presentación pura)
- `Stepper`, `Toast`, `AlertBanner` — definidos solo aquí, sin estado propio.
- Reciben sus props tal cual hoy.

### 3. `useFlujoGeneracion.js` (riesgo medio — estado entrelazado)
**Posee** el estado de flujo: `onboardingFase`, `genProgress`, `genError`,
`genResult`, `pendingResult`, `pdfsPendientes`, `pendienteEsGratis`,
`mostrarModalFechas`, `guardandoFechas`, `mostrarModalSinCreditos`,
`generandoPagada`, y el ref `continuacionPerfilProcesadaRef`.

**Mueve** los handlers: `handleOnboardingGenerate`, `handleFreeExtract`,
`handleGenerarDesdeEstructura`, `handleGuardarFechas`, `handleCerrarModalFechas`,
`continuarTrasCompletarPerfil`, `handleOnboardingSuccess`, y el efecto
"continuar tras completar perfil".

**Recibe** lo que coordina con la página:
`{ estado, setEstado, mainTab, setMainTab, materiaId, user, perfilDocente, creditos, esAdmin }`.
`navigate`/`location` se obtienen dentro del hook.

**Devuelve** los handlers + el estado de flujo que consume el render.

> Límite honesto: la interfaz es *ancha* (pasa `setEstado`/`setMainTab`) porque
> el código original acopla generación + materia + modales. Es una reubicación
> que agrupa el motor y achica la página, no una abstracción nueva. El nombre es
> `useFlujoGeneracion` (no `2023`) porque cubre ambos modelos (2018 y 2023).

## Qué se queda en la página
Carga de materia, auto-guardado (debounced), efecto de validación/cálculo,
dark mode, derivados del stepper, y todo el render JSX.

## Orden de ejecución (gate de build entre pasos)
1. `utils.js` → `npm run build` ✓
2. `components/` → `npm run build` ✓
3. `useFlujoGeneracion.js` → `npm run build` ✓

## Verificación
- `npm run build` tras cada paso (atrapa imports/props/wiring rotos).
- Revisión de diff: lo movido debe ser idéntico salvo el cableado de params.
- **Limitación:** sin tests de esta página, el build no valida el comportamiento
  en runtime. Un smoke-test real (onboarding → horario → generación) necesita
  PDFs + créditos + Firebase; queda como verificación manual opcional.

## No-objetivos (fuera de scope)
- Cambiar comportamiento, copy, estilos o nombres de props.
- Partir el render JSX en sub-secciones (sería el alcance "agresivo").
- Tocar `services/`, `contexts/`, `modelos/`.
