"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  LifeBuoy, Plus, Send, ArrowLeft, MessageSquare, Clock, Search,
  CheckCircle2, User, Filter, Trash2, Paperclip, Lock,
} from "lucide-react"
import { formatDate, formatRelativeTime, cn } from "@/lib/utils"
import type { Ticket, TicketEstado, TicketPrioridad, TicketCategoria, TicketMensaje, Cliente } from "@/types"

const ESTADOS: Record<TicketEstado, { label: string; color: string }> = {
  abierto: { label: "Abierto", color: "bg-cyan-500/20 text-cyan-400" },
  en_proceso: { label: "En proceso", color: "bg-amber-500/20 text-amber-400" },
  esperando_respuesta: { label: "Esperando respuesta", color: "bg-purple-500/20 text-purple-400" },
  resuelto: { label: "Resuelto", color: "bg-green-500/20 text-green-400" },
  cerrado: { label: "Cerrado", color: "bg-slate-500/20 text-slate-400" },
}

const PRIORIDADES: Record<TicketPrioridad, { label: string; color: string }> = {
  baja: { label: "Baja", color: "bg-slate-500/20 text-slate-400" },
  normal: { label: "Normal", color: "bg-blue-500/20 text-blue-400" },
  alta: { label: "Alta", color: "bg-orange-500/20 text-orange-400" },
  urgente: { label: "Urgente", color: "bg-red-500/20 text-red-400" },
}

const CATEGORIAS: Record<TicketCategoria, string> = {
  tecnico: "Técnico",
  facturacion: "Facturación",
  consulta: "Consulta",
  otro: "Otro",
}

export default function TicketsPage() {
  const supabase = useSupabase()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [mensajes, setMensajes] = useState<TicketMensaje[]>([])
  const [loadingMensajes, setLoadingMensajes] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [replyInterno, setReplyInterno] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroBusqueda, setFiltroBusqueda] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const mensajesEndRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    titulo: "", descripcion: "", categoria: "tecnico" as TicketCategoria,
    prioridad: "normal" as TicketPrioridad, cliente_id: "",
  })

  const fetchTickets = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("tickets")
        .select(`
          *,
          clientes ( id, nombre, empresa )
        `)
        .order("updated_at", { ascending: false })
      setTickets((data as Ticket[]) || [])
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchTickets()
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || ""))
    supabase.from("clientes").select("id, nombre, empresa").order("nombre").then(({ data }) => setClientes(data || []))
  }, [fetchTickets, supabase])

  const fetchMensajes = useCallback(async (ticketId: string) => {
    setLoadingMensajes(true)
    try {
      const { data } = await supabase
        .from("ticket_mensajes")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true })
      setMensajes(data || [])
    } catch (error) {
      console.error("Error fetching mensajes:", error)
    } finally {
      setLoadingMensajes(false)
    }
  }, [supabase])

  useEffect(() => {
    if (selectedTicket) {
      fetchMensajes(selectedTicket.id)
      setTimeout(() => mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }
  }, [selectedTicket, fetchMensajes])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from("tickets").insert({
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        prioridad: formData.prioridad,
        cliente_id: formData.cliente_id || null,
        creado_por: user?.id,
        estado: "abierto",
      }).select().single()
      if (data) {
        setTickets([data, ...tickets])
        setDialogOpen(false)
        setFormData({ titulo: "", descripcion: "", categoria: "tecnico", prioridad: "normal", cliente_id: "" })
      }
    } catch (error) {
      console.error("Error creating ticket:", error)
      alert("No se pudo crear el ticket.")
    }
  }

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return
    setSendingReply(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from("ticket_mensajes").insert({
        ticket_id: selectedTicket.id,
        remitente_id: user?.id,
        mensaje: replyText.trim(),
        es_interno: replyInterno,
      }).select().single()
      if (data) {
        setMensajes([...mensajes, data])
        setReplyText("")
        setReplyInterno(false)
        if (selectedTicket.estado === "esperando_respuesta") {
          await cambiarEstado(selectedTicket.id, "en_proceso")
        }
        setTimeout(() => mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
      }
    } catch (error) {
      console.error("Error replying:", error)
      alert("No se pudo enviar la respuesta.")
    } finally {
      setSendingReply(false)
    }
  }

  const cambiarEstado = async (ticketId: string, estado: TicketEstado) => {
    try {
      await supabase.from("tickets").update({ estado }).eq("id", ticketId)
      const updated = tickets.map((t) => t.id === ticketId ? { ...t, estado } : t)
      setTickets(updated)
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, estado })
      }
    } catch (error) {
      console.error("Error cambiando estado:", error)
    }
  }

  const handleDelete = async (ticketId: string) => {
    if (!confirm("¿Eliminar este ticket y todos sus mensajes?")) return
    try {
      await supabase.from("tickets").delete().eq("id", ticketId)
      setTickets(tickets.filter((t) => t.id !== ticketId))
      setSelectedTicket(null)
    } catch (error) {
      console.error("Error deleting ticket:", error)
    }
  }

  const ticketsFiltrados = tickets.filter((t) => {
    if (filtroEstado !== "todos" && t.estado !== filtroEstado) return false
    if (filtroBusqueda) {
      const q = filtroBusqueda.toLowerCase()
      return t.titulo.toLowerCase().includes(q) || t.descripcion.toLowerCase().includes(q)
    }
    return true
  })

  const stats = {
    abiertos: tickets.filter((t) => t.estado === "abierto" || t.estado === "en_proceso").length,
    esperando: tickets.filter((t) => t.estado === "esperando_respuesta").length,
    resueltos: tickets.filter((t) => t.estado === "resuelto").length,
    urgentes: tickets.filter((t) => t.prioridad === "urgente" && t.estado !== "cerrado" && t.estado !== "resuelto").length,
  }

  // === VISTA DETALLE (conversacion) ===
  if (selectedTicket) {
    const est = ESTADOS[selectedTicket.estado]
    const pri = PRIORIDADES[selectedTicket.prioridad]
    return (
      <div className="space-y-6 animate-in">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a tickets
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(selectedTicket.id)}>
            <Trash2 className="h-4 w-4 mr-2" /> Eliminar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <CardTitle className="text-lg">{selectedTicket.titulo}</CardTitle>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", est.color)}>{est.label}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", pri.color)}>{pri.label}</span>
                  {selectedTicket.categoria && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
                      {CATEGORIAS[selectedTicket.categoria]}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{selectedTicket.descripcion}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {selectedTicket.cliente && (
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {selectedTicket.cliente.nombre}</span>
                  )}
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(selectedTicket.created_at)}</span>
                </div>
              </div>
              <div className="shrink-0">
                <Select value={selectedTicket.estado} onValueChange={(v: any) => cambiarEstado(selectedTicket.id, v)}>
                  <SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ESTADOS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Conversacion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Conversación ({mensajes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMensajes ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
              </div>
            ) : mensajes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Sin mensajes aún. Escribe el primero abajo.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {mensajes.map((m) => {
                  const isOwn = m.remitente_id === currentUserId
                  return (
                    <div key={m.id} className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
                      <div className={cn(
                        "shrink-0 h-8 w-8 rounded-pill flex items-center justify-center text-xs font-medium",
                        m.es_interno ? "bg-amber-500/20 text-amber-400" : isOwn ? "bg-arena-gradient text-white" : "bg-white/10 text-muted-foreground"
                      )}>
                        {m.es_interno ? <Lock className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                      </div>
                      <div className={cn("max-w-[75%]", isOwn && "text-right")}>
                        <div className={cn(
                          "rounded-2xl px-4 py-2.5 inline-block text-sm",
                          m.es_interno ? "bg-amber-500/10 border border-amber-500/20 text-amber-100" :
                          isOwn ? "bg-arena-gradient text-white" : "bg-white/5 border border-white/5"
                        )}>
                          {m.mensaje}
                        </div>
                        <p className="text-[0.65rem] text-muted-foreground mt-1 px-1">
                          {m.es_interno && "Nota interna · "}{formatRelativeTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={mensajesEndRef} />
              </div>
            )}

            {/* Respuesta */}
            <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
              <Textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe tu respuesta..."
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleReply() } }}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={replyInterno} onChange={(e) => setReplyInterno(e.target.checked)} className="accent-primary" />
                  Nota interna (solo equipo)
                </label>
                <Button size="sm" onClick={handleReply} disabled={!replyText.trim() || sendingReply}>
                  <Send className="h-3.5 w-3.5 mr-1.5" /> {sendingReply ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // === VISTA LISTA ===
  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal tracking-tight mb-1 flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-primary" /> Tickets
          </h1>
          <p className="text-sm text-muted-foreground">Gestión de incidencias y consultas</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Abiertos", value: stats.abiertos, color: "text-cyan-400" },
          { label: "Esperando", value: stats.esperando, color: "text-purple-400" },
          { label: "Resueltos", value: stats.resueltos, color: "text-green-400" },
          { label: "Urgentes", value: stats.urgentes, color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            placeholder="Buscar tickets..."
            className="pl-10"
          />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-full sm:w-[180px]"><Filter className="h-3.5 w-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {Object.entries(ESTADOS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
        </div>
      ) : ticketsFiltrados.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center text-center text-muted-foreground">
            <LifeBuoy className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-sm">{filtroBusqueda || filtroEstado !== "todos" ? "No hay tickets que coincidan." : "No hay tickets todavía."}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Crear primer ticket
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {ticketsFiltrados.map((ticket) => {
            const est = ESTADOS[ticket.estado]
            const pri = PRIORIDADES[ticket.prioridad]
            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="glass rounded-2xl p-4 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">{ticket.titulo}</h3>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", est.color)}>{est.label}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", pri.color)}>{pri.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{ticket.descripcion}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      {ticket.cliente && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {ticket.cliente.nombre}</span>}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatRelativeTime(ticket.updated_at)}</span>
                    </div>
                  </div>
                  <MessageSquare className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog nuevo ticket */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><LifeBuoy className="h-5 w-5" /> Nuevo Ticket</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} placeholder="Breve descripción del problema" required />
            </div>
            <div className="space-y-2">
              <Label>Descripción *</Label>
              <Textarea rows={4} value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Detalles de la incidencia..." required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={formData.categoria} onValueChange={(v: any) => setFormData({ ...formData, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIAS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={formData.prioridad} onValueChange={(v: any) => setFormData({ ...formData, prioridad: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORIDADES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cliente asociado (opcional)</Label>
              <Select value={formData.cliente_id} onValueChange={(v) => setFormData({ ...formData, cliente_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sin cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin cliente</SelectItem>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` (${c.empresa})` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit"><Send className="h-4 w-4 mr-2" /> Crear Ticket</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
