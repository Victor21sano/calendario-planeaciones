export function exportarCSV(planeacion, resumen) {
  const encabezados = [
    'Unidad',
    'Subunidad',
    'Horas',
    'Semana Inicio',
    'Semana Fin',
    'Fecha Inicio',
    'Fecha Fin',
    'Duración (semanas)',
    '% del total',
  ]

  const filas = planeacion.map(row => [
    `"${row.unidadNombre}"`,
    `"${row.subunidadNombre}"`,
    row.horas,
    row.semanaInicio ?? 'Sin capacidad',
    row.semanaFin ?? 'Sin capacidad',
    row.fechaInicio ?? '',
    row.fechaFin ?? '',
    row.duracionSemanas ?? '',
    row.porcentaje.toFixed(1) + '%',
  ])

  const filaResumen = [
    [''],
    ['RESUMEN'],
    ['Total horas programa', resumen.totalHoras],
    ['Semanas hábiles', resumen.semanasHabiles],
    ['Horas/semana', resumen.horasSemana],
    ['Capacidad total', resumen.capacidadTotal],
    ['Horas restantes', resumen.horasRestantes],
  ]

  const contenido = [
    encabezados.join(','),
    ...filas.map(f => f.join(',')),
    ...filaResumen.map(f => f.join(',')),
  ].join('\n')

  const blob = new Blob(['﻿' + contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'planeacion_docente.csv'
  a.click()
  URL.revokeObjectURL(url)
}
