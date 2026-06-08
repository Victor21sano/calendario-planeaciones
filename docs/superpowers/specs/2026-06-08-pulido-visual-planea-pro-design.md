# Pulido visual de Planea-Pro (sin tocar lógica)

**Fecha:** 2026-06-08
**Rama:** `diseno-pulido` (creada desde `rediseno-visual`)
**Regla rectora:** cambios 100% de capa de presentación. NO se toca `services/`,
`contexts/`, `modelos/`, `hooks/`, `services/exportar2023/`, ni los `prompts` de IA.
Cero cambios de comportamiento.

## Objetivo

Cerrar las inconsistencias de pulido detectadas en el diagnóstico de diseño,
sin alterar ninguna lógica ni la salida del documento Word. Cuatro frentes:
acentos en copia de UI, unificación de tokens de color, login en móvil, y
limpieza del header del dashboard.

## Restricciones

- **No lógica.** Solo markup JSX, clases Tailwind y CSS de presentación.
- **No tocar archivos prohibidos** (regla dura del proyecto): `services/`,
  `modelos/`, `hooks/`, `contexts/`, `services/exportar2023/`,
  `services/ia/prompts*`, `utils/`. El texto en esos archivos alimenta la IA,
  la validación o el documento exportado → es lógica/salida.
- **Git:** trabajar en `diseno-pulido`; commitear SOLO los archivos tocados por
  este trabajo. El árbol traía cambios previos sin commitear (incl.
  `functions/index.js`) que NO deben mezclarse.

## Alcance por sección

### 1. Acentos en texto de UI

- **Dónde:** strings visibles al usuario en `src/pages/` y `src/components/`.
- **Qué se cambia:** contenido de texto JSX, `placeholder`, `title`,
  `aria-label`, etiquetas de botón.
- **Qué NO se cambia:** identificadores, nombres de prop, keys, claves de
  objeto, y cualquier string que se pase a `services/`, `modelos/`,
  `exportar2023/` o `prompts`. Si un componente de UI construye texto que
  termina en el Word o en un prompt, ese string se deja igual.
- **Ejemplos:** "sesión", "contraseña", "electrónico", "didácticas",
  "Continúa", "Olvidé", "Regístrate", "planeación", "información", "número".
- **Método:** abrir cada archivo de UI, corregir solo strings de cara al
  usuario, revisar uno por uno. No usar reemplazo global a ciegas.

### 2. Tokens de color `rose → danger`

- **Dónde:** únicamente `src/index.css` (las clases ad-hoc viven solo ahí).
- **Clases afectadas:** `.btn-danger` y `.btn-icon-delete`.
- **Cambio:** `text-rose-* → text-danger-*`, `bg-rose-* → bg-danger-*`,
  `border-rose-* → border-danger-*`, `ring-rose-* → ring-danger-*`
  (incluidas variantes `dark:` y opacidades `/20`, `/40`).
- **Efecto visual esperado:** `danger-600` (#dc2626, rojo puro) vs `rose-600`
  (#e11d48, rosado): el botón de eliminar quedará levemente menos rosa y más
  rojo. Es el comportamiento deseado del sistema de tokens (Archivo Vivo).

### 3. Login en móvil + checkbox decorativo

- **Archivo:** `src/pages/LoginPage.jsx`.
- **Propuesta de valor en móvil:** hoy el panel izquierdo es `hidden lg:block`,
  así que en celular solo se ve el formulario. Añadir, visible solo en `<lg`,
  una versión compacta encima del formulario: el badge "Para docentes CONALEP"
  + el titular (`h1`). Las 3 tarjetas de features permanecen solo en desktop.
  Puro markup Tailwind responsivo; sin estado nuevo.
- **Checkbox "Mantener sesión":** actualmente no tiene `onChange` ni estado —
  promete algo que no ocurre. **Decisión:** eliminarlo. (Alternativa descartada:
  cablear persistencia de Firebase = lógica, fuera de alcance.)

### 4. Header del dashboard — Avatar + menú (opción A)

- **Archivo:** `src/pages/DashboardPage.jsx` (y, si conviene, un componente
  pequeño nuevo de menú en `src/components/` o `src/components/ui/`).
- **Estado actual:** header con `Saldo · Admin · Perfil · Salir` como 4
  elementos sueltos; Admin y Perfil ocultos en móvil.
- **Diseño nuevo:** dos bloques — `SaldoCreditos` (chip) + botón avatar con
  inicial/icono. El avatar abre un menú desplegable con:
  - Mi perfil → `/perfil`
  - Admin → `/admin` (solo si `esAdmin`)
  - divisor
  - Salir → `handleLogout`
- **Interacción:** `useState` local para abrir/cerrar (estado de presentación,
  no lógica de negocio); cerrar con click-fuera y tecla `Esc`; `focus-visible`
  y `aria-*` para accesibilidad, siguiendo el patrón existente
  (`.icon-button`, `focus-visible:ring-brand-500`).
- **Reutiliza:** los handlers existentes (`handleLogout`, navegación) sin
  modificar su lógica; solo se reorganiza la presentación.

## Componentes / unidades

- **MenuUsuario** (nuevo, presentación): botón avatar + dropdown. Entradas:
  `esAdmin`, `onLogout`. Sin estado de negocio; solo abre/cierra y enruta.
- Resto: ediciones in-place de texto/clases en archivos de UI existentes.

## Verificación

- Build/validación de Tailwind con el método del proyecto (rollup roto; usar
  CLI de Tailwind para validar que las clases compilan — ver memory de entorno).
- Revisión visual: login en móvil y desktop, dark mode, menú del header
  (abrir/cerrar, click-fuera, Esc, teclado), botón eliminar con nuevo tono.
- Confirmar que NINGÚN archivo de `services/`, `modelos/`, `hooks/`,
  `contexts/`, `exportar2023/` o `prompts` aparece en el `git diff`.
- `git diff --stat` solo debe listar archivos de UI + `index.css` + este spec.

## Fuera de alcance (YAGNI)

- Cablear persistencia de sesión (lógica).
- Refactors no relacionados.
- Tocar la paleta categórica de 6 colores de `ResultadoTabla`/`EstructuraForm`.
- Cambios en `functions/` o en cualquier flujo de datos.
