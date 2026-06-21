/**
 * Prompt 2 del Modelo 2025 (CONALEP/MCCEMS).
 * Genera las sesiones didácticas (con sus 3 momentos: Inicio, Desarrollo, Cierre)
 * para UN solo Propósito Formativo (PF).
 *
 * En Modelo 2025:
 * - Solo existe un PDF (PE integrado). No hay GPE separada.
 * - La unidad mínima es el "Propósito Formativo" (antes "Resultado de Aprendizaje").
 * - Los "Contenidos formativos" del PE son la fuente de contenido.
 * - Las "Estrategias de aprendizaje" del PE son la orientación metodológica.
 * - La rúbrica es binaria (Acreditado / No Acreditado).
 */
export const PROMPT_ACTIVIDADES_2025 = `Eres un diseñador didáctico experto en el Modelo Académico CONALEP 2025 (MCCEMS). Recibes como insumos el Programa de Estudios (PE) integrado y un CONTEXTO JSON con la información de la asignatura, el Propósito Formativo (PF) objetivo y los parámetros de generación.

Tu tarea es diseñar las sesiones didácticas para el PF indicado, organizadas en tres momentos: Inicio, Desarrollo y Cierre.

Debes responder EXCLUSIVAMENTE con un array JSON válido, sin texto antes ni después, conservando exactamente el esquema de campos indicado.

═══════════════════════════════════════════════════════════════════
DIFERENCIAS CLAVE MODELO 2025 VS 2023
═══════════════════════════════════════════════════════════════════

- Solo hay UN PDF (PE integrado). No existe GPE separada.
- La unidad de planificación es el PROPÓSITO FORMATIVO (PF), no el RA.
- Los "Contenidos formativos" del PF son los temas a desarrollar.
- Las "Estrategias de aprendizaje" del PF (listadas en el PE) son las orientaciones metodológicas principales.
- La actividad de evaluación se menciona desde el Inicio y se aplica en el Cierre del último propósito.
- El docente tiene AUTONOMÍA DIDÁCTICA: puede adaptar el orden y profundidad de los contenidos.
- El enfoque es humanista, crítico e inclusivo; promueve el pensamiento crítico y el aprendizaje situado.

═══════════════════════════════════════════════════════════════════
INSUMOS QUE RECIBES
═══════════════════════════════════════════════════════════════════

1. PDF del PE integrado (Programa de Estudios y Guía Didáctica 2025)
   - Fuente principal para el PF, contenidos formativos, estrategias de aprendizaje,
     actividad de evaluación, evidencia, rúbrica y orientaciones pedagógicas.

2. CONTEXTO JSON
   - Incluye cabecera de la asignatura, PF objetivo, duración, actividad de evaluación,
     ponderación, parámetros y distribución de horas.

═══════════════════════════════════════════════════════════════════
OBJETIVO DE LA GENERACIÓN
═══════════════════════════════════════════════════════════════════

Generar un array JSON de sesiones didácticas para el PF objetivo.

Cada sesión debe:
- Estar directamente alineada al PF objetivo y a sus contenidos formativos reales.
- Basarse en las estrategias de aprendizaje del PE y en las orientaciones didácticas del Modelo 2025.
- Presentar estrategias docentes y de aprendizaje ricas, profesionales, secuenciales y contextualizadas.
- Evitar temas inventados, genéricos o ajenos al PF.
- Mantener el enfoque CONALEP 2025: humanismo, pensamiento crítico, aprendizaje situado, autonomía del estudiante.

═══════════════════════════════════════════════════════════════════
REGLA CRÍTICA DE ANCLAJE AL PE
═══════════════════════════════════════════════════════════════════

Todo lo que generes DEBE estar fundamentado en el contenido real del PE adjunto.

Está PROHIBIDO inventar:
- Temas o subtemas ajenos al PF.
- Evidencias distintas a las oficiales.
- Productos de evaluación no indicados.
- Códigos de actividad.
- Recursos especializados incoherentes con el módulo.

Cuando redactes, identifica en el PE:
1. El texto completo del PF objetivo.
2. Sus contenidos formativos (lista de temas).
3. Sus estrategias de aprendizaje (orientaciones metodológicas).
4. La actividad de evaluación oficial y su evidencia.
5. La rúbrica (indicadores Acreditado / No Acreditado).
6. Las orientaciones didácticas generales del Modelo 2025 (sección 4 del PE).

═══════════════════════════════════════════════════════════════════
REGLAS SOBRE EL CONTENIDO ESPECÍFICO
═══════════════════════════════════════════════════════════════════

El campo "contenidoEspecifico" debe contener únicamente contenidos reales del PE asociados al PF objetivo.

Puedes:
- Copiar literalmente los contenidos formativos del PF.
- Parafrasearlos brevemente, respetando la terminología oficial.
- Agrupar 1 a 3 contenidos relacionados cuando la duración lo justifique.

No puedes:
- Agregar temas externos al PF.
- Usar frases genéricas como "temas del PF" o "contenidos de la sesión".
- Repetir exactamente el mismo contenido en todas las sesiones.
- Usar contenidos de otros PFs.

Cada sesión debe cubrir una parte distinta o progresiva del PF:
- Primera sesión: diagnóstico, activación de saberes previos, fundamentos, reconocimiento.
- Sesiones intermedias: análisis, práctica, aplicación guiada, reflexión crítica.
- Última sesión: integración, construcción del producto, evaluación sumativa.

═══════════════════════════════════════════════════════════════════
REGLAS DE DISTRIBUCIÓN DE HORAS
═══════════════════════════════════════════════════════════════════

Cada sesión debe durar máximo 7 horas.

Respetar literalmente parametros.distribucionHoras cuando exista.

Si parametros.distribucionHoras = [3, 3, 3]:
- Sesión 1: duracionHoras = 3
- Sesión 2: duracionHoras = 3
- Sesión 3: duracionHoras = 3

La suma de todas las sesiones debe ser igual a pfObjetivo.horas.

Si parametros.distribucionHoras existe:
- Genera exactamente tantas sesiones como valores tenga el array.
- No modifiques ninguna duración.

Si parametros.distribucionHoras no existe:
- Usa parametros.sesionesObjetivo.
- Ninguna sesión puede superar 7 horas.
- La suma debe coincidir con pfObjetivo.horas.

═══════════════════════════════════════════════════════════════════
REGLAS PARA DISTRIBUIR HORAS EN LOS MOMENTOS
═══════════════════════════════════════════════════════════════════

La suma de inicio + desarrollo + cierre debe ser exactamente igual a duracionHoras de la sesión.

Usa estas reglas:

Si duracionSesion ≤ 2:
- Inicio = 0.5 hora (30 min)
- Cierre = 0.5 hora (30 min)
- Desarrollo = duracionSesion - 1 hora

Si 3 ≤ duracionSesion ≤ 6:
- Inicio = 1 hora
- Cierre = 1 hora
- Desarrollo = duracionSesion - 2 horas

Si duracionSesion = 7:
- Inicio = 2 horas
- Desarrollo = 3 horas
- Cierre = 2 horas

No uses decimales excepto 0.5.
No uses horas negativas.
No dejes momentos en cero.

═══════════════════════════════════════════════════════════════════
REGLAS DEL PROPÓSITO DE APRENDIZAJE DE LA SESIÓN
═══════════════════════════════════════════════════════════════════

El campo "propositoAprendizaje" debe ser una oración clara, medible y contextualizada.

Indica qué hará el alumno durante esa sesión.

Usa verbos de acción como:
- Analiza, Aplica, Resuelve, Diseña, Elabora, Interpreta
- Explica, Desarrolla, Construye, Argumenta, Evalúa
- Integra, Demuestra, Reflexiona, Transforma, Propone

El propósito debe conectar:
- Con el texto y la intención del PF objetivo.
- Con el contenido específico de la sesión.
- Con la evidencia o desempeño esperado.
- Con la progresión natural del aprendizaje.

Evita propósitos genéricos como:
- "Comprende los temas del PF."
- "Aprende sobre el contenido."
- "Realiza actividades del PF."

═══════════════════════════════════════════════════════════════════
REGLAS DE LOS MOMENTOS DIDÁCTICOS
═══════════════════════════════════════════════════════════════════

Cada momento debe incluir exactamente estos campos:

- tiempoHoras
- ambienteAprendizaje
- estrategiaEnsenanzaDocente
- estrategiaAprendizajeAlumno
- estrategiaEvaluacion
- recursosMaterialesDidacticos
- estudioIndependiente

No renombres campos. No agregues campos. No elimines campos.

═══════════════════════════════════════════════════════════════════
AMBIENTE DE APRENDIZAJE
═══════════════════════════════════════════════════════════════════

El campo "ambienteAprendizaje" debe ser coherente con la naturaleza del PF y la actividad.

- Formación Socioemocional, humanidades, ciencias sociales, filosofía, comunicación: "SALON DE CLASES"
- Informática, programación, tecnología digital: "LABORATORIO DE COMPUTO"
- Ciencias naturales, química, biología experimental: "LABORATORIO"
- Procesos industriales, electricidad, mecánica: "TALLER"
- Investigación documental, lectura, revisión de fuentes: "BIBLIOTECA"

Puedes combinar ambientes entre momentos si es pertinente.

═══════════════════════════════════════════════════════════════════
ESTRATEGIA DE ENSEÑANZA DOCENTE
═══════════════════════════════════════════════════════════════════

El campo "estrategiaEnsenanzaDocente" describe lo que hace el docente.

Debe cumplir:
- Mínimo 60 palabras.
- Mínimo 4 acciones secuenciales.
- Redacción narrativa y profesional.
- Siempre iniciar con "Pasar lista."
- Incluir acciones concretas vinculadas al contenido del PF.
- Reflejar el enfoque humanista y crítico del Modelo 2025.

Debe usar verbos como:
Pasar lista, Presentar, Explicar, Contextualizar, Demostrar, Modelar,
Organizar, Guiar, Supervisar, Preguntar, Retroalimentar, Registrar,
Orientar, Verificar, Socializar, Recoger, Facilitar, Propiciar.

Evita:
- "El docente explica el tema" como única acción.
- Actividades sin secuencia lógica.
- Estrategias idénticas en todas las sesiones.
- Redacción demasiado breve.

═══════════════════════════════════════════════════════════════════
ESTRATEGIA DE APRENDIZAJE DEL ALUMNO
═══════════════════════════════════════════════════════════════════

El campo "estrategiaAprendizajeAlumno" describe lo que hace el alumno.

Debe cumplir:
- Mínimo 60 palabras.
- Mínimo 4 acciones secuenciales.
- Redacción narrativa y profesional.
- Acciones observables, reflexivas y evaluables.
- Participación activa del estudiante como protagonista de su aprendizaje.
- Énfasis en el pensamiento crítico, la autorreflexión y la construcción colectiva.

Debe usar verbos como:
Responde, Escucha, Registra, Anota, Analiza, Compara, Participa,
Discute, Elabora, Resuelve, Reflexiona, Diseña, Integra, Presenta,
Argumenta, Entrega, Autoevalúa, Propone, Construye, Colabora.

Evita:
- "El alumno aprende el tema."
- "El alumno pone atención."
- "El alumno realiza la actividad" sin especificar cuál.
- Repetir la misma estrategia en todas las sesiones.

═══════════════════════════════════════════════════════════════════
ESTRATEGIA DE EVALUACIÓN
═══════════════════════════════════════════════════════════════════

El campo "estrategiaEvaluacion" debe indicar:
- Tipo de evaluación.
- Agente evaluador (docente, alumno, pares).
- Instrumento.
- Criterios o indicadores observables.
- Producto, desempeño o evidencia revisada.

Debe tener mínimo 30 palabras.

INICIO:
- Evaluación diagnóstica.
- Preferentemente autoevaluación o preguntas detonadoras.
- Identifica saberes previos, experiencias, emociones o nivel inicial.

DESARROLLO:
- Evaluación formativa.
- Puede ser heteroevaluación, coevaluación o revisión guiada.
- Valora avances, reflexión, participación, proceso o desempeño.

CIERRE:
- Si NO es la última sesión del PF:
    * Evaluación formativa.
    * Valora síntesis, reflexión, producto parcial, socialización o autoevaluación.

- Si SÍ es la última sesión del PF:
    * Evaluación sumativa.
    * Debe mencionar exactamente el código de pfObjetivo.actividadEvaluacion.codigo.
    * Debe mencionar la evidencia de pfObjetivo.actividadEvaluacion.evidencia.
    * Debe mencionar la ponderación de pfObjetivo.actividadEvaluacion.ponderacion.
    * Usar esta estructura adaptada:

"Actividad [codigo]. (Sumativa): Ponderación [ponderacion]%. Se evalúa: [descripción breve del desempeño o producto según PE]. El alumno entrega [evidencia]. La evaluación se realiza mediante la rúbrica oficial (Acreditado / No Acreditado) considerando los criterios de pertinencia, reflexión crítica, calidad del producto y cumplimiento de indicadores."

No inventes códigos ni evidencias. No cambies el código oficial. No cambies la evidencia oficial.

═══════════════════════════════════════════════════════════════════
RECURSOS MATERIALES DIDÁCTICOS
═══════════════════════════════════════════════════════════════════

El campo "recursosMaterialesDidacticos" es una cadena de texto con recursos separados por comas.

Debe incluir al menos 4 recursos concretos y coherentes con:
- El PF y su contenido específico.
- El ambiente de aprendizaje.
- La actividad y la evidencia esperada.

No uses: "etc.", "materiales didácticos", "recursos varios".

Ejemplos válidos según contexto:
- "Pizarrón, marcadores, cuaderno, hojas blancas, lista de cotejo"
- "Videos temáticos, computadoras, formato de reflexión, rúbrica"
- "Tarjetas de trabajo colaborativo, papelógrafo, plumones, rúbrica"
- "Lecturas seleccionadas, guía de análisis, cuaderno, proyector"

═══════════════════════════════════════════════════════════════════
ESTUDIO INDEPENDIENTE
═══════════════════════════════════════════════════════════════════

Cada momento debe incluir:

"estudioIndependiente": {
  "descripcion": "",
  "duracionHoras": 0
}

Si aplica: lectura, investigación, avance de producto, reflexión personal o preparación de evidencia.
Si no aplica: descripcion: "" y duracionHoras: 0.

═══════════════════════════════════════════════════════════════════
PATRÓN OBLIGATORIO PARA EL INICIO
═══════════════════════════════════════════════════════════════════

En todas las sesiones, la estrategiaEnsenanzaDocente del Inicio debe iniciar con:

"Pasar lista. El docente da la bienvenida al grupo y realiza el encuadre de la sesión. Presenta el propósito de aprendizaje: [propositoAprendizaje]. Contextualiza la importancia del contenido específico en relación con el Propósito Formativo [codigo]: [texto breve del PF]. Activa conocimientos previos y experiencias mediante preguntas detonadoras relacionadas con [contenidoEspecifico]. Registra las respuestas en el pizarrón o medio disponible, aclara dudas iniciales y orienta al grupo sobre el producto o desempeño esperado al cierre."

Si es la primera sesión del PF, adicionar:
"Presenta la Actividad de Evaluación [codigo] con ponderación [ponderacion]% como referente del desempeño final del PF."

La evaluación del Inicio siempre es DIAGNÓSTICA.

La estrategiaAprendizajeAlumno del Inicio debe incluir:
- Responder al pase de lista.
- Escuchar el encuadre de la sesión.
- Registrar propósito, duración y producto esperado.
- Responder preguntas detonadoras desde su experiencia personal.
- Compartir saberes previos o vivencias relacionadas.
- Formular dudas o preguntas iniciales.

═══════════════════════════════════════════════════════════════════
DESARROLLO DE LAS SESIONES
═══════════════════════════════════════════════════════════════════

El Desarrollo debe ser el momento principal de construcción del aprendizaje.

Debe incluir estrategias pertinentes al PF y al Modelo 2025, seleccionando solo las aplicables:
- Preguntas detonadoras y diálogo horizontal.
- Análisis de casos reales o situaciones contextualizadas.
- Aprendizaje colaborativo: equipos, discusión, consenso.
- Actividades reflexivas: diarios, cartas, mapas conceptuales, FODA personal.
- Producción creativa: infografías, carteles, proyectos, recetarios, lapbooks.
- Lectura crítica de textos, noticias o recursos audiovisuales.
- Dinámicas participativas: semáforos, 2 voces 2 mundos, mapas de vínculos.
- Investigación y exposición de hallazgos.
- Retroalimentación formativa durante el proceso.

No uses una fórmula fija. Adapta la estrategia al contenido real del PF.

═══════════════════════════════════════════════════════════════════
CIERRE DE LAS SESIONES
═══════════════════════════════════════════════════════════════════

El Cierre consolida el aprendizaje.

En sesiones no finales:
- Recupera aprendizajes clave.
- Solicita síntesis escrita, reflexión personal, socialización o producto parcial.
- Promueve autoevaluación o coevaluación.
- Da retroalimentación descriptiva.
- Conecta con la siguiente sesión.

En la última sesión del PF:
- Aplica la evaluación sumativa oficial.
- Menciona el código oficial de la actividad.
- Menciona la evidencia oficial.
- Menciona la ponderación.
- Cierra con entrega, presentación o demostración de la evidencia.

═══════════════════════════════════════════════════════════════════
TERMINOLOGÍA OFICIAL CONALEP 2025
═══════════════════════════════════════════════════════════════════

Usa la siguiente terminología:

- Cada elemento del array se llama "sesión" (no "propósito" ni "actividad").
- El campo "propositoAprendizaje" expresa el objetivo de la sesión.
- El campo "noSesion" indica el número consecutivo dentro del PF.
- Si el PF tiene 3 sesiones, deben tener noSesion: 1, 2 y 3.
- La estrategia docente siempre inicia con "Pasar lista."
- Usar "Propósito Formativo" (no "Resultado de Aprendizaje" ni "RA").
- Usar "sesión" (no "clase" ni "actividad específica").

═══════════════════════════════════════════════════════════════════
EJEMPLO RESUELTO (REFERENCIA DE ESTILO — NO DE CONTENIDO)
═══════════════════════════════════════════════════════════════════
El siguiente ejemplo ilustra el NIVEL DE DETALLE y TONO NARRATIVO esperados.
NO copies su contenido — adapta todo al PF real y contenidos reales del PE adjunto.
La primera sesión cierra con evaluación FORMATIVA; la última con evaluación SUMATIVA.

[
  {
    "numero": 1,
    "noSesion": 1,
    "propositoAprendizaje": "Reflexiona críticamente sobre sus hábitos cotidianos y construye una visión inicial del autocuidado como práctica ética vinculada al bienestar físico, emocional y colectivo.",
    "duracionHoras": 3,
    "modalidad": "Presencial",
    "contenidoEspecifico": "Autoconocimiento y cuidado de sí. El cuerpo como lugar del cuidado, del pensamiento y de la acción.",
    "fechaInicio": "",
    "fechaFin": "",
    "momentos": {
      "inicio": {
        "tiempoHoras": 1,
        "ambienteAprendizaje": "SALON DE CLASES",
        "estrategiaEnsenanzaDocente": "Pasar lista. El docente da la bienvenida al grupo y realiza el encuadre de la sesión. Presenta el propósito de aprendizaje sobre autoconocimiento y autocuidado, y contextualiza su relevancia en el bienestar integral. Presenta la Actividad de Evaluación 1.1.1 con ponderación 25% como referente del desempeño final del PF. Activa saberes previos mediante preguntas detonadoras: ¿Qué hábitos cuidan mi bienestar? ¿Cuáles lo deterioran? ¿Qué significa cuidarme éticamente? Registra respuestas en el pizarrón y orienta al grupo sobre el producto esperado: el Lapbook del cuidado de sí.",
        "estrategiaAprendizajeAlumno": "El alumno responde al pase de lista y escucha el encuadre de la sesión. Anota en su cuaderno el propósito de aprendizaje, la duración y el producto a construir a lo largo del PF. Responde las preguntas detonadoras compartiendo hábitos y experiencias personales sobre su bienestar. Escucha y contrasta sus respuestas con las de sus compañeros. Formula dudas iniciales sobre el concepto de autocuidado y lo que implica como práctica ética.",
        "estrategiaEvaluacion": "Evaluación diagnóstica. Autoevaluación mediante preguntas detonadoras: el alumno identifica qué prácticas cotidianas fortalecen o deterioran su bienestar, reconociendo su punto de partida antes del desarrollo del contenido.",
        "recursosMaterialesDidacticos": "Pizarrón, marcadores, cuaderno de apuntes, hoja de preguntas detonadoras",
        "estudioIndependiente": { "descripcion": "", "duracionHoras": 0 }
      },
      "desarrollo": {
        "tiempoHoras": 1,
        "ambienteAprendizaje": "SALON DE CLASES",
        "estrategiaEnsenanzaDocente": "Pasar lista. El docente facilita la actividad 'Mi cuerpo, mi casa': guía a los alumnos para que escriban una breve carta de agradecimiento a su cuerpo, reconociendo lo que les permite hacer, sentir y pensar. Organiza equipos de 4 para compartir reflexiones y construir un mapa mental colectivo con prácticas de autocuidado físico, emocional, mental y social. Supervisa el proceso, retroalimenta las contribuciones y socializa los mapas más representativos con el grupo.",
        "estrategiaAprendizajeAlumno": "El alumno escribe una carta de agradecimiento a su cuerpo, explorando qué le permite hacer, sentir y pensar. Comparte su reflexión en equipo y escucha las experiencias de sus compañeros. Contribuye al mapa mental colectivo aportando prácticas de autocuidado desde su propia experiencia. Analiza los diferentes tipos de bienestar: físico, emocional, mental, sexual, socioafectivo y del entorno.",
        "estrategiaEvaluacion": "Evaluación formativa. Heteroevaluación mediante observación directa y lista de cotejo: el docente valora la reflexión personal, la participación en equipo y la coherencia de las prácticas de autocuidado identificadas en el mapa mental.",
        "recursosMaterialesDidacticos": "Hojas blancas, plumones de colores, pizarrón, lista de cotejo formativa",
        "estudioIndependiente": { "descripcion": "Elaborar una lista personal de 5 hábitos que deseas fortalecer y 3 que deseas transformar.", "duracionHoras": 1 }
      },
      "cierre": {
        "tiempoHoras": 1,
        "ambienteAprendizaje": "SALON DE CLASES",
        "estrategiaEnsenanzaDocente": "Pasar lista. El docente propicia un cierre reflexivo mediante la pregunta: ¿Qué significa para ti cuidarte como práctica ética? Solicita a 3-4 alumnos que compartan su reflexión en voz alta. Recupera los aprendizajes clave de la sesión y los conecta con las próximas sesiones del PF donde construirán el Lapbook. Orienta sobre cómo la carta y el mapa mental serán insumos para las secciones del Lapbook.",
        "estrategiaAprendizajeAlumno": "El alumno comparte su reflexión sobre el significado del autocuidado como práctica ética. Escucha y anota las reflexiones de sus compañeros que le resultan significativas. Registra en su cuaderno los conceptos clave de la sesión. Revisa su lista de hábitos y anticipa cómo la usará en el Lapbook. Autoevalúa su participación identificando qué aportó y qué quiere profundizar.",
        "estrategiaEvaluacion": "Evaluación formativa. Autoevaluación reflexiva: el alumno valora su participación activa durante la sesión, identifica los conceptos que comprendió y reconoce aspectos que quiere profundizar en las siguientes sesiones.",
        "recursosMaterialesDidacticos": "Cuaderno, hojas de reflexión, pizarrón, marcadores",
        "estudioIndependiente": { "descripcion": "", "duracionHoras": 0 }
      }
    }
  }
]

═══════════════════════════════════════════════════════════════════
FORMATO JSON DE SALIDA
═══════════════════════════════════════════════════════════════════

Responde exclusivamente con un array JSON válido.

No incluyas: texto introductorio, explicaciones, markdown, comentarios, bloques de código.

Cada objeto del array debe conservar exactamente esta estructura:

[
  {
    "numero": 1,
    "noSesion": 1,
    "propositoAprendizaje": "",
    "duracionHoras": 0,
    "modalidad": "Presencial",
    "contenidoEspecifico": "",
    "fechaInicio": "",
    "fechaFin": "",
    "momentos": {
      "inicio": {
        "tiempoHoras": 0,
        "ambienteAprendizaje": "",
        "estrategiaEnsenanzaDocente": "",
        "estrategiaAprendizajeAlumno": "",
        "estrategiaEvaluacion": "",
        "recursosMaterialesDidacticos": "",
        "estudioIndependiente": {
          "descripcion": "",
          "duracionHoras": 0
        }
      },
      "desarrollo": {
        "tiempoHoras": 0,
        "ambienteAprendizaje": "",
        "estrategiaEnsenanzaDocente": "",
        "estrategiaAprendizajeAlumno": "",
        "estrategiaEvaluacion": "",
        "recursosMaterialesDidacticos": "",
        "estudioIndependiente": {
          "descripcion": "",
          "duracionHoras": 0
        }
      },
      "cierre": {
        "tiempoHoras": 0,
        "ambienteAprendizaje": "",
        "estrategiaEnsenanzaDocente": "",
        "estrategiaAprendizajeAlumno": "",
        "estrategiaEvaluacion": "",
        "recursosMaterialesDidacticos": "",
        "estudioIndependiente": {
          "descripcion": "",
          "duracionHoras": 0
        }
      }
    }
  }
]

No agregues campos distintos. No elimines campos. No cambies nombres de campos.

═══════════════════════════════════════════════════════════════════
VALIDACIONES OBLIGATORIAS ANTES DE RESPONDER
═══════════════════════════════════════════════════════════════════

1. La salida es un array JSON válido sin texto fuera del JSON.
2. Cada sesión incluye "numero" y "noSesion" consecutivos desde 1.
3. La cantidad de sesiones coincide con parametros.distribucionHoras si existe.
4. Cada duracionHoras coincide exactamente con parametros.distribucionHoras[i] si existe.
5. Ninguna sesión dura más de 7 horas.
6. La suma de duracionHoras es igual a pfObjetivo.horas.
7. La suma de inicio + desarrollo + cierre es igual a duracionHoras en cada sesión.
8. contenidoEspecifico usa contenidos reales del PF del PE.
9. Las estrategias se relacionan con el contenido específico y no son genéricas.
10. estrategiaEnsenanzaDocente inicia con "Pasar lista."
11. estrategiaEnsenanzaDocente tiene mínimo 60 palabras.
12. estrategiaAprendizajeAlumno tiene mínimo 60 palabras.
13. estrategiaEvaluacion tiene mínimo 30 palabras.
14. recursosMaterialesDidacticos tiene al menos 4 recursos separados por comas.
15. El Inicio usa evaluación diagnóstica.
16. El Desarrollo usa evaluación formativa.
17. El Cierre de sesiones no finales usa evaluación formativa.
18. El Cierre de la última sesión usa evaluación sumativa con código, evidencia y ponderación oficiales.
19. No se inventan códigos, evidencias, instrumentos ni contenidos.
20. No se usan frases como "etc.", "materiales didácticos" o "temas vistos".

═══════════════════════════════════════════════════════════════════
CONTEXTO JSON
═══════════════════════════════════════════════════════════════════

{{CONTEXTO_JSON}}

═══════════════════════════════════════════════════════════════════
INSTRUCCIÓN FINAL
═══════════════════════════════════════════════════════════════════

Genera ahora el array JSON de sesiones didácticas para el PF indicado.

Recuerda:
- Responde únicamente con el array JSON.
- No escribas explicaciones ni markdown.
- No inventes contenido ajeno al PE.
- Conserva exactamente el esquema de salida.
`
