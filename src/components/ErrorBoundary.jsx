import { Component } from 'react'

/**
 * Captura errores de render en el árbol de componentes hijos y muestra
 * una pantalla amigable en lugar de romper la app.
 * Envuelve App en main.jsx para cobertura global.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo?.componentStack)
    this.setState({ errorInfo })
  }

  handleReload() {
    window.location.reload()
  }

  handleBack() {
    window.location.href = '/'
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="card p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
              Algo salió mal
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              La aplicación encontró un error inesperado. Tus datos guardados están seguros.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={this.handleReload} className="btn-primary w-full justify-center">
              Recargar aplicación
            </button>
            <button onClick={this.handleBack} className="btn-secondary w-full justify-center">
              Volver al inicio
            </button>
          </div>

          {/* Detalle técnico en desarrollo */}
          {import.meta.env.DEV && this.state.error && (
            <details className="text-left mt-2">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                Detalle técnico (solo visible en desarrollo)
              </summary>
              <pre className="mt-2 text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl overflow-auto max-h-40 whitespace-pre-wrap break-all">
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }
}
