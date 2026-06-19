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
  'ev-certificados-habilidades': {
    factor: '1', subfactor: '1.5', max: 20,
    options: [
      ['', 'Seleccionar certificados en habilidades', 0],
      ['0', 'Sin certificados', 0],
      ['10', '1 certificado', 10],
      ['20', '2 o más certificados', 20],
    ]
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
