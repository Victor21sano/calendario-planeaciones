import { Link } from 'react-router-dom'

/**
 * Overlay semitransparente que bloquea actividades 2..N en modo gratis.
 * La primera actividad siempre es visible — esta solo aparece en las siguientes.
 */
export default function PaywallOverlay() {
  return (
    <div className="absolute inset-0 backdrop-blur-sm bg-white/70 dark:bg-slate-900/70
                    flex items-center justify-center rounded-2xl z-10 no-print">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700
                      p-6 max-w-sm mx-4 text-center space-y-4 animate-scale-in">
        {/* Lock icon */}
        <div className="w-12 h-12 mx-auto rounded-full bg-info-100 dark:bg-info-900/40 flex items-center justify-center">
          <svg className="w-6 h-6 text-info-600 dark:text-info-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
            Contenido bloqueado
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Adquiere créditos para desbloquear todas las actividades de esta planeación y copiarlas a Word.
          </p>
        </div>

        <Link
          to="/comprar-creditos"
          className="btn-accent w-full justify-center py-2.5 text-sm"
        >
          Adquirir créditos
        </Link>
      </div>
    </div>
  )
}
