"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { isFeatureEnabled } from "@/lib/features"
import { cn } from "@/lib/utils"
import { getPanelConfig, type PanelConfig } from "@/lib/panel-config"
import { BrandLogo } from "@/components/brand-logo"
import type { Rol } from "@/lib/roles"
import {
  Home, Users, Briefcase, FolderKanban, Settings, X, LogOut, Layers,
  Calculator, Receipt, Bot, Inbox, Phone, GaugeCircle, FileText, CalendarDays,
} from "lucide-react"

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  feature?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

interface SidebarProps {
  user?: {
    email?: string
    name?: string
  }
  rol?: Rol
  onCloseMobile?: () => void
  onLogout?: () => void
  isMobile?: boolean
}

const adminSections: NavSection[] = [
  {
    title: "Principal",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Inbox", href: "/inbox", icon: Inbox },
      { name: "Pipeline", href: "/pipeline", icon: Layers },
      { name: "Clientes", href: "/clientes", icon: Users },
      { name: "Servicios", href: "/servicios", icon: Briefcase },
      { name: "Proyectos", href: "/proyectos", icon: FolderKanban },
      { name: "Citas", href: "/citas", icon: CalendarDays },
    ],
  },
  {
    title: "Gestión",
    items: [
      { name: "Presupuestos", href: "/presupuestos", icon: Calculator, feature: "calculadora_presupuestos" },
      { name: "Facturación", href: "/facturacion", icon: Receipt, feature: "facturacion" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { name: "Monitor IA", href: "/monitor-ia", icon: Bot },
      { name: "Configuración", href: "/settings", icon: Settings },
    ],
  },
]

const clienteSections: NavSection[] = [
  {
    title: "Mi espacio",
    items: [
      { name: "Mis Asistentes", href: "/asistentes", icon: Phone },
      { name: "Mi Consumo", href: "/consumo", icon: GaugeCircle },
      { name: "Mis Citas", href: "/citas", icon: CalendarDays },
      { name: "Mis Documentos", href: "/documentos", icon: FileText },
    ],
  },
  {
    title: "Preferencias",
    items: [
      { name: "Configuración", href: "/mi-configuracion", icon: Settings },
    ],
  },
]

export function Sidebar({ user, rol = "admin", onCloseMobile, onLogout, isMobile = false }: SidebarProps) {
  const pathname = usePathname()
  const [panelConfig, setPanelConfig] = useState<PanelConfig>({})

  useEffect(() => {
    setPanelConfig(getPanelConfig())
    const handler = () => setPanelConfig(getPanelConfig())
    window.addEventListener("panel-config-changed", handler)
    return () => window.removeEventListener("panel-config-changed", handler)
  }, [])

  const panelNombre = panelConfig.nombrePanel || "Arena13"
  const baseSections = rol === "cliente" ? clienteSections : adminSections

  const filteredSections = baseSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      !item.feature || isFeatureEnabled(item.feature)
    ),
  })).filter(section => section.items.length > 0)

  const homeHref = rol === "cliente" ? "/asistentes" : "/dashboard"

  const sidebarContent = (
    <>
      {/* Logo / Header — arriba a la izquierda */}
      <div className={cn(
        "p-5 pb-4",
        isMobile ? "flex items-center justify-between" : "flex items-center"
      )}>
        <Link href={homeHref} className="group relative flex items-center" aria-label={panelNombre}>
          {/* Halo neón detrás del logo */}
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-arena-gradient blur-2xl opacity-50 animate-arena-neon-halo"
          />
          {panelConfig.logoUrl ? (
            <img
              src={panelConfig.logoUrl}
              alt={panelNombre}
              className="relative h-10 w-10 object-contain drop-shadow-[0_0_8px_rgba(120,125,255,0.3)]"
            />
          ) : (
            <BrandLogo
              className="relative"
              imgClassName="h-10 drop-shadow-[0_0_8px_rgba(120,125,255,0.3)]"
              fallbackSize="text-2xl drop-shadow-[0_0_10px_rgba(120,125,255,0.55)]"
            />
          )}
          <span className="relative ml-3 text-sm font-medium tracking-tight">
            {panelNombre.includes("13") ? (
              <>Arena<span className="text-gradient">13</span></>
            ) : panelNombre}
          </span>
        </Link>
        {isMobile && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="glass p-2 rounded-pill transition-colors hover:border-primary/40"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {filteredSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="px-4 mb-2 text-[0.6rem] font-medium text-muted-foreground/50 uppercase tracking-widest2">
              {section.title}
            </h3>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => isMobile && onCloseMobile?.()}
                    className={cn(
                      "group relative flex items-center gap-3 px-4 py-2 rounded-pill text-sm transition-all duration-200 overflow-hidden",
                      isActive
                        ? "text-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                    )}
                  >
                    {/* Fondo gradiente activo */}
                    {isActive && (
                      <span className="absolute inset-0 bg-arena-gradient opacity-80" />
                    )}
                    <Icon className={cn(
                      "relative h-4 w-4 shrink-0 transition-colors",
                      !isActive && "group-hover:text-primary"
                    )} />
                    <span className="relative flex-1 font-medium">{item.name}</span>
                    {/* Barra indicadora lateral */}
                    {!isActive && (
                      <span className="absolute left-0 top-1/2 h-0 w-0.5 -translate-y-1/2 rounded-pill bg-arena-gradient opacity-0 transition-all duration-200 group-hover:h-1/2 group-hover:opacity-100" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4">
        <div className="glass-strong rounded-2xl p-3 flex items-center gap-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-arena-gradient shadow-glow-purple">
            <span className="text-xs font-semibold text-white">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            {user?.name && (
              <p className="text-sm font-medium truncate">{user.name}</p>
            )}
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
              {user?.email || "admin@arenatrece.com"}
            </p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="shrink-0 glass p-2 rounded-pill text-muted-foreground transition-all duration-300 hover:text-destructive hover:border-destructive/40"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        {sidebarContent}
      </div>
    )
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen fixed left-0 top-0 glass-strong border-r border-white/5">
      {sidebarContent}
    </aside>
  )
}
