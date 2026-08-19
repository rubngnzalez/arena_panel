"use client"

import { useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { cn, formatRelativeTime, formatDate } from "@/lib/utils"
import { AudioPlayer } from "@/components/ia/audio-player"
import { TranscripcionChat } from "@/components/ia/transcripcion-chat"
import type { Lead, LeadEstado } from "@/types"
import {
  Inbox, Sparkles, Archive, Ban, FolderPlus, RefreshCw, Mail, Phone, Building2,
  Clock, ChevronRight, Bot, MessageSquare, Globe, PhoneCall,
} from "lucide-react"

const ORIGEN_LABEL: Record<string, string> = {
  retell: "Llamada de Voz",
  whatsapp: "WhatsApp",
  formulario: "Formulario web",
  webhook: "Webhook",
  manual: "Manual",
}

const NIVEL_STYLE: Record<string, string> = {
  bajo: "border-white/15 bg-white/5 text-muted-foreground",
  medio: "border-sky-400/30 bg-sky-400/10 text-sky-400",
  alto: "border-green-400/30 bg-green-400/10 text-green-400",
}

const FILTROS: { key: LeadEstado | "todos"; label: string }[] = [
  { key: "nuevo", label: "Nuevos" },
  { key: "convertido", label: "Convertidos" },
  { key: "archivado", label: "Archivados" },
  { key: "spam", label: "Spam" },
  { key: "todos", label: "Todos" },
]

function canalIcon(origen: string) {
  if (origen === "whatsapp") return <MessageSquare className="h-3.5 w-3.5 text-primary" />
  if (origen === "formulario" || origen === "webhook") return <Globe className="h-3.5 w-3.5 text-sky-400" />
  return <PhoneCall className="h-3.5 w-3.5 text-accent" />
}

function duracionTexto(seg?: number): string {
  if (!seg) return ""
  const m = Math.floor(seg / 60)
  const s = seg % 60
  return `${m}m ${String(s).padStart(2, "0")}s`
}

export default function InboxPage() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<Lead[]>([])
  const [filtro, setFiltro] = useState<LeadEstado | "todos">("nuevo")
  const [ocupadoId, setOcupadoId] = useState<string | null>(null)
  const [detalle, setDetalle] = useState<Lead | null>(null)

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
    if (data) setLeads(data as Lead[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    cargar()

    const canal = supabase
      .channel("inbox-leads")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "arena_panel", table: "leads" },
        (payload) => {
          setLeads((prev) => [payload.new as Lead, ...prev])
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "arena_panel", table: "leads" },
        (payload) => {
          const actualizado = payload.new as Lead
          setLeads((prev) => prev.map((l) => (l.id === actualizado.id ? actualizado : l)))
          setDetalle((d) => (d && d.id === actualizado.id ? actualizado : d))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [supabase, cargar])

  const cambiarEstado = async (lead: Lead, estado: LeadEstado) => {
    setOcupadoId(lead.id)
    try {
      const { error } = await supabase.from("leads").update({ estado }).eq("id", lead.id)
      if (error) throw error
      setLeads(leads.map((l) => (l.id === lead.id ? { ...l, estado } : l)))
      setDetalle((d) => (d && d.id === lead.id ? { ...d, estado } : d))
    } catch (err) {
      console.error(err)
    } finally {
      setOcupadoId(null)
    }
  }

  const convertirEnProyecto = async (lead: Lead) => {
    setOcupadoId(lead.id)
    try {
      let clienteId: string | null = null

      if (lead.email) {
        const { data: existente } = await supabase
          .from("clientes")
          .select("id")
          .eq("email", lead.email)
          .maybeSingle()
        clienteId = existente?.id ?? null
      }

      if (!clienteId) {
        const { data: nuevo, error: errCliente } = await supabase
          .from("clientes")
          .insert({
            nombre: lead.nombre || "Lead sin nombre",
            email: lead.email || null,
            telefono: lead.telefono || null,
            empresa: lead.empresa || null,
            estado: "activo",
          })
          .select("id")
          .single()
        if (errCliente) throw errCliente
        clienteId = nuevo.id
      }

      const { data: proyecto, error: errProyecto } = await supabase
        .from("proyectos")
        .insert({
          cliente_id: clienteId,
          nombre: lead.empresa ? `${lead.nombre || "Proyecto"} · ${lead.empresa}` : (lead.nombre || "Nuevo proyecto"),
          descripcion: lead.resumen_ia || lead.mensaje || "Convertido desde inbox de leads.",
          estado: "planeacion",
          prioridad: lead.nivel_interes === "alto" ? "alta" : "media",
          progreso: 0,
        })
        .select("id")
        .single()
      if (errProyecto) throw errProyecto

      const { error: errLead } = await supabase
        .from("leads")
        .update({
          estado: "convertido",
          metadata: { ...(lead.metadata || {}), proyecto_id: proyecto.id },
        })
        .eq("id", lead.id)
      if (errLead) throw errLead

      setLeads(leads.map((l) =>
        l.id === lead.id
          ? { ...l, estado: "convertido", metadata: { ...(l.metadata || {}), proyecto_id: proyecto.id } }
          : l
      ))
      setDetalle(null)
    } catch (err) {
      console.error(err)
    } finally {
      setOcupadoId(null)
    }
  }

  const filtrados = filtro === "todos" ? leads : leads.filter((l) => l.estado === filtro)
  const nuevos = leads.filter((l) => l.estado === "nuevo").length

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Inbox className="h-6 w-6 text-primary" /> Inbox
            {nuevos > 0 && (
              <Badge variant="primary">{nuevos} nuevos</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Llamadas y contactos capturados por tus asistentes, en tiempo real
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={cargar}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Actualizar
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTROS.map((f) => (
          <Button
            key={f.key}
            variant={filtro === f.key ? "default" : "outline"}
            size="sm"
            className="shrink-0"
            onClick={() => setFiltro(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Inbox className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-sm text-muted-foreground">
              {filtro === "nuevo"
                ? "Bandeja vacía: no hay llamadas pendientes de revisar."
                : "No hay registros en este estado."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((lead) => (
            <Card
              key={lead.id}
              className="flex flex-col cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setDetalle(lead)}
            >
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant="outline" className="text-[0.65rem]">
                    {ORIGEN_LABEL[lead.origen] || lead.origen}
                  </Badge>
                  <span className={cn("text-[0.65rem] px-2 py-0.5 rounded-pill border", NIVEL_STYLE[lead.nivel_interes])}>
                    Interés {lead.nivel_interes}
                  </span>
                </div>

                <p className="font-medium mb-1 truncate">{lead.nombre || "Contacto no registrado"}</p>

                <div className="space-y-1 mb-3 text-xs text-muted-foreground">
                  {lead.empresa && (
                    <p className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> {lead.empresa}</p>
                  )}
                  {lead.telefono && (
                    <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {lead.telefono}</p>
                  )}
                </div>

                {(lead.resumen_ia || lead.mensaje) && (
                  <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 mb-4 flex-1">
                    {lead.resumen_ia && (
                      <p className="flex items-start gap-1.5 text-xs text-primary mb-1">
                        <Sparkles className="h-3 w-3 mt-0.5 shrink-0" /> {lead.resumen_ia}
                      </p>
                    )}
                    {lead.mensaje && !lead.resumen_ia && (
                      <p className="text-xs text-muted-foreground line-clamp-3">{lead.mensaje}</p>
                    )}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[0.65rem] text-muted-foreground/70">
                    <span>{formatRelativeTime(lead.created_at)}</span>
                    {lead.metadata?.duracion_seg ? (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {duracionTexto(lead.metadata.duracion_seg)}</span>
                    ) : null}
                    {lead.metadata?.transcripcion && lead.metadata.transcripcion.length > 0 && (
                      <span className="flex items-center gap-1"><Bot className="h-3 w-3" /> transcripción</span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ====== FICHA COMPLETA DE LA LLAMADA ====== */}
      <Dialog open={!!detalle} onOpenChange={(open) => !open && setDetalle(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detalle && (() => {
            const vars = detalle.metadata?.variables_extraidas
            const transcripcion = detalle.metadata?.transcripcion || []
            const nombre = detalle.nombre || vars?.nombre || "Contacto no registrado"
            const telefono = detalle.telefono || vars?.telefono || ""
            const empresa = detalle.empresa || vars?.empresa || ""
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 flex-wrap">
                    {canalIcon(detalle.origen)}
                    <DialogTitle className="text-lg">
                      {ORIGEN_LABEL[detalle.origen] || "Contacto"}
                    </DialogTitle>
                    <span className={cn("text-[0.65rem] px-2 py-0.5 rounded-pill border", NIVEL_STYLE[detalle.nivel_interes])}>
                      Interés {detalle.nivel_interes}
                    </span>
                    {detalle.estado === "nuevo" && <Badge variant="primary">Nuevo</Badge>}
                  </div>
                  <DialogDescription>
                    {formatDate(detalle.created_at, "long")}
                    {detalle.metadata?.duracion_seg ? ` · ${duracionTexto(detalle.metadata.duracion_seg)}` : ""}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                  {/* Datos del contacto */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Contacto</p>
                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                      <p><span className="text-muted-foreground">Nombre:</span> {nombre}</p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {telefono || <span className="text-muted-foreground/50">No disponible</span>}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {detalle.email || <span className="text-muted-foreground/50">Sin email</span>}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {empresa || <span className="text-muted-foreground/50">Sin empresa</span>}
                      </p>
                      {vars?.servicio && (
                        <p className="col-span-2"><span className="text-muted-foreground">Servicio:</span> {vars.servicio}</p>
                      )}
                      {vars?.motivo && !vars?.servicio && (
                        <p className="col-span-2"><span className="text-muted-foreground">Motivo:</span> {vars.motivo}</p>
                      )}
                    </div>
                  </div>

                  {/* Audio de la llamada */}
                  {detalle.metadata?.audio_url && (
                    <AudioPlayer src={detalle.metadata.audio_url} duracionSeg={detalle.metadata.duracion_seg} />
                  )}

                  {/* Resumen IA */}
                  {detalle.resumen_ia && (
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-primary uppercase tracking-wider mb-2">
                        <Sparkles className="h-3.5 w-3.5" /> Resumen
                      </p>
                      <p className="text-sm leading-relaxed">{detalle.resumen_ia}</p>
                    </div>
                  )}

                  {/* Mensaje original (formularios) */}
                  {detalle.mensaje && detalle.resumen_ia && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Mensaje</p>
                      <p className="text-sm whitespace-pre-wrap">{detalle.mensaje}</p>
                    </div>
                  )}

                  {/* Transcripción */}
                  {transcripcion.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                        Transcripción
                      </p>
                      <TranscripcionChat turnos={transcripcion} />
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="pt-2 border-t border-white/5 flex flex-wrap gap-2">
                    {detalle.estado === "nuevo" && (
                      <>
                        <Button
                          className="flex-1"
                          disabled={ocupadoId === detalle.id}
                          onClick={() => convertirEnProyecto(detalle)}
                        >
                          <FolderPlus className="h-4 w-4 mr-1.5" /> Convertir en Proyecto
                        </Button>
                        <Button variant="outline" disabled={ocupadoId === detalle.id} onClick={() => cambiarEstado(detalle, "archivado")}>
                          <Archive className="h-4 w-4 mr-1.5" /> Archivar
                        </Button>
                        <Button variant="ghost" className="text-destructive" disabled={ocupadoId === detalle.id} onClick={() => cambiarEstado(detalle, "spam")}>
                          <Ban className="h-4 w-4 mr-1.5" /> Spam
                        </Button>
                      </>
                    )}
                    {detalle.estado !== "nuevo" && (
                      <Button variant="outline" disabled={ocupadoId === detalle.id} onClick={() => cambiarEstado(detalle, "nuevo")}>
                        <RefreshCw className="h-4 w-4 mr-1.5" /> Reactivar
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
