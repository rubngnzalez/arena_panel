/**
 * Arena13 Panel - Página Inicio
 * Identidad arenatrece.com: gradiente púrpura→cian, liquid glass, pills
 */

import Link from "next/link"

const features = [
  { num: "01", label: "Diseño responsive", desc: "Glass UI adaptable" },
  { num: "02", label: "Gestión de clientes", desc: "CRUD completo" },
  { num: "03", label: "Sistema de servicios", desc: "Catálogo extensible" },
  { num: "04", label: "Dashboard con métricas", desc: "Tiempo real" },
  { num: "05", label: "Configuración editable", desc: "Self-service" },
  { num: "06", label: "Deploy en GitHub Pages", desc: "CI/CD nativo" },
]

const stats = [
  { label: "Clientes", value: "Gestión completa" },
  { label: "Servicios", value: "Catálogo extensible" },
  { label: "Dashboard", value: "Métricas en tiempo real" },
  { label: "Deploy", value: "GitHub Pages" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-grid">
      <div className="w-full max-w-md space-y-12 px-6 animate-fade-in">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-pill bg-arena-gradient shadow-glow-purple mb-5">
            <span className="text-2xl font-semibold text-white">A</span>
          </div>
          <h1 className="text-4xl font-medium tracking-tight mb-2">
            Arena<span className="text-gradient">13</span>
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest2 font-light">
            Panel de Gestión
          </p>
        </div>

        {/* Hero card */}
        <div className="glass-strong rounded-2xl p-7">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/60 animate-arena-pulse" />
              <div>
                <p className="text-sm font-medium">Panel activo</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-light">
                  Gestión completa de clientes y proyectos
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {features.map((f) => (
                <div key={f.num} className="flex items-center gap-4 group">
                  <span className="text-xs font-medium text-gradient w-7 shrink-0">{f.num}.</span>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-foreground">{f.label}</span>
                    <span className="text-xs text-muted-foreground font-light">{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/login" className="arena-btn w-full">
              Acceder al Panel
            </Link>

            <Link
              href="/dashboard-preview"
              className="block text-center text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
            >
              Ver demo sin sesión
            </Link>
          </div>
        </div>

        {/* Stats minimalistas */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-light">{s.label}</p>
              <p className="text-sm text-gradient font-medium">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
