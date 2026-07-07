"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Briefcase,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  AlertCircle,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { DEFAULT_SERVICIOS } from "@/lib/supabase/config"
import type { Servicio } from "@/types"

const CATEGORIAS = {
  web: "Desarrollo Web",
  branding: "Branding",
  ia: "IA & Automatización",
  marketing: "Marketing & Growth",
  consultoria: "Consultoría",
  otro: "Otro",
}

const CATEGORIA_COLORS: Record<string, string> = {
  web: "bg-blue-500/20 text-blue-400",
  branding: "bg-pink-500/20 text-pink-400",
  ia: "bg-purple-500/20 text-purple-400",
  marketing: "bg-green-500/20 text-green-400",
  consultoria: "bg-amber-500/20 text-amber-400",
  otro: "bg-gray-500/20 text-gray-400",
}

export default function ServiciosPage() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null)

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio_base: "",
    activo: true,
    categoria: "web" as Servicio["categoria"],
  })

  useEffect(() => {
    fetchServicios()
  }, [supabase])

  const fetchServicios = async () => {
    try {
      setError("")
      const { data, error } = await supabase
        .from("servicios")
        .select("*")
        .order("categoria", { ascending: true })

      if (error) throw error
      setServicios(data || [])
    } catch (err) {
      console.error("Error fetching servicios:", err)
      setError("No se pudieron cargar los servicios. Comprueba la conexión con la base de datos.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        ...formData,
        precio_base: formData.precio_base ? parseFloat(formData.precio_base) : null,
      }

      if (editingServicio) {
        const { error } = await supabase
          .from("servicios")
          .update(payload)
          .eq("id", editingServicio.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("servicios")
          .insert([payload])

        if (error) throw error
      }

      setDialogOpen(false)
      resetForm()
      fetchServicios()
    } catch (error) {
      console.error("Error saving servicio:", error)
    }
  }

  const handleEdit = (servicio: Servicio) => {
    setEditingServicio(servicio)
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || "",
      precio_base: servicio.precio_base?.toString() || "",
      activo: servicio.activo,
      categoria: servicio.categoria,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este servicio?")) return

    try {
      const { error } = await supabase
        .from("servicios")
        .delete()
        .eq("id", id)

      if (error) throw error
      fetchServicios()
    } catch (error) {
      console.error("Error deleting servicio:", error)
    }
  }

  const handleToggleActive = async (servicio: Servicio) => {
    try {
      const { error } = await supabase
        .from("servicios")
        .update({ activo: !servicio.activo })
        .eq("id", servicio.id)

      if (error) throw error
      fetchServicios()
    } catch (error) {
      console.error("Error toggling servicio:", error)
    }
  }

  const resetForm = () => {
    setEditingServicio(null)
    setFormData({
      nombre: "",
      descripcion: "",
      precio_base: "",
      activo: true,
      categoria: "web",
    })
  }

  const initializeDefaultServices = async () => {
    if (!confirm("¿Crear servicios por defecto? Esto añadirá 7 servicios básicos.")) return

    try {
      const { error } = await supabase
        .from("servicios")
        .insert(DEFAULT_SERVICIOS)

      if (error) throw error
      fetchServicios()
    } catch (error) {
      console.error("Error initializing servicios:", error)
    }
  }

  // Group servicios by categoria
  const groupedServicios = servicios.reduce((acc, servicio) => {
    if (!acc[servicio.categoria]) {
      acc[servicio.categoria] = []
    }
    acc[servicio.categoria].push(servicio)
    return acc
  }, {} as Record<string, Servicio[]>)

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Servicios</h1>
          <p className="text-muted-foreground">
            Catálogo de servicios de Arena13
          </p>
        </div>
        <div className="flex gap-2">
          {servicios.length === 0 && (
            <Button variant="outline" onClick={initializeDefaultServices}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Servicios por Defecto
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Servicio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingServicio ? "Editar Servicio" : "Nuevo Servicio"}
                </DialogTitle>
                <DialogDescription>
                  {editingServicio
                    ? "Actualiza la información del servicio"
                    : "Añade un nuevo servicio al catálogo"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción breve del servicio..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="precio_base">Precio Base (€)</Label>
                    <Input
                      id="precio_base"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.precio_base}
                      onChange={(e) => setFormData({ ...formData, precio_base: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value: any) => setFormData({ ...formData, categoria: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORIAS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="activo" className="cursor-pointer">
                    Servicio activo
                  </Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingServicio ? "Actualizar" : "Crear"} Servicio
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Servicios por categoría */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-muted-foreground mb-4 text-center max-w-md">{error}</p>
            <Button variant="outline" onClick={() => { setLoading(true); fetchServicios() }}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : servicios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No hay servicios en el catálogo
            </p>
            <Button onClick={initializeDefaultServices}>
              Crear Servicios por Defecto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedServicios).map(([categoria, categoriaServicios]) => (
            <div key={categoria}>
              <div className="flex items-center gap-3 mb-4">
                <Badge className={CATEGORIA_COLORS[categoria]}>
                  {CATEGORIAS[categoria]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {categoriaServicios.length} servicio{categoriaServicios.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoriaServicios.map((servicio) => (
                  <Card key={servicio.id} className={!servicio.activo ? "opacity-60" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{servicio.nombre}</CardTitle>
                          {servicio.descripcion && (
                            <CardDescription className="mt-1 line-clamp-2">
                              {servicio.descripcion}
                            </CardDescription>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleActive(servicio)}
                        >
                          {servicio.activo ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {servicio.precio_base && (
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(servicio.precio_base)}
                        </div>
                      )}
                      <div className="flex gap-2 pt-2 border-t border-white/10">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(servicio)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(servicio.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
