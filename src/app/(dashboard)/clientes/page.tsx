"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import type { Cliente } from "@/types"

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
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [formError, setFormError] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    empresa: "",
    estado: "potencial" as Cliente["estado"],
    notas: "",
  })

  useEffect(() => {
    fetchClientes()
  }, [supabase])

  useEffect(() => {
    // Filtrar clientes
    let filtered = clientes

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
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
      setClientes(data || [])
    } catch (err) {
      console.error("Error fetching clientes:", err)
      setError("No se pudieron cargar los clientes. Comprueba la conexión con la base de datos.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setFormError("")
      const payload = {
        ...formData,
        email: formData.email.trim() || null,
        telefono: formData.telefono.trim() || null,
        empresa: formData.empresa.trim() || null,
        notas: formData.notas.trim() || null,
      }

      if (editingCliente) {
        const { error } = await supabase
          .from("clientes")
          .update(payload)
          .eq("id", editingCliente.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("clientes")
          .insert([payload])

        if (error) throw error
      }

      setDialogOpen(false)
      resetForm()
      fetchClientes()
    } catch (error: any) {
      console.error("Error saving cliente:", error)
      const msg = error?.message || ""
      if (msg.includes("duplicate") || msg.includes("unique")) {
        setFormError("Ya existe un cliente con ese email.")
      } else if (msg.includes("rls") || msg.includes("policy")) {
        setFormError("No tienes permisos para esta acción.")
      } else {
        setFormError(msg || "No se pudo guardar el cliente.")
      }
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono || "",
      empresa: cliente.empresa || "",
      estado: cliente.estado,
      notas: cliente.notas || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return

    try {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", id)

      if (error) throw error
      fetchClientes()
    } catch (error) {
      console.error("Error deleting cliente:", error)
    }
  }

  const resetForm = () => {
    setEditingCliente(null)
    setFormError("")
    setFormData({
      nombre: "",
      email: "",
      telefono: "",
      empresa: "",
      estado: "potencial",
      notas: "",
    })
  }

  const getEstadoBadge = (estado: Cliente["estado"]) => {
    const badges: Record<Cliente["estado"], { label: string; variant: any }> = {
      activo: { label: "Activo", variant: "success" },
      inactivo: { label: "Inactivo", variant: "secondary" },
      potencial: { label: "Potencial", variant: "outline" },
    }
    return badges[estado]
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tu cartera de clientes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
              </DialogTitle>
              <DialogDescription>
                {editingCliente
                  ? "Actualiza la información del cliente"
                  : "Añade un nuevo cliente a tu cartera"}
              </DialogDescription>
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
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value: any) => setFormData({ ...formData, estado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="potencial">Potencial</SelectItem>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notas">Notas</Label>
                  <Input
                    id="notas"
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    placeholder="Notas internas sobre el cliente..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCliente ? "Actualizar" : "Crear"} Cliente
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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

      {/* Clientes List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-muted-foreground mb-4 text-center max-w-md">{error}</p>
            <Button variant="outline" onClick={() => { setLoading(true); fetchClientes() }}>
              Reintentar
            </Button>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClientes.map((cliente) => {
            const estadoBadge = getEstadoBadge(cliente.estado)
            return (
              <Card key={cliente.id} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate cursor-pointer hover:text-primary transition-colors" onClick={() => router.push(`/clientes/detalle?id=${cliente.id}`)}>
                        {cliente.nombre}
                      </CardTitle>
                      {cliente.empresa && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Building className="h-3 w-3" />
                          {cliente.empresa}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{cliente.email}</span>
                    </div>
                    {cliente.telefono && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{cliente.telefono}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatRelativeTime(cliente.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/clientes/detalle?id=${cliente.id}`)}
                    >
                      Ver ficha
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(cliente)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(cliente.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
