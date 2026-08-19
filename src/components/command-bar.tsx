"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { isFeatureEnabled } from "@/lib/features"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { BrandLogo } from "@/components/brand-logo"
import {
  Home, Users, Briefcase, FolderKanban, LifeBuoy, FileText,
  Bell, Settings, Grid3x3, Layers, Calculator, Receipt,
  BarChart3, ScrollText, Search, CornerDownLeft, Inbox, Bot,
} from "lucide-react"

interface Command {
  id: string
  label: string
  section: string
  href: string
  icon: React.ElementType
}

const NAV_COMMANDS: Command[] = [
  { id: "nav-dashboard", label: "Dashboard", section: "Navegación", href: "/dashboard", icon: Home },
  { id: "nav-inbox", label: "Inbox de leads", section: "Navegación", href: "/inbox", icon: Inbox },
  { id: "nav-monitor-ia", label: "Monitor IA", section: "Navegación", href: "/monitor-ia", icon: Bot },
  { id: "nav-clientes", label: "Clientes", section: "Navegación", href: "/clientes", icon: Users },
  { id: "nav-pipeline", label: "Pipeline", section: "Navegación", href: "/pipeline", icon: Layers, },
  { id: "nav-servicios", label: "Servicios", section: "Navegación", href: "/servicios", icon: Briefcase },
  { id: "nav-proyectos", label: "Proyectos", section: "Navegación", href: "/proyectos", icon: FolderKanban },
  { id: "nav-presupuestos", label: "Presupuestos", section: "Navegación", href: "/presupuestos", icon: Calculator },
  { id: "nav-facturacion", label: "Facturación", section: "Navegación", href: "/facturacion", icon: Receipt },
  { id: "nav-tickets", label: "Tickets", section: "Navegación", href: "/tickets", icon: LifeBuoy },
  { id: "nav-documentos", label: "Documentos", section: "Navegación", href: "/documentos", icon: FileText },
  { id: "nav-notificaciones", label: "Notificaciones", section: "Navegación", href: "/notificaciones", icon: Bell },
  { id: "nav-reportes", label: "Reportes", section: "Navegación", href: "/reportes", icon: BarChart3 },
  { id: "nav-auditoria", label: "Auditoría", section: "Navegación", href: "/auditoria", icon: ScrollText },
  { id: "nav-features", label: "Funcionalidades", section: "Navegación", href: "/features", icon: Grid3x3 },
  { id: "nav-settings", label: "Configuración", section: "Navegación", href: "/settings", icon: Settings },
]

const FEATURE_MAP: Record<string, string> = {
  "nav-presupuestos": "calculadora_presupuestos",
  "nav-facturacion": "facturacion",
  "nav-tickets": "tickets_soporte",
  "nav-documentos": "documentos",
  "nav-notificaciones": "notificaciones",
  "nav-reportes": "reportes",
  "nav-auditoria": "auditoria",
}

export function CommandBar() {
  const router = useRouter()
  const supabase = useSupabase()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [dinamicos, setDinamicos] = useState<Command[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // Atajo global ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Cargar clientes y proyectos al abrir
  useEffect(() => {
    if (!open) return
    setQuery("")
    setSelectedIndex(0)
    const cargar = async () => {
      const [cliRes, proRes] = await Promise.all([
        supabase.from("clientes").select("id,nombre,empresa").order("nombre").limit(100),
        supabase.from("proyectos").select("id,nombre").order("created_at", { ascending: false }).limit(100),
      ])
      const cmds: Command[] = []
      if (cliRes.data) {
        for (const c of cliRes.data) {
          cmds.push({
            id: `cli-${c.id}`,
            label: c.empresa ? `${c.nombre} · ${c.empresa}` : c.nombre,
            section: "Clientes",
            href: `/clientes/detalle?id=${c.id}`,
            icon: Users,
          })
        }
      }
      if (proRes.data) {
        for (const p of proRes.data) {
          cmds.push({
            id: `pro-${p.id}`,
            label: p.nombre,
            section: "Proyectos",
            href: `/proyectos`,
            icon: FolderKanban,
          })
        }
      }
      setDinamicos(cmds)
    }
    cargar()
  }, [open, supabase])

  const navDisponibles = NAV_COMMANDS.filter((c) => {
    const feature = FEATURE_MAP[c.id]
    return !feature || isFeatureEnabled(feature)
  })

  const filtrar = useCallback((items: Command[], q: string) => {
    if (!q.trim()) return items
    const needle = q.toLowerCase()
    return items.filter(
      (c) => c.label.toLowerCase().includes(needle) || c.section.toLowerCase().includes(needle)
    )
  }, [])

  const resultados = useCallback(() => {
    if (!query.trim()) {
      // Sin búsqueda: navegación primero, luego algunos dinámicos
      return [...navDisponibles, ...dinamicos.slice(0, 6)]
    }
    return [...filtrar(navDisponibles, query), ...filtrar(dinamicos, query)]
  }, [query, navDisponibles, dinamicos, filtrar])

  const items = resultados()

  const ejecutar = (cmd: Command) => {
    setOpen(false)
    router.push(cmd.href)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && items[selectedIndex]) {
      e.preventDefault()
      ejecutar(items[selectedIndex])
    }
  }

  // Scroll del item seleccionado a la vista
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  useEffect(() => setSelectedIndex(0), [query])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-xl p-0 gap-0 overflow-hidden !max-h-[70vh]"
        onKeyDown={onKeyDown}
      >
        <DialogHeader className="p-0 space-y-0">
          <DialogTitle className="sr-only">Búsqueda rápida</DialogTitle>
        </DialogHeader>

        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar páginas, clientes, proyectos..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded-pill border border-white/10 bg-white/5 px-2 py-0.5 text-[0.65rem] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Resultados */}
        <div ref={listRef} className="overflow-y-auto max-h-[50vh] p-2">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Sin resultados para «{query}»
            </p>
          ) : (
            (() => {
              let lastSection = ""
              return items.map((cmd, i) => {
                const mostrarSeccion = cmd.section !== lastSection
                lastSection = cmd.section
                const Icon = cmd.icon
                return (
                  <div key={cmd.id}>
                    {mostrarSeccion && (
                      <p className="px-3 pt-3 pb-1 text-[0.6rem] font-medium text-muted-foreground/60 uppercase tracking-widest2">
                        {cmd.section}
                      </p>
                    )}
                    <button
                      data-index={i}
                      onClick={() => ejecutar(cmd)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-pill text-sm text-left transition-colors",
                        i === selectedIndex
                          ? "bg-primary/15 text-foreground"
                          : "text-muted-foreground hover:bg-white/[0.04]"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", i === selectedIndex && "text-primary")} />
                      <span className="flex-1 truncate">{cmd.label}</span>
                      {i === selectedIndex && (
                        <CornerDownLeft className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  </div>
                )
              })
            })()
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/5 text-[0.65rem] text-muted-foreground">
          <span className="flex items-center gap-2">
            <kbd className="rounded-pill border border-white/10 bg-white/5 px-1.5 py-0.5">↑↓</kbd> navegar
            <kbd className="rounded-pill border border-white/10 bg-white/5 px-1.5 py-0.5">↵</kbd> abrir
          </span>
          <BrandLogo imgClassName="h-5" fallbackSize="text-sm" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
