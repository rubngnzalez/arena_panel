"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Megaphone, X, Info, AlertTriangle, Tag, Zap, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Banner, BannerTipo, MetodoContacto } from "@/types"

const TIPO_CONFIG: Record<BannerTipo, { icon: typeof Info; bg: string; border: string; iconColor: string }> = {
  info: { icon: Info, bg: "bg-cyan-500/10", border: "border-cyan-500/20", iconColor: "text-cyan-400" },
  promocion: { icon: Tag, bg: "bg-purple-500/10", border: "border-purple-500/20", iconColor: "text-purple-400" },
  aviso: { icon: AlertTriangle, bg: "bg-amber-500/10", border: "border-amber-500/20", iconColor: "text-amber-400" },
  urgente: { icon: Zap, bg: "bg-red-500/10", border: "border-red-500/20", iconColor: "text-red-400" },
}

export function BannerNotificaciones() {
  const supabase = useSupabase()
  const [banners, setBanners] = useState<Banner[]>([])
  const [contactos, setContactos] = useState<MetodoContacto[]>([])
  const [showContactoMenu, setShowContactoMenu] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    const loadData = async () => {
      const now = new Date().toISOString()
      const { data: bannersData } = await supabase
        .from("banners")
        .select("*")
        .eq("activo", true)
        .or(`fecha_inicio.is.null,fecha_inicio.lte.${now}`)
        .or(`fecha_fin.is.null,fecha_fin.gte.${now}`)
        .order("orden", { ascending: true })
      setBanners((bannersData as Banner[]) || [])

      const { data: contactosData } = await supabase
        .from("metodos_contacto")
        .select("*")
        .eq("activo", true)
        .order("orden", { ascending: true })
      setContactos((contactosData as MetodoContacto[]) || [])
    }
    loadData()
    const stored = localStorage.getItem("banners-dismissed")
    if (stored) {
      try { setDismissed(JSON.parse(stored)) } catch {}
    }
  }, [supabase])

  const dismiss = (id: string) => {
    const newDismissed = [...dismissed, id]
    setDismissed(newDismissed)
    localStorage.setItem("banners-dismissed", JSON.stringify(newDismissed))
  }

  const getContactoUrl = (c: MetodoContacto) => {
    switch (c.tipo) {
      case "whatsapp": return c.valor.startsWith("http") ? c.valor : `https://wa.me/${c.valor.replace(/[^0-9]/g, "")}`
      case "email": return `mailto:${c.valor}`
      case "telefono": return `tel:${c.valor.replace(/\s/g, "")}`
      case "web": return c.valor.startsWith("http") ? c.valor : `https://${c.valor}`
      default: return c.valor.startsWith("http") ? c.valor : `https://${c.valor}`
    }
  }

  const visibleBanners = banners.filter((b) => !dismissed.includes(b.id))
  if (visibleBanners.length === 0) return null

  return (
    <div className="space-y-3">
      {visibleBanners.map((banner) => {
        const config = TIPO_CONFIG[banner.tipo] || TIPO_CONFIG.info
        const Icon = config.icon
        return (
          <div
            key={banner.id}
            className={cn(
              "relative rounded-2xl border p-4 flex items-start gap-3 animate-in",
              config.bg, config.border
            )}
          >
            <div className={cn("shrink-0 mt-0.5", config.iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-medium">{banner.titulo}</p>
                {banner.tipo === "urgente" && (
                  <span className="text-[0.65rem] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium uppercase tracking-wider">Urgente</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{banner.mensaje}</p>
              {(banner.mostrar_boton || contactos.length > 0) && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {banner.mostrar_boton && banner.boton_texto && banner.boton_url && (
                    banner.boton_url.startsWith("/") ? (
                      <Link href={banner.boton_url}>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          {banner.boton_texto}
                        </Button>
                      </Link>
                    ) : (
                      <a href={banner.boton_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          {banner.boton_texto} <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </a>
                    )
                  )}
                  {contactos.length > 0 && (
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setShowContactoMenu(showContactoMenu === banner.id ? null : banner.id)}
                      >
                        <Megaphone className="h-3 w-3 mr-1" /> Contactar
                      </Button>
                      {showContactoMenu === banner.id && (
                        <div className="absolute top-full left-0 mt-1 z-20 glass-strong rounded-xl border border-white/10 p-1 min-w-[180px] shadow-xl">
                          {contactos.map((c) => (
                            <a
                              key={c.id}
                              href={getContactoUrl(c)}
                              target={c.tipo === "whatsapp" || c.tipo === "web" || c.tipo === "telegram" || c.tipo === "instagram" || c.tipo === "linkedin" ? "_blank" : undefined}
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm"
                            >
                              <span className="capitalize text-xs text-muted-foreground">{c.tipo}</span>
                              <span className="truncate">{c.etiqueta}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            {banner.descartable && (
              <button
                onClick={() => dismiss(banner.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
