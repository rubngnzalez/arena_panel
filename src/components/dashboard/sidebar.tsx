"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { isFeatureEnabled } from "@/lib/features"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { getPanelConfig, type PanelConfig } from "@/lib/panel-config"
import {
  Home,
  Users,
  Briefcase,
  FolderKanban,
  LifeBuoy,
  FileText,
  Bell,
  Settings,
  Code,
  Palette,
  X,
  Grid3x3,
  LogOut,
  Layers,
  Calculator,
  Receipt,
  BarChart3,
  Mail,
} from "lucide-react"

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: number
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
  unreadNotifications?: number
  onCloseMobile?: () => void
  onLogout?: () => void
  isMobile?: boolean
}

const navSections: NavSection[] = [
  {
    title: "Principal",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Clientes", href: "/clientes", icon: Users },
      { name: "Pipeline", href: "/pipeline", icon: Layers },
      { name: "Servicios", href: "/servicios", icon: Briefcase },
      { name: "Proyectos", href: "/proyectos", icon: FolderKanban },
    ],
  },
  {
    title: "Gestión",
    items: [
      { name: "Presupuestos", href: "/presupuestos", icon: Calculator, feature: "calculadora_presupuestos" },
      { name: "Facturación", href: "/facturacion", icon: Receipt, feature: "facturacion" },
      { name: "Tickets", href: "/tickets", icon: LifeBuoy, feature: "tickets_soporte" },
      { name: "Documentos", href: "/documentos", icon: FileText, feature: "documentos" },
      { name: "Notificaciones", href: "/notificaciones", icon: Bell, feature: "notificaciones" },
    ],
  },
  {
    title: "Integraciones",
    items: [
      { name: "KiloCode", href: "/integraciones/kilocode", icon: Code, feature: "kilocode" },
      { name: "OpenDesign", href: "/integraciones/opendesign", icon: Palette, feature: "opendesign" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { name: "Reportes", href: "/reportes", icon: BarChart3, feature: "reportes" },
      { name: "Newsletter", href: "/newsletter", icon: Mail, feature: "newsletter" },
      { name: "Funcionalidades", href: "/features", icon: Grid3x3 },
      { name: "Configuración", href: "/settings", icon: Settings },
    ],
  },
]

export function Sidebar({ user, unreadNotifications = 0, onCloseMobile, onLogout, isMobile = false }: SidebarProps) {
  const pathname = usePathname()
  const [panelConfig, setPanelConfig] = useState<PanelConfig>({})

  useEffect(() => {
    setPanelConfig(getPanelConfig())
    const handler = () => setPanelConfig(getPanelConfig())
    window.addEventListener("panel-config-changed", handler)
    return () => window.removeEventListener("panel-config-changed", handler)
  }, [])

  const panelNombre = panelConfig.nombrePanel || "Arena13"

  const filteredSections = navSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      !item.feature || isFeatureEnabled(item.feature)
    ),
  })).filter(section => section.items.length > 0)

  const sectionsWithBadges = filteredSections.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      badge: item.name === "Notificaciones" ? unreadNotifications : item.badge,
    })),
  }))

  const sidebarContent = (
    <>
      {/* Logo / Header */}
      <div className={cn(
        "p-6",
        isMobile && "flex items-center justify-between"
      )}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          {panelConfig.logoUrl ? (
            <img src={panelConfig.logoUrl} alt={panelNombre} className="h-9 w-9 rounded-pill object-cover" />
          ) : (
            <span className="relative flex h-9 w-9 items-center justify-center rounded-pill bg-arena-gradient shadow-glow-purple">
              <span className="text-sm font-semibold text-white">{panelNombre.charAt(0).toUpperCase()}</span>
            </span>
          )}
          <div className="leading-none">
            <span className="block text-base font-medium tracking-tight">
              {panelNombre.includes("13") ? (
                <>Arena<span className="text-gradient">13</span></>
              ) : panelNombre}
            </span>
            <span className="block text-[0.65rem] font-light text-muted-foreground tracking-widest2 uppercase mt-0.5">Panel</span>
          </div>
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
        {sectionsWithBadges.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="px-4 mb-2 text-[0.65rem] font-medium text-muted-foreground/60 uppercase tracking-widest2">
              {section.title}
            </h3>

            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => isMobile && onCloseMobile?.()}
                    className={cn(
                      "group relative flex items-center gap-3 px-4 py-2.5 rounded-pill text-sm transition-all duration-300 overflow-hidden",
                      isActive
                        ? "text-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                    )}
                  >
                    {/* Fondo gradiente activo */}
                    {isActive && (
                      <span className="absolute inset-0 bg-arena-gradient opacity-90 shadow-glow-purple" />
                    )}
                    <Icon className={cn(
                      "relative h-4 w-4 shrink-0 transition-colors",
                      !isActive && "group-hover:text-primary"
                    )} />
                    <span className="relative flex-1 font-medium">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge
                        variant={isActive ? "secondary" : "primary"}
                        className="relative text-xs h-5 px-1.5"
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </Badge>
                    )}
                    {/* Barra indicadora lateral */}
                    {!isActive && (
                      <span className="absolute left-0 top-1/2 h-0 w-0.5 -translate-y-1/2 rounded-pill bg-arena-gradient opacity-0 transition-all duration-300 group-hover:h-1/2 group-hover:opacity-100" />
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
