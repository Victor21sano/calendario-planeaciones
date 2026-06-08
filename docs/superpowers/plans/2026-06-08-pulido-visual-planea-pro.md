# Pulido Visual de Planea-Pro — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar cuatro mejoras de pulido visual (tokens de color, login móvil, header del dashboard, acentos en copia de UI) sin alterar ninguna lógica ni la salida del documento Word.

**Architecture:** Cambios 100% de presentación. Tres tareas son ediciones in-place deterministas (`index.css`, `LoginPage.jsx`, sweep de acentos); una crea un componente nuevo de presentación (`MenuUsuario.jsx`) que reutiliza los handlers existentes del dashboard sin tocar su lógica.

**Tech Stack:** React + Vite + Tailwind CSS. Sistema de diseño "Archivo Vivo" (tokens `brand`/`accent`/`danger`/etc. en `tailwind.config.js`; clases de componente en `src/index.css`).

**Spec:** `docs/superpowers/specs/2026-06-08-pulido-visual-planea-pro-design.md`

**Rama:** `diseno-pulido` (ya creada desde `rediseno-visual`).

---

## Notas de entorno (leer antes de empezar)

- **El build de Vite está roto** (rollup/vite sin ejecutable utilizable). NO se valida con `npm run build`. La validación de que las clases Tailwind compilan se hace con el **CLI de Tailwind** directamente (ver Task de verificación). Si el CLI tampoco corre, la verificación es revisión visual + diff-guard.
- **Shell del usuario: fish.** Los comandos de este plan usan sintaxis POSIX simple compatible; si algún `&&`/`||` complejo falla en fish, ejecutarlo dentro de `bash -c '...'`.
- **No existe framework de tests JS** para estas pantallas, y son cambios puramente visuales. Por eso cada tarea verifica con: (a) Tailwind CLI build, (b) **diff-guard** que confirma que NINGÚN archivo prohibido fue tocado, (c) revisión visual descrita en cada tarea.
- **Árbol de git sucio heredado:** la rama traía cambios previos sin commitear (incl. `functions/index.js`). NUNCA usar `git add -A` / `git add .`. Siempre `git add <rutas exactas>` de los archivos de cada tarea.

### Diff-guard (se reutiliza en cada tarea)

Confirma que no se tocó lógica/salida. Debe imprimir `OK`:

```bash
bash -c 'git diff --name-only HEAD | grep -E "services/|modelos/|hooks/|contexts/|exportar2023|prompts|functions/" && echo "VIOLACION: archivo prohibido tocado" || echo "OK"'
```

---

## File Structure

- **Modificar** `src/index.css` — migrar 2 clases (`.btn-danger`, `.btn-icon-delete`) de `rose-*` a `danger-*`. Una responsabilidad: tokens de color de componente.
- **Modificar** `src/pages/LoginPage.jsx` — añadir hero compacto móvil; quitar checkbox decorativo.
- **Crear** `src/components/dashboard/MenuUsuario.jsx` — componente de presentación: botón avatar + dropdown (Perfil/Admin/Salir) con click-fuera y Esc. Recibe props, sin estado de negocio.
- **Modificar** `src/pages/DashboardPage.jsx` — reemplazar el bloque Admin/Perfil/Salir del header por `<MenuUsuario>`; calcular la inicial del avatar.
- **Modificar** N archivos de UI en `src/pages/` y `src/components/` — corregir acentos solo en texto visible.

---

## Task 1: Tokens `rose → danger` en index.css

**Files:**
- Modify: `src/index.css` (clases `.btn-danger` y `.btn-icon-delete`)

- [ ] **Step 1: Localizar las clases rose actuales**

Run:
```bash
bash -c 'grep -nE "rose-[0-9]" src/index.css'
```
Expected: ~12 líneas, todas dentro de `.btn-danger` y `.btn-icon-delete`. Si aparece `rose-` en cualquier otra clase, anotarlo (no debería).

- [ ] **Step 2: Migrar `.btn-danger`**

En el bloque `.btn-danger` (`@apply ...`), reemplazar exactamente:

```
           text-rose-600 dark:text-rose-400
           bg-rose-50 dark:bg-rose-900/20
           border border-rose-200 dark:border-rose-800/40
           hover:bg-rose-100 dark:hover:bg-rose-900/40
           outline-none
           focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2;
```

por:

```
           text-danger-600 dark:text-danger-400
           bg-danger-50 dark:bg-danger-900/20
           border border-danger-200 dark:border-danger-800/40
           hover:bg-danger-100 dark:hover:bg-danger-900/40
           outline-none
           focus-visible:ring-2 focus-visible:ring-danger-500 focus-visible:ring-offset-2;
```

- [ ] **Step 3: Migrar `.btn-icon-delete`**

En el bloque `.btn-icon-delete` (`@apply ...`), reemplazar exactamente:

```
    @apply p-1.5 rounded-lg text-slate-400
           hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20
           opacity-0 group-hover:opacity-100
           outline-none
           focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1;
```

por:

```
    @apply p-1.5 rounded-lg text-slate-400
           hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20
           opacity-0 group-hover:opacity-100
           outline-none
           focus-visible:ring-2 focus-visible:ring-danger-500 focus-visible:ring-offset-1;
```

- [ ] **Step 4: Verificar que ya no quedan clases rose**

Run:
```bash
bash -c 'grep -nE "rose-[0-9]" src/index.css && echo "QUEDAN ROSE" || echo "OK: sin rose"'
```
Expected: `OK: sin rose`

- [ ] **Step 5: Validar que Tailwind compila (best-effort)**

Run:
```bash
bash -c 'npx tailwindcss -i src/index.css -o /tmp/planea-out.css 2>&1 | tail -5'
```
Expected: compila sin error y `/tmp/planea-out.css` contiene reglas (`grep -c danger /tmp/planea-out.css` > 0). Si el CLI no está disponible, omitir y anotar.

- [ ] **Step 6: Diff-guard y commit**

Run el diff-guard (debe imprimir `OK`), luego:
```bash
git add src/index.css
git commit -m "style: migrar btn-danger e icon-delete de rose a token danger"
```

---

## Task 2: Login móvil + quitar checkbox decorativo

**Files:**
- Modify: `src/pages/LoginPage.jsx`

- [ ] **Step 1: Añadir hero compacto solo-móvil**

En el `return`, justo después de `<main ...>` y ANTES de `<section className="hidden animate-slide-up lg:block">`, insertar este bloque (visible solo en `<lg`, oculto en desktop donde ya está el panel grande):

```jsx
        {/* Hero compacto — solo móvil (en lg+ aparece el panel lateral completo) */}
        <section className="text-center lg:hidden animate-slide-up">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700 shadow-sm backdrop-blur dark:border-brand-800/60 dark:bg-slate-900/50 dark:text-brand-300">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            Para docentes CONALEP
          </p>
          <h1 className="font-display text-[1.6rem] font-semibold leading-tight tracking-tight text-slate-950 dark:text-white">
            Convierte PE y GPE en <span className="text-accent-600 dark:text-accent-400">planeaciones listas</span> para revisar y exportar.
          </h1>
        </section>
```

- [ ] **Step 2: Quitar el checkbox "Mantener sesión" (conservando el enlace de recuperación)**

Reemplazar exactamente este bloque:

```jsx
            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-xs text-slate-600 dark:text-slate-400">Mantener sesion</span>
              </label>
              <Link to="/reset-password" className="text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300">
                Olvide mi contrasena
              </Link>
            </div>
```

por (queda solo el enlace, alineado a la derecha; con acentos ya corregidos):

```jsx
            <div className="flex items-center justify-end pt-1">
              <Link to="/reset-password" className="text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300">
                Olvidé mi contraseña
              </Link>
            </div>
```

- [ ] **Step 3: Verificar render mental / sintaxis**

Run:
```bash
bash -c 'grep -n "lg:hidden" src/pages/LoginPage.jsx && grep -n "Mantener sesion" src/pages/LoginPage.jsx && echo "AUN EXISTE CHECKBOX" || echo "OK: checkbox eliminado"'
```
Expected: aparece la línea `lg:hidden` y luego `OK: checkbox eliminado`.

- [ ] **Step 4: Revisión visual (manual)**

Abrir `/login`: en viewport angosto (<1024px) debe verse el badge + titular arriba del formulario; en ancho (≥1024px) NO debe duplicarse (solo el panel lateral grande). El checkbox ya no aparece; el enlace "Olvidé mi contraseña" queda a la derecha.

- [ ] **Step 5: Diff-guard y commit**

Diff-guard debe imprimir `OK`, luego:
```bash
git add src/pages/LoginPage.jsx
git commit -m "feat(ui): hero de valor en login movil y quitar checkbox decorativo"
```

> Nota: los demás acentos de `LoginPage.jsx` se corrigen en la Task 4 (sweep). Aquí solo se tocó el bloque del checkbox.

---

## Task 3: Header del dashboard — Avatar + menú (opción A)

**Files:**
- Create: `src/components/dashboard/MenuUsuario.jsx`
- Modify: `src/pages/DashboardPage.jsx` (header, líneas ~300-329; e import)

- [ ] **Step 1: Crear el componente `MenuUsuario`**

Create `src/components/dashboard/MenuUsuario.jsx` con este contenido exacto:

```jsx
import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

/**
 * Menú de usuario del header: botón avatar con dropdown (Perfil/Admin/Salir).
 * Solo presentación: el estado abrir/cerrar es de UI; la acción de salir y la
 * navegación vienen del padre (sin lógica de negocio aquí).
 */
export default function MenuUsuario({ inicial, esAdmin, onLogout }) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!abierto) return
    function onClickFuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false)
    }
    function onEsc(e) {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', onClickFuera)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickFuera)
      document.removeEventListener('keydown', onEsc)
    }
  }, [abierto])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto(v => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Menú de cuenta"
        className="icon-button h-9 w-9 rounded-full bg-brand-600 text-sm font-bold text-white hover:bg-brand-500"
      >
        {inicial}
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-44 origin-top-right animate-scale-in rounded-xl border border-brand-100/70 bg-[var(--surface-primary)] p-1.5 shadow-xl dark:border-white/10"
        >
          <Link
            to="/perfil"
            role="menuitem"
            onClick={() => setAbierto(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Mi perfil
          </Link>

          {esAdmin && (
            <Link
              to="/admin"
              role="menuitem"
              onClick={() => setAbierto(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/20"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin
            </Link>
          )}

          <div className="my-1 border-t border-slate-100 dark:border-white/5" />

          <button
            type="button"
            role="menuitem"
            onClick={() => { setAbierto(false); onLogout() }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Salir
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Importar `MenuUsuario` en DashboardPage**

En `src/pages/DashboardPage.jsx`, junto a los demás imports de componentes (cerca de la línea de `import PerfilIncompletoModal ...`), añadir:

```jsx
import MenuUsuario from '../components/dashboard/MenuUsuario'
```

- [ ] **Step 3: Calcular la inicial del avatar**

Dentro de `DashboardPage()`, después de la línea `const { user, logout, esAdmin, creditos, sinCreditosDisponibles, perfilDocente } = useAuth()`, añadir:

```jsx
  const inicialAvatar = (perfilDocente?.nombre || user?.displayName || user?.email || '?')
    .trim().charAt(0).toUpperCase() || '?'
```

- [ ] **Step 4: Reemplazar el bloque Admin/Perfil/Salir del header**

En el header, reemplazar exactamente este bloque (el `Link` a `/admin`, el `Link` a `/perfil` y el `button` de Salir):

```jsx
            {esAdmin && (
              <Link to="/admin"
                className="pressable hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30">
                <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                Admin
              </Link>
            )}
            {/* Link perfil */}
            <Link
              to="/perfil"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Mi perfil"
            >
              <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Perfil
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-danger-600 dark:hover:text-danger-400 px-2.5 py-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
            >
              Salir
            </button>
```

por una sola línea:

```jsx
            <MenuUsuario inicial={inicialAvatar} esAdmin={esAdmin} onLogout={handleLogout} />
```

(El `<SaldoCreditos />` que está justo antes se conserva tal cual.)

- [ ] **Step 5: Verificar que el handler y SaldoCreditos siguen intactos**

Run:
```bash
bash -c 'grep -n "MenuUsuario" src/pages/DashboardPage.jsx && grep -n "handleLogout" src/pages/DashboardPage.jsx && grep -n "SaldoCreditos />" src/pages/DashboardPage.jsx'
```
Expected: import + uso de `MenuUsuario`; `handleLogout` sigue definido y se pasa como prop; `<SaldoCreditos />` sigue en el header. La función `handleLogout` NO debe haberse modificado.

- [ ] **Step 6: Validar Tailwind (best-effort)**

Run:
```bash
bash -c 'npx tailwindcss -i src/index.css -o /tmp/planea-out.css 2>&1 | tail -5'
```
Expected: compila sin error. (Las clases nuevas son utilidades estándar ya cubiertas por el `content` glob.)

- [ ] **Step 7: Revisión visual (manual)**

En `/dashboard`: el header muestra `Saldo + avatar`. Click en el avatar abre el menú con Mi perfil, Admin (solo si admin) y Salir. Cerrar funciona con: click en una opción, click fuera, y tecla Esc. En dark mode los colores son correctos. Salir cierra sesión como antes.

- [ ] **Step 8: Diff-guard y commit**

Diff-guard debe imprimir `OK`, luego:
```bash
git add src/components/dashboard/MenuUsuario.jsx src/pages/DashboardPage.jsx
git commit -m "feat(ui): header del dashboard con menu de usuario (avatar + dropdown)"
```

---

## Task 4: Sweep de acentos en texto de UI

**Objetivo:** corregir acentos SOLO en texto visible de `src/pages/` y `src/components/`. **Regla de oro (crítica):** `planeacion` y similares aparecen muchísimo como identificadores (`planeacion2023`, `planeacion_dark_mode`, args de función, keys). NUNCA se renombra un identificador. Se corrige únicamente cuando el texto es: contenido entre `>...<` en JSX, valor de `placeholder=`, `title=`, `aria-label=`, o etiqueta de botón/enlace de cara al usuario.

**Files:**
- Modify: archivos de UI listados en Step 2 (solo los que tengan texto visible afectado).

- [ ] **Step 1: Tabla de mapeo (referencia de corrección)**

Aplicar SOLO sobre texto visible. Mapeo (forma sin acento → con acento), respetando mayúsculas iniciales:

| sin acento | con acento |
|---|---|
| sesion | sesión |
| contrasena / Contrasena | contraseña / Contraseña |
| electronico | electrónico |
| didacticas / didactica | didácticas / didáctica |
| planeacion (como texto) | planeación |
| Continua / continua (verbo) | Continúa / continúa |
| Olvide | Olvidé |
| Registrate | Regístrate |
| informacion | información |
| numero | número |
| telefono | teléfono |
| configuracion | configuración |
| generacion | generación |
| exportacion | exportación |
| seleccion | selección |
| opcion | opción |
| evaluacion | evaluación |
| automatico | automático |
| periodo | período |
| credito / creditos (texto) | crédito / créditos |
| pagina | página |
| tambien | también |
| despues | después |
| metodo | método |
| titulo (como texto) | título |

> Si una palabra de la tabla es parte de un identificador (p. ej. `planeacion2023`, `selección` dentro de un nombre de variable, `creditos` como prop/clave de estado), **NO se toca**.

- [ ] **Step 2: Generar la lista de archivos candidatos**

Run:
```bash
bash -c "grep -rloE '\b(sesion|contrasena|electronico|didactic[ao]s?|informacion|numero|telefono|configuracion|generacion|exportacion|continua|olvide|registrate|tambien|despues|seleccion|opcion|evaluacion|automatico|periodo)\b' src/pages src/components"
```
Expected: una lista de archivos. Procesarlos uno por uno en los steps siguientes. (LoginPage.jsx ya tuvo su checkbox corregido en Task 2, pero aún tiene otros acentos: sí entra al sweep.)

- [ ] **Step 3: Procesar cada archivo (procedimiento por archivo)**

Para CADA archivo de la lista, repetir:

  1. Listar los hits con contexto:
     ```bash
     bash -c "grep -nE '\b(sesion|contrasena|electronico|didactic[ao]s?|informacion|numero|telefono|configuracion|generacion|exportacion|continua|olvide|registrate|tambien|despues|seleccion|opcion|evaluacion|automatico|periodo|planeacion|credito|pagina|titulo|metodo)\b' <archivo>"
     ```
  2. Abrir el archivo y, para cada hit, decidir con la **Regla de oro**:
     - ¿Es texto visible (entre `>...<`, `placeholder`, `title`, `aria-label`, label de botón)? → corregir con la tabla del Step 1.
     - ¿Es identificador, key, prop, nombre de función/variable, o string que se pasa a un servicio/modelo/prompt/export? → **dejar igual**.
  3. Aplicar las correcciones de texto visible con ediciones puntuales (no reemplazo global).

- [ ] **Step 4: Verificación de no-regresión de identificadores**

Tras editar todos los archivos, confirmar que no se renombró ningún identificador común. Estos conteos NO deben haber bajado:

```bash
bash -c "echo planeacion2023: ; grep -rc 'planeacion2023' src | grep -v ':0' | wc -l ; echo planeacion_dark_mode: ; grep -rn 'planeacion_dark_mode' src | wc -l"
```
Expected: `planeacion2023` sigue presente en los mismos archivos; `planeacion_dark_mode` sigue existiendo. Si alguno desapareció → se renombró un identificador por error: revertir ese cambio.

- [ ] **Step 5: Diff-guard reforzado**

El sweep es donde más fácil se cuela un archivo prohibido. Correr el diff-guard; debe imprimir `OK`:

```bash
bash -c 'git diff --name-only HEAD | grep -E "services/|modelos/|hooks/|contexts/|exportar2023|prompts|functions/" && echo "VIOLACION: archivo prohibido tocado" || echo "OK"'
```
Si imprime VIOLACION: `git checkout -- <ese archivo>` para revertirlo (no entra en este sweep).

- [ ] **Step 6: Revisar el diff completo del sweep**

Run:
```bash
bash -c 'git diff --stat ; echo "--- revisar que TODO cambio sea texto visible ---" ; git diff'
```
Expected: cada línea cambiada es texto de cara al usuario (solo se agregaron tildes/ñ). Ningún cambio en nombres de variables, imports, props o JSX no textual.

- [ ] **Step 7: Validar Tailwind (best-effort) y commit**

```bash
bash -c 'npx tailwindcss -i src/index.css -o /tmp/planea-out.css 2>&1 | tail -3'
```
Luego commitear solo los archivos del sweep (listar las rutas exactas que aparecieron en `git diff --stat`):
```bash
git add <ruta1.jsx> <ruta2.jsx> ...   # rutas exactas, NO 'git add .'
git commit -m "style(ui): corregir acentos en texto visible de pages y components"
```

---

## Verificación final (cierre del plan)

- [ ] **Diff-guard global:** correr el diff-guard sobre todo el rango de la rama:
  ```bash
  bash -c 'git diff --name-only rediseno-visual..diseno-pulido | grep -E "services/|modelos/|hooks/|contexts/|exportar2023|prompts|functions/" && echo "VIOLACION" || echo "OK: sin lógica tocada"'
  ```
  Expected: `OK: sin lógica tocada`.
- [ ] **Lista de archivos tocados:** `git diff --name-only rediseno-visual..diseno-pulido` debe contener solo: el spec, este plan, `src/index.css`, `src/pages/LoginPage.jsx`, `src/components/dashboard/MenuUsuario.jsx`, `src/pages/DashboardPage.jsx`, y los archivos de UI del sweep.
- [ ] **Revisión visual integral:** login (móvil + desktop + dark), dashboard (header/menú + dark), botón eliminar con tono `danger`, acentos correctos en pantallas clave.
- [ ] Usar `superpowers:requesting-code-review` antes de integrar, si se desea una revisión final.

---

## Cobertura del spec (self-review)

- Spec §1 Acentos UI → **Task 4** (acotado a pages/+components/, regla de oro anti-identificadores). ✔
- Spec §2 Tokens rose→danger en index.css → **Task 1**. ✔
- Spec §3 Login móvil + quitar checkbox → **Task 2**. ✔
- Spec §4 Header avatar+menú (opción A) → **Task 3** (`MenuUsuario` + wiring, estado de UI, reutiliza `handleLogout`). ✔
- Spec "Verificación" (Tailwind CLI, revisión visual, diff sin archivos prohibidos) → steps de verificación + diff-guard en cada tarea y cierre. ✔
- Spec "Fuera de alcance" → respetado (no persistencia de sesión, no refactors, no paleta categórica, no `functions/`). ✔
