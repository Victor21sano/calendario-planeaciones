# Asistente Estímulo Docente — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portar el Asistente Estímulo Docente (checklist vanilla HTML/JS) a PLANEA-PRO como una ruta protegida `/asistente-estimulo`, con tarjeta de acceso en el dashboard.

**Architecture:** Página React lazy con el sistema de diseño PLANEA-PRO (tokens brand/danger/info/warning, clases `card`, `btn-primary`, `btn-secondary`, `input-base`). Estado completo en `useEstimuloState` con persistencia en `localStorage` usando la key original. Cinco subcomponentes puros, todos en `src/pages/estimulo/`.

**Tech Stack:** React 18, React Router v6, Tailwind CSS (tokens existentes), localStorage, createPortal para modal.

## Global Constraints

- Proyecto en: `/home/emmanuel/Datos/Archivos/Documentos/PLANEA-PRO/APP CALENDARIO PLANEACIONES FINAL/APP CALENDARIO PLANEACIONES`
- Rama activa: `feat-stripe-creditos` — todos los commits van aquí
- Build: `npm run dev` para verificar; `npm run build` para validar antes de cualquier commit crítico
- NO modificar: `services/`, `contexts/AuthContext.jsx`, `services/materias.js`, `hooks/` existentes
- Clases CSS disponibles: `card`, `card-spotlight`, `btn-primary`, `btn-secondary`, `btn-accent`, `input-base`, `icon-button`, `surface-atmosphere`, `animate-scale-in`, `animate-fade-in`
- Tokens Tailwind: `brand-*`, `danger-*`, `info-*`, `warning-*`, `success-*` (NO usar colores ad-hoc como `emerald`, `rose`, `violet`, etc.)
- Tipografía: `font-display` = Fraunces (títulos); cuerpo = Plus Jakarta Sans (default)
- localStorage key: `asistente-estimulo-docente-v1` (NO cambiar — preserva avance existente)
- Verificación visual: no hay test runner para React; cada tarea termina con `npm run dev` + revisión en `http://localhost:5173`

---

## Mapa de archivos

| Acción | Ruta |
|---|---|
| Crear | `src/pages/estimulo/data.js` |
| Crear | `src/pages/estimulo/useEstimuloState.js` |
| Crear | `src/pages/estimulo/components/ConfirmResetModal.jsx` |
| Crear | `src/pages/estimulo/components/FechasPanel.jsx` |
| Crear | `src/pages/estimulo/components/ReqCard.jsx` |
| Crear | `src/pages/estimulo/components/ScorePanel.jsx` |
| Crear | `src/pages/estimulo/components/StatusBar.jsx` |
| Crear | `src/pages/EstimuloDocentePage.jsx` |
| Modificar | `src/App.jsx` (agregar ruta lazy) |
| Modificar | `src/index.css` (agregar estilos `@media print`) |
| Modificar | `src/pages/DashboardPage.jsx` (agregar sección Herramientas) |
| Copiar | `public/docs/convocatoria-estimulo-2526.pdf` |
| Copiar | `public/docs/cedula-edd.pdf` |

---

## Task 1: Datos y PDFs

**Files:**
- Create: `src/pages/estimulo/data.js`
- Copy: `public/docs/convocatoria-estimulo-2526.pdf`
- Copy: `public/docs/cedula-edd.pdf`

**Interfaces:**
- Produces: `sections` (array de 8 objetos con `.id`, `.title`, `.desc`, `.items[]`), `scoreRubric` (objeto indexado por `itemId`, cada entrada con `.factor`, `.subfactor`, `.max`, `.options[]`), `factorMeta` (objeto con claves `"1"`, `"2"`, `"3"`, cada una con `.label` y `.max`)

- [ ] **Step 1: Crear el directorio y el archivo de datos**

```bash
mkdir -p "src/pages/estimulo/components"
```

Crear `src/pages/estimulo/data.js` con el contenido completo extraído del original:

```js
export const sections = [
  {
    id: 'perfil',
    title: '1. Verificación antes de armar expediente',
    desc: 'Condiciones base para saber si conviene iniciar el trámite. No todas son documentos que se entregan; varias se validan con el plantel.',
    items: [
      { id: 'perfil-frente-grupo', title: 'Confirmar que estás frente a grupo', deadline: 'Momento: antes de iniciar el expediente', tags: ['Verificación'], tagType: 'verify', desc: 'Debes impartir módulos, asignaturas o materias frente a grupo.', detail: ['Si no estás en funciones frente a grupo, la convocatoria excluye la participación.'] },
      { id: 'perfil-carga-horaria', title: 'Confirmar carga mínima de 8 horas/semana/mes', deadline: 'Momento: antes de iniciar el expediente', tags: ['Verificación'], tagType: 'verify', desc: 'Valida tu carga horaria asignada para el periodo semestral correspondiente.' },
      { id: 'perfil-pevidd', title: 'Confirmar evaluación PEVIDD con promedio mínimo de 8.0', deadline: 'Momento: antes de iniciar el expediente', tags: ['Verificación'], tagType: 'verify', desc: 'La convocatoria pide haber sido evaluado en los cuatro instrumentos del PEVIDD y cubrir promedio general mínimo de 8.0.', callout: 'No lo puse como documento de entrega porque estos resultados normalmente los consulta o valida el plantel.' },
      { id: 'perfil-asistencia', title: 'Confirmar asistencia mínima del 90%', deadline: 'Periodo a revisar: 03 de febrero al 19 de junio de 2026', tags: ['Verificación'], tagType: 'verify', desc: 'Considera el total de la duración del periodo semestral y la carga horaria asignada.' },
      { id: 'perfil-exclusion', title: 'Revisar que no estés en causal de exclusión', deadline: 'Momento: antes de entregar el expediente', tags: ['Verificación'], tagType: 'verify', desc: 'Revisa interinato o temporalidad, licencias, falta de funciones frente a grupo, renuncia voluntaria al programa o notificaciones por falta de captura oportuna de calificaciones.', detail: ['También revisa que no exista incumplimiento de disposiciones de la convocatoria.', 'Si tienes duda, conviene validarlo con Formación Técnica antes de reunir todo el expediente.'] }
    ]
  },
  {
    id: 'formatos',
    title: '2. Formatos de participación',
    desc: 'Documentos que sí debes llenar, firmar y entregar según la modalidad indicada por tu plantel.',
    items: [
      { id: 'formato-anexo-i', title: 'Anexo I: Solicitud para participar', deadline: 'Entrega: 15 al 25 de junio de 2026', tags: ['Obligatorio'], tagType: 'required', desc: 'Debe ir debidamente requisitada y firmada.', detail: ['Datos personales: nombre, RFC, CURP, teléfono y género.', 'Datos generales: colegio estatal, plantel y periodo semestral.', 'Datos académicos: nivel académico, área de formación, contratación, fechas y horas.', 'Indicar si participaste antes y, en su caso, puntuación y nivel obtenido.'] },
      { id: 'formato-anexo-ii', title: 'Anexo II: Carta bajo protesta de decir verdad', deadline: 'Entrega: 15 al 25 de junio de 2026', tags: ['Obligatorio'], tagType: 'required', desc: 'Debe completarse con lugar, entidad, fecha, destinatario, periodo semestral y firma autógrafa.', callout: 'Este punto evita confusión: no basta tener el formato; debe estar llenado y firmado.' }
    ]
  },
  {
    id: 'identidad',
    title: '3. Identidad y datos fiscales',
    desc: 'Documentos personales básicos para integrar el expediente.',
    items: [
      { id: 'doc-rfc', title: 'Constancia de Situación Fiscal vigente', deadline: 'Entrega: 15 al 25 de junio de 2026', tags: ['Obligatorio'], tagType: 'required', desc: 'Documento para acreditar RFC vigente.', callout: 'Verifica que sea reciente y que el RFC coincida con los demás documentos.' },
      { id: 'doc-curp', title: 'CURP', deadline: 'Entrega: 15 al 25 de junio de 2026', tags: ['Obligatorio'], tagType: 'required', desc: 'Clave Única de Registro de Población legible y actualizada.' }
    ]
  },
  {
    id: 'academico-laboral',
    title: '4. Formación académica y experiencia',
    desc: 'Documentos para acreditar nivel académico, experiencia laboral y experiencia docente.',
    items: [
      { id: 'doc-nivel-academico', title: 'Documento oficial de nivel académico', deadline: 'Entrega: 15 al 25 de junio de 2026', tags: ['Obligatorio', 'Puntuable'], tagType: 'required score', desc: 'Título, cédula profesional, diploma o documento oficial válido según corresponda.', detail: ['Para especialidades, revisa que el documento sea diploma, certificado o documento oficial expedido por institución reconocida.', 'La convocatoria aclara que licenciatura no se considera como especialidad.'] },
      { id: 'doc-experiencia-laboral', title: 'Documento que avale experiencia laboral inicial', deadline: 'Entrega: 15 al 25 de junio de 2026', tags: ['Obligatorio', 'Puntuable'], tagType: 'required score', desc: 'Debe avalar experiencia laboral en la profesión derivada de tu formación inicial.', detail: ['Puede ser documento con membrete de empresa o persona física.', 'También puede identificar el Registro Federal de Contribuyentes cuando aplique.'] },
      { id: 'doc-experiencia-docente', title: 'Documento que avale experiencia docente', deadline: 'Entrega: 15 al 25 de junio de 2026', tags: ['Obligatorio', 'Puntuable'], tagType: 'required score', desc: 'Constancia o contrato que identifique periodos de experiencia en docencia.', detail: ['Aplica para facilitación de módulos, asignaturas o materias a nivel medio superior o superior.', 'Debe permitir identificar centro de trabajo, periodos y nivel educativo.'] }
    ]
  },
  {
    id: 'formacion-certificados',
    title: '5. Cursos, certificados y formación continua',
    desc: 'Evidencias que pueden sumar puntos si cumplen vigencia, horas y condiciones de la convocatoria.',
    items: [
      { id: 'ev-cursos-conalep', title: 'Cursos de formación impartidos por CONALEP', deadline: 'Vigencia: constancias con expedición no mayor a 1 año', tags: ['Puntuable'], tagType: 'score', desc: 'Reúne constancias o diplomas válidos. Respeta la asignación de puntos conforme al rango de horas.', callout: 'La convocatoria indica que cierta formación se considera por única ocasión; evita reutilizar constancias ya consideradas.' },
      { id: 'ev-cursos-externos', title: 'Cursos de formación impartidos por otras instituciones', deadline: 'Vigencia: constancias con expedición no mayor a 1 año', tags: ['Puntuable'], tagType: 'score', desc: 'Reúne constancias o diplomas de instituciones externas, con fecha y horas claras.' },
      { id: 'ev-certificados-afines', title: 'Certificados afines a la función docente', deadline: 'Vigencia: deben estar vigentes al integrar expediente', tags: ['Puntuable'], tagType: 'score', desc: 'Certificados avalados por instituciones públicas o privadas.', callout: 'Para el puntaje, la cédula cuenta el total de certificados vigentes: afines, digitales, lingüísticos, académicos o de aptitud.' },
      { id: 'ev-certificados-habilidades', title: 'Certificados en habilidades o competencias', deadline: 'Vigencia: revisar fecha y validez del certificado', tags: ['Puntuable'], tagType: 'score', desc: 'Pueden ser digitales, lingüísticas, académicas, de aptitud u otras aplicables.' }
    ]
  },
  {
    id: 'evidencias-docencia',
    title: '6. Evidencias de práctica docente y participación',
    desc: 'Elementos que respaldan desempeño, materiales, planeación y participación institucional.',
    items: [
      { id: 'ev-materiales', title: 'Evidencias de recursos o materiales didácticos', deadline: 'Entrega: 15 al 25 de junio de 2026', tags: ['Puntuable'], tagType: 'score', desc: 'Materiales físicos o digitales elaborados, seleccionados e incorporados en la planeación didáctica.', detail: ['Ejemplos: manuales, monografías, infografías, videos, simuladores y uso de TIC.', 'Procura incluir evidencia clara de que el material se relaciona con tu planeación.'] },
      { id: 'ev-planeacion', title: 'Registro de planeación didáctica', deadline: 'Periodo: semestre 2-2526; validar antes de entregar expediente', tags: ['Obligatorio', 'Puntuable'], tagType: 'required score', desc: 'Debe estar registrada en los medios y mecanismos establecidos conforme al número total de grupos-módulo impartidos.', callout: 'No lo dejes al final: si el sistema o mecanismo de registro falla, puede afectar el expediente.' },
      { id: 'ev-instructor-conalep', title: 'Constancia como instructor/facilitador en CONALEP', deadline: 'Vigencia: expedición no mayor a 1 año', tags: ['Puntuable'], tagType: 'score', desc: 'Participación como persona instructora o facilitadora de cursos de formación para CONALEP.', callout: 'La convocatoria señala que esta documentación se considera por única ocasión.' },
      { id: 'ev-instructor-externo', title: 'Constancia como instructor/facilitador en otras instituciones', deadline: 'Vigencia: expedición no mayor a 1 año', tags: ['Puntuable'], tagType: 'score', desc: 'Participación como persona instructora o facilitadora de cursos de formación en otras instituciones.' },
      { id: 'ev-reconocimientos', title: 'Reconocimientos, distinciones o premios', deadline: 'Vigencia: no mayor a 2 años', tags: ['Puntuable'], tagType: 'score', desc: 'Pueden ser internacionales, nacionales, estatales, locales o institucionales.', detail: ['Deben acreditar contribución, mérito o desempeño relevante en el ámbito académico, profesional o institucional.', 'No se consideran documentos simples de participación, asistencia, apoyo o colaboración ocasional.'] }
    ]
  },
  {
    id: 'pevidd-dedicacion',
    title: '7. PEVIDD, dedicación y permanencia',
    desc: 'Resultados y evidencias que la cédula considera para completar el puntaje del estímulo docente.',
    items: [
      { id: 'pevidd-observacion', title: 'Resultado de observación de una sesión', deadline: 'Periodo: semestre en curso; validación PEVIDD', tags: ['Puntuable', 'Verificación'], tagType: 'score verify', desc: 'Resultado del instrumento de observación de una sesión con calificación de 8 a 10.', callout: 'La convocatoria indica que estos resultados los consulta el responsable de Formación Técnica en el sistema establecido.' },
      { id: 'pevidd-estudiantil', title: 'Resultado de evaluación estudiantil', deadline: 'Periodo: semestre en curso; validación PEVIDD', tags: ['Puntuable', 'Verificación'], tagType: 'score verify', desc: 'Resultado del instrumento de evaluación estudiantil con calificación de 8 a 10.' },
      { id: 'pevidd-aprovechamiento', title: 'Aprovechamiento escolar del grupo o módulo', deadline: 'Periodo: semestre en curso; validación con resultados finales', tags: ['Puntuable', 'Verificación'], tagType: 'score verify', desc: 'Promedio final conforme a los grupos o módulos asignados en el semestre.' },
      { id: 'dedicacion-academias', title: 'Participación en academias', deadline: 'Periodo: semestre 2-2526; integrar actas, minutas o informes', tags: ['Puntuable'], tagType: 'score', desc: 'Evidencia de participación activa en reuniones de academia y propuestas de mejora.' },
      { id: 'dedicacion-preceptorias', title: 'Participación en tutorías o preceptorías', deadline: 'Periodo: semestre 2-2526; validar constancias del plantel', tags: ['Puntuable'], tagType: 'score', desc: 'Constancias o evidencias de intervención grupal e individual en tutorías, preceptorías o atención a estudiantes.' },
      { id: 'pevidd-autoevaluacion', title: 'Resultado de autoevaluación PEVIDD', deadline: 'Periodo: semestre en curso; validación PEVIDD', tags: ['Puntuable', 'Verificación'], tagType: 'score verify', desc: 'Resultado del instrumento de autoevaluación con calificación de 8 a 10.' },
      { id: 'pevidd-integracion', title: 'Resultado de integración al CONALEP', deadline: 'Periodo: semestre en curso; validación PEVIDD', tags: ['Puntuable', 'Verificación'], tagType: 'score verify', desc: 'Resultado del instrumento de integración al CONALEP aplicado por el responsable de Formación Técnica.' }
    ]
  },
  {
    id: 'entrega',
    title: '8. Preparación y entrega del expediente',
    desc: 'Acciones finales para que el expediente llegue completo, legible y en la modalidad correcta.',
    items: [
      { id: 'entrega-modalidad', title: 'Confirmar modalidad de entrega con el plantel', deadline: 'Antes del periodo de entrega: idealmente antes del 15 de junio de 2026', tags: ['Obligatorio'], tagType: 'required', desc: 'La convocatoria contempla expediente físico cerrado o digital con archivos PDF por correo institucional, conforme indique el plantel.' },
      { id: 'entrega-pdfs-legibles', title: 'Revisar que los archivos o copias sean legibles', deadline: 'Antes de entregar: 15 al 25 de junio de 2026', tags: ['Obligatorio'], tagType: 'required', desc: 'Verifica nombres de archivos, firmas, escaneos completos, orientación correcta y que no falten páginas.' },
      { id: 'entrega-final', title: 'Entregar expediente completo', deadline: 'Fecha límite: 25 de junio de 2026', tags: ['Obligatorio'], tagType: 'required', desc: 'Entregar al responsable de Formación Técnica del plantel de adscripción, en físico o digital según corresponda.', callout: 'Este es el único checkbox de entrega final; las fechas de resultados e inconformidad quedan solo como recordatorio.' }
    ]
  }
]

export const scoreRubric = {
  'doc-nivel-academico': {
    factor: '1', subfactor: '1.1 Formación inicial', max: 40,
    options: [['', 'Seleccionar nivel académico', 0], ['doctorado', 'Doctorado', 40], ['maestria', 'Maestría', 35], ['licenciatura', 'Licenciatura', 30], ['pasante', 'Pasante de licenciatura', 25], ['tecnico', 'Técnico', 20], ['bachillerato', 'Bachillerato', 15], ['otros', 'Otros', 10]]
  },
  'doc-experiencia-docente': {
    factor: '1', subfactor: '1.2 Ejercicio de la profesión / facilitación', max: 40,
    options: [['', 'Seleccionar experiencia docente', 0], ['dos', 'Experiencia mínima de dos años', 40], ['uno', 'Experiencia mínima de un año', 25], ['menor', 'Experiencia menor a un año', 10]]
  },
  'doc-experiencia-laboral': {
    factor: '1', subfactor: '1.3 Experiencia frente a grupo / profesión inicial', max: 40,
    options: [['', 'Seleccionar experiencia laboral', 0], ['dos', 'Experiencia mínima de dos años', 40], ['uno', 'Experiencia mínima de un año', 25], ['menor', 'Experiencia menor a un año', 10]]
  },
  'ev-cursos-conalep': {
    factor: '1', subfactor: '1.4A Actualizaciones CONALEP', max: 45,
    options: [['', 'Seleccionar horas CONALEP', 0], ['40', 'Mínimo 40 horas', 45], ['30', 'Mínimo 30 horas', 35], ['20', 'Mínimo 20 horas', 25]]
  },
  'ev-cursos-externos': {
    factor: '1', subfactor: '1.4B Actualizaciones externas', max: 35,
    options: [['', 'Seleccionar horas externas', 0], ['120', 'Mínimo 120 horas', 35], ['40', 'Mínimo 40 horas', 25], ['30', 'Mínimo 30 horas', 15], ['20', 'Mínimo 20 horas', 10]]
  },
  'ev-certificados-afines': {
    factor: '1', subfactor: '1.5 Certificación vigente en competencias', max: 50,
    options: [['', 'Seleccionar total de certificados vigentes', 0], ['4', 'Cuatro certificados', 50], ['3', 'Tres certificados', 40], ['2', 'Dos certificados', 30], ['1', 'Un certificado', 20]]
  },
  'pevidd-observacion': {
    factor: '1', subfactor: '1.6 Observación de una sesión', max: 40,
    options: [['', 'Seleccionar calificación', 0], ['10', 'Calificación 10', 40], ['9', 'Calificación 9 a 9.99', 25], ['8', 'Calificación 8 a 8.99', 10]]
  },
  'pevidd-estudiantil': {
    factor: '1', subfactor: '1.7 Evaluación estudiantil', max: 50,
    options: [['', 'Seleccionar calificación', 0], ['10', 'Calificación 10', 50], ['9', 'Calificación 9 a 9.99', 30], ['8', 'Calificación 8 a 8.99', 15]]
  },
  'ev-materiales': {
    factor: '1', subfactor: '1.8 Recursos y materiales didácticos', max: 50,
    options: [['', 'Seleccionar materiales didácticos', 0], ['5', 'Cinco materiales didácticos', 50], ['4', 'Cuatro materiales didácticos', 30], ['3', 'Tres materiales didácticos', 15]]
  },
  'ev-planeacion': {
    factor: '1', subfactor: '1.9 Planeación didáctica', max: 60,
    options: [['', 'Seleccionar evidencia de planeación', 0], ['completa', 'Planes con contenidos, estrategias, evaluación, recursos/materiales y tiempos', 60], ['parcial', 'Planes con contenidos, estrategias, evaluación y recursos/materiales', 30]]
  },
  'pevidd-aprovechamiento': {
    factor: '1', subfactor: '1.10 Aprovechamiento escolar', max: 70,
    options: [['', 'Seleccionar promedio', 0], ['10', 'Promedio 10', 70], ['9', 'Promedio 9', 60], ['8', 'Promedio 8', 50], ['7', 'Promedio 7', 40], ['6', 'Promedio 6 o menos', 20]]
  },
  'dedicacion-academias': {
    factor: '2', subfactor: '2.1 Participación en academias', max: 55,
    options: [['', 'Seleccionar evidencia de academia', 0], ['integral', 'Propuestas de mejora a programas, atención de necesidades, proyectos y actividades extracurriculares', 55], ['programas-necesidades', 'Propuestas de mejora a programas y atención de necesidades académicas', 40], ['necesidades', 'Propuestas para atención de necesidades académicas', 25], ['programas', 'Propuestas de acciones de mejora a programas de estudio', 15]]
  },
  'dedicacion-preceptorias': {
    factor: '2', subfactor: '2.2 Participación en preceptorías', max: 60,
    options: [['', 'Seleccionar participación', 0], ['1g5i', 'Una grupal y al menos cinco individuales', 60], ['1g4i', 'Una grupal y al menos cuatro individuales', 50], ['1g3i', 'Una grupal y al menos tres individuales', 40], ['2i', 'Al menos dos individuales', 30]]
  },
  'pevidd-autoevaluacion': {
    factor: '2', subfactor: '2.3 Autoevaluación', max: 15,
    options: [['', 'Seleccionar calificación', 0], ['10', 'Calificación 10', 15], ['9', 'Calificación 9 a 9.99', 10], ['8', 'Calificación 8 a 8.99', 5]]
  },
  'ev-instructor-conalep': {
    factor: '2', subfactor: '2.4A Instructor CONALEP', max: 50,
    options: [['', 'Seleccionar horas como instructor CONALEP', 0], ['40', '40 horas', 50], ['30', '30 horas', 40], ['20', '20 horas', 25]]
  },
  'ev-instructor-externo': {
    factor: '2', subfactor: '2.4B Instructor externo', max: 20,
    options: [['', 'Seleccionar horas como instructor externo', 0], ['40', '40 horas', 20], ['30', '30 horas', 10], ['20', '20 horas', 6]]
  },
  'pevidd-integracion': {
    factor: '3', subfactor: '3.1 Integración al CONALEP', max: 50,
    options: [['', 'Seleccionar calificación', 0], ['10', 'Calificación 10', 50], ['9', 'Calificación 9 a 9.99', 35], ['8', 'Calificación 8 a 8.99', 20]]
  },
  'ev-reconocimientos': {
    factor: '3', subfactor: '3.2 Trayectoria', max: 30,
    options: [['', 'Seleccionar reconocimientos', 0], ['3', 'Por lo menos tres reconocimientos, premios o distinciones', 30], ['2', 'Por lo menos dos reconocimientos, premios o distinciones', 20], ['1', 'Por lo menos un reconocimiento, premio o distinción', 10]]
  }
}

export const factorMeta = {
  '1': { label: 'Calidad en el desempeño', max: 520 },
  '2': { label: 'Dedicación a la docencia', max: 200 },
  '3': { label: 'Permanencia', max: 80 }
}
```

- [ ] **Step 2: Copiar los PDFs a public/docs/**

```bash
mkdir -p public/docs
cp "/home/emmanuel/Datos/conalep/herramientas/asistente-estimulo-docente/Convocatoria estímulo docente 2-2526.pdf" public/docs/convocatoria-estimulo-2526.pdf
cp "/home/emmanuel/Datos/conalep/herramientas/asistente-estimulo-docente/Formato Cédula EDD.pdf" public/docs/cedula-edd.pdf
ls public/docs/
```

Resultado esperado: los dos archivos PDF en `public/docs/`.

- [ ] **Step 3: Verificar que el archivo JS no tiene errores de sintaxis**

```bash
node --input-type=module < src/pages/estimulo/data.js 2>&1 | head -5
```

Resultado esperado: sin output de error (node procesa el módulo sin fallos).

- [ ] **Step 4: Commit**

```bash
git add src/pages/estimulo/data.js public/docs/
git commit -m "feat: datos checklist estimulo docente y PDFs"
```

---

## Task 2: Hook `useEstimuloState`

**Files:**
- Create: `src/pages/estimulo/useEstimuloState.js`

**Interfaces:**
- Consumes: `sections` (array), `scoreRubric` (object), `factorMeta` (object) de `./data`
- Produces: hook `useEstimuloState()` con la firma completa descrita abajo

- [ ] **Step 1: Crear el hook**

Crear `src/pages/estimulo/useEstimuloState.js`:

```js
import { useState, useEffect } from 'react'
import { sections, scoreRubric, factorMeta } from './data'

const STORAGE_KEY = 'asistente-estimulo-docente-v1'

function scoreValueFor(itemId, scores) {
  const rubric = scoreRubric[itemId]
  const selected = scores[itemId] || ''
  const opt = rubric?.options.find(o => o[0] === selected)
  return opt ? Number(opt[2]) : 0
}

function calculateScore(scores) {
  const factors = Object.fromEntries(Object.keys(factorMeta).map(k => [k, 0]))
  let total = 0
  Object.keys(scoreRubric).forEach(itemId => {
    const pts = scoreValueFor(itemId, scores)
    factors[scoreRubric[itemId].factor] += pts
    total += pts
  })
  return { total, factors }
}

function resolveLevel(points) {
  if (points >= 701) return { label: 'Nivel V', umas: 5 }
  if (points >= 601) return { label: 'Nivel IV', umas: 4 }
  if (points >= 501) return { label: 'Nivel III', umas: 3 }
  if (points >= 401) return { label: 'Nivel II', umas: 2 }
  if (points >= 301) return { label: 'Nivel I', umas: 1 }
  return { label: 'Sin nivel estimado', umas: 0 }
}

function persist(checks, scores, notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    checks, scores, notes, updatedAt: new Date().toISOString()
  }))
}

export function useEstimuloState() {
  const [checks, setChecks] = useState({})
  const [scores, setScores] = useState({})
  const [notes, setNotes] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showConfirmReset, setShowConfirmReset] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      setChecks(saved.checks || {})
      setScores(saved.scores || {})
      setNotes(saved.notes || '')
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  function toggleCheck(itemId) {
    setChecks(prev => {
      const next = { ...prev, [itemId]: !prev[itemId] }
      persist(next, scores, notes)
      return next
    })
  }

  function setScore(itemId, value) {
    setScores(prev => {
      const next = { ...prev, [itemId]: value }
      persist(checks, next, notes)
      return next
    })
  }

  function handleSetNotes(value) {
    setNotes(value)
    persist(checks, scores, value)
  }

  function markSection(sectionId, value) {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return
    setChecks(prev => {
      const next = { ...prev }
      section.items.forEach(item => { next[item.id] = value })
      persist(next, scores, notes)
      return next
    })
  }

  function confirmReset() {
    setChecks({})
    setScores({})
    setNotes('')
    persist({}, {}, '')
    setShowConfirmReset(false)
  }

  const allItems = sections.flatMap(s => s.items)
  const done = allItems.filter(item => checks[item.id]).length
  const total = allItems.length
  const totalProgress = { done, total, pct: total ? Math.round((done / total) * 100) : 0 }

  const { total: scoreTotal, factors } = calculateScore(scores)
  const { label: level, umas } = resolveLevel(scoreTotal)
  const scoreResult = { total: scoreTotal, factors, level, umas }

  function exportCsv() {
    const rows = allItems.map(item => {
      const section = sections.find(s => s.items.some(i => i.id === item.id))
      return [
        section?.title || '',
        item.title,
        item.deadline,
        checks[item.id] ? 'Completo' : 'Pendiente',
        (item.tags || []).join(' / '),
        scoreRubric[item.id]?.subfactor || '',
        scoreValueFor(item.id, scores)
      ]
    })
    const lines = [
      'Sección,Requisito,Fecha o periodo,Estado,Tipo,Subfactor,Puntos',
      ...rows.map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')),
      '',
      `"Total estimado","","","","","${level}","${scoreTotal}"`
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `avance_estimulo_docente_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return {
    checks, scores, notes,
    filter, setFilter,
    search, setSearch,
    toggleCheck, setScore,
    setNotes: handleSetNotes,
    markSection,
    resetAll: () => setShowConfirmReset(true),
    showConfirmReset, confirmReset,
    cancelReset: () => setShowConfirmReset(false),
    totalProgress,
    scoreResult,
    exportCsv,
  }
}
```

- [ ] **Step 2: Verificar sintaxis**

```bash
node --input-type=module --eval "import('./src/pages/estimulo/useEstimuloState.js')" 2>&1 | head -5
```

Resultado esperado: sin errores (o error de `localStorage not defined` en Node que es esperado — confirma que el módulo ES se importa bien).

- [ ] **Step 3: Commit**

```bash
git add src/pages/estimulo/useEstimuloState.js
git commit -m "feat: hook useEstimuloState con localStorage y scoring"
```

---

## Task 3: ConfirmResetModal

**Files:**
- Create: `src/pages/estimulo/components/ConfirmResetModal.jsx`

**Interfaces:**
- Props: `{ onConfirm: () => void, onCancel: () => void }`
- Produces: modal de confirmación montado en `document.body` via `createPortal`

- [ ] **Step 1: Crear el componente**

Crear `src/pages/estimulo/components/ConfirmResetModal.jsx`:

```jsx
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function ConfirmResetModal({ onConfirm, onCancel }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    cancelRef.current?.focus()
    function onEsc(e) { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onCancel])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="card w-full max-w-sm p-6 shadow-2xl animate-scale-in space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          ¿Reiniciar todo el avance?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Se borrará todo el avance guardado en este navegador. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <button ref={cancelRef} type="button" onClick={onCancel} className="btn-secondary text-sm h-9 px-4">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 px-4 rounded-xl text-sm font-semibold bg-danger-600 text-white hover:bg-danger-700 active:scale-95 transition-all"
          >
            Sí, reiniciar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/estimulo/components/ConfirmResetModal.jsx
git commit -m "feat: ConfirmResetModal para reiniciar avance"
```

---

## Task 4: FechasPanel

**Files:**
- Create: `src/pages/estimulo/components/FechasPanel.jsx`

**Interfaces:**
- Consumes: `sections` de `../data` (para generar nav de anchors)
- Props: ninguna
- Produces: aside con fechas clave, nav, nota de uso, links a PDFs

- [ ] **Step 1: Crear el componente**

Crear `src/pages/estimulo/components/FechasPanel.jsx`:

```jsx
import { sections } from '../data'

const FECHAS = [
  { label: 'Periodo evaluado',        desc: 'Semestre 2-2526, febrero a julio de 2026.' },
  { label: 'Asistencia',              desc: '03 de febrero al 19 de junio de 2026.' },
  { label: 'Inscripción y expediente',desc: '15 al 25 de junio de 2026.' },
  { label: 'Fecha límite final',       desc: '25 de junio de 2026.' },
  { label: 'Resultados',              desc: '03 de agosto de 2026.' },
  { label: 'Inconformidades',         desc: '03 y 04 de agosto de 2026.' },
]

const navLinkClass = 'block rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-700 dark:hover:text-brand-300 transition-colors'

export default function FechasPanel() {
  return (
    <aside className="flex flex-col gap-4" aria-label="Panel de fechas y navegación">

      <div className="card p-4">
        <h2 className="font-display text-base font-bold text-brand-700 dark:text-brand-300 mb-3">Fechas clave</h2>
        <ul className="flex flex-col gap-2">
          {FECHAS.map(({ label, desc }) => (
            <li key={label} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-2">
              <strong className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</strong>
              <span className="text-xs text-slate-500 dark:text-slate-400">{desc}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-4">
        <h2 className="font-display text-base font-bold text-brand-700 dark:text-brand-300 mb-3">Ir a sección</h2>
        <nav>
          {sections.map(s => (
            <a key={s.id} href={`#${s.id}`} className={navLinkClass}>{s.title}</a>
          ))}
        </nav>
      </div>

      <div className="card p-4">
        <h2 className="font-display text-base font-bold text-brand-700 dark:text-brand-300 mb-2">Uso recomendado</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Marca solo lo que ya tienes listo o validado. Las fechas aparecen como referencia, no como tareas independientes.
        </p>
      </div>

      <div className="card p-4">
        <h2 className="font-display text-base font-bold text-brand-700 dark:text-brand-300 mb-3">Documentos fuente</h2>
        <nav>
          <a href="/docs/convocatoria-estimulo-2526.pdf" target="_blank" rel="noopener noreferrer" className={navLinkClass}>
            Convocatoria 2-2526
          </a>
          <a href="/docs/cedula-edd.pdf" target="_blank" rel="noopener noreferrer" className={navLinkClass}>
            Cédula de evaluación
          </a>
        </nav>
      </div>

    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/estimulo/components/FechasPanel.jsx
git commit -m "feat: FechasPanel aside con fechas, nav y docs"
```

---

## Task 5: ReqCard

**Files:**
- Create: `src/pages/estimulo/components/ReqCard.jsx`

**Interfaces:**
- Consumes: `scoreRubric` de `../data`
- Props: `{ item: object, done: boolean, scoreValue: string, onToggle: (id: string) => void, onScoreChange: (id: string, value: string) => void }`
- `item` shape: `{ id, title, deadline, tags, tagType, desc, callout?, detail?: string[] }`

- [ ] **Step 1: Crear el componente**

Crear `src/pages/estimulo/components/ReqCard.jsx`:

```jsx
import { scoreRubric } from '../data'

const TAG_CLS = {
  Obligatorio:  'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-300 dark:border-danger-800',
  Puntuable:    'bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-300 dark:border-info-800',
  Verificación: 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-300 dark:border-warning-800',
}

export default function ReqCard({ item, done, scoreValue, onToggle, onScoreChange }) {
  const rubric = scoreRubric[item.id]

  return (
    <article
      className={`grid grid-cols-[auto_1fr] gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors ${
        done ? 'bg-gradient-to-r from-brand-50/60 to-transparent dark:from-brand-900/10' : ''
      }`}
    >
      <div className="pt-7">
        <input
          type="checkbox"
          id={item.id}
          checked={done}
          onChange={() => onToggle(item.id)}
          aria-describedby={`${item.id}-desc`}
          className="w-5 h-5 cursor-pointer accent-brand-600"
        />
      </div>

      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="font-bold text-brand-700 dark:text-brand-300">Fecha / periodo:</span>{' '}{item.deadline}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {(item.tags || []).map(tag => (
            <span key={tag} className={`inline-flex items-center h-6 px-2 rounded-full text-[11px] font-semibold border ${TAG_CLS[tag] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
              {tag}
            </span>
          ))}
        </div>

        <label htmlFor={item.id} className="block text-sm font-bold text-slate-800 dark:text-slate-100 cursor-pointer leading-snug mb-1">
          {item.title}
        </label>

        <p id={`${item.id}-desc`} className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {item.desc}
        </p>

        {item.callout && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 text-xs text-warning-700 dark:text-warning-300">
            {item.callout}
          </div>
        )}

        {item.detail?.length > 0 && (
          <details className="mt-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 overflow-hidden">
            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-brand-700 dark:text-brand-300">Ver detalles</summary>
            <ul className="px-4 pb-2.5 pt-1 text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
              {item.detail.map((point, i) => <li key={i}>{point}</li>)}
            </ul>
          </details>
        )}

        {rubric && (
          <div className="mt-3 p-3 rounded-xl border border-info-200 dark:border-info-800 bg-info-50 dark:bg-info-900/20 space-y-1.5">
            <label htmlFor={`${item.id}-score`} className="block text-xs font-bold text-info-700 dark:text-info-300">
              Puntaje: {rubric.subfactor}
            </label>
            <select
              id={`${item.id}-score`}
              value={scoreValue}
              onChange={e => onScoreChange(item.id, e.target.value)}
              className="w-full text-xs rounded-lg border border-info-200 dark:border-info-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-2 py-1.5 cursor-pointer"
            >
              {rubric.options.map(([value, label, points]) => (
                <option key={value} value={value}>
                  {label}{value ? ` · ${points} pts` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Máximo: {rubric.max} puntos · Factor {rubric.factor}
            </p>
          </div>
        )}
      </div>
    </article>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/estimulo/components/ReqCard.jsx
git commit -m "feat: ReqCard con chips, score control y detalles"
```

---

## Task 6: ScorePanel

**Files:**
- Create: `src/pages/estimulo/components/ScorePanel.jsx`

**Interfaces:**
- Consumes: `factorMeta` de `../data`
- Props: `{ scoreResult: { total: number, factors: Record<string,number>, level: string, umas: number } }`

- [ ] **Step 1: Crear el componente**

Crear `src/pages/estimulo/components/ScorePanel.jsx`:

```jsx
import { factorMeta } from '../data'

export default function ScorePanel({ scoreResult }) {
  const { total, factors, level, umas } = scoreResult
  const pct = Math.min(100, Math.round((total / 800) * 100))

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Estimador de puntaje</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
            Selecciona el nivel de evidencia en cada rubro puntuable. El resultado es orientativo y debe validarse con la Comisión Evaluadora.
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-brand-50 dark:bg-brand-900/20 px-4 py-2.5 text-right">
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-300" aria-live="polite">{level}</p>
          <p className="text-sm font-bold text-brand-700 dark:text-brand-200">
            {umas} UMA{umas !== 1 ? 'S' : ''} mensuales
          </p>
        </div>
      </div>

      <div>
        <p className="text-3xl font-black text-brand-700 dark:text-brand-300 tabular-nums" aria-live="polite">
          {total} <span className="text-lg font-semibold text-slate-400 dark:text-slate-500">/ 800</span>
        </p>
        <div
          role="progressbar"
          aria-label="Puntaje estimado"
          aria-valuemin={0}
          aria-valuemax={800}
          aria-valuenow={total}
          className="mt-2 w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-700 to-brand-400 transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {Object.entries(factorMeta).map(([factor, meta]) => (
          <div key={factor} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-2.5">
            <p className="text-sm font-bold text-brand-700 dark:text-brand-300 tabular-nums">
              Factor {factor}: {factors[factor] ?? 0}
              <span className="font-normal text-slate-400 dark:text-slate-500"> / {meta.max}</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{meta.label}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        Rangos de la convocatoria: 301–400 nivel I · 401–500 nivel II · 501–600 nivel III · 601–700 nivel IV · 701–800 nivel V
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/estimulo/components/ScorePanel.jsx
git commit -m "feat: ScorePanel con estimador y desglose por factor"
```

---

## Task 7: StatusBar

**Files:**
- Create: `src/pages/estimulo/components/StatusBar.jsx`

**Interfaces:**
- Props: `{ totalProgress: { done: number, total: number, pct: number }, scoreResult: { total: number, level: string }, onPrint: () => void, onExport: () => void, onReset: () => void }`

- [ ] **Step 1: Crear el componente**

Crear `src/pages/estimulo/components/StatusBar.jsx`:

```jsx
export default function StatusBar({ totalProgress, scoreResult, onPrint, onExport, onReset }) {
  const { done, total, pct } = totalProgress
  const { total: scoreTotal, level } = scoreResult

  return (
    <div className="sticky top-14 z-30 border-b border-slate-200/80 dark:border-white/5 bg-[#fffdf8]/90 dark:bg-[#182420]/90 backdrop-blur-xl"
         data-no-print>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div
            role="progressbar"
            aria-label="Progreso total"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden w-32 sm:w-44 shrink-0"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-700 to-brand-400 transition-[width] duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="hidden sm:block min-w-0">
            <p className="text-xs font-bold text-brand-700 dark:text-brand-300 truncate" aria-live="polite">
              {done} de {total} completos ({pct}%)
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Puntos: {scoreTotal} / 800 · {level}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={onPrint} className="btn-secondary text-xs h-8 px-3 hidden sm:flex">
            Imprimir
          </button>
          <button type="button" onClick={onExport} className="btn-secondary text-xs h-8 px-3">
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={onReset}
            className="h-8 px-3 rounded-xl text-xs font-semibold bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 border border-danger-200 dark:border-danger-800 hover:bg-danger-100 dark:hover:bg-danger-900/30 transition-colors"
          >
            Reiniciar
          </button>
        </div>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/estimulo/components/StatusBar.jsx
git commit -m "feat: StatusBar sticky con progreso y acciones"
```

---

## Task 8: EstimuloDocentePage + estilos print + ruta

**Files:**
- Create: `src/pages/EstimuloDocentePage.jsx`
- Modify: `src/index.css` (añadir bloque `@media print`)
- Modify: `src/App.jsx` (añadir import lazy + ruta protegida)

**Interfaces:**
- Consumes: `useEstimuloState` de `./estimulo/useEstimuloState`, todos los componentes de `./estimulo/components/`, `useAuth` de `../contexts/AuthContext`, `BrandLogo` de `../components/brand/BrandLogo`, `MenuUsuario` de `../components/dashboard/MenuUsuario`, `sections` y `scoreRubric` de `./estimulo/data`

- [ ] **Step 1: Crear EstimuloDocentePage.jsx**

Crear `src/pages/EstimuloDocentePage.jsx`:

```jsx
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import BrandLogo from '../components/brand/BrandLogo'
import MenuUsuario from '../components/dashboard/MenuUsuario'
import { useEstimuloState } from './estimulo/useEstimuloState'
import { sections, scoreRubric } from './estimulo/data'
import StatusBar from './estimulo/components/StatusBar'
import FechasPanel from './estimulo/components/FechasPanel'
import ScorePanel from './estimulo/components/ScorePanel'
import ReqCard from './estimulo/components/ReqCard'
import ConfirmResetModal from './estimulo/components/ConfirmResetModal'

function matchesFilter(item, filter, checks) {
  if (filter === 'pending')  return !checks[item.id]
  if (filter === 'done')     return !!checks[item.id]
  if (filter === 'required') return (item.tagType || '').includes('required')
  if (filter === 'score')    return (item.tagType || '').includes('score')
  return true
}

function matchesSearch(item, section, search) {
  if (!search.trim()) return true
  const text = [
    section.title, section.desc, item.title, item.deadline, item.desc,
    item.tags?.join(' '),
    scoreRubric[item.id]?.subfactor,
    scoreRubric[item.id]?.options.map(o => o[1]).join(' '),
    item.callout, item.detail?.join(' ')
  ].filter(Boolean).join(' ').toLowerCase()
  return text.includes(search.trim().toLowerCase())
}

const FILTERS = [
  { key: 'all',      label: 'Todos' },
  { key: 'pending',  label: 'Pendientes' },
  { key: 'done',     label: 'Completos' },
  { key: 'required', label: 'Obligatorios' },
  { key: 'score',    label: 'Puntuables' },
]

export default function EstimuloDocentePage() {
  const { user, logout, esAdmin, perfilDocente } = useAuth()
  const inicialAvatar = (perfilDocente?.nombre || user?.displayName || user?.email || '?')
    .trim().charAt(0).toUpperCase()

  const {
    checks, scores, notes, filter, search,
    setFilter, setSearch,
    toggleCheck, setScore, setNotes,
    markSection, resetAll,
    showConfirmReset, confirmReset, cancelReset,
    totalProgress, scoreResult, exportCsv,
  } = useEstimuloState()

  const hasVisibleItems = sections.some(section =>
    section.items.some(item => matchesFilter(item, filter, checks) && matchesSearch(item, section, search))
  )

  return (
    <div className="estimulo-page min-h-screen surface-atmosphere flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fffdf8]/80 dark:bg-[#182420]/80 backdrop-blur-xl border-b border-brand-100/60 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <BrandLogo className="flex-shrink-0" markClassName="w-8 h-8" />
          <MenuUsuario inicial={inicialAvatar} esAdmin={esAdmin} onLogout={logout} />
        </div>
      </header>

      {/* StatusBar */}
      <StatusBar
        totalProgress={totalProgress}
        scoreResult={scoreResult}
        onPrint={() => window.print()}
        onExport={exportCsv}
        onReset={resetAll}
      />

      {/* Hero */}
      <div className="bg-gradient-to-r from-brand-800 to-brand-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80 mb-2">
              CONALEP Guanajuato · Semestre 2-2526
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
              Asistente Estímulo Docente
            </h1>
            <p className="mt-2 text-sm opacity-90 max-w-xl leading-relaxed">
              Checklist para revisar requisitos del Estímulo al Desempeño Docente 2-2526 sin confundir fechas con tareas.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm px-5 py-3 text-center sm:text-right">
            <p className="text-3xl font-black tabular-nums" aria-live="polite">{totalProgress.pct}%</p>
            <p className="text-xs opacity-80 mt-0.5">
              {totalProgress.done === 0
                ? 'Sin requisitos marcados'
                : totalProgress.done === totalProgress.total
                  ? 'Checklist completo'
                  : `${totalProgress.done} requisitos listos`}
            </p>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5 items-start">

          {/* Aside */}
          <div className="md:sticky md:top-28">
            <FechasPanel />
          </div>

          {/* Content */}
          <div className="space-y-4 min-w-0">

            <ScorePanel scoreResult={scoreResult} />

            {/* Búsqueda */}
            <div className="card p-4">
              <label htmlFor="estimulo-search" className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1.5">
                Buscar requisito
              </label>
              <input
                id="estimulo-search"
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ejemplo: RFC, CURP, Anexo, cursos, planeación..."
                autoComplete="off"
                className="input-base text-sm"
              />
            </div>

            {/* Filtros */}
            <div role="toolbar" aria-label="Filtros del checklist" className="flex flex-wrap gap-2">
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  aria-pressed={filter === key}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                    filter === key
                      ? 'bg-brand-600 text-white border-brand-600 dark:bg-brand-500 dark:border-brand-500'
                      : 'btn-secondary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Secciones */}
            {sections.map(section => {
              const visibleItems = section.items.filter(
                item => matchesFilter(item, filter, checks) && matchesSearch(item, section, search)
              )
              if (visibleItems.length === 0) return null
              const doneInSection = section.items.filter(item => checks[item.id]).length

              return (
                <section
                  key={section.id}
                  id={section.id}
                  aria-labelledby={`${section.id}-title`}
                  className="card overflow-hidden scroll-mt-32"
                >
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 id={`${section.id}-title`} className="font-display text-base font-semibold text-slate-900 dark:text-white">
                          {section.title}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-prose">{section.desc}</p>
                      </div>
                      <span className="shrink-0 inline-flex items-center h-6 px-2.5 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300">
                        {doneInSection} / {section.items.length}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button type="button" onClick={() => markSection(section.id, true)}  className="btn-secondary text-xs h-7 px-3">Marcar sección</button>
                      <button type="button" onClick={() => markSection(section.id, false)} className="btn-secondary text-xs h-7 px-3">Desmarcar sección</button>
                    </div>
                  </div>
                  <div>
                    {visibleItems.map(item => (
                      <ReqCard
                        key={item.id}
                        item={item}
                        done={!!checks[item.id]}
                        scoreValue={scores[item.id] || ''}
                        onToggle={toggleCheck}
                        onScoreChange={setScore}
                      />
                    ))}
                  </div>
                </section>
              )
            })}

            {/* Empty state */}
            {!hasVisibleItems && (
              <div className="card p-10 text-center text-slate-400 dark:text-slate-500 text-sm">
                No hay requisitos que coincidan con tu búsqueda o filtro.
              </div>
            )}

            {/* Notas personales */}
            <div className="card p-5 space-y-2">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">Notas personales</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Este espacio también se guarda automáticamente en este navegador.
              </p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ejemplo: pedir constancia de curso, escanear Anexo II, revisar RFC vigente..."
                className="input-base text-sm min-h-[100px] resize-y"
              />
            </div>

            {/* Back */}
            <div className="pb-4">
              <Link to="/" className="text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors">
                ← Volver al dashboard
              </Link>
            </div>

          </div>
        </div>
      </main>

      {showConfirmReset && <ConfirmResetModal onConfirm={confirmReset} onCancel={cancelReset} />}
    </div>
  )
}
```

- [ ] **Step 2: Añadir estilos @media print a src/index.css**

Añadir al final de `src/index.css` (antes del último `}` si hay uno que cierre un bloque global, o simplemente al final):

```css
/* ─── Estimulo Docente: print ─────────────────────────────── */
@media print {
  .estimulo-page [data-no-print],
  .estimulo-page header,
  .estimulo-page aside,
  .estimulo-page [role="toolbar"],
  .estimulo-page button,
  .estimulo-page details,
  .estimulo-page a[href="/"] {
    display: none !important;
  }

  .estimulo-page { background: white !important; }

  .estimulo-page .md\:grid-cols-\[280px_1fr\] {
    grid-template-columns: 1fr !important;
  }

  .estimulo-page .card {
    box-shadow: none !important;
    border: 1px solid #ccc !important;
    break-inside: avoid;
  }
}
```

- [ ] **Step 3: Añadir ruta lazy en src/App.jsx**

En `src/App.jsx`, añadir el import lazy junto a los otros lazy imports (línea ~15):

```jsx
const EstimuloDocentePage = lazy(() => import('./pages/EstimuloDocentePage'))
```

Dentro del bloque `<Route element={<ProtectedRoute />}>`, añadir después de la ruta `/perfil`:

```jsx
<Route path="/asistente-estimulo" element={<EstimuloDocentePage />} />
```

- [ ] **Step 4: Verificar en el navegador**

```bash
npm run dev
```

1. Ir a `http://localhost:5173/login`, iniciar sesión
2. Navegar manualmente a `http://localhost:5173/asistente-estimulo`
3. Verificar que carga el hero con "Asistente Estímulo Docente"
4. Marcar un requisito → verificar que la barra de progreso se actualiza
5. Cambiar un select de puntaje → verificar que el score en ScorePanel cambia
6. Escribir en notas → recargar la página → verificar que las notas persisten
7. Clic en "Exportar CSV" → verificar que se descarga un archivo `.csv`
8. Clic en "Reiniciar" → verificar que aparece el modal de confirmación → cancelar → el avance sigue igual
9. Verificar `http://localhost:5173/docs/convocatoria-estimulo-2526.pdf` abre el PDF

- [ ] **Step 5: Commit**

```bash
git add src/pages/EstimuloDocentePage.jsx src/index.css src/App.jsx
git commit -m "feat: EstimuloDocentePage completa con ruta protegida y estilos print"
```

---

## Task 9: Tarjeta en el Dashboard

**Files:**
- Modify: `src/pages/DashboardPage.jsx`

**Interfaces:**
- Consumes: `localStorage.getItem('asistente-estimulo-docente-v1')` leído al montar el Dashboard
- Consumes: `Link` de `react-router-dom` (ya importado)

- [ ] **Step 1: Añadir la sección "Herramientas" al Dashboard**

En `src/pages/DashboardPage.jsx`, localizar el bloque de `</main>` (cierre de main, antes de los modales). Insertar la sección de herramientas **dentro** de `<main>`, justo antes del cierre `</main>`:

```jsx
{/* ── Herramientas ── */}
<EstimuloCard />
```

Y añadir el componente `EstimuloCard` como función interna en el mismo archivo, justo antes de la función `DashboardPage` (después del `SkeletonGrid`):

```jsx
// ─── Tarjeta Asistente Estímulo ──────────────────────────────
function EstimuloCard() {
  const stored = (() => {
    try { return JSON.parse(localStorage.getItem('asistente-estimulo-docente-v1') || '{}') } catch { return {} }
  })()
  const checks = stored.checks || {}
  const done = Object.values(checks).filter(Boolean).length
  const TOTAL = 34
  const pct = TOTAL ? Math.round((done / TOTAL) * 100) : 0
  const hasProgress = done > 0

  return (
    <section className="mt-10" aria-labelledby="herramientas-title">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300" id="herramientas-title">
        Herramientas gratuitas
      </p>
      <div className="card card-spotlight border-t-2 border-brand-400 dark:border-brand-500 p-5 max-w-sm">
        <div className="flex items-start gap-3 mb-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
            <svg aria-hidden="true" className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 leading-snug">
              Asistente Estímulo Docente 2-2526
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Checklist + estimador de puntaje para el trámite semestral CONALEP.
            </p>
          </div>
        </div>

        {hasProgress ? (
          <div className="mb-3 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">{pct}% completado</span>
              <span className="text-xs text-slate-400">{done} / {TOTAL}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500 dark:bg-brand-400 transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 italic">Sin iniciar</p>
        )}

        <Link to="/asistente-estimulo" className="btn-primary text-xs h-8 px-4 inline-flex items-center gap-1.5">
          Abrir herramienta
          <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verificar en el navegador**

Con `npm run dev` corriendo:

1. Ir al dashboard (`http://localhost:5173/`)
2. Desplazarse al final de la página — debe aparecer "Herramientas gratuitas" con la tarjeta
3. La tarjeta muestra "Sin iniciar" si no hay avance previo
4. Clic en "Abrir herramienta" → navega a `/asistente-estimulo`
5. Marcar algunos requisitos → regresar al dashboard → la barra de progreso de la tarjeta debe reflejar el avance (requiere reload del dashboard ya que `EstimuloCard` lee `localStorage` solo al montar)

- [ ] **Step 3: Verificar build limpio**

```bash
npm run build 2>&1 | tail -10
```

Resultado esperado: `✓ built in` sin errores ni warnings de importaciones faltantes.

- [ ] **Step 4: Commit**

```bash
git add src/pages/DashboardPage.jsx
git commit -m "feat: tarjeta Asistente Estimulo en dashboard con progreso"
```

---

## Self-review del plan

**Cobertura del spec:**

| Requisito spec | Tarea |
|---|---|
| Ruta protegida `/asistente-estimulo` | Task 8 (App.jsx) |
| Datos en `data.js` — 8 secciones, 18 rubrics, factorMeta | Task 1 |
| Hook `useEstimuloState` con localStorage, scoring, CSV | Task 2 |
| ConfirmResetModal (reemplaza window.confirm) | Task 3 |
| FechasPanel con fechas, nav, PDFs | Task 4 |
| ReqCard con chips, callout, details, score control | Task 5 |
| ScorePanel con puntaje, nivel, UMAs, factor breakdown | Task 6 |
| StatusBar sticky con progreso, acciones | Task 7 |
| EstimuloDocentePage ensamblada | Task 8 |
| PDFs en public/docs/ | Task 1 |
| Print CSS bajo .estimulo-page | Task 8 |
| Tarjeta en Dashboard con progreso desde localStorage | Task 9 |
| Tokens diseño PLANEA-PRO (brand/danger/info/warning) | Tasks 3–9 (implícito) |
| localStorage key `asistente-estimulo-docente-v1` preservada | Task 2 |

**Placeholders:** ninguno — todos los pasos tienen código completo.

**Consistencia de tipos:** `scoreResult` definido en Task 2 con `{ total, factors, level, umas }` — consumido en Tasks 6 y 7 con los mismos campos. `totalProgress` con `{ done, total, pct }` — consumido en Task 7 y Hero de Task 8. `toggleCheck(itemId: string)` y `setScore(itemId, value)` definidos en Task 2, llamados en Task 5 via Task 8.
