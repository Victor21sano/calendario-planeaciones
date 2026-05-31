// Constantes de estilo para exportación a Word (docx v9)
// Unidades: half-points para texto, TWIPs para dimensiones

export const FUENTES = {
  cuerpo:     'Calibri',
  encabezado: 'Calibri',
}

// Tamaños en half-points (1pt = 2 half-points)
export const TAMANOS = {
  titulo:    28,   // 14pt
  cuerpo:    22,   // 11pt
  pequeno:   18,   // 9pt
  minimo:    16,   // 8pt
}

// Colores en hex SIN el '#'
export const COLORES = {
  texto:           '0F172A',   // slate-900
  textoMuted:      '64748B',   // slate-500
  bordeTabla:      'CBD5E1',   // slate-300
  fondoHeader:     'F1F5F9',   // slate-100
  acentoCONALEP:   '059669',   // emerald-600 (verde CONALEP)
  // Fondos de momentos
  fondoInicio:     'EDE9FE',   // violet-100
  fondoDesarrollo: 'D1FAE5',   // emerald-100
  fondoCierre:     'FEF3C7',   // amber-100
  blanco:          'FFFFFF',
}

// Dimensiones de página en TWIPs (1 cm ≈ 567 TWIPs, 1 pulgada = 1440 TWIPs)
export const PAGINA = {
  ancho:           12240,   // 8.5 in (Letter)
  alto:            15840,   // 11 in
  margenTop:       1134,    // 2 cm
  margenBottom:    1134,
  margenLeft:      1134,
  margenRight:     1134,
}

// Ancho total de contenido (ancho - márgenes) en TWIPs
// 12240 - 2268 = 9972 TWIPs
export const ANCHO_CONTENIDO = 9972

// Anchos de columnas por tabla (en TWIPs)
export const COL = {
  // Tabla docente: 3 columnas iguales
  docente:       [3324, 3324, 3324],
  // Tabla módulo: proporcional 4/4/2
  modulo:        [4488, 4488, 996],
  // Tabla momento: etiqueta angosta / contenido ancho
  momento:       [2993, 6979],
  // Tabla datos específico: 2 columnas iguales para fechas/duración
  datosEq:       [4986, 4986],
}
