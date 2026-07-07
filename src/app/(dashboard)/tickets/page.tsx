"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  MessageSquare,
  Clock,
  AlertCircle,
  Send,
} from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

interface Ticket {
  id: string
  titulo: string
  descripcion: string
  estado: string
  prioridad: string
  categoria?: string
  created_at: string
  updated_at: string
}

export default function TicketsPage() {
  const supabase = useSupabase()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    categoria: "",
    prioridad: "normal",
  })

  useEffect(() => {
    fetchTickets()
  }, [supabase])

  const fetchTickets = async () => {
    try {
      const { data } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false })

      setTickets(data || [])
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data: { user } } = await supabase.auth.getUser()

      await supabase.from("tickets").insert([
        {
          ...formData,
          creado_por: user?.id,
        },
      ])

      setDialogOpen(false)
      setFormData({ titulo: "", descripcion: "", categoria: "", prioridad: "normal" })
      fetchTickets()
    } catch (error) {
      console.error("Error creating ticket:", error)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      abierto: { label: "Abierto", variant: "primary" },
      en_proceso: { label: "En Proceso", variant: "outline" },
      esperando_respuesta: { label: "Esperando Respuesta", variant: "outline" },
      resuelto: { label: "Resuelto", variant: "secondary" },
      cerrado: { label: "Cerrado", variant: "secondary" },
    }
    return badges[estado] || { label: estado, variant: "outline" }
  }

  const getPrioridadBadge = (prioridad: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      baja: { label: "Baja", className: "border-border text-muted-foreground" },
      normal: { label: "Normal", className: "border-primary/30 text-primary" },
      alta: { label: "Alta", className: "border-orange-500/30 text-orange-400" },
      urgente: { label: "Urgente", className: "border-red-500/30 text-red-400" },
    }
    return badges[prioridad] || badges.normal
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal tracking-tight mb-2">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las incidencias y consultas
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Ticket
        </Button>
      </div>

      {/* Dialog de nuevo ticket */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nuevo Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Breve descripción del problema"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Detalles de la incidencia..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tecnico">Técnico</SelectItem>
                        <SelectItem value="facturacion">Facturación</SelectItem>
                        <SelectItem value="consulta">Consulta</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prioridad</Label>
                    <Select
                      value={formData.prioridad}
                      onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <Send className="h-4 w-4 mr-2" />
                    Crear Ticket
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="text-xs text-muted-foreground">Cargando...</div>
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">No hay tickets</p>
        </Card>
      ) : (
        <div className="space-y-px border-t border-border">
          {tickets.map((ticket, index) => {
            const estadoBadge = getEstadoBadge(ticket.estado)
            const prioridadBadge = getPrioridadBadge(ticket.prioridad)

            return (
              <div
                key={ticket.id}
                className={`flex items-center justify-between py-4 ${
                  index < tickets.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm truncate">{ticket.titulo}</h3>
                    <Badge variant={estadoBadge.variant} className="text-xs">
                      {estadoBadge.label}
                    </Badge>
                    <Badge variant="outline" className={prioridadBadge.className + " text-xs"}>
                      {prioridadBadge.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {ticket.descripcion}
                  </p>
                </div>
                <div className="flex items-center gap-6 ml-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Creado</p>
                    <p className="text-xs">{formatRelativeTime(ticket.created_at)}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
