import { useState, useEffect } from 'react'
import { sections, scoreRubric, factorMeta } from './data.js'

const STORAGE_KEY = 'asistente-estimulo-docente-v1'

function scoreValueFor(itemId, scores) {
  const rubric = scoreRubric[itemId]
  const selected = scores[itemId] || ''
  const opt = rubric?.options.find(o => o[0] === selected)
  return opt ? Number(opt[2]) : 0
}

function calculateScore(scores, checks) {
  const factors = Object.fromEntries(Object.keys(factorMeta).map(k => [k, 0]))
  let total = 0
  Object.keys(scoreRubric).forEach(itemId => {
    if (!checks[itemId]) return
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

export function useEstimuloState() {
  const [checks, setChecks] = useState({})
  const [scores, setScores] = useState({})
  const [notes, setNotes] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      setChecks(saved.checks || {})
      setScores(saved.scores || {})
      setNotes(saved.notes || '')
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    setIsLoaded(true)
  }, [])

  // Persist con valores siempre frescos — sin closures estancados.
  // isLoaded evita sobreescribir con el estado vacío inicial antes de cargar.
  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      checks, scores, notes, updatedAt: new Date().toISOString()
    }))
  }, [isLoaded, checks, scores, notes])

  function toggleCheck(itemId) {
    setChecks(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  function setScore(itemId, value) {
    setScores(prev => ({ ...prev, [itemId]: value }))
  }

  function markSection(sectionId, value) {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return
    setChecks(prev => {
      const next = { ...prev }
      section.items.forEach(item => { next[item.id] = value })
      return next
    })
  }

  function confirmReset() {
    setChecks({})
    setScores({})
    setNotes('')
    setShowConfirmReset(false)
  }

  const allItems = sections.flatMap(s => s.items)
  const done = allItems.filter(item => checks[item.id]).length
  const total = allItems.length
  const totalProgress = { done, total, pct: total ? Math.round((done / total) * 100) : 0 }

  const { total: scoreTotal, factors } = calculateScore(scores, checks)
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
        checks[item.id] ? scoreValueFor(item.id, scores) : 0
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
    setNotes,
    markSection,
    resetAll: () => setShowConfirmReset(true),
    showConfirmReset, confirmReset,
    cancelReset: () => setShowConfirmReset(false),
    totalProgress,
    scoreResult,
    exportCsv,
  }
}
