"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FolderKanban,
  Plus,
  Filter,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Proyecto } from "@/types"

const ESTADOS = {
  planeacion: "Planificación",
  en_progreso: "En Progreso",
  revision: "Revisión",
  completado: "Completado",
}

const ESTADO_COLORS: Record<string, string> = {
  planeacion: "bg-blue-500/20 text-blue-400",
  en_progreso: "bg-amber-500/20 text-amber-400",
  revision: "bg-purple-500/20 text-purple-400",
  completado: "bg-green-500/20 text-green-400",
}

const PRIORIDADES: Record<string, { label: string; color: string }> = {
  baja: { label: "Baja", color: "bg-gray-500/20 text-gray-400" },
  media: { label: "Media", color: "bg-blue-500/20 text-blue-400" },
  alta: { label: "Alta", color: "bg-orange-500/20 text-orange-400" },
  urgente: { label: "Urgente", color: "bg-red-500/20 text-red-400" },
}

export default function ProyectosPage() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [estadoFilter, setEstadoFilter] = useState<string>("todos")

  useEffect(() => {
    fetchProyectos()
  }, [supabase])

  const fetchProyectos = async () => {
    try {
      setError("")
      const { data, error } = await supabase
        .from("proyectos")
        .select(`
          *,
          clientes (
            id,
            nombre,
            empresa
          ),
          cliente_servicios (
            id,
            servicios (
              id,
              nombre,
              categoria
            )
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProyectos(data || [])
    } catch (err) {
      console.error("Error fetching proyectos:", err)
      setError("No se pudieron cargar los proyectos. Comprueba la conexión con la base de datos.")
    } finally {
      setLoading(false)
    }
  }

  const filteredProyectos = estadoFilter === "todos"
    ? proyectos
    : proyectos.filter(p => p.estado === estadoFilter)

  const estadosCount = proyectos.reduce((acc, p) => {
    acc[p.estado] = (acc[p.estado] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Proyectos</h1>
          <p className="text-muted-foreground">
            Gestiona los proyectos de tus clientes
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(ESTADOS).map(([key, label]) => (
          <Card
            key={key}
            className={`cursor-pointer transition-colors ${
              estadoFilter === key ? "border-primary/50" : ""
            }`}
            onClick={() => setEstadoFilter(estadoFilter === key ? "todos" : key)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{estadosCount[key] || 0}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
                <div className={`h-2 w-2 rounded-full ${
                  estadoFilter === key ? "bg-primary shadow-glow-purple" : "bg-muted"
                }`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      {estadoFilter !== "todos" && (
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">
            <Filter className="h-3 w-3 mr-1" />
            Filtrando: {ESTADOS[estadoFilter as keyof typeof ESTADOS]}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setEstadoFilter("todos")}>
            Limpiar filtro
          </Button>
        </div>
      )}

      {/* Proyectos List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-muted-foreground mb-4 text-center max-w-md">{error}</p>
            <Button variant="outline" onClick={() => { setLoading(true); fetchProyectos() }}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : filteredProyectos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {estadoFilter !== "todos"
                ? "No hay proyectos con este estado"
                : "No hay proyectos aún. ¡Crea el primero!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProyectos.map((proyecto) => {
            const prioridad = PRIORIDADES[proyecto.prioridad]
            const servicio = proyecto.cliente_servicios?.servicios

            return (
              <Card key={proyecto.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{proyecto.nombre}</h3>
                        <Badge className={ESTADO_COLORS[proyecto.estado]}>
                          {ESTADOS[proyecto.estado as keyof typeof ESTADOS]}
                        </Badge>
                        <Badge className={prioridad.color} variant="outline">
                          {prioridad.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {proyecto.descripcion}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Cliente:</span>
                          {proyecto.clientes?.empresa || proyecto.clientes?.nombre}
                        </span>
                        {servicio && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Servicio:</span>
                            {servicio.nombre}
                          </span>
                        )}
                        {proyecto.fecha_entrega_estimada && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(proyecto.fecha_entrega_estimada)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{proyecto.progreso}%</div>
                        <div className="text-xs text-muted-foreground">Progreso</div>
                      </div>
                      <div className="w-32">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-arena-gradient transition-all"
                            style={{ width: `${proyecto.progreso}%` }}
                          />
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
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
