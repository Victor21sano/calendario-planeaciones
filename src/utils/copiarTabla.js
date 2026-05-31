export async function copiarTablaHTML(htmlContent) {
  const html = `<html><head><meta charset="utf-8"></head><body>${htmlContent}</body></html>`
  try {
    const blob = new Blob([html], { type: 'text/html' })
    await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })])
    return true
  } catch {
    try {
      const div = document.createElement('div')
      div.innerHTML = htmlContent
      await navigator.clipboard.writeText(div.innerText)
    } catch {}
    return false
  }
}

export function copiarElemento(elementId) {
  const el = document.getElementById(elementId)
  if (!el) return Promise.resolve(false)
  return copiarTablaHTML(el.outerHTML)
}

export function copiarVariosElementos(elementIds) {
  const parts = elementIds.map(id => {
    const el = document.getElementById(id)
    return el ? el.outerHTML : ''
  }).filter(Boolean)
  return copiarTablaHTML(parts.join('<br>'))
}
