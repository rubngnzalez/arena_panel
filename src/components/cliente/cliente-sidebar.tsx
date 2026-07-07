"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { isFeatureEnabled } from "@/lib/features"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  FolderKanban,
  FileText,
  MessageSquare,
  Bell,
  User,
  LogOut,
  X,
  ChevronRight,
} from "lucide-react"

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: number
  feature?: string
}

interface ClienteSidebarProps {
  unreadNotifications?: number
  onCloseMobile?: () => void
  onLogout?: () => void
  isMobile?: boolean
}

const navItems: NavItem[] = [
  { name: "Inicio", href: "/cliente/portal", icon: Home },
  { name: "Mis Proyectos", href: "/cliente/proyectos", icon: FolderKanban },
  { name: "Documentos", href: "/cliente/documentos", icon: FileText, feature: "documentos" },
  { name: "Soporte", href: "/cliente/tickets", icon: MessageSquare, feature: "tickets_soporte" },
  { name: "Notificaciones", href: "/cliente/notificaciones", icon: Bell, feature: "notificaciones" },
]

const bottomItems: NavItem[] = [
  { name: "Mi Perfil", href: "/cliente/perfil", icon: User },
]

export function ClienteSidebar({
  unreadNotifications = 0,
  onCloseMobile,
  onLogout,
  isMobile = false,
}: ClienteSidebarProps) {
  const pathname = usePathname()

  // Filtrar items por features
  const filteredItems = navItems.filter(
    item => !item.feature || isFeatureEnabled(item.feature)
  )

  // Actualizar badge de notificaciones
  const itemsWithBadges = filteredItems.map(item => ({
    ...item,
    badge: item.name === "Notificaciones" ? unreadNotifications : item.badge,
  }))

  const sidebarContent = (
    <>
      {/* Logo/Header */}
      <div className={cn(
        "p-6",
        isMobile && "flex items-center justify-between"
      )}>
        <Link href="/cliente/portal" className="text-sm font-normal tracking-tight">
          Arena13 <span className="text-muted-foreground">Cliente</span>
        </Link>
        {isMobile && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-2 -mr-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 overflow-y-auto">
        <div className="space-y-0.5">
          {itemsWithBadges.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => isMobile && onCloseMobile?.()}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  "hover:bg-primary/5",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 shrink-0",
                  isActive && "text-primary"
                )} />
                <span className="flex-1">{item.name}</span>
                {item.badge && item.badge > 0 && (
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className="text-xs h-5 px-1.5"
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </Badge>
                )}
                {isActive && (
                  <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-border" />

        {/* Bottom items */}
        <div className="space-y-0.5">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => isMobile && onCloseMobile?.()}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  "hover:bg-primary/5",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
                {isActive && (
                  <ChevronRight className="h-4 w-4 shrink-0 text-primary ml-auto" />
                )}
              </Link>
            )
          })}

          {/* Logout button */}
          <button
            onClick={() => onLogout?.()}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
              "hover:bg-destructive/10 text-muted-foreground hover:text-destructive mt-2"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </nav>

      {/* Help text */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          ¿Necesitas ayuda?{" "}
          <a href="/cliente/tickets" className="text-primary hover:underline">
            Contacta soporte
          </a>
        </p>
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
    <aside className="hidden lg:flex flex-col w-56 min-h-screen border-r border-border fixed left-0 top-0 bg-card">
      {sidebarContent}
    </aside>
  )
}
