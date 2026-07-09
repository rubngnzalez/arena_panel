"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Users,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Building,
  Calendar,
  AlertCircle,
  ArrowRight,
} from "lucide-react"
import { formatDate, formatRelativeTime, getInitials } from "@/lib/utils"
import type { Cliente } from "@/types"

const ESTADO_BADGES: Record<Cliente["estado"], { label: string; variant: any }> = {
  activo: { label: "Activo", variant: "success" },
  inactivo: { label: "Inactivo", variant: "secondary" },
  potencial: { label: "Potencial", variant: "outline" },
}

export default function ClientesPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState<string>("todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formError, setFormError] = useState("")

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    empresa: "",
    estado: "potencial" as Cliente["estado"],
    fecha_captacion: "",
    notas: "",
  })

  useEffect(() => {
    fetchClientes()
  }, [supabase])

  useEffect(() => {
    let filtered = clientes
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter(c =>
        c.nombre?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.empresa?.toLowerCase().includes(q) ||
        c.telefono?.toLowerCase().includes(q)
      )
    }
    if (estadoFilter !== "todos") {
      filtered = filtered.filter(c => c.estado === estadoFilter)
    }
    setFilteredClientes(filtered)
  }, [clientes, searchTerm, estadoFilter])

  const fetchClientes = async () => {
    try {
      setError("")
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      setClientes((data || []) as Cliente[])
    } catch (err) {
      console.error("Error fetching clientes:", err)
      setError("No se pudieron cargar los clientes.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setFormError("")
      const payload = {
        nombre: formData.nombre.trim(),
        email: formData.email.trim() || null,
        telefono: formData.telefono.trim() || null,
        empresa: formData.empresa.trim() || null,
        estado: formData.estado,
        fecha_captacion: formData.fecha_captacion || null,
        notas: formData.notas.trim() || null,
      }
      const { error } = await supabase.from("clientes").insert([payload])
      if (error) throw error

      setDialogOpen(false)
      resetForm()
      fetchClientes()
    } catch (error: any) {
      console.error("Error saving cliente:", error)
      const msg = error?.message || ""
      if (msg.includes("duplicate") || msg.includes("unique")) {
        setFormError("Ya existe un cliente con ese email.")
      } else if (msg.includes("policy") || msg.includes("security")) {
        setFormError("No tienes permisos para esta acción.")
      } else {
        setFormError(msg || "No se pudo guardar el cliente.")
      }
    }
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id)
      if (error) throw error
      fetchClientes()
    } catch (error) {
      console.error("Error deleting cliente:", error)
    }
  }

  const resetForm = () => {
    setFormError("")
    setFormData({
      nombre: "", email: "", telefono: "", empresa: "",
      estado: "potencial", fecha_captacion: "", notas: "",
    })
  }

  const abrirFicha = (id: string) => {
    router.push(`/clientes/detalle?id=${id}`)
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gestiona tu cartera de clientes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo Cliente</DialogTitle>
              <DialogDescription>Añade un nuevo cliente a tu cartera</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="flex items-start gap-2.5 rounded-pill border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input id="nombre" value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required autoFocus />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" type="tel" value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input id="empresa" value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={formData.estado}
                    onValueChange={(value: any) => setFormData({ ...formData, estado: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="potencial">Potencial</SelectItem>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_captacion">Fecha de captación</Label>
                  <Input id="fecha_captacion" type="date" value={formData.fecha_captacion}
                    onChange={(e) => setFormData({ ...formData, fecha_captacion: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notas">Notas</Label>
                  <Input id="notas" value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    placeholder="Notas internas sobre el cliente..." />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Crear Cliente</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, email, empresa o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10" />
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="potencial">Potenciales</SelectItem>
                <SelectItem value="inactivo">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de clientes */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-muted-foreground mb-4 text-center max-w-md">{error}</p>
            <Button variant="outline" onClick={() => { setLoading(true); fetchClientes() }}>Reintentar</Button>
          </CardContent>
        </Card>
      ) : filteredClientes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || estadoFilter !== "todos"
                ? "No se encontraron clientes con los filtros aplicados"
                : "No hay clientes aún. ¡Añade el primero!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-white/5 overflow-hidden">
          {/* Header de la tabla (desktop) */}
          <div className="hidden md:grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 px-4 py-3 bg-white/[0.02] border-b border-white/5 text-xs uppercase tracking-wider text-muted-foreground">
            <div className="w-10" />
            <div>Cliente</div>
            <div>Contacto</div>
            <div>Estado</div>
            <div>Cliente desde</div>
            <div className="w-10" />
          </div>

          {/* Filas */}
          <div className="divide-y divide-white/5">
            {filteredClientes.map((cliente) => {
              const estadoBadge = ESTADO_BADGES[cliente.estado] || ESTADO_BADGES.potencial
              return (
                <div
                  key={cliente.id}
                  className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-3 md:gap-4 items-center px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  onClick={() => abrirFicha(cliente.id)}
                >
                  {/* Avatar / Logo */}
                  <div className="w-10 h-10 shrink-0">
                    {cliente.logo_url ? (
                      <img src={cliente.logo_url} alt={cliente.nombre}
                        className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-arena-gradient flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">{getInitials(cliente.nombre)}</span>
                      </div>
                    )}
                  </div>

                  {/* Nombre + empresa */}
                  <div className="min-w-0">
                    <p className="font-medium truncate group-hover:text-primary transition-colors">{cliente.nombre}</p>
                    {cliente.empresa && (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Building className="h-3 w-3" /> {cliente.empresa}
                      </p>
                    )}
                  </div>

                  {/* Contacto */}
                  <div className="hidden md:block min-w-0 space-y-0.5">
                    {cliente.email ? (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {cliente.email}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/50">Sin email</p>
                    )}
                    {cliente.telefono && (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {cliente.telefono}
                      </p>
                    )}
                  </div>

                  {/* Estado */}
                  <div className="hidden md:block">
                    <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                  </div>

                  {/* Fecha */}
                  <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {cliente.fecha_captacion ? formatDate(cliente.fecha_captacion) : formatRelativeTime(cliente.created_at)}
                  </div>

                  {/* Acción */}
                  <div className="flex items-center justify-end">
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Contador */}
      {!loading && !error && filteredClientes.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {filteredClientes.length} cliente{filteredClientes.length !== 1 ? "s" : ""}
          {filteredClientes.length !== clientes.length && ` de ${clientes.length}`}
        </p>
      )}
    </div>
  )
}
