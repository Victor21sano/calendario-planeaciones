import LandingHeader from './LandingHeader'
import LandingFooter from './LandingFooter'

/**
 * Marco común de las landings SEO: el mismo lienzo cálido del login
 * (radiales menta + durazno sobre papel), header con acciones y footer
 * petróleo. El contenido SEO de cada página va como children.
 */
export default function LandingLayout({ children }) {
  return (
    <div className="surface-grain min-h-screen bg-[radial-gradient(circle_at_top_left,#d6efe9,transparent_38%),radial-gradient(circle_at_bottom_right,#fde3db,transparent_42%),linear-gradient(135deg,#fffdf8_0%,#f7f3ea_50%,#fdf0e9_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(94,234,212,0.10),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(232,93,63,0.08),transparent_42%),linear-gradient(135deg,#0d1614_0%,#111a18_55%,#1a1512_100%)]">
      <LandingHeader />
      <main className="mx-auto max-w-4xl px-4 pb-4">{children}</main>
      <LandingFooter />
    </div>
  )
}
