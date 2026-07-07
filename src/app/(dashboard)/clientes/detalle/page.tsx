"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  Save,
  Trash2,
  FolderKanban,
  Briefcase,
  Activity as ActivityIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  CircleDollarSign,
} from "lucide-react"
import { formatDate, formatRelativeTime, formatCurrency, getInitials } from "@/lib/utils"
import type { Cliente, Proyecto, ClienteServicio, Actividad } from "@/types"

const ESTADOS_CLIENTE: Record<Cliente["estado"], { label: string; variant: string }> = {
  activo: { label: "Activo", variant: "success" },
  potencial: { label: "Potencial", variant: "info" },
  inactivo: { label: "Inactivo", variant: "secondary" },
}

const ESTADOS_PROYECTO: Record<string, { label: string; color: string }> = {
  planeacion: { label: "Planificación", color: "bg-cyan-500/20 text-cyan-400" },
  en_progreso: { label: "En progreso", color: "bg-amber-500/20 text-amber-400" },
  revision: { label: "Revisión", color: "bg-purple-500/20 text-purple-400" },
  completado: { label: "Completado", color: "bg-green-500/20 text-green-400" },
}

function ClienteDetalleContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const supabase = useSupabase()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [servicios, setServicios] = useState<ClienteServicio[]>([])
  const [actividad, setActividad] = useState<Actividad[]>([])

  // Edición
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    empresa: "",
    estado: "potencial" as Cliente["estado"],
    notas: "",
  })

  const cargarTodo = useCallback(async () => {
    if (!id) {
      setError("ID de cliente no especificado")
      setLoading(false)
      return
    }

    try {
      setError("")

      const [cliRes, proyRes, servRes, actRes] = await Promise.all([
        supabase.from("clientes").select("*").eq("id", id).single(),
        supabase
          .from("proyectos")
          .select("*")
          .eq("cliente_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("cliente_servicios")
          .select("*, servicio:servicios(*)")
          .eq("cliente_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("actividad")
          .select("*")
          .eq("cliente_id", id)
          .order("created_at", { ascending: false })
          .limit(20),
      ])

      if (cliRes.error) throw cliRes.error
      if (!cliRes.data) {
        setError("Cliente no encontrado")
        setLoading(false)
        return
      }

      setCliente(cliRes.data)
      setProyectos(proyRes.data || [])
      setServicios(servRes.data || [])
      setActividad(actRes.data || [])
      setFormData({
        nombre: cliRes.data.nombre || "",
        email: cliRes.data.email || "",
        telefono: cliRes.data.telefono || "",
        empresa: cliRes.data.empresa || "",
        estado: cliRes.data.estado || "potencial",
        notas: cliRes.data.notas || "",
      })
    } catch (err) {
      console.error("Error cargando cliente:", err)
      setError("No se pudo cargar el cliente.")
    } finally {
      setLoading(false)
    }
  }, [id, supabase])

  useEffect(() => {
    cargarTodo()
  }, [cargarTodo])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    setSaving(true)
    try {
      const payload = {
        ...formData,
        email: formData.email.trim() || null,
        telefono: formData.telefono.trim() || null,
        empresa: formData.empresa.trim() || null,
        notas: formData.notas.trim() || null,
      }
      const { error } = await supabase.from("clientes").update(payload).eq("id", id)
      if (error) throw error

      setCliente({ ...cliente!, ...formData })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error("Error guardando:", err)
      alert("No se pudo guardar. Revisa los permisos.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!cliente) return
    if (!confirm(`¿Eliminar a "${cliente.nombre}"? Esta acción no se puede deshacer.`)) return

    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id)
      if (error) throw error
      router.push("/clientes")
    } catch (err) {
      console.error("Error eliminando:", err)
      alert("No se pudo eliminar el cliente.")
    }
  }

  const cancelEdit = () => {
    if (!cliente) return
    setFormData({
      nombre: cliente.nombre || "",
      email: cliente.email || "",
      telefono: cliente.telefono || "",
      empresa: cliente.empresa || "",
      estado: cliente.estado || "potencial",
      notas: cliente.notas || "",
    })
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
      </div>
    )
  }

  if (error || !cliente) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/clientes")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a clientes
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-muted-foreground mb-4">{error || "Cliente no encontrado"}</p>
            <Button variant="outline" onClick={() => router.push("/clientes")}>
              Ir a clientes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const estadoInfo = ESTADOS_CLIENTE[cliente.estado] || ESTADOS_CLIENTE.potencial
  const proyectosActivos = proyectos.filter((p) => p.estado !== "completado").length
  const serviciosActivos = servicios.filter((s) => s.estado === "activo").length

  return (
    <div className="space-y-6 animate-in">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/clientes")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Clientes
        </Button>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4" /> Guardado
            </span>
          )}
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" /> Eliminar
          </Button>
        </div>
      </div>

      {/* Header del cliente */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar */}
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-pill bg-arena-gradient shadow-glow-purple shrink-0">
              <span className="text-2xl font-semibold text-white">{getInitials(cliente.nombre)}</span>
            </div>

            {/* Datos */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{cliente.nombre}</h1>
                <Badge variant={estadoInfo.variant as any}>{estadoInfo.label}</Badge>
              </div>
              {cliente.empresa && (
                <p className="flex items-center gap-1.5 text-muted-foreground mt-1">
                  <Building className="h-3.5 w-3.5" /> {cliente.empresa}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {cliente.email}
                </span>
                {cliente.telefono && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {cliente.telefono}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Alta: {formatDate(cliente.fecha_alta || cliente.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/5">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gradient">{proyectosActivos}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Proyectos activos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gradient">{proyectos.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Total proyectos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gradient">{serviciosActivos}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Servicios activos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gradient">{servicios.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Total servicios</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="proyectos">
            Proyectos ({proyectos.length})
          </TabsTrigger>
          <TabsTrigger value="servicios">
            Servicios ({servicios.length})
          </TabsTrigger>
          <TabsTrigger value="actividad">
            Actividad ({actividad.length})
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB: INFORMACIÓN ===== */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Datos del cliente</CardTitle>
                {!editing ? (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    Editar
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    Cancelar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!editing ? (
                <div className="grid sm:grid-cols-2 gap-5">
                  <CampoInfo label="Nombre" value={cliente.nombre} />
                  <CampoInfo label="Email" value={cliente.email} />
                  <CampoInfo label="Teléfono" value={cliente.telefono || "—"} />
                  <CampoInfo label="Empresa" value={cliente.empresa || "—"} />
                  <CampoInfo label="Estado" value={estadoInfo.label} />
                  <CampoInfo label="Fecha de alta" value={formatDate(cliente.fecha_alta || cliente.created_at, "long")} />
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Notas</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {cliente.notas || "Sin notas."}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
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
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
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
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Select
                        value={formData.estado}
                        onValueChange={(v: any) => setFormData({ ...formData, estado: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="potencial">Potencial</SelectItem>
                          <SelectItem value="inactivo">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="notas">Notas internas</Label>
                      <Textarea
                        id="notas"
                        rows={4}
                        value={formData.notas}
                        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                        placeholder="Notas sobre el cliente..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: PROYECTOS ===== */}
        <TabsContent value="proyectos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" /> Proyectos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {proyectos.length === 0 ? (
                <EmptyState
                  icon={<FolderKanban className="h-10 w-10" />}
                  text="Este cliente aún no tiene proyectos."
                />
              ) : (
                <div className="space-y-3">
                  {proyectos.map((p) => {
                    const est = ESTADOS_PROYECTO[p.estado] || ESTADOS_PROYECTO.planeacion
                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-4 rounded-lg border border-white/5 p-4 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{p.nombre}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${est.color}`}>
                              {est.label}
                            </span>
                          </div>
                          {p.descripcion && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{p.descripcion}</p>
                          )}
                        </div>
                        <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                          <div className="w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-arena-gradient"
                              style={{ width: `${p.progreso}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{p.progreso}%</span>
                        </div>
                        {p.fecha_entrega_estimada && (
                          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(p.fecha_entrega_estimada)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: SERVICIOS ===== */}
        <TabsContent value="servicios">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" /> Servicios contratados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {servicios.length === 0 ? (
                <EmptyState
                  icon={<Briefcase className="h-10 w-10" />}
                  text="Este cliente aún no tiene servicios contratados."
                />
              ) : (
                <div className="space-y-3">
                  {servicios.map((cs) => {
                    const estadoColor: Record<string, string> = {
                      activo: "bg-green-500/20 text-green-400",
                      completado: "bg-blue-500/20 text-blue-400",
                      pausado: "bg-amber-500/20 text-amber-400",
                      cancelado: "bg-red-500/20 text-red-400",
                    }
                    const nombreServ = (cs as any).servicio?.nombre || "Servicio"
                    return (
                      <div
                        key={cs.id}
                        className="flex items-center gap-4 rounded-lg border border-white/5 p-4"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{nombreServ}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Desde {formatDate(cs.fecha_inicio)}
                            {cs.fecha_fin ? ` · hasta ${formatDate(cs.fecha_fin)}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {cs.precio_acordado != null && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <CircleDollarSign className="h-3.5 w-3.5" />
                              {formatCurrency(Number(cs.precio_acordado))}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${estadoColor[cs.estado] || estadoColor.activo}`}>
                            {cs.estado}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: ACTIVIDAD ===== */}
        <TabsContent value="actividad">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ActivityIcon className="h-5 w-5" /> Historial de actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actividad.length === 0 ? (
                <EmptyState
                  icon={<ActivityIcon className="h-10 w-10" />}
                  text="Sin actividad registrada."
                />
              ) : (
                <div className="relative space-y-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                  {actividad.map((a) => (
                    <div key={a.id} className="relative flex gap-4 pl-7">
                      <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-arena-gradient ring-4 ring-background" />
                      <div>
                        <p className="text-sm">{a.descripcion}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatRelativeTime(a.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CampoInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
      <div className="mb-3 opacity-40">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  )
}

export default function ClienteDetallePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
        </div>
      }
    >
      <ClienteDetalleContent />
    </Suspense>
  )
}
