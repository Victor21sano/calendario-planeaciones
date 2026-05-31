import CampoNumero   from './campos/CampoNumero'
import CampoSelect   from './campos/CampoSelect'
import CampoTextArea from './campos/CampoTextArea'
import CampoTexto    from './campos/CampoTexto'
import { AMBIENTES_SUGERIDOS } from '../../modelos/2023/constantes.js'

const CFG = {
  inicio:     { titulo: 'Inicio',     color: 'border-violet-300 dark:border-violet-800',  bg: 'bg-violet-50/50 dark:bg-violet-950/20' },
  desarrollo: { titulo: 'Desarrollo', color: 'border-emerald-300 dark:border-emerald-800', bg: 'bg-emerald-50/50 dark:bg-emerald-950/20' },
  cierre:     { titulo: 'Cierre',     color: 'border-amber-300 dark:border-amber-800',    bg: 'bg-amber-50/50 dark:bg-amber-950/20' },
}

const AYUDA_EVALUACION = {
  inicio:     'Suele ser DIAGNÓSTICA (autoevaluación de conocimientos previos)',
  desarrollo: 'Suele ser FORMATIVA (heteroevaluación o coevaluación en proceso)',
  cierre:     'En la última actividad del RA: SUMATIVA con aplicación de rúbrica oficial',
}

const opcionesAmbiente = AMBIENTES_SUGERIDOS.map(a => ({ valor: a, etiqueta: a }))

export default function EditorMomento({ tipo, momento = {}, onCambio }) {
  const cfg = CFG[tipo] || { titulo: tipo, color: 'border-slate-300', bg: '' }

  const set = (campo, valor) => onCambio({ ...momento, [campo]: valor })
  const setEstudio = (campo, valor) => onCambio({
    ...momento,
    estudioIndependiente: { ...(momento.estudioIndependiente || {}), [campo]: valor },
  })

  return (
    <fieldset className={`rounded-2xl border-2 ${cfg.color} ${cfg.bg} p-4 space-y-3`}>
      <legend className="px-2 text-sm font-bold text-slate-800 dark:text-slate-100">{cfg.titulo}</legend>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CampoNumero
          etiqueta="Tiempo"
          valor={momento.tiempoHoras}
          onCambio={v => set('tiempoHoras', v)}
          min={0} paso={0.5} sufijo="hrs" requerido
        />
        <CampoSelect
          etiqueta="Ambiente de Aprendizaje"
          valor={momento.ambienteAprendizaje}
          onCambio={v => set('ambienteAprendizaje', v)}
          opciones={opcionesAmbiente} requerido
        />
      </div>

      <CampoTextArea
        etiqueta="Estrategia de Enseñanza (Docente)"
        valor={momento.estrategiaEnsenanzaDocente}
        onCambio={v => set('estrategiaEnsenanzaDocente', v)}
        requerido
      />
      <CampoTextArea
        etiqueta="Estrategia de Aprendizaje (Alumno)"
        valor={momento.estrategiaAprendizajeAlumno}
        onCambio={v => set('estrategiaAprendizajeAlumno', v)}
        requerido
      />
      <CampoTextArea
        etiqueta="Estrategia de Evaluación"
        valor={momento.estrategiaEvaluacion}
        onCambio={v => set('estrategiaEvaluacion', v)}
        ayuda={AYUDA_EVALUACION[tipo]}
        requerido
      />
      <CampoTexto
        etiqueta="Recursos y materiales didácticos"
        valor={momento.recursosMaterialesDidacticos}
        onCambio={v => set('recursosMaterialesDidacticos', v)}
        requerido
      />

      <details className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
        <summary className="cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300">
          Estudio independiente (opcional)
        </summary>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_120px] gap-3">
          <CampoTexto
            etiqueta="Descripción"
            valor={momento.estudioIndependiente?.descripcion || ''}
            onCambio={v => setEstudio('descripcion', v)}
          />
          <CampoNumero
            etiqueta="Duración"
            valor={momento.estudioIndependiente?.duracionHoras || 0}
            onCambio={v => setEstudio('duracionHoras', v)}
            min={0} paso={0.5} sufijo="hrs"
          />
        </div>
      </details>
    </fieldset>
  )
}
