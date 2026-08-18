"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  FolderKanban,
  Plus,
  Filter,
  Calendar,
  AlertCircle,
  Play,
  Square,
  ListChecks,
  Clock,
  Trash2,
  ChevronDown,
} from "lucide-react"
import { formatDate, cn } from "@/lib/utils"
import type { Proyecto, ImputacionHoras, ChecklistItem } from "@/types"

const ESTADOS: Record<string, string> = {
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

const TIMER_KEY = "arena13-timer-activo"

interface TimerActivo {
  proyectoId: string
  inicio: number // epoch ms
}

function formatDuracion(ms: number): string {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export default function ProyectosPage() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [imputaciones, setImputaciones] = useState<ImputacionHoras[]>([])
  const [estadoFilter, setEstadoFilter] = useState<string>("todos")
  const [timer, setTimer] = useState<TimerActivo | null>(null)
  const [now, setNow] = useState(Date.now())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [nuevaTarea, setNuevaTarea] = useState("")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Recuperar timer activo de localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TIMER_KEY)
      if (raw) setTimer(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  // Ticker para el contador en vivo
  useEffect(() => {
    if (timer) {
      timerRef.current = setInterval(() => setNow(Date.now()), 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [timer])

  const fetchProyectos = useCallback(async () => {
    try {
      setError("")
      const [prRes, impRes] = await Promise.all([
        supabase
          .from("proyectos")
          .select(`
            *,
            clientes ( id, nombre, empresa ),
            cliente_servicios ( id, servicios ( id, nombre, categoria ) )
          `)
          .order("created_at", { ascending: false }),
        supabase.from("imputaciones_horas").select("id,proyecto_id,inicio,fin,duracion_minutos"),
      ])
      if (prRes.error) throw prRes.error
      setProyectos(prRes.data || [])
      if (impRes.data) setImputaciones(impRes.data as ImputacionHoras[])
    } catch (err) {
      console.error("Error fetching proyectos:", err)
      setError("No se pudieron cargar los proyectos. Comprueba la conexión con la base de datos.")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchProyectos() }, [fetchProyectos])

  const horasPorProyecto = imputaciones.reduce((acc, i) => {
    const min = i.duracion_minutos ?? (i.fin ? Math.round((new Date(i.fin).getTime() - new Date(i.inicio).getTime()) / 60000) : 0)
    acc[i.proyecto_id] = (acc[i.proyecto_id] || 0) + min
    return acc
  }, {} as Record<string, number>)

  const iniciarTimer = (proyectoId: string) => {
    const t = { proyectoId, inicio: Date.now() }
    setTimer(t)
    localStorage.setItem(TIMER_KEY, JSON.stringify(t))
  }

  const pararTimer = async () => {
    if (!timer) return
    const fin = Date.now()
    const duracionMin = Math.max(1, Math.round((fin - timer.inicio) / 60000))
    setTimer(null)
    localStorage.removeItem(TIMER_KEY)
    try {
      const { error } = await supabase.from("imputaciones_horas").insert({
        proyecto_id: timer.proyectoId,
        inicio: new Date(timer.inicio).toISOString(),
        fin: new Date(fin).toISOString(),
        duracion_minutos: duracionMin,
      })
      if (error) throw error
      await fetchProyectos()
    } catch (err) {
      console.error("Error guardando imputación:", err)
      setError("No se pudo guardar la imputación de horas.")
    }
  }

  // ===== Checklist =====
  const guardarChecklist = async (proyecto: Proyecto, checklist: ChecklistItem[]) => {
    setProyectos(proyectos.map((p) => (p.id === proyecto.id ? { ...p, checklist } : p)))
    const { error } = await supabase.from("proyectos").update({ checklist }).eq("id", proyecto.id)
    if (error) console.error("Error guardando checklist:", error)
  }

  const toggleItem = (proyecto: Proyecto, itemId: string) => {
    const items = (proyecto.checklist || []).map((i) => (i.id === itemId ? { ...i, done: !i.done } : i))
    guardarChecklist(proyecto, items)
  }

  const addItem = (proyecto: Proyecto) => {
    const text = nuevaTarea.trim()
    if (!text) return
    const items = [...(proyecto.checklist || []), { id: crypto.randomUUID(), text, done: false }]
    guardarChecklist(proyecto, items)
    setNuevaTarea("")
  }

  const removeItem = (proyecto: Proyecto, itemId: string) => {
    guardarChecklist(proyecto, (proyecto.checklist || []).filter((i) => i.id !== itemId))
  }

  const filteredProyectos = estadoFilter === "todos"
    ? proyectos
    : proyectos.filter((p) => p.estado === estadoFilter)

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
            className={cn(
              "cursor-pointer transition-colors",
              estadoFilter === key && "border-primary/50"
            )}
            onClick={() => setEstadoFilter(estadoFilter === key ? "todos" : key)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{estadosCount[key] || 0}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  estadoFilter === key ? "bg-primary" : "bg-muted"
                )} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timer activo global */}
      {timer && (
        <div className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 border-primary/30">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <span className="text-sm">
              Cronómetro activo — {proyectos.find((p) => p.id === timer.proyectoId)?.nombre || "Proyecto"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-lg font-semibold text-gradient tabular-nums">
              {formatDuracion(now - timer.inicio)}
            </span>
            <Button variant="destructive" size="sm" onClick={pararTimer}>
              <Square className="h-3.5 w-3.5 mr-1.5" /> Detener y guardar
            </Button>
          </div>
        </div>
      )}

      {/* Filtro */}
      {estadoFilter !== "todos" && (
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">
            <Filter className="h-3 w-3 mr-1" />
            Filtrando: {ESTADOS[estadoFilter]}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setEstadoFilter("todos")}>
            Limpiar filtro
          </Button>
        </div>
      )}

      {/* Lista */}
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
            const checklist = proyecto.checklist || []
            const doneCount = checklist.filter((i) => i.done).length
            const horas = horasPorProyecto[proyecto.id] || 0
            const esTimerActivo = timer?.proyectoId === proyecto.id
            const expandido = expandedId === proyecto.id

            return (
              <Card key={proyecto.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{proyecto.nombre}</h3>
                        <Badge className={ESTADO_COLORS[proyecto.estado]}>
                          {ESTADOS[proyecto.estado]}
                        </Badge>
                        <Badge className={prioridad.color} variant="outline">
                          {prioridad.label}
                        </Badge>
                      </div>
                      {proyecto.descripcion && (
                        <p className="text-sm text-muted-foreground mb-3">{proyecto.descripcion}</p>
                      )}
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
                        {horas > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuracion(horas * 60000)} registradas
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{proyecto.progreso}%</div>
                        <div className="text-xs text-muted-foreground">Progreso</div>
                      </div>
                      <div className="w-24 sm:w-32">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-arena-gradient transition-all"
                            style={{ width: `${proyecto.progreso}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Timer */}
                        {esTimerActivo ? (
                          <Button variant="destructive" size="sm" onClick={pararTimer}>
                            <Square className="h-3.5 w-3.5 mr-1.5" />
                            <span className="font-mono tabular-nums">{formatDuracion(now - timer!.inicio)}</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => iniciarTimer(proyecto.id)}
                            disabled={!!timer}
                            title="Iniciar cronómetro"
                          >
                            <Play className="h-3.5 w-3.5 mr-1.5" /> Iniciar
                          </Button>
                        )}
                        {/* Checklist toggle */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedId(expandido ? null : proyecto.id)}
                          title="Subtareas"
                        >
                          <ListChecks className="h-3.5 w-3.5 mr-1.5" />
                          {checklist.length > 0 ? `${doneCount}/${checklist.length}` : "Tareas"}
                          <ChevronDown className={cn("h-3 w-3 ml-1 transition-transform", expandido && "rotate-180")} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Panel de subtareas */}
                  {expandido && (
                    <div className="mt-5 pt-5 border-t border-white/5">
                      <div className="space-y-1.5 mb-3">
                        {checklist.length === 0 && (
                          <p className="text-sm text-muted-foreground py-2">Sin subtareas todavía. Añade la primera:</p>
                        )}
                        {checklist.map((item) => (
                          <div key={item.id} className="group flex items-center gap-3 rounded-pill px-3 py-1.5 hover:bg-white/[0.03]">
                            <button
                              onClick={() => toggleItem(proyecto, item.id)}
                              className={cn(
                                "h-4 w-4 shrink-0 rounded-full border flex items-center justify-center transition-all",
                                item.done
                                  ? "bg-arena-gradient border-transparent"
                                  : "border-white/25 hover:border-primary/60"
                              )}
                              aria-label={item.done ? "Marcar pendiente" : "Marcar completada"}
                            >
                              {item.done && <span className="text-[0.6rem] leading-none">✓</span>}
                            </button>
                            <span className={cn("text-sm flex-1", item.done && "line-through text-muted-foreground")}>
                              {item.text}
                            </span>
                            <button
                              onClick={() => removeItem(proyecto, item.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                              aria-label="Eliminar subtarea"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={nuevaTarea}
                          onChange={(e) => setNuevaTarea(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addItem(proyecto)}
                          placeholder="Nueva subtarea y Enter..."
                          className="h-9"
                        />
                        <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={() => addItem(proyecto)}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
