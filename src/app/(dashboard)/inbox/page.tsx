"use client"

import { useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/utils"
import type { Lead, LeadEstado } from "@/types"
import {
  Inbox, Sparkles, Archive, Ban, FolderPlus, RefreshCw, Mail, Phone, Building2,
} from "lucide-react"

const ORIGEN_LABEL: Record<string, string> = {
  retell: "Retell AI",
  whatsapp: "WhatsApp",
  formulario: "Formulario",
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

export default function InboxPage() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<Lead[]>([])
  const [filtro, setFiltro] = useState<LeadEstado | "todos">("nuevo")
  const [ocupadoId, setOcupadoId] = useState<string | null>(null)

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
            Triaje de leads en tiempo real (webhooks, Retell AI, WhatsApp, formularios)
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
                ? "Bandaja vacía: no hay leads pendientes de triaje."
                : "No hay leads en este estado."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((lead) => (
            <Card key={lead.id} className="flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant="outline" className="text-[0.65rem]">
                    {ORIGEN_LABEL[lead.origen] || lead.origen}
                  </Badge>
                  <span className={cn("text-[0.65rem] px-2 py-0.5 rounded-pill border", NIVEL_STYLE[lead.nivel_interes])}>
                    Interés {lead.nivel_interes}
                  </span>
                </div>

                <p className="font-medium mb-1 truncate">{lead.nombre || "Lead sin nombre"}</p>

                <div className="space-y-1 mb-3 text-xs text-muted-foreground">
                  {lead.empresa && (
                    <p className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> {lead.empresa}</p>
                  )}
                  {lead.email && (
                    <p className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3" /> {lead.email}</p>
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

                <p className="text-[0.65rem] text-muted-foreground/60 mb-4">
                  {formatRelativeTime(lead.created_at)}
                </p>

                <div className="mt-auto flex flex-wrap gap-2">
                  {lead.estado === "nuevo" && (
                    <>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={ocupadoId === lead.id}
                        onClick={() => convertirEnProyecto(lead)}
                      >
                        <FolderPlus className="h-3.5 w-3.5" /> Convertir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ocupadoId === lead.id}
                        onClick={() => cambiarEstado(lead, "archivado")}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={ocupadoId === lead.id}
                        onClick={() => cambiarEstado(lead, "spam")}
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  {lead.estado !== "nuevo" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ocupadoId === lead.id}
                      onClick={() => cambiarEstado(lead, "nuevo")}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reactivar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
