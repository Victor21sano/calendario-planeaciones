import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { updateMateria, actualizarMateriaConPlaneacion2023, MODELO_2023 } from "../../services/materias"
import { calcularSemanasHabiles, calcularHorasSemanaAuto } from "../../utils/calculos"
import {
  extraerEstructuraDesdeArchivos,
  generarRAsDesdeEstructura,
  buildUnidadesFromAI,
  fileToBase64,
} from "../../services/iaPlaneacion"
import { extraerEstructura2023 } from "../../services/ia/gemini2023"
import { iniciarSesionGeneracion, finalizarSesionGeneracion } from "../../services/creditosService"
import { generarPlaneacion2023Completa, validarRequisitos2023 } from "../../services/ia/orquestador2023"
import { tieneDatosCompletos2023 } from "../../services/userService"
import {
  extraerUnidadesDesde2023,
  nombreMateriaDesdeSiglema,
  debeAutonombrarMateria,
  base64ToFile,
  expandirPeriodosVacacionales,
  PDFS_KEY,
} from "./utils"

// Motor de generacion del PlanificadorPage (modelos 2018 y 2023). Extraido de
// PlanificadorPage.jsx SIN cambios de comportamiento: posee el estado de flujo
// (onboarding/generacion/modales) y los handlers que orquestan extraccion de
// estructura, generacion de planeacion y el cobro via sesiones de credito.
// La interfaz es ancha a proposito (recibe estado/setEstado/setMainTab) porque
// el flujo original acopla generacion + materia + modales.
export default function useFlujoGeneracion({
  estado,
  setEstado,
  loading,
  setMainTab,
  materiaId,
  user,
  perfilDocente,
  creditos,
  esAdmin,
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const [mostrarModalSinCreditos, setMostrarModalSinCreditos] = useState(false)
  // ── Onboarding flow: 'init'|'splash'|'upload'|'loading'|'success'|'app'
  const [onboardingFase, setOnboardingFase] = useState('init')
  const [genProgress,    setGenProgress]    = useState({ phase: 'idle', message: '', current: 0, total: 0 })
  const [genError,       setGenError]       = useState('')
  const [genResult,      setGenResult]      = useState(null)
  const [pendingResult,  setPendingResult]  = useState(null)
  // Modal de captura de fechas cuando faltan antes de generar
  const [mostrarModalFechas, setMostrarModalFechas] = useState(false)
  const [guardandoFechas,    setGuardandoFechas]    = useState(false)
  const [pdfsPendientes,     setPdfsPendientes]     = useState(null)
  // true cuando los PDFs pendientes son para el modo gratuito (solo Planificador)
  const [pendienteEsGratis,  setPendienteEsGratis]  = useState(false)
  // Estado de generación on-pay (desde la estructura ya extraída en modo gratis)
  const [generandoPagada,    setGenerandoPagada]    = useState(false)
  // Reset de estados que pueden quedar atascados entre recargas parciales
  useEffect(() => {
    setPdfsPendientes(null)
    setMostrarModalFechas(false)
    setGuardandoFechas(false)
  }, []) // solo al montar

  // Mostrar modal UNA SOLA VEZ cuando el usuario llega al UploadScreen sin créditos.
  // Se usa una ref para no repetirlo si vuelve de un error en modo gratuito.
  const sinCreditosModalMostradoRef = useRef(false)
  const continuacionPerfilProcesadaRef = useRef(false)
  useEffect(() => {
    if (
      onboardingFase === 'upload' &&
      !esAdmin &&
      creditos !== null &&
      creditos <= 0 &&
      !sinCreditosModalMostradoRef.current
    ) {
      sinCreditosModalMostradoRef.current = true
      setMostrarModalSinCreditos(true)
    }
  }, [onboardingFase, esAdmin, creditos])
  // ── Guardado de fechas desde el modal ───────────────────────
  async function handleGuardarFechas({ fechaInicio, fechaFin, periodosVacacionales }) {
    setGuardandoFechas(true)
    try {
      const nuevaSemestre = { ...estado.semestre, fechaInicio, fechaFin }
      const actualizacion  = { semestre: nuevaSemestre }
      if (periodosVacacionales !== undefined) actualizacion.periodosVacacionales = periodosVacacionales
      await updateMateria(user.uid, materiaId, actualizacion)
      setEstado(prev => ({
        ...prev,
        semestre: nuevaSemestre,
        ...(periodosVacacionales !== undefined ? { periodosVacacionales } : {}),
      }))
      setMostrarModalFechas(false)

      if (pdfsPendientes) {
        const { pdfPE, pdfGPE } = pdfsPendientes
        const esGratis = pendienteEsGratis
        setPdfsPendientes(null)
        setPendienteEsGratis(false)
        // Pasar el semestre directamente para evitar dependencia del estado asíncrono
        if (esGratis) {
          await handleFreeExtract(pdfPE, pdfGPE, nuevaSemestre)
        } else {
          await handleOnboardingGenerate(pdfPE, pdfGPE, nuevaSemestre)
        }
      }
    } catch (err) {
      throw new Error('No se pudieron guardar las fechas: ' + err.message)
    } finally {
      setGuardandoFechas(false)
    }
  }

  function handleCerrarModalFechas() {
    setMostrarModalFechas(false)
    setPdfsPendientes(null)
    setPendienteEsGratis(false)
  }

  async function continuarTrasCompletarPerfil(modo, pdfPE, pdfGPE, semestre) {
    const [b64PE, b64GPE] = await Promise.all([fileToBase64(pdfPE), fileToBase64(pdfGPE)])
    sessionStorage.setItem(PDFS_KEY(materiaId), JSON.stringify({ pe: b64PE, gpe: b64GPE }))
    sessionStorage.setItem('planea_perfil_continuar', JSON.stringify({
      source: 'planificador',
      materiaId,
      modo,
      semestre,
    }))
    navigate('/perfil')
  }

  // ── Generación desde la pantalla de onboarding ───────────────
  // semestreOverride: usado cuando se guardan fechas desde el modal (evita state stale)
  async function handleOnboardingGenerate(pdfPE, pdfGPE, semestreOverride = null) {
    const modelo   = estado.modelo || '2018'
    const semestre = semestreOverride || estado.semestre

    console.log('🔵 [Generar] Click recibido', {
      modelo,
      semestre,
      semestreOverride,
      pdfs: { pe: pdfPE?.name, gpe: pdfGPE?.name },
      perfilDocente: { nombre: perfilDocente?.nombre, numEmpleado: perfilDocente?.numEmpleado, plantel: perfilDocente?.plantel },
      creditos,
      esAdmin,
      pdfsPendientes,
      mostrarModalFechas,
    })

    // Detección temprana de fechas faltantes: abre modal en lugar de mostrar error
    if (modelo === MODELO_2023 && !semestreOverride) {
      const faltanFechas = !semestre?.fechaInicio || !semestre?.fechaFin
      if (faltanFechas) {
        console.log('🟡 [Generar] Faltan fechas → abriendo modal de captura')
        setPdfsPendientes({ pdfPE, pdfGPE })
        setMostrarModalFechas(true)
        return
      }
    }

    console.log('🟢 [Generar] Validaciones OK, iniciando flujo de generación (modelo:', modelo, ')')

    // Validación previa sin descontar crédito (solo Modelo 2023)
    // horasSemana ya NO se valida aquí — se calcula automáticamente en el orquestador
    if (modelo === MODELO_2023) {
      if (!tieneDatosCompletos2023(perfilDocente)) {
        await continuarTrasCompletarPerfil('completa', pdfPE, pdfGPE, semestre)
        return
      }
      const problemaRequisitos = validarRequisitos2023({
        perfilDocente,
        semestre,
        pdfPE,
        pdfGPE,
      })
      if (problemaRequisitos) {
        setGenError(problemaRequisitos)
        return
      }
    }

    // Gate de UX: si no hay saldo, abrir modal antes de procesar los PDFs.
    // El descuento real lo hace el servidor al abrir la sesión de generación
    // (iniciarSesionGeneracion), de forma atómica y como única fuente de verdad.
    if (!esAdmin && creditos <= 0) {
      setMostrarModalSinCreditos(true)
      return
    }

    setOnboardingFase('loading')
    setGenError('')
    setGenProgress({ phase: 'converting', message: 'Preparando PDFs…', current: 0, total: 0 })

    // ── Rama Modelo 2023 ──────────────────────────────────────────
    if (modelo === MODELO_2023) {
      try {
        const datosDocente = {
          nombre:      perfilDocente?.nombre      || '',
          numEmpleado: perfilDocente?.numEmpleado || '',
          plantel:     perfilDocente?.plantel     || '',
        }
        const calendario = {
          fechaInicioSemestre: semestre?.fechaInicio || '',
          fechaFinSemestre:    semestre?.fechaFin    || '',
          diasNoLaborables:    expandirPeriodosVacacionales(estado.periodosVacacionales),
        }

        const resultado = await generarPlaneacion2023Completa({
          pdfPE,
          pdfGPE,
          datosDocente,
          calendario,
          materiaId,
          onProgreso: p => setGenProgress(p),
        })

        const nombreCorto = nombreMateriaDesdeSiglema(resultado.planeacion)
        if (nombreCorto && debeAutonombrarMateria(estado.nombre)) {
          await updateMateria(user.uid, materiaId, { nombre: nombreCorto })
        }

        // Guardar en Firestore. El crédito ya fue descontado por la sesión de
        // generación que abre el orquestador 2023 (y reembolsado si hubiera fallado).
        await actualizarMateriaConPlaneacion2023(user.uid, materiaId, resultado.planeacion, { pagada: true })

        // Poblar Estructura y horasSemana para la Planeación Calculada.
        // horasSemana se calcula con la regla de 3 del Planificador (totalHoras ÷ semanas hábiles)
        // para que la capacidad cuadre al 100 % — no se usa el valor del orquestador 2023.
        const unidades2023 = extraerUnidadesDesde2023(resultado.planeacion)
        setEstado(prev => {
          const next = {
            ...prev,
            ...(nombreCorto && debeAutonombrarMateria(prev.nombre) ? { nombre: nombreCorto } : {}),
            planeacion2023: resultado.planeacion,
            unidades: unidades2023,
            pagada: true,
            planGeneradaGratis: false,
          }
          const hTotales = unidades2023.flatMap(u => u.subunidades || []).reduce((s, su) => s + (Number(su.horas) || 0), 0)
          const sem = semestre
          if (hTotales > 0 && sem?.fechaInicio && sem?.fechaFin) {
            const semanas = calcularSemanasHabiles(sem, estado.periodosVacacionales || [])
            const auto = calcularHorasSemanaAuto(hTotales, semanas.length)
            if (auto) next.horasSemana = auto.requiereManual ? '' : String(auto.rounded)
          }
          return next
        })

        if (resultado.rasConError.length > 0) {
          console.warn('[2023] RAs con error:', resultado.rasConError)
        }

        sessionStorage.setItem('planea_pro_splash', '1')
        setOnboardingFase('success')
      } catch (err) {
        console.error('🔴 [Generar 2023] Error en generación:', err)
        setGenError(err.message || 'Error generando la planeación 2023.')
        setOnboardingFase('upload')
      }
      return
    }

    // ── Rama Modelo 2018 ──────────────────────────────────────────
    // Abrir una sola sesión de generación (1 crédito) que cubre extracción + RAs.
    let sessionId
    try {
      sessionId = await iniciarSesionGeneracion('completa', materiaId)
    } catch (err) {
      if (err.code === 'functions/failed-precondition') setMostrarModalSinCreditos(true)
      else setGenError(err.message || 'Error al iniciar la generación.')
      setOnboardingFase('upload')
      return
    }
    try {
      // Paso 1: extraer estructura del PE
      const estructura = await extraerEstructuraDesdeArchivos(pdfPE, pdfGPE, p => setGenProgress(p), sessionId)

      // Actualizar unidades, horas totales y calcular horasSemana con regla de 3
      const newUnidades   = buildUnidadesFromAI(estructura.unidades)
      const horasTotales2018 = estructura.modulo?.horasTotales || 0
      setEstado(prev => {
        const next = { ...prev, unidades: newUnidades, horasTotalesPrograma: horasTotales2018 }
        if (horasTotales2018 > 0 && prev.semestre?.fechaInicio && prev.semestre?.fechaFin) {
          const semanas = calcularSemanasHabiles(prev.semestre, prev.periodosVacacionales || [])
          const auto = calcularHorasSemanaAuto(horasTotales2018, semanas.length)
          if (auto) next.horasSemana = auto.requiereManual ? '' : String(auto.rounded)
        }
        return next
      })

      // Paso 2: generar todas las planeaciones
      const { rasData, errors } = await generarRAsDesdeEstructura(estructura, p => setGenProgress(p), sessionId)
      const result = { estructura, rasData, errors }

      // Confirmar la sesión: el crédito se consume definitivamente.
      await finalizarSesionGeneracion(sessionId, true)

      setGenResult(result)
      sessionStorage.setItem('planea_pro_splash', '1')
      setOnboardingFase('success')
    } catch (err) {
      // Cerrar la sesión con fallo → el servidor reembolsa el crédito.
      await finalizarSesionGeneracion(sessionId, false)
      setGenError(err.message)
      setOnboardingFase('upload')
    }
  }

  function handleOnboardingSuccess() {
    if (genResult) setPendingResult(genResult)
    setOnboardingFase('app')
    setMainTab('planeacion')
  }

  // ── Modo horario: extrae solo la estructura del PE (cuesta 25 créditos) ──
  // El horario (25) cuenta como anticipo: la planeación completa de esta materia
  // pasa de 100 a 75 una vez pagado el horario.
  // semestreOverride: cuando se guardan fechas desde el modal (evita state stale)
  async function handleFreeExtract(pdfPE, pdfGPE, semestreOverride = null) {
    const semestreActual = semestreOverride || estado.semestre
    const modelo = estado.modelo || '2018'

    // Pedir fechas del semestre si faltan (igual que el flujo de pago)
    if (!semestreOverride && (!semestreActual?.fechaInicio || !semestreActual?.fechaFin)) {
      setPdfsPendientes({ pdfPE, pdfGPE })
      setPendienteEsGratis(true)
      setMostrarModalFechas(true)
      return
    }

    setOnboardingFase('loading')
    setGenError('')
    setMostrarModalSinCreditos(false)
    setGenProgress({ phase: 'converting', message: 'Extrayendo estructura del PE…', current: 0, total: 0 })

    if (modelo === MODELO_2023 && !tieneDatosCompletos2023(perfilDocente)) {
      await continuarTrasCompletarPerfil('gratis', pdfPE, pdfGPE, semestreActual)
      return
    }
    const sem    = semestreOverride || estado.semestre
    const vac    = estado.periodosVacacionales || []

    // Abrir sesión de horario (descuenta 25 créditos en el servidor).
    let sessionId
    try {
      sessionId = await iniciarSesionGeneracion('horario', materiaId)
    } catch (err) {
      if (err.code === 'functions/failed-precondition') setMostrarModalSinCreditos(true)
      else setGenError(err.message || 'Error al iniciar el horario.')
      setOnboardingFase('upload')
      return
    }

    try {
      // Guardar los PDFs en sessionStorage para poder generar al pagar sin re-subir
      const [b64PE, b64GPE] = await Promise.all([fileToBase64(pdfPE), fileToBase64(pdfGPE)])
      try { sessionStorage.setItem(PDFS_KEY(materiaId), JSON.stringify({ pe: b64PE, gpe: b64GPE })) } catch {}

      // ── Rama Modelo 2023: extraer estructura 2023 (sin actividades, sin cobro) ──
      if (modelo === MODELO_2023) {
        setGenProgress({ phase: 'structure', message: 'Extrayendo estructura del módulo…', current: 0, total: 0 })
        const datosDocente = {
          nombre:      perfilDocente?.nombre      || '',
          numEmpleado: perfilDocente?.numEmpleado || '',
          plantel:     perfilDocente?.plantel     || '',
        }
        const calendario = {
          fechaInicioSemestre: sem?.fechaInicio || '',
          fechaFinSemestre:    sem?.fechaFin    || '',
          diasNoLaborables:    expandirPeriodosVacacionales(vac),
        }
        // Extrae la estructura 2023 cobrando la sesión de horario (25 créditos).
        const estructura2023 = await extraerEstructura2023(
          pdfPE, pdfGPE, datosDocente, calendario, sessionId,
        )
        if (estructura2023?.cabecera) estructura2023.cabecera.calendario = calendario

        const unidades2023 = extraerUnidadesDesde2023(estructura2023)
        const hTotales = unidades2023.flatMap(u => u.subunidades || []).reduce((s, su) => s + (Number(su.horas) || 0), 0)
        const nombreCorto = nombreMateriaDesdeSiglema(estructura2023)

        // Persistir la estructura como planeacion2023 (RAs sin actividades aún)
        await actualizarMateriaConPlaneacion2023(user.uid, materiaId, estructura2023, { pagada: false })
        if (nombreCorto && debeAutonombrarMateria(estado.nombre)) {
          await updateMateria(user.uid, materiaId, { nombre: nombreCorto })
        }

        setEstado(prev => {
          const next = {
            ...prev,
            ...(nombreCorto && debeAutonombrarMateria(prev.nombre) ? { nombre: nombreCorto } : {}),
            planeacion2023: estructura2023,
            unidades: unidades2023,
            horasTotalesPrograma: hTotales,
            pagada: false,
            planGeneradaGratis: true,
          }
          if (hTotales > 0 && sem?.fechaInicio && sem?.fechaFin) {
            const semanas = calcularSemanasHabiles(sem, vac)
            const auto = calcularHorasSemanaAuto(hTotales, semanas.length)
            if (auto) next.horasSemana = auto.requiereManual ? '' : String(auto.rounded)
          }
          return next
        })

        // Confirmar la sesión de horario (consume los 25 créditos definitivamente).
        await finalizarSesionGeneracion(sessionId, true)

        sessionStorage.setItem('planea_pro_splash', '1')
        setOnboardingFase('app')
        setMainTab('planificador')
        return
      }

      // ── Rama Modelo 2018 ──
      const estructura = await extraerEstructuraDesdeArchivos(pdfPE, pdfGPE, p => setGenProgress(p), sessionId)
      const newUnidades   = buildUnidadesFromAI(estructura.unidades)
      const horasDesdeRAs = newUnidades.flatMap(u => u.subunidades || []).reduce((s, su) => s + (Number(su.horas) || 0), 0)
      const horasTotales  = horasDesdeRAs || estructura.modulo?.horasTotales || 0

      setEstado(prev => {
        const next = {
          ...prev,
          unidades: newUnidades,
          horasTotalesPrograma: horasTotales,
          pagada: false,
          planGeneradaGratis: true,
          estructuraIA: estructura,   // guardada para generar al pagar (sin re-subir PDFs)
        }
        if (horasTotales > 0 && sem?.fechaInicio && sem?.fechaFin) {
          const hPE = estructura.modulo?.horasSemana
          if (hPE > 0) {
            next.horasSemana = String(hPE)
          } else {
            const semanas = calcularSemanasHabiles(sem, vac)
            const auto = calcularHorasSemanaAuto(horasTotales, semanas.length)
            if (auto) next.horasSemana = auto.requiereManual ? '' : String(auto.rounded)
          }
        }
        return next
      })
      await updateMateria(user.uid, materiaId, {
        unidades: newUnidades,
        horasTotalesPrograma: horasTotales,
        pagada: false,
        planGeneradaGratis: true,
        estructuraIA: estructura,
      })

      // Confirmar la sesión de horario (consume los 25 créditos definitivamente).
      await finalizarSesionGeneracion(sessionId, true)

      sessionStorage.setItem('planea_pro_splash', '1')
      setOnboardingFase('app')
      setMainTab('planificador')   // mostrar el Planificador ya lleno
    } catch (err) {
      // Cerrar la sesión con fallo → el servidor reembolsa los 25 créditos.
      await finalizarSesionGeneracion(sessionId, false)
      setGenError(err.message)
      setOnboardingFase('upload')
    }
  }

  // ── Generación on-pay: desbloquea la planeación completa ──
  async function handleGenerarDesdeEstructura() {
    // Sin créditos → mandar a comprar
    if (!esAdmin && creditos <= 0) {
      navigate('/comprar-creditos')
      return
    }

    // ── Modelo 2023: regenerar con los PDFs guardados (re-usa el flujo de pago) ──
    if (estado.modelo === MODELO_2023) {
      const stored = sessionStorage.getItem(PDFS_KEY(materiaId))
      if (!stored) {
        // PDFs no disponibles (otra sesión/dispositivo) → re-subir
        setOnboardingFase('upload')
        return
      }
      try {
        const { pe, gpe } = JSON.parse(stored)
        const pdfPE  = base64ToFile(pe,  'PE.pdf')
        const pdfGPE = base64ToFile(gpe, 'GPE.pdf')
        // handleOnboardingGenerate hace: validar, descontar crédito, generar y guardar
        await handleOnboardingGenerate(pdfPE, pdfGPE, estado.semestre)
      } catch (err) {
        setGenError(err.message || 'Error al generar la planeación.')
        setOnboardingFase('upload')
      }
      return
    }

    // ── Modelo 2018: generar desde la estructura ya extraída ──
    if (!estado.estructuraIA) return

    // Abrir sesión (descuenta 1 crédito en el servidor, atómico).
    let sessionId
    try {
      sessionId = await iniciarSesionGeneracion('completa', materiaId)
    } catch (err) {
      if (err.code === 'functions/failed-precondition') { navigate('/comprar-creditos'); return }
      setGenError(err.message || 'Error al iniciar la generación.')
      return
    }

    setGenerandoPagada(true)
    setOnboardingFase('loading')
    setGenProgress({ phase: 'structure', message: 'Generando tu planeación didáctica…', current: 0, total: 0 })
    try {
      const { rasData, errors } = await generarRAsDesdeEstructura(estado.estructuraIA, p => setGenProgress(p), sessionId)
      await finalizarSesionGeneracion(sessionId, true)
      await updateMateria(user.uid, materiaId, { pagada: true, planGeneradaGratis: false })
      setGenResult({ estructura: estado.estructuraIA, rasData, errors })
      setEstado(prev => ({ ...prev, pagada: true, planGeneradaGratis: false }))
      setOnboardingFase('success')
    } catch (err) {
      await finalizarSesionGeneracion(sessionId, false)
      setGenError(err.message || 'Error al generar la planeación.')
      setOnboardingFase('app')
      setMainTab('planeacion')
    } finally {
      setGenerandoPagada(false)
    }
  }
  useEffect(() => {
    if (loading || continuacionPerfilProcesadaRef.current || !location.state?.continuarTrasPerfil) return

    const pendienteRaw = sessionStorage.getItem('planea_perfil_continuar')
    if (!pendienteRaw) return

    let pendiente
    try {
      pendiente = JSON.parse(pendienteRaw)
    } catch {
      sessionStorage.removeItem('planea_perfil_continuar')
      return
    }

    if (pendiente.source !== 'planificador' || pendiente.materiaId !== materiaId) return

    const stored = sessionStorage.getItem(PDFS_KEY(materiaId))
    if (!stored) {
      sessionStorage.removeItem('planea_perfil_continuar')
      setOnboardingFase('upload')
      return
    }

    continuacionPerfilProcesadaRef.current = true
    sessionStorage.removeItem('planea_perfil_continuar')

    try {
      const { pe, gpe } = JSON.parse(stored)
      const pdfPE = base64ToFile(pe, 'PE.pdf')
      const pdfGPE = base64ToFile(gpe, 'GPE.pdf')
      if (pendiente.modo === 'gratis') {
        handleFreeExtract(pdfPE, pdfGPE, pendiente.semestre || estado.semestre)
      } else {
        handleOnboardingGenerate(pdfPE, pdfGPE, pendiente.semestre || estado.semestre)
      }
    } catch (err) {
      console.error('Error al continuar tras completar perfil:', err)
      setGenError(err.message || 'No se pudo continuar la generación.')
      setOnboardingFase('upload')
    }
  }, [loading, location.state, materiaId])

  return {
    onboardingFase, setOnboardingFase,
    genProgress,
    genError, setGenError,
    genResult,
    pendingResult, setPendingResult,
    mostrarModalSinCreditos, setMostrarModalSinCreditos,
    mostrarModalFechas,
    guardandoFechas,
    generandoPagada,
    handleOnboardingGenerate,
    handleFreeExtract,
    handleGenerarDesdeEstructura,
    handleGuardarFechas,
    handleCerrarModalFechas,
    handleOnboardingSuccess,
  }
}
