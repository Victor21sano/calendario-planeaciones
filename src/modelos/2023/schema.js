/**
 * JSON Schema (draft 2020-12) para la Planeación Didáctica CONALEP Modelo 2023 (MCCEMS).
 *
 * Estructura:
 *   planeacion
 *     cabecera
 *       modulo  (nombre, siglema, semestre, horasTotales, horasSemana, tipoCurriculum, …)
 *       docente (nombre, numEmpleado, plantel)
 *       calendario (fechaInicioSemestre, fechaFinSemestre, diasNoLaborables[])
 *       grupo   (numero, turno?)
 *     unidades[]
 *       ras[]
 *         actividadesEspecificas[]   ← minItems: 0 en Prompt 1, ≥ 1 cuando completa
 *           momentos { inicio, desarrollo, cierre }
 */

export const schemaModelo2023 = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id:     'https://planea-pro.com.mx/schemas/planeacion-modelo-2023.json',
  title:   'Planeación Didáctica CONALEP Modelo 2023',
  type:    'object',
  required: ['cabecera', 'unidades'],

  properties: {

    // ── CABECERA ──────────────────────────────────────────────
    cabecera: {
      type: 'object',
      required: ['modulo', 'docente', 'calendario', 'grupo'],
      properties: {

        modulo: {
          type: 'object',
          required: ['nombre', 'siglema', 'semestre', 'horasTotales', 'horasSemana', 'tipoCurriculum', 'competenciaModulo', 'proposito'],
          properties: {
            nombre:             { type: 'string', minLength: 3, maxLength: 300 },
            siglema:            { type: 'string', minLength: 3, maxLength: 20 },
            semestre:           { type: 'integer', minimum: 1, maximum: 6 },
            horasTotales:       { type: 'number', exclusiveMinimum: 0 },
            horasSemana:        { type: 'number', exclusiveMinimum: 0 },
            tipoCurriculum:     { type: 'string', enum: ['fundamental', 'ampliado', 'laboral'] },
            competenciaModulo:  { type: 'string', minLength: 2 },
            recursoOArea:       { type: 'string', minLength: 2 },
            proposito:          { type: 'string', minLength: 10 },
            competenciasGenericas: {
              type: 'array',
              items: { type: 'string', minLength: 2 },
            },
          },
          // Si tipoCurriculum es fundamental o ampliado, recursoOArea es requerido
          allOf: [
            {
              if:   { properties: { tipoCurriculum: { enum: ['fundamental', 'ampliado'] } }, required: ['tipoCurriculum'] },
              then: { required: ['recursoOArea'] },
            },
          ],
        },

        docente: {
          type: 'object',
          required: ['nombre', 'numEmpleado', 'plantel'],
          properties: {
            nombre:      { type: 'string', minLength: 3, maxLength: 200 },
            numEmpleado: { type: 'string', pattern: '^[0-9]{4,15}$' },
            plantel:     { type: 'string', minLength: 2, maxLength: 100 },
          },
        },

        calendario: {
          type: 'object',
          required: ['fechaInicioSemestre', 'fechaFinSemestre'],
          properties: {
            fechaInicioSemestre: { type: 'string', format: 'date' },
            fechaFinSemestre:    { type: 'string', format: 'date' },
            diasNoLaborables: {
              type:  'array',
              items: { type: 'string', format: 'date' },
            },
          },
        },

        grupo: {
          type: 'object',
          required: ['numero'],
          properties: {
            numero: { type: 'string', minLength: 1 },
            turno:  { type: 'string' },
          },
        },
      },
    },

    // ── UNIDADES ──────────────────────────────────────────────
    unidades: {
      type:     'array',
      minItems: 1,
      maxItems: 4,
      items:    { $ref: '#/$defs/unidad' },
    },
  },

  // ── DEFINICIONES REUTILIZABLES ────────────────────────────
  $defs: {

    unidad: {
      type: 'object',
      required: ['numero', 'nombre', 'proposito', 'duracionHoras', 'ras'],
      properties: {
        numero:        { type: 'integer', minimum: 1 },
        nombre:        { type: 'string',  minLength: 3 },
        proposito:     { type: 'string',  minLength: 10 },
        duracionHoras: { type: 'number',  exclusiveMinimum: 0 },
        ras:           { type: 'array', minItems: 1, maxItems: 8, items: { $ref: '#/$defs/ra' } },
      },
    },

    ra: {
      type: 'object',
      required: ['numero', 'codigo', 'nombre', 'duracionHoras', 'actividadEvaluacion'],
      properties: {
        numero:        { type: 'integer', minimum: 1 },
        codigo:        { type: 'string',  pattern: '^[0-9]+\\.[0-9]+$' },
        nombre:        { type: 'string',  minLength: 5 },
        duracionHoras: { type: 'number',  exclusiveMinimum: 0 },

        actividadEvaluacion: {
          type: 'object',
          required: ['codigo', 'nombre', 'descripcion', 'instrumento', 'ponderacion'],
          properties: {
            codigo:       { type: 'string', pattern: '^[0-9]+\\.[0-9]+\\.[0-9]+$' },
            nombre:       { type: 'string', minLength: 3 },
            descripcion:  { type: 'string', minLength: 5 },
            instrumento:  { type: 'string', minLength: 2 },
            ponderacion:  { type: 'number', minimum: 0, maximum: 100 },
          },
        },

        // minItems: 0 → el Prompt 1 devuelve [] y el Prompt 2 rellena las actividades.
        // Para validación de planeación completa usar validarPlaneacionCompleta2023().
        actividadesEspecificas: {
          type:     'array',
          minItems: 0,
          // Sin tope fijo de cantidad: el nº de actividades = ⌈horasRA / 7⌉
          // (regla CONALEP de máx. 7h por actividad). 16 da holgura para RAs largos.
          maxItems: 16,
          items:    { $ref: '#/$defs/actividadEspecifica' },
        },
      },
    },

    actividadEspecifica: {
      type: 'object',
      required: ['numero', 'propositoAprendizaje', 'duracionHoras', 'modalidad', 'contenidoEspecifico', 'momentos'],
      properties: {
        numero:               { type: 'integer', minimum: 1 },
        noSesion:             { type: 'integer', minimum: 1 },   // número de sesión dentro del RA
        propositoAprendizaje: { type: 'string',  minLength: 5 },
        duracionHoras:        { type: 'number',  exclusiveMinimum: 0 },
        modalidad:            { type: 'string',  enum: ['Presencial', 'Mixta', 'A distancia', 'Híbrida'] },
        contenidoEspecifico:  { type: 'string',  minLength: 3 },
        fechaInicio:          { type: 'string',  format: 'date' },
        fechaFin:             { type: 'string',  format: 'date' },
        momentos: {
          type: 'object',
          required: ['inicio', 'desarrollo', 'cierre'],
          properties: {
            inicio:     { $ref: '#/$defs/momento' },
            desarrollo: { $ref: '#/$defs/momento' },
            cierre:     { $ref: '#/$defs/momento' },
          },
        },
      },
    },

    momento: {
      type: 'object',
      required: ['tiempoHoras', 'ambienteAprendizaje', 'estrategiaEnsenanzaDocente', 'estrategiaAprendizajeAlumno', 'estrategiaEvaluacion', 'recursosMaterialesDidacticos'],
      properties: {
        tiempoHoras:                    { type: 'number', minimum: 0 },
        ambienteAprendizaje:            { type: 'string', minLength: 2 },
        estrategiaEnsenanzaDocente:     { type: 'string', minLength: 2 },
        estrategiaAprendizajeAlumno:    { type: 'string', minLength: 2 },
        estrategiaEvaluacion:           { type: 'string', minLength: 2 },
        recursosMaterialesDidacticos:   { type: 'string', minLength: 2 },
        estudioIndependiente: {
          type: 'object',
          properties: {
            descripcion:   { type: 'string' },
            duracionHoras: { type: 'number', minimum: 0 },
          },
        },
      },
    },
  },
}
