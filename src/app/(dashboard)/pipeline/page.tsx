"use client"

import { useEffect, useState, useCallback } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { useSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Plus, X, Clock, AlertTriangle, CheckCircle2, ExternalLink,
  Cpu, Palette, Layers, Calendar, ChevronRight, GripVertical,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Proyecto, Cliente, ChecklistItem } from "@/types"

// === CONFIG COLUMNAS ===

const COLUMNAS: { id: string; estado: Proyecto["estado"]; titulo: string; color: string }[] = [
  { id: "backlog", estado: "planeacion", titulo: "Backlog", color: "border-t-slate-500" },
  { id: "progreso", estado: "en_progreso", titulo: "En Progreso", color: "border-t-amber-500" },
  { id: "bloqueado", estado: "bloqueado", titulo: "Bloqueado", color: "border-t-red-500" },
  { id: "revision", estado: "revision", titulo: "En Revisión", color: "border-t-purple-500" },
  { id: "completado", estado: "completado", titulo: "Completado", color: "border-t-green-500" },
]

type FiltroLinea = "todos" | "ia" | "diseno"

function getChecklistProgress(checklist?: ChecklistItem[]): number {
  if (!checklist || checklist.length === 0) return 0
  return Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)
}

function LineaBadge({ linea }: { linea?: string }) {
  if (linea === "ia") return <span className="inline-flex items-center gap-1 text-[0.65rem] px-1.5 py-0.5 rounded-full bg-[#01A9F2]/20 text-[#01A9F2] font-medium"><Cpu className="h-2.5 w-2.5" /> IA</span>
  if (linea === "diseno") return <span className="inline-flex items-center gap-1 text-[0.65rem] px-1.5 py-0.5 rounded-full bg-[#787DFF]/20 text-[#787DFF] font-medium"><Palette className="h-2.5 w-2.5" /> Diseño</span>
  return <span className="inline-flex items-center gap-1 text-[0.65rem] px-1.5 py-0.5 rounded-full bg-white/10 text-muted-foreground font-medium"><Layers className="h-2.5 w-2.5" /> Mixto</span>
}

export default function PipelinePage() {
  const supabase = useSupabase()
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [clientes, setClientes] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<FiltroLinea>("todos")
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)

  const cargarDatos = useCallback(async () => {
    try {
      const [proyRes, cliRes] = await Promise.all([
        supabase.from("proyectos").select("*").order("created_at", { ascending: false }),
        supabase.from("clientes").select("id, nombre, logo_url"),
      ])
      if (proyRes.error) throw proyRes.error
      const map = new Map<string, string>()
      ;(cliRes.data || []).forEach((c: any) => map.set(c.id, c.nombre))
      setClientes(map)
      setProyectos((proyRes.data || []) as Proyecto[])
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const proyectosFiltrados = proyectos.filter((p) => {
    if (filtro === "todos") return true
    if (filtro === "ia") return p.linea_negocio === "ia"
    if (filtro === "diseno") return p.linea_negocio === "diseno"
    return true
  })

  const getProyectosPorEstado = (estado: string) =>
    proyectosFiltrados.filter((p) => p.estado === estado)

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const sourceCol = COLUMNAS.find((c) => c.id === result.source.droppableId)
    const destCol = COLUMNAS.find((c) => c.id === result.destination.droppableId)
    if (!sourceCol || !destCol) return
    if (sourceCol.estado === destCol.estado) return

    const proyectoId = result.draggableId
    setProyectos((prev) => prev.map((p) => p.id === proyectoId ? { ...p, estado: destCol.estado } : p))

    try {
      const progresoMap: Record<string, number> = {
        planeacion: 0, en_progreso: 30, bloqueado: 30, revision: 80, completado: 100,
      }
      await supabase.from("proyectos")
        .update({ estado: destCol.estado, progreso: progresoMap[destCol.estado] ?? p_progreso(proyectos.find((p) => p.id === proyectoId)) })
        .eq("id", proyectoId)
    } catch (err) {
      console.error("Error moviendo:", err)
      cargarDatos()
    }
  }

  function p_progreso(p?: Proyecto): number {
    return p?.progreso ?? 0
  }

  const handleUpdateProyecto = async (id: string, updates: Partial<Proyecto>) => {
    setProyectos((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p))
    setSelectedProject((prev) => prev && prev.id === id ? { ...prev, ...updates } : prev)
    try {
      const { error } = await supabase.from("proyectos").update(updates).eq("id", id)
      if (error) throw error
    } catch (err) {
      console.error("Error:", err)
      cargarDatos()
    }
  }

  // === RENDER ===

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground">Tablero operativo de producción</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filtro línea de negocio */}
          <div className="flex items-center gap-1 glass rounded-pill p-1">
            <FiltroBtn active={filtro === "todos"} onClick={() => setFiltro("todos")} label="Todo" />
            <FiltroBtn active={filtro === "ia"} onClick={() => setFiltro("ia")} label="IA" color="#01A9F2" />
            <FiltroBtn active={filtro === "diseno"} onClick={() => setFiltro("diseno")} label="Diseño" color="#787DFF" />
          </div>
          <Button size="sm" onClick={() => setShowNewProject(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo
          </Button>
        </div>
      </div>

      {/* Kanban */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
          {COLUMNAS.map((col) => {
            const items = getProyectosPorEstado(col.estado)
            return (
              <div key={col.id} className={`flex-shrink-0 w-72 flex flex-col rounded-xl border border-white/5 border-t-2 ${col.color} bg-card/50`}>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-sm font-medium">{col.titulo}</span>
                  <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 px-2 pb-2 space-y-2 min-h-[100px] transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}
                    >
                      {items.map((proyecto, index) => {
                        const progress = getChecklistProgress(proyecto.checklist)
                        return (
                          <Draggable key={proyecto.id} draggableId={proyecto.id} index={index}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                onClick={() => setSelectedProject(proyecto)}
                                className={`rounded-lg border border-white/5 bg-background/80 p-3 cursor-pointer hover:border-primary/30 transition-all ${snap.isDragging ? "shadow-glow-purple border-primary/50" : ""}`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <p className="text-sm font-medium line-clamp-2">{proyecto.nombre}</p>
                                  <LineaBadge linea={proyecto.linea_negocio} />
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{clientes.get(proyecto.cliente_id) || "—"}</p>
                                {(proyecto.checklist?.length ?? 0) > 0 && (
                                  <div className="mb-1.5">
                                    <div className="flex items-center justify-between text-[0.65rem] text-muted-foreground mb-1">
                                      <span>{progress}%</span>
                                      <span>{proyecto.checklist!.filter((c) => c.done).length}/{proyecto.checklist!.length}</span>
                                    </div>
                                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                                      <div className="h-full bg-arena-gradient" style={{ width: `${progress}%` }} />
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-[0.65rem] text-muted-foreground">
                                  {proyecto.prioridad === "urgente" && (
                                    <span className="flex items-center gap-0.5 text-red-400"><AlertTriangle className="h-2.5 w-2.5" /> Urgente</span>
                                  )}
                                  {proyecto.fecha_entrega_estimada && (
                                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {formatDate(proyecto.fecha_entrega_estimada)}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                      {items.length === 0 && !snapshot.isDraggingOver && (
                        <p className="text-xs text-muted-foreground/40 text-center py-4">Arrastrar aquí</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {/* Slide-over */}
      {selectedProject && (
        <SlideOver
          proyecto={selectedProject}
          clienteNombre={clientes.get(selectedProject.cliente_id) || "—"}
          onClose={() => setSelectedProject(null)}
          onUpdate={handleUpdateProyecto}
        />
      )}

      {/* Nuevo proyecto */}
      {showNewProject && (
        <NewProjectDialog
          clientes={clientes}
          onClose={() => setShowNewProject(false)}
          onCreated={() => { setShowNewProject(false); cargarDatos() }}
          supabase={supabase}
        />
      )}
    </div>
  )
}

// === SUBCOMPONENTES ===

function FiltroBtn({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-pill transition-all ${
        active ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {color && <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: color }} />}
      {label}
    </button>
  )
}

function SlideOver({ proyecto, clienteNombre, onClose, onUpdate }: {
  proyecto: Proyecto
  clienteNombre: string
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Proyecto>) => void
}) {
  const [nuevaTarea, setNuevaTarea] = useState("")
  const [editingLinks, setEditingLinks] = useState(false)
  const [links, setLinks] = useState({
    figma_url: proyecto.figma_url || "",
    github_url: proyecto.github_url || "",
    webflow_url: proyecto.webflow_url || "",
    drive_url: proyecto.drive_url || "",
  })
  const [notas, setNotas] = useState(proyecto.notas_internas || "")

  const checklist = proyecto.checklist || []
  const progress = getChecklistProgress(checklist)

  const toggleItem = (itemId: string) => {
    const updated = checklist.map((c) => c.id === itemId ? { ...c, done: !c.done } : c)
    onUpdate(proyecto.id, { checklist: updated, progreso: getChecklistProgress(updated) })
  }

  const addItem = () => {
    if (!nuevaTarea.trim()) return
    const item: ChecklistItem = { id: crypto.randomUUID(), text: nuevaTarea.trim(), done: false }
    const updated = [...checklist, item]
    onUpdate(proyecto.id, { checklist: updated, progreso: getChecklistProgress(updated) })
    setNuevaTarea("")
  }

  const removeItem = (itemId: string) => {
    const updated = checklist.filter((c) => c.id !== itemId)
    onUpdate(proyecto.id, { checklist: updated, progreso: getChecklistProgress(updated) })
  }

  const saveLinks = () => {
    const cleaned = Object.fromEntries(Object.entries(links).map(([k, v]) => [k, v.trim() || null]))
    onUpdate(proyecto.id, cleaned)
    setEditingLinks(false)
  }

  const saveNotas = () => {
    onUpdate(proyecto.id, { notas_internas: notas.trim() || null })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md h-full bg-card border-l border-white/10 overflow-y-auto animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-white/5 px-5 py-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <LineaBadge linea={proyecto.linea_negocio} />
              <span className="text-xs text-muted-foreground">{clienteNombre}</span>
            </div>
            <h2 className="text-lg font-bold">{proyecto.nombre}</h2>
          </div>
          <button onClick={onClose} className="glass p-2 rounded-pill hover:border-primary/40 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Descripción */}
          {proyecto.descripcion && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Descripción</p>
              <p className="text-sm">{proyecto.descripcion}</p>
            </div>
          )}

          {/* Progreso */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Progreso</p>
              <span className="text-sm font-semibold text-gradient">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-arena-gradient transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Checklist */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Checklist atómico</p>
            <div className="space-y-1.5">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`shrink-0 h-4 w-4 rounded border transition-all flex items-center justify-center ${
                      item.done ? "bg-primary border-primary" : "border-white/20 hover:border-primary/50"
                    }`}
                  >
                    {item.done && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </button>
                  <span className={`text-sm flex-1 ${item.done ? "line-through text-muted-foreground" : ""}`}>
                    {item.text}
                  </span>
                  <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <Input
                  value={nuevaTarea}
                  onChange={(e) => setNuevaTarea(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                  placeholder="Añadir tarea..."
                  className="h-8 text-sm"
                />
                <Button size="sm" variant="ghost" onClick={addItem} className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Línea de negocio */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Línea de negocio</p>
            <div className="flex gap-2">
              {(["ia", "diseno", "mixto"] as const).map((ln) => (
                <button
                  key={ln}
                  onClick={() => onUpdate(proyecto.id, { linea_negocio: ln })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-pill border transition-all ${
                    proyecto.linea_negocio === ln ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/30"
                  }`}
                >
                  {ln === "ia" && "IA (Cian)"}
                  {ln === "diseno" && "Diseño (Púrpura)"}
                  {ln === "mixto" && "Mixto"}
                </button>
              ))}
            </div>
          </div>

          {/* Enlaces externos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Enlaces externos</p>
              <Button variant="ghost" size="sm" onClick={() => setEditingLinks(!editingLinks)}>
                {editingLinks ? "Guardar" : "Editar"}
              </Button>
            </div>
            {!editingLinks ? (
              <div className="space-y-1.5">
                {proyecto.figma_url && <LinkRow icon="figma" label="Figma" url={proyecto.figma_url} />}
                {proyecto.github_url && <LinkRow icon="github" label="GitHub" url={proyecto.github_url} />}
                {proyecto.webflow_url && <LinkRow icon="web" label="Webflow" url={proyecto.webflow_url} />}
                {proyecto.drive_url && <LinkRow icon="drive" label="Drive" url={proyecto.drive_url} />}
                {!proyecto.figma_url && !proyecto.github_url && !proyecto.webflow_url && !proyecto.drive_url && (
                  <p className="text-xs text-muted-foreground">Sin enlaces configurados.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {(["figma_url", "github_url", "webflow_url", "drive_url"] as const).map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <Label className="text-xs w-16 capitalize shrink-0">{key.replace("_url", "")}</Label>
                    <Input value={links[key]} onChange={(e) => setLinks({ ...links, [key]: e.target.value })} placeholder="https://..." className="h-8 text-sm" />
                  </div>
                ))}
                <Button size="sm" onClick={saveLinks}>Guardar enlaces</Button>
              </div>
            )}
          </div>

          {/* Notas internas */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Notas del equipo</p>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              onBlur={saveNotas}
              rows={3}
              placeholder="Notas internas del equipo..."
              className="text-sm"
            />
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Creado</p>
              <p className="text-sm">{formatDate(proyecto.created_at)}</p>
            </div>
            {proyecto.fecha_entrega_estimada && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Entrega est.</p>
                <p className="text-sm">{formatDate(proyecto.fecha_entrega_estimada)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LinkRow({ icon, label, url }: { icon: string; label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors group">
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
      <span>{label}</span>
      <span className="text-xs text-muted-foreground truncate">{url.replace(/^https?:\/\//, "")}</span>
    </a>
  )
}

function NewProjectDialog({ clientes, onClose, onCreated, supabase }: {
  clientes: Map<string, string>
  onClose: () => void
  onCreated: () => void
  supabase: any
}) {
  const [nombre, setNombre] = useState("")
  const [clienteId, setClienteId] = useState("")
  const [linea, setLinea] = useState<"ia" | "diseno" | "mixto">("mixto")
  const [descripcion, setDescripcion] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = async () => {
    if (!nombre.trim() || !clienteId) { setError("Nombre y cliente son obligatorios"); return }
    setSaving(true)
    setError("")
    try {
      const { data: serv } = await supabase.from("cliente_servicios").select("id").eq("cliente_id", clienteId).limit(1).single()
      const payload: any = {
        nombre: nombre.trim(),
        cliente_id: clienteId,
        servicio_id: serv?.id || null,
        estado: "planeacion",
        linea_negocio: linea,
        descripcion: descripcion.trim() || null,
        prioridad: "media",
        progreso: 0,
      }
      if (!serv) {
        const { data: newServ } = await supabase.from("cliente_servicios").insert({
          cliente_id: clienteId,
          servicio_id: (await supabase.from("servicios").select("id").limit(1).single()).data?.id,
          estado: "activo",
        }).select().single()
        payload.servicio_id = newServ?.id
      }
      const { error: insErr } = await supabase.from("proyectos").insert(payload)
      if (insErr) throw insErr
      onCreated()
    } catch (err: any) {
      console.error("Error:", err)
      setError(err?.message || "No se pudo crear el proyecto.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-card border border-white/10 rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Nuevo proyecto</h2>
          <button onClick={onClose} className="glass p-2 rounded-pill"><X className="h-4 w-4" /></button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Nombre del proyecto *</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Chatbot WhatsApp" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full h-10 rounded-lg border border-white/10 bg-background px-3 text-sm"
            >
              <option value="">Seleccionar cliente...</option>
              {Array.from(clientes.entries()).map(([id, nombre]) => (
                <option key={id} value={id}>{nombre}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Línea de negocio</Label>
            <div className="flex gap-2">
              {(["ia", "diseno", "mixto"] as const).map((ln) => (
                <button
                  key={ln}
                  onClick={() => setLinea(ln)}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                    linea === ln ? "border-primary bg-primary/10" : "border-white/10"
                  }`}
                >
                  {ln === "ia" && "IA"}
                  {ln === "diseno" && "Diseño"}
                  {ln === "mixto" && "Mixto"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} placeholder="Breve descripción..." />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={saving}>{saving ? "Creando..." : "Crear proyecto"}</Button>
        </div>
      </div>
    </div>
  )
}
