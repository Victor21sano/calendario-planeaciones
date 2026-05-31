/**
 * Catálogo de ciclos escolares CONALEP con fechas oficiales.
 * Para agregar un nuevo ciclo, añadir un objeto al array CICLOS_ESCOLARES.
 */

export const CICLOS_ESCOLARES = [
  {
    id:          '2.2526',
    nombre:      'Ciclo 2.2526',
    descripcion: 'Febrero – Junio 2026',
    fechaInicio: '2026-02-02',
    fechaFin:    '2026-06-19',
    periodosVacacionales: [
      { nombre: 'Semana Santa', inicio: '2026-03-30', fin: '2026-04-10' },
    ],
  },
  // ─── Futuros ciclos ───────────────────────────────────────────
  // {
  //   id: '1.2627',
  //   nombre: 'Ciclo 1.2627',
  //   descripcion: 'Agosto – Diciembre 2026',
  //   fechaInicio: '2026-08-17',
  //   fechaFin:    '2026-12-18',
  //   periodosVacacionales: [
  //     { nombre: 'Vacaciones decembrinas', inicio: '...', fin: '...' },
  //   ],
  // },
]

export const CICLO_PERSONALIZADO = {
  id:          'personalizado',
  nombre:      'Personalizado',
  descripcion: 'Captura manual',
  fechaInicio: '',
  fechaFin:    '',
  periodosVacacionales: [],
}

export function obtenerCicloPorId(id) {
  if (id === 'personalizado') return CICLO_PERSONALIZADO
  return CICLOS_ESCOLARES.find(c => c.id === id) || null
}
