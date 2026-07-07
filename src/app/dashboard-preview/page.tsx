/**
 * Arena13 Panel - Dashboard Preview
 * Demo estática con la identidad visual oficial de arenatrece.com
 * Liquid glass · Gradiente púrpura→cian · Pills · Glow
 */

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  Briefcase,
  FolderKanban,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Activity,
  Home,
  LifeBuoy,
  FileText,
  Bell,
  Settings,
  Grid3x3,
  LogOut,
  Sparkles,
  CheckCircle2,
  Clock,
} from "lucide-react"

const stats = [
  { title: "Clientes Activos", value: "24", change: "+12%", icon: Users },
  { title: "Proyectos en Curso", value: "8", change: "+3", icon: FolderKanban },
  { title: "Servicios Activos", value: "7", change: "7 tipos", icon: Briefcase },
  { title: "Ingreso Mensual", value: "€45K", change: "+18%", icon: TrendingUp },
]

const proyectos = [
  { nombre: "Web E-commerce", cliente: "TechCorp", estado: "En Progreso", estadoCls: "text-amber-400 border-amber-400/40 bg-amber-400/10", progreso: 75 },
  { nombre: "Rebranding Completo", cliente: "StartupXYZ", estado: "Planificación", estadoCls: "text-arena-cyan border-arena-cyan/40 bg-arena-cyan/10", progreso: 30 },
  { nombre: "Agente IA Atención", cliente: "RetailCo", estado: "Revisión", estadoCls: "text-purple-400 border-purple-400/40 bg-purple-400/10", progreso: 90 },
  { nombre: "Landing Marketing", cliente: "GrowthLab", estado: "Completado", estadoCls: "text-green-400 border-green-400/40 bg-green-400/10", progreso: 100 },
]

const actividad = [
  { tipo: "done", texto: "Proyecto «Landing Marketing» marcado como completado", tiempo: "hace 2h", icon: CheckCircle2, color: "text-green-400" },
  { tipo: "new", texto: "Nuevo cliente añadido: GrowthLab", tiempo: "hace 5h", icon: Plus, color: "text-primary" },
  { tipo: "progress", texto: "«Agente IA Atención» alcanzó el 90%", tiempo: "hace 1d", icon: TrendingUp, color: "text-arena-cyan" },
  { tipo: "pending", texto: "Revisión pendiente de documentos", tiempo: "hace 2d", icon: Clock, color: "text-amber-400" },
]

const navSections = [
  {
    title: "Principal",
    items: [
      { name: "Dashboard", icon: Home, active: true },
      { name: "Clientes", icon: Users },
      { name: "Servicios", icon: Briefcase },
      { name: "Proyectos", icon: FolderKanban },
    ],
  },
  {
    title: "Gestión",
    items: [
      { name: "Tickets", icon: LifeBuoy },
      { name: "Documentos", icon: FileText },
      { name: "Notificaciones", icon: Bell, badge: 3 },
    ],
  },
  {
    title: "Sistema",
    items: [
      { name: "Funcionalidades", icon: Grid3x3 },
      { name: "Configuración", icon: Settings },
    ],
  },
]

const acciones = [
  { icon: Users, label: "Nuevo Cliente" },
  { icon: Briefcase, label: "Nuevo Servicio" },
  { icon: FolderKanban, label: "Nuevo Proyecto" },
  { icon: Activity, label: "Ver Actividad" },
]

export default function DashboardPreviewPage() {
  return (
    <div className="min-h-screen">
      {/* Sidebar fijo (réplica estática del panel real) */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen fixed left-0 top-0 glass-strong border-r border-white/5">
        {/* Logo */}
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-pill bg-arena-gradient shadow-glow-purple">
              <span className="text-sm font-semibold text-white">A</span>
            </span>
            <div className="leading-none">
              <span className="block text-base font-medium tracking-tight">Arena<span className="text-gradient">13</span></span>
              <span className="block text-[0.65rem] font-light text-muted-foreground tracking-widest2 uppercase mt-0.5">Panel</span>
            </div>
          </Link>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="px-4 mb-2 text-[0.65rem] font-medium text-muted-foreground/60 uppercase tracking-widest2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.name}
                      className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-pill text-sm transition-all duration-300 overflow-hidden ${
                        item.active
                          ? "text-white"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03] cursor-pointer"
                      }`}
                    >
                      {item.active && (
                        <span className="absolute inset-0 bg-arena-gradient opacity-90 shadow-glow-purple" />
                      )}
                      <Icon className="relative h-4 w-4 shrink-0" />
                      <span className="relative flex-1 font-medium">{item.name}</span>
                      {item.badge && (
                        <span className="relative text-xs h-5 px-1.5 inline-flex items-center justify-center rounded-pill border border-primary/40 bg-primary/10 text-primary">
                          {item.badge}
                        </span>
                      )}
                      {!item.active && (
                        <span className="absolute left-0 top-1/2 h-0 w-0.5 -translate-y-1/2 rounded-pill bg-arena-gradient opacity-0 transition-all duration-300 group-hover:h-1/2 group-hover:opacity-100" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Tarjeta de usuario */}
        <div className="p-4">
          <div className="glass-strong rounded-2xl p-3 flex items-center gap-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-arena-gradient shadow-glow-purple">
              <span className="text-xs font-semibold text-white">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin</p>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
                Demo
              </p>
            </div>
            <div className="shrink-0 glass p-2 rounded-pill text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </div>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Header desktop */}
        <header className="hidden lg:block border-b border-white/5">
          <div className="arena-container">
            <div className="py-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest2 font-light">Panel de Gestión</p>
                <p className="text-sm text-gradient font-medium mt-0.5">Arena13</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="arena-badge text-arena-cyan border-arena-cyan/40 bg-arena-cyan/10">
                  <Sparkles className="h-3 w-3" />
                  Demo Mode
                </span>
                <span className="text-xs text-muted-foreground font-light hidden xl:inline">Diseño de Producto Digital & IA</span>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <div className="arena-container py-8 lg:py-12 space-y-8 animate-fade-in">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground font-light mt-1">
                Resumen de tu actividad en Arena13
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Actividad
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-light">{stat.title}</p>
                      <p className="text-2xl font-medium mt-1.5">{stat.value}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-pill border border-primary/20 bg-primary/10 text-primary">
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs">
                    <span className="arena-badge text-primary border-primary/40 bg-primary/10">{stat.change}</span>
                    <span className="text-muted-foreground font-light">vs mes anterior</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Proyectos + Actividad */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Proyectos Recientes */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-medium">Proyectos Recientes</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      Últimos proyectos actualizados
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver todos
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {proyectos.map((proyecto) => (
                    <div
                      key={proyecto.nombre}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-medium truncate">{proyecto.nombre}</h3>
                          <span className={`arena-badge ${proyecto.estadoCls}`}>{proyecto.estado}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 font-light">{proyecto.cliente}</p>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{proyecto.progreso}%</div>
                          <div className="w-20 h-1.5 bg-white/5 rounded-pill overflow-hidden mt-1">
                            <div
                              className="h-full bg-arena-gradient rounded-pill"
                              style={{ width: `${proyecto.progreso}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actividad reciente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Actividad</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  Últimos movimientos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {actividad.map((act, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="relative flex flex-col items-center">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border border-white/10 bg-white/[0.03] ${act.color}`}>
                          <act.icon className="h-3.5 w-3.5" />
                        </div>
                        {i < actividad.length - 1 && (
                          <span className="w-px flex-1 bg-white/5 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="text-xs text-foreground leading-relaxed">{act.texto}</p>
                        <p className="text-[0.65rem] text-muted-foreground font-light mt-0.5">{act.tiempo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Acciones Rápidas</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Gestiona frecuentes al alcance de un clic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {acciones.map((a) => (
                  <Button key={a.label} variant="secondary" className="h-auto flex-col gap-2 py-5">
                    <a.icon className="h-5 w-5 text-primary" />
                    <span className="text-xs">{a.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Aviso Preview */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border border-arena-cyan/30 bg-arena-cyan/10 text-arena-cyan">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-1">Vista Demo</h3>
                  <p className="text-sm text-muted-foreground font-light mb-4">
                    Estás viendo una demostración estática del panel. Conecta Supabase para
                    habilitar la funcionalidad completa con datos reales.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {["Crear proyecto en supabase.com", "Ejecutar migraciones SQL", "Actualizar .env.local", "Crear usuario admin"].map((step, idx) => (
                      <span key={step} className="arena-badge">
                        <span className="text-gradient font-medium">{idx + 1}</span>
                        <span className="text-muted-foreground">{step}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors shrink-0">
                  ← Volver
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs text-muted-foreground font-light">
              Arena13 — Diseño de Producto Digital & IA
            </p>
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
            >
              arenatrece.com
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
