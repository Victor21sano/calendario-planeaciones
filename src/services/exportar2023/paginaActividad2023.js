import { tituloOficial }          from './utiles/estilos.js'
import { espacio, saltoPagina }  from './utiles/helpers.js'
import { tablaCabeceraDocente }  from './tablas/tablaCabeceraDocente.js'
import { tablaCabeceraModulo }   from './tablas/tablaCabeceraModulo.js'
import { tablaUnidad }           from './tablas/tablaUnidad.js'
import { tablaRA }               from './tablas/tablaRA.js'
import { tablaDatosEspecifico }  from './tablas/tablaDatosEspecifico.js'
import { tablaMomento }          from './tablas/tablaMomento.js'

/**
 * Devuelve el array de elementos (Paragraph | Table) que componen
 * UNA página/actividad completa del Modelo 2023.
 *
 * @param {{ cabecera, unidad, ra, actividad, esPrimeraActividadDelRA, esPrimeraPagina, logoBuffer }} args
 */
export function paginaActividad2023({ cabecera, unidad, ra, actividad, esPrimeraActividadDelRA, esPrimeraPagina, logoBuffer }) {
  const elems = []

  if (!esPrimeraPagina) elems.push(saltoPagina())

  elems.push(tituloOficial(logoBuffer))
  elems.push(tablaCabeceraDocente(cabecera.docente))
  elems.push(espacio(80))
  elems.push(tablaCabeceraModulo(cabecera.modulo, cabecera.grupo))
  elems.push(espacio(80))
  elems.push(tablaUnidad(unidad))
  elems.push(espacio(80))
  elems.push(tablaRA(ra, esPrimeraActividadDelRA))
  elems.push(espacio(80))
  elems.push(tablaDatosEspecifico(actividad))
  elems.push(espacio(80))
  elems.push(tablaMomento('inicio',     actividad?.momentos?.inicio))
  elems.push(espacio(80))
  elems.push(tablaMomento('desarrollo', actividad?.momentos?.desarrollo))
  elems.push(espacio(80))
  elems.push(tablaMomento('cierre',     actividad?.momentos?.cierre))

  return elems
}
