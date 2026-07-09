"use client"

import { Suspense, useEffect, useState, useCallback, useRef } from "react"
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  ArrowLeft, Mail, Phone, Building, Calendar, Save, Trash2,
  FolderKanban, Briefcase, Activity as ActivityIcon, AlertCircle,
  CheckCircle2, Clock, CircleDollarSign, Upload, Download, FileText,
  Image as ImageIcon, Palette, Globe, MapPin, Plus, X, FileDown,
  Hash, Type, Eye,
  Figma, Github, ListChecks, ExternalLink, Pencil, Link2, Vault,
  PackageOpen, FileCheck2, Check, SquareCheck,
} from "lucide-react"
import { formatDate, formatRelativeTime, formatCurrency, getInitials } from "@/lib/utils"
import type {
  Cliente, Proyecto, ClienteServicio, Actividad,
  ClienteDocumento, Trabajo, TipoDocumento, TipoServicioTrabajo, EstadoTrabajo,
} from "@/types"

// === CONSTANTES ===

const ESTADOS_CLIENTE: Record<Cliente["estado"], { label: string; variant: string }> = {
  activo: { label: "Activo", variant: "success" },
  potencial: { label: "Potencial", variant: "info" },
  inactivo: { label: "Inactivo", variant: "secondary" },
}

const ESTADOS_PROYECTO: Record<string, { label: string; color: string }> = {
  planeacion: { label: "Planificación", color: "bg-cyan-500/20 text-cyan-400" },
  en_progreso: { label: "En progreso", color: "bg-amber-500/20 text-amber-400" },
  bloqueado: { label: "Bloqueado", color: "bg-red-500/20 text-red-400" },
  revision: { label: "Revisión", color: "bg-purple-500/20 text-purple-400" },
  completado: { label: "Completado", color: "bg-green-500/20 text-green-400" },
}

const LINEAS_NEGOCIO: Record<string, { label: string; color: string }> = {
  ia: { label: "IA", color: "bg-cyan-500/20 text-cyan-400" },
  diseno: { label: "Diseño", color: "bg-purple-500/20 text-purple-400" },
  mixto: { label: "Mixto", color: "bg-slate-500/20 text-slate-300" },
}

// Configuración de endpoints externos por proyecto (enlaces de entrega)
const ENDPOINTS: { key: "figma_url" | "github_url" | "webflow_url" | "drive_url"; label: string; icon: typeof Figma; color: string }[] = [
  { key: "figma_url", label: "Figma", icon: Figma, color: "text-pink-400" },
  { key: "github_url", label: "GitHub", icon: Github, color: "text-slate-300" },
  { key: "webflow_url", label: "Webflow", icon: Globe, color: "text-blue-400" },
  { key: "drive_url", label: "Drive", icon: FileDown, color: "text-green-400" },
]

const TIPOS_DOCUMENTO: Record<TipoDocumento, { label: string; icon: typeof FileText }> = {
  logo: { label: "Logo", icon: ImageIcon },
  manual_marca: { label: "Manual de marca", icon: FileText },
  fuentes: { label: "Fuentes", icon: Type },
  colores: { label: "Colores", icon: Palette },
  paleta: { label: "Paleta", icon: Palette },
  presentacion: { label: "Presentación", icon: FileText },
  contrato: { label: "Contrato", icon: FileText },
  factura: { label: "Factura", icon: FileText },
  otro: { label: "Otro", icon: FileText },
}

const TIPOS_SERVICIO: Record<TipoServicioTrabajo, string> = {
  imagen_marca: "Imagen de marca",
  web: "Desarrollo web",
  redes_sociales: "Redes sociales",
  sem: "SEM / Ads",
  seo: "SEO",
  diseno_grafico: "Diseño gráfico",
  contenido: "Contenido",
  fotografia: "Fotografía",
  video: "Vídeo",
  consultoria: "Consultoría",
  automatizacion: "Automatización",
  ia: "Inteligencia Artificial",
  otro: "Otro",
}

const ESTADOS_TRABAJO: Record<EstadoTrabajo, { label: string; color: string }> = {
  presupuestado: { label: "Presupuestado", color: "bg-cyan-500/20 text-cyan-400" },
  aprobado: { label: "Aprobado", color: "bg-blue-500/20 text-blue-400" },
  en_proceso: { label: "En proceso", color: "bg-amber-500/20 text-amber-400" },
  completado: { label: "Completado", color: "bg-green-500/20 text-green-400" },
  facturado: { label: "Facturado", color: "bg-purple-500/20 text-purple-400" },
  cancelado: { label: "Cancelado", color: "bg-red-500/20 text-red-400" },
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// === COMPONENTE PRINCIPAL ===

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
  const [documentos, setDocumentos] = useState<ClienteDocumento[]>([])
  const [trabajos, setTrabajos] = useState<Trabajo[]>([])

  // Edición info general
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Edición identidad visual
  const [editingBrand, setEditingBrand] = useState(false)
  const [savingBrand, setSavingBrand] = useState(false)

  // Logo upload
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    nombre: "", email: "", telefono: "", empresa: "", estado: "potencial" as Cliente["estado"],
    notas: "", sector: "", web: "", direccion: "", ciudad: "", codigo_postal: "",
    descripcion: "", fecha_captacion: "",
  })

  const [brandData, setBrandData] = useState({
    color_primario: "", color_secundario: "", color_acento: "",
    fuente_principal: "", fuente_secundaria: "", descripcion_marca: "",
    instagram: "", linkedin: "", facebook: "",
  })

  const cargarTodo = useCallback(async () => {
    if (!id) { setError("ID de cliente no especificado"); setLoading(false); return }
    try {
      setError("")
      const [cliRes, proyRes, servRes, actRes, docRes, trabRes] = await Promise.all([
        supabase.from("clientes").select("*").eq("id", id).single(),
        supabase.from("proyectos").select("*").eq("cliente_id", id).order("created_at", { ascending: false }),
        supabase.from("cliente_servicios").select("*, servicio:servicios(*)").eq("cliente_id", id).order("created_at", { ascending: false }),
        supabase.from("actividad").select("*").eq("cliente_id", id).order("created_at", { ascending: false }).limit(20),
        supabase.from("cliente_documentos").select("*").eq("cliente_id", id).order("created_at", { ascending: false }),
        supabase.from("trabajos").select("*").eq("cliente_id", id).order("fecha", { ascending: false }),
      ])

      if (cliRes.error) throw cliRes.error
      if (!cliRes.data) { setError("Cliente no encontrado"); setLoading(false); return }

      setCliente(cliRes.data)
      setProyectos(proyRes.data || [])
      setServicios(servRes.data || [])
      setActividad(actRes.data || [])
      setDocumentos(docRes.data || [])
      setTrabajos(trabRes.data || [])

      const c = cliRes.data
      setFormData({
        nombre: c.nombre || "", email: c.email || "", telefono: c.telefono || "",
        empresa: c.empresa || "", estado: c.estado || "potencial", notas: c.notas || "",
        sector: c.sector || "", web: c.web || "", direccion: c.direccion || "",
        ciudad: c.ciudad || "", codigo_postal: c.codigo_postal || "",
        descripcion: c.descripcion || "",
        fecha_captacion: c.fecha_captacion || "",
      })
      setBrandData({
        color_primario: c.color_primario || "", color_secundario: c.color_secundaria || "",
        color_acento: c.color_acento || "", fuente_principal: c.fuente_principal || "",
        fuente_secundaria: c.fuente_secundaria || "", descripcion_marca: c.descripcion_marca || "",
        instagram: c.instagram || "", linkedin: c.linkedin || "", facebook: c.facebook || "",
      })
    } catch (err) {
      console.error("Error cargando cliente:", err)
      setError("No se pudo cargar el cliente.")
    } finally {
      setLoading(false)
    }
  }, [id, supabase])

  useEffect(() => { cargarTodo() }, [cargarTodo])

  // === HANDLERS INFO GENERAL ===

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
        sector: formData.sector.trim() || null,
        web: formData.web.trim() || null,
        direccion: formData.direccion.trim() || null,
        ciudad: formData.ciudad.trim() || null,
        codigo_postal: formData.codigo_postal.trim() || null,
        descripcion: formData.descripcion.trim() || null,
        fecha_captacion: formData.fecha_captacion || null,
      }
      const { error } = await supabase.from("clientes").update(payload).eq("id", id)
      if (error) throw error
      setCliente({ ...cliente!, ...formData } as Cliente)
      setEditing(false)
      flashSaved()
    } catch (err) {
      console.error("Error guardando:", err)
      alert("No se pudo guardar.")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBrand = async () => {
    if (!id) return
    setSavingBrand(true)
    try {
      const payload = {
        color_primario: brandData.color_primario || null,
        color_secundario: brandData.color_secundario || null,
        color_acento: brandData.color_acento || null,
        fuente_principal: brandData.fuente_principal || null,
        fuente_secundaria: brandData.fuente_secundaria || null,
        descripcion_marca: brandData.descripcion_marca || null,
        instagram: brandData.instagram || null,
        linkedin: brandData.linkedin || null,
        facebook: brandData.facebook || null,
      }
      const { error } = await supabase.from("clientes").update(payload).eq("id", id)
      if (error) throw error
      setCliente({ ...cliente!, ...payload } as Cliente)
      setEditingBrand(false)
      flashSaved()
    } catch (err) {
      console.error("Error:", err)
      alert("No se pudo guardar la identidad visual.")
    } finally {
      setSavingBrand(false)
    }
  }

  // === LOGO UPLOAD ===

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    setUploadingLogo(true)
    try {
      const ext = file.name.split(".").pop()
      const path = `${id}/logo_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from("cliente-docs").upload(path, file, { cacheControl: "3600", upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from("cliente-docs").getPublicUrl(path)
      const logo_url = urlData.publicUrl
      const { error: dbErr } = await supabase.from("clientes").update({ logo_url }).eq("id", id)
      if (dbErr) throw dbErr
      setCliente({ ...cliente!, logo_url })
    } catch (err) {
      console.error("Error subiendo logo:", err)
      alert("No se pudo subir el logo.")
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ""
    }
  }

  // === DOCUMENTOS ===

  const handleDocUpload = async (file: File, tipo: TipoDocumento, titulo: string, descripcion: string) => {
    if (!id) return
    try {
      const path = `${id}/docs/${Date.now()}_${file.name}`
      const { error: upErr } = await supabase.storage.from("cliente-docs").upload(path, file)
      if (upErr) throw upErr
      const { error: insErr, data } = await supabase
        .from("cliente_documentos")
        .insert({
          cliente_id: id, tipo, titulo: titulo || file.name,
          descripcion: descripcion || null, nombre_archivo: file.name,
          storage_path: path, mime_type: file.type, tamano_bytes: file.size,
          es_publico: false,
        })
        .select()
        .single()
      if (insErr) throw insErr
      setDocumentos([data, ...documentos])
    } catch (err) {
      console.error("Error:", err)
      alert("No se pudo subir el documento.")
    }
  }

  const handleDocDelete = async (doc: ClienteDocumento) => {
    if (!confirm(`¿Eliminar "${doc.titulo}"?`)) return
    try {
      await supabase.storage.from("cliente-docs").remove([doc.storage_path])
      await supabase.from("cliente_documentos").delete().eq("id", doc.id)
      setDocumentos(documentos.filter((d) => d.id !== doc.id))
    } catch (err) {
      console.error("Error:", err)
      alert("No se pudo eliminar.")
    }
  }

  const getDocUrl = (path: string) => supabase.storage.from("cliente-docs").getPublicUrl(path).data.publicUrl

  // === TRABAJOS ===

  const [nuevoTrabajo, setNuevoTrabajo] = useState({
    fecha: new Date().toISOString().split("T")[0],
    tipo_servicio: "imagen_marca" as TipoServicioTrabajo,
    titulo: "", descripcion: "", coste: "", estado: "presupuestado" as EstadoTrabajo, notas: "",
  })
  const [addingTrabajo, setAddingTrabajo] = useState(false)

  const handleAddTrabajo = async () => {
    if (!id || !nuevoTrabajo.titulo.trim()) return
    setAddingTrabajo(true)
    try {
      const { data, error } = await supabase.from("trabajos").insert({
        cliente_id: id, fecha: nuevoTrabajo.fecha, tipo_servicio: nuevoTrabajo.tipo_servicio,
        titulo: nuevoTrabajo.titulo.trim(), descripcion: nuevoTrabajo.descripcion.trim() || null,
        coste: parseFloat(nuevoTrabajo.coste) || 0, estado: nuevoTrabajo.estado,
        notas: nuevoTrabajo.notas.trim() || null,
      }).select().single()
      if (error) throw error
      setTrabajos([data, ...trabajos])
      setNuevoTrabajo({
        fecha: new Date().toISOString().split("T")[0], tipo_servicio: "imagen_marca",
        titulo: "", descripcion: "", coste: "", estado: "presupuestado", notas: "",
      })
    } catch (err) {
      console.error("Error:", err)
      alert("No se pudo añadir el trabajo.")
    } finally {
      setAddingTrabajo(false)
    }
  }

  const handleDeleteTrabajo = async (trabajoId: string) => {
    if (!confirm("¿Eliminar este trabajo?")) return
    try {
      const { error } = await supabase.from("trabajos").delete().eq("id", trabajoId)
      if (error) throw error
      setTrabajos(trabajos.filter((t) => t.id !== trabajoId))
    } catch (err) {
      console.error("Error:", err)
      alert("No se pudo eliminar.")
    }
  }

  const handleUpdateTrabajoEstado = async (trabajoId: string, estado: EstadoTrabajo) => {
    try {
      const { error } = await supabase.from("trabajos").update({ estado }).eq("id", trabajoId)
      if (error) throw error
      setTrabajos(trabajos.map((t) => t.id === trabajoId ? { ...t, estado } : t))
    } catch (err) {
      console.error("Error:", err)
    }
  }

  // === PROYECTOS: endpoints + checklist ===

  const [editProyecto, setEditProyecto] = useState<Proyecto | null>(null)
  const [proyectoForm, setProyectoForm] = useState({
    estado: "planeacion" as Proyecto["estado"],
    progreso: 0,
    linea_negocio: "mixto" as NonNullable<Proyecto["linea_negocio"]>,
    figma_url: "", github_url: "", webflow_url: "", drive_url: "",
    notas_internas: "",
  })
  const [savingProyecto, setSavingProyecto] = useState(false)
  const [expandedChecklist, setExpandedChecklist] = useState<string | null>(null)
  const [newChecklistText, setNewChecklistText] = useState<Record<string, string>>({})

  const openEditProyecto = (p: Proyecto) => {
    setEditProyecto(p)
    setProyectoForm({
      estado: p.estado, progreso: p.progreso,
      linea_negocio: p.linea_negocio || "mixto",
      figma_url: p.figma_url || "", github_url: p.github_url || "",
      webflow_url: p.webflow_url || "", drive_url: p.drive_url || "",
      notas_internas: p.notas_internas || "",
    })
  }

  const handleSaveProyecto = async () => {
    if (!editProyecto) return
    setSavingProyecto(true)
    try {
      const payload = {
        estado: proyectoForm.estado,
        progreso: proyectoForm.progreso,
        linea_negocio: proyectoForm.linea_negocio,
        figma_url: proyectoForm.figma_url.trim() || null,
        github_url: proyectoForm.github_url.trim() || null,
        webflow_url: proyectoForm.webflow_url.trim() || null,
        drive_url: proyectoForm.drive_url.trim() || null,
        notas_internas: proyectoForm.notas_internas.trim() || null,
      }
      const { error } = await supabase.from("proyectos").update(payload).eq("id", editProyecto.id)
      if (error) throw error
      setProyectos(proyectos.map((p) => p.id === editProyecto.id ? { ...p, ...payload } : p))
      setEditProyecto(null)
      flashSaved()
    } catch (err) {
      console.error("Error:", err)
      alert("No se pudo guardar el proyecto.")
    } finally {
      setSavingProyecto(false)
    }
  }

  const handleToggleChecklistItem = async (proyectoId: string, itemId: string) => {
    const proyecto = proyectos.find((p) => p.id === proyectoId)
    if (!proyecto) return
    const checklist = (proyecto.checklist || []).map((it) =>
      it.id === itemId ? { ...it, done: !it.done } : it
    )
    setProyectos(proyectos.map((p) => p.id === proyectoId ? { ...p, checklist } : p))
    try {
      await supabase.from("proyectos").update({ checklist }).eq("id", proyectoId)
      // Progreso automático según checklist
      const done = checklist.filter((i) => i.done).length
      const auto = checklist.length > 0 ? Math.round((done / checklist.length) * 100) : proyecto.progreso
      if (auto !== proyecto.progreso) {
        await supabase.from("proyectos").update({ progreso: auto }).eq("id", proyectoId)
        setProyectos((prev) => prev.map((p) => p.id === proyectoId ? { ...p, progreso: auto } : p))
      }
    } catch (err) {
      console.error("Error:", err)
    }
  }

  const handleAddChecklistItem = async (proyectoId: string) => {
    const text = (newChecklistText[proyectoId] || "").trim()
    if (!text) return
    const proyecto = proyectos.find((p) => p.id === proyectoId)
    if (!proyecto) return
    const checklist = [...(proyecto.checklist || []), { id: crypto.randomUUID(), text, done: false }]
    setProyectos(proyectos.map((p) => p.id === proyectoId ? { ...p, checklist } : p))
    setNewChecklistText({ ...newChecklistText, [proyectoId]: "" })
    try {
      await supabase.from("proyectos").update({ checklist }).eq("id", proyectoId)
    } catch (err) {
      console.error("Error:", err)
    }
  }

  const handleRemoveChecklistItem = async (proyectoId: string, itemId: string) => {
    const proyecto = proyectos.find((p) => p.id === proyectoId)
    if (!proyecto) return
    const checklist = (proyecto.checklist || []).filter((it) => it.id !== itemId)
    setProyectos(proyectos.map((p) => p.id === proyectoId ? { ...p, checklist } : p))
    try {
      await supabase.from("proyectos").update({ checklist }).eq("id", proyectoId)
    } catch (err) {
      console.error("Error:", err)
    }
  }

  // Cuenta cuántos endpoints externos tiene un proyecto
  const countEndpoints = (p: Proyecto) =>
    ENDPOINTS.filter((e) => (p as any)[e.key]).length

  // === DELETE CLIENTE ===

  const handleDelete = async () => {
    if (!cliente) return
    if (!confirm(`¿Eliminar a "${cliente.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id)
      if (error) throw error
      router.push("/clientes")
    } catch (err) {
      console.error("Error:", err)
      alert("No se pudo eliminar el cliente.")
    }
  }

  const cancelEdit = () => {
    if (!cliente) return
    setFormData({
      nombre: cliente.nombre || "", email: cliente.email || "", telefono: cliente.telefono || "",
      empresa: cliente.empresa || "", estado: cliente.estado || "potencial", notas: cliente.notas || "",
      sector: cliente.sector || "", web: cliente.web || "", direccion: cliente.direccion || "",
      ciudad: cliente.ciudad || "", codigo_postal: cliente.codigo_postal || "",
      descripcion: cliente.descripcion || "", fecha_captacion: cliente.fecha_captacion || "",
    })
    setEditing(false)
  }

  const cancelEditBrand = () => {
    if (!cliente) return
    setBrandData({
      color_primario: cliente.color_primario || "", color_secundario: cliente.color_secundario || "",
      color_acento: cliente.color_acento || "", fuente_principal: cliente.fuente_principal || "",
      fuente_secundaria: cliente.fuente_secundaria || "", descripcion_marca: cliente.descripcion_marca || "",
      instagram: cliente.instagram || "", linkedin: cliente.linkedin || "", facebook: cliente.facebook || "",
    })
    setEditingBrand(false)
  }

  function flashSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // === RENDER ===

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
            <Button variant="outline" onClick={() => router.push("/clientes")}>Ir a clientes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const estadoInfo = ESTADOS_CLIENTE[cliente.estado] || ESTADOS_CLIENTE.potencial
  const proyectosActivos = proyectos.filter((p) => p.estado !== "completado").length
  const serviciosActivos = servicios.filter((s) => s.estado === "activo").length
  const totalFacturado = trabajos.filter((t) => t.estado === "facturado" || t.estado === "completado").reduce((sum, t) => sum + Number(t.coste), 0)
  const totalPresupuestado = trabajos.filter((t) => t.estado === "presupuestado" || t.estado === "aprobado").reduce((sum, t) => sum + Number(t.coste), 0)
  const totalEndpointsCliente = proyectos.reduce((sum, p) => sum + countEndpoints(p), 0)

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
            {/* Avatar / Logo */}
            <div className="relative shrink-0 group">
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              {cliente.logo_url ? (
                <img
                  src={cliente.logo_url}
                  alt={cliente.nombre}
                  className="h-20 w-20 rounded-2xl object-cover border border-white/10 cursor-pointer"
                  onClick={() => logoInputRef.current?.click()}
                />
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-arena-gradient shadow-glow-purple hover:opacity-90 transition-opacity"
                >
                  {uploadingLogo ? (
                    <div className="h-6 w-6 rounded-pill border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <span className="text-2xl font-semibold text-white">{getInitials(cliente.nombre)}</span>
                  )}
                </button>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl bg-black/50 cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                <Upload className="h-5 w-5 text-white" />
              </div>
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
                {cliente.email && (
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {cliente.email}</span>
                )}
                {cliente.telefono && (
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {cliente.telefono}</span>
                )}
                {cliente.web && (
                  <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />
                    <a href={cliente.web.startsWith("http") ? cliente.web : `https://${cliente.web}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{cliente.web}</a>
                  </span>
                )}
                {cliente.fecha_captacion && (
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Cliente desde {formatDate(cliente.fecha_captacion)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/5">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gradient">{formatCurrency(totalFacturado)}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Facturado</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gradient">{formatCurrency(totalPresupuestado)}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Presupuestado</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gradient">{proyectosActivos}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Proyectos activos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gradient">{documentos.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Entregables</p>
            </div>
          </div>

          {/* Datos compactos con edición inline */}
          {!editing ? (
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center justify-end mb-3">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Editar datos
                </Button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                <CampoInfo label="Sector" value={cliente.sector || "—"} />
                <CampoInfo label="Web" value={cliente.web || "—"} />
                <CampoInfo label="Teléfono" value={cliente.telefono || "—"} />
                <CampoInfo label="Ciudad" value={cliente.ciudad || "—"} />
                <CampoInfo label="Dirección" value={cliente.direccion || "—"} />
                <CampoInfo label="Cód. postal" value={cliente.codigo_postal || "—"} />
                <CampoInfo label="Captación" value={cliente.fecha_captacion ? formatDate(cliente.fecha_captacion) : "—"} />
                <CampoInfo label="Email" value={cliente.email || "—"} />
              </div>
              {(cliente.descripcion || cliente.notas) && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  {cliente.descripcion && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Descripción</p>
                      <p className="text-sm whitespace-pre-wrap">{cliente.descripcion}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Notas internas</p>
                    <p className="text-sm whitespace-pre-wrap">{cliente.notas || "Sin notas."}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} className="mt-6 pt-6 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-end mb-2">
                <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancelar</Button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Field label="Nombre *" value={formData.nombre} onChange={(v) => setFormData({ ...formData, nombre: v })} required />
                <Field label="Email" type="email" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} />
                <Field label="Teléfono" value={formData.telefono} onChange={(v) => setFormData({ ...formData, telefono: v })} />
                <Field label="Empresa" value={formData.empresa} onChange={(v) => setFormData({ ...formData, empresa: v })} />
                <Field label="Sector" value={formData.sector} onChange={(v) => setFormData({ ...formData, sector: v })} placeholder="Ej: Restauración" />
                <Field label="Web" value={formData.web} onChange={(v) => setFormData({ ...formData, web: v })} placeholder="https://..." />
                <div className="space-y-1">
                  <Label className="text-xs">Estado</Label>
                  <Select value={formData.estado} onValueChange={(v: any) => setFormData({ ...formData, estado: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="potencial">Potencial</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Captación</Label>
                  <Input type="date" value={formData.fecha_captacion} onChange={(e) => setFormData({ ...formData, fecha_captacion: e.target.value })} className="h-9" />
                </div>
                <Field label="Ciudad" value={formData.ciudad} onChange={(v) => setFormData({ ...formData, ciudad: v })} />
                <Field label="Cód. postal" value={formData.codigo_postal} onChange={(v) => setFormData({ ...formData, codigo_postal: v })} />
              </div>
              <Input value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} placeholder="Dirección" className="h-9" />
              <Textarea rows={2} value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Descripción del cliente..." />
              <Textarea rows={2} value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} placeholder="Notas internas..." />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="identidad">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="identidad" className="shrink-0">Identidad visual</TabsTrigger>
          <TabsTrigger value="boveda" className="shrink-0">
            <Vault className="h-3.5 w-3.5 mr-1.5" /> Bóveda ({documentos.length + totalEndpointsCliente})
          </TabsTrigger>
          <TabsTrigger value="trabajos" className="shrink-0">Trabajos ({trabajos.length})</TabsTrigger>
          <TabsTrigger value="proyectos" className="shrink-0">Proyectos ({proyectos.length})</TabsTrigger>
          <TabsTrigger value="servicios" className="shrink-0">Servicios ({servicios.length})</TabsTrigger>
          <TabsTrigger value="actividad" className="shrink-0">Actividad ({actividad.length})</TabsTrigger>
        </TabsList>

        {/* ===== TAB: IDENTIDAD VISUAL ===== */}
        <TabsContent value="identidad">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Identidad visual</CardTitle>
                {!editingBrand ? (
                  <Button variant="outline" size="sm" onClick={() => setEditingBrand(true)}>Editar</Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={cancelEditBrand}>Cancelar</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!editingBrand ? (
                <div className="space-y-6">
                  {/* Colores */}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Paleta de colores</p>
                    <div className="flex flex-wrap gap-4">
                      {cliente.color_primario && <ColorSwatch color={cliente.color_primario} label="Primario" />}
                      {cliente.color_secundario && <ColorSwatch color={cliente.color_secundario} label="Secundario" />}
                      {cliente.color_acento && <ColorSwatch color={cliente.color_acento} label="Acento" />}
                      {!cliente.color_primario && !cliente.color_secundario && !cliente.color_acento && (
                        <p className="text-sm text-muted-foreground">No hay colores definidos.</p>
                      )}
                    </div>
                  </div>
                  {/* Fuentes */}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Tipografía</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <CampoInfo label="Fuente principal" value={cliente.fuente_principal || "—"} />
                      <CampoInfo label="Fuente secundaria" value={cliente.fuente_secundaria || "—"} />
                    </div>
                  </div>
                  {/* Descripción de marca */}
                  {cliente.descripcion_marca && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Descripción de marca</p>
                      <p className="text-sm whitespace-pre-wrap">{cliente.descripcion_marca}</p>
                    </div>
                  )}
                  {/* Redes sociales */}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Redes sociales</p>
                    <div className="flex flex-wrap gap-4">
                      {cliente.instagram && <SocialLink icon="instagram" url={cliente.instagram} label={cliente.instagram} />}
                      {cliente.linkedin && <SocialLink icon="linkedin" url={cliente.linkedin} label={cliente.linkedin} />}
                      {cliente.facebook && <SocialLink icon="facebook" url={cliente.facebook} label={cliente.facebook} />}
                      {!cliente.instagram && !cliente.linkedin && !cliente.facebook && (
                        <p className="text-sm text-muted-foreground">Sin redes sociales registradas.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <Label className="mb-3 block">Paleta de colores</Label>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <ColorPicker label="Color primario" value={brandData.color_primario} onChange={(v) => setBrandData({ ...brandData, color_primario: v })} />
                      <ColorPicker label="Color secundario" value={brandData.color_secundario} onChange={(v) => setBrandData({ ...brandData, color_secundario: v })} />
                      <ColorPicker label="Color de acento" value={brandData.color_acento} onChange={(v) => setBrandData({ ...brandData, color_acento: v })} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Fuente principal" value={brandData.fuente_principal} onChange={(v) => setBrandData({ ...brandData, fuente_principal: v })} placeholder="Ej: Montserrat" />
                    <Field label="Fuente secundaria" value={brandData.fuente_secundaria} onChange={(v) => setBrandData({ ...brandData, fuente_secundaria: v })} placeholder="Ej: Open Sans" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc_marca">Descripción de marca</Label>
                    <Textarea id="desc_marca" rows={3} value={brandData.descripcion_marca} onChange={(e) => setBrandData({ ...brandData, descripcion_marca: e.target.value })} placeholder="Valores de marca, tono, personalidad..." />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Field label="Instagram" value={brandData.instagram} onChange={(v) => setBrandData({ ...brandData, instagram: v })} placeholder="@usuario" />
                    <Field label="LinkedIn" value={brandData.linkedin} onChange={(v) => setBrandData({ ...brandData, linkedin: v })} placeholder="URL" />
                    <Field label="Facebook" value={brandData.facebook} onChange={(v) => setBrandData({ ...brandData, facebook: v })} placeholder="URL" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={cancelEditBrand}>Cancelar</Button>
                    <Button onClick={handleSaveBrand} disabled={savingBrand}>{savingBrand ? "Guardando..." : "Guardar identidad visual"}</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: BÓVEDA DE ENTREGABLES ===== */}
        <TabsContent value="boveda">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Vault className="h-5 w-5" /> Bóveda de Entregables</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Resumen de la bóveda */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-lg border border-white/5 p-3 text-center">
                  <p className="text-2xl font-bold text-gradient">{documentos.length}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Archivos</p>
                </div>
                <div className="rounded-lg border border-white/5 p-3 text-center">
                  <p className="text-2xl font-bold text-gradient">{totalEndpointsCliente}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Endpoints</p>
                </div>
                <div className="rounded-lg border border-white/5 p-3 text-center">
                  <p className="text-2xl font-bold text-gradient">{(() => {
                    const all = proyectos.flatMap((p) => p.checklist || [])
                    return all.length > 0 ? Math.round((all.filter((i) => i.done).length / all.length) * 100) : 0
                  })()}%</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Checklist</p>
                </div>
              </div>

              <DocumentUploader onUpload={handleDocUpload} />

              {/* Entregables agrupados por categoría */}
              {documentos.length === 0 ? (
                <div className="mt-6">
                  <EmptyState icon={<PackageOpen className="h-10 w-10" />} text="Aún no hay entregables en la bóveda." />
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {Object.entries(
                    documentos.reduce<Record<string, ClienteDocumento[]>>((acc, doc) => {
                      const cat = (TIPOS_DOCUMENTO[doc.tipo]?.label) || "Otros"
                      ;(acc[cat] = acc[cat] || []).push(doc)
                      return acc
                    }, {})
                  ).map(([categoria, docs]) => (
                    <div key={categoria}>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <FileCheck2 className="h-3.5 w-3.5" /> {categoria} <span className="text-muted-foreground/60">({docs.length})</span>
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {docs.map((doc) => {
                          const tipoInfo = TIPOS_DOCUMENTO[doc.tipo] || TIPOS_DOCUMENTO.otro
                          const Icon = tipoInfo.icon
                          return (
                            <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-white/5 p-3 hover:border-primary/30 transition-colors group">
                              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-white/5 shrink-0">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{doc.titulo}</p>
                                <p className="text-xs text-muted-foreground truncate">{formatBytes(doc.tamano_bytes)} · {doc.nombre_archivo}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <a href={getDocUrl(doc.storage_path)} target="_blank" rel="noopener noreferrer" download>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Download className="h-4 w-4" /></Button>
                                </a>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDocDelete(doc)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Endpoints de acceso rápido (enlaces externos de los proyectos) */}
              {totalEndpointsCliente > 0 && (
                <div className="mt-6 pt-6 border-t border-white/5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5" /> Endpoints de acceso rápido
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {proyectos.map((p) =>
                      ENDPOINTS.map((e) => {
                        const url = (p as any)[e.key] as string | undefined
                        if (!url) return null
                        const Icon = e.icon
                        return (
                          <a
                            key={`${p.id}-${e.key}`}
                            href={url.startsWith("http") ? url : `https://${url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-lg border border-white/5 p-3 hover:border-primary/40 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-white/5 shrink-0">
                              <Icon className={`h-4 w-4 ${e.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{e.label}</p>
                              <p className="text-xs text-muted-foreground truncate">{p.nombre}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                          </a>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: TRABAJOS / COSTES ===== */}
        <TabsContent value="trabajos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CircleDollarSign className="h-5 w-5" /> Trabajos y costes</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <ResumenCard label="Facturado" value={formatCurrency(totalFacturado)} color="text-green-400" />
                <ResumenCard label="En proceso" value={formatCurrency(trabajos.filter((t) => t.estado === "en_proceso" || t.estado === "aprobado").reduce((s, t) => s + Number(t.coste), 0))} color="text-amber-400" />
                <ResumenCard label="Presupuestado" value={formatCurrency(totalPresupuestado)} color="text-cyan-400" />
                <ResumenCard label="Total" value={formatCurrency(trabajos.reduce((s, t) => s + Number(t.coste), 0))} color="text-gradient" />
              </div>

              {/* Formulario nuevo trabajo */}
              <TrabajoForm
                nuevo={nuevoTrabajo}
                setNuevo={setNuevoTrabajo}
                onAdd={handleAddTrabajo}
                adding={addingTrabajo}
              />

              {/* Lista de trabajos */}
              <div className="mt-6 space-y-2">
                {trabajos.length === 0 ? (
                  <EmptyState icon={<CircleDollarSign className="h-10 w-10" />} text="No hay trabajos registrados." />
                ) : (
                  trabajos.map((t) => {
                    const est = ESTADOS_TRABAJO[t.estado] || ESTADOS_TRABAJO.presupuestado
                    return (
                      <div key={t.id} className="flex items-start gap-3 rounded-lg border border-white/5 p-4 group hover:border-primary/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-medium">{t.titulo}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${est.color}`}>{est.label}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">{TIPOS_SERVICIO[t.tipo_servicio]}</span>
                          </div>
                          {t.descripcion && <p className="text-sm text-muted-foreground">{t.descripcion}</p>}
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(t.fecha)}</span>
                            {t.notas && <span>· {t.notas}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold">{formatCurrency(Number(t.coste))}</span>
                          <Select value={t.estado} onValueChange={(v: any) => handleUpdateTrabajoEstado(t.id, v)}>
                            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(ESTADOS_TRABAJO).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="sm" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteTrabajo(t.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: PROYECTOS ===== */}
        <TabsContent value="proyectos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FolderKanban className="h-5 w-5" /> Proyectos y entregables</CardTitle>
            </CardHeader>
            <CardContent>
              {proyectos.length === 0 ? (
                <EmptyState icon={<FolderKanban className="h-10 w-10" />} text="Este cliente aún no tiene proyectos." />
              ) : (
                <div className="space-y-3">
                  {proyectos.map((p) => {
                    const est = ESTADOS_PROYECTO[p.estado] || ESTADOS_PROYECTO.planeacion
                    const linea = LINEAS_NEGOCIO[p.linea_negocio || "mixto"] || LINEAS_NEGOCIO.mixto
                    const checklist = p.checklist || []
                    const doneItems = checklist.filter((i) => i.done).length
                    const epCount = countEndpoints(p)
                    const expanded = expandedChecklist === p.id
                    return (
                      <div key={p.id} className="rounded-lg border border-white/5 p-4 hover:border-primary/30 transition-colors">
                        {/* Fila superior */}
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium truncate">{p.nombre}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${est.color}`}>{est.label}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${linea.color}`}>{linea.label}</span>
                              {epCount > 0 && (
                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
                                  <Link2 className="h-3 w-3" /> {epCount}
                                </span>
                              )}
                            </div>
                            {p.descripcion && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{p.descripcion}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                              <div className="w-28 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full bg-arena-gradient" style={{ width: `${p.progreso}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground w-8 text-right">{p.progreso}%</span>
                              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEditProyecto(p)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            {p.fecha_entrega_estimada && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" /> {formatDate(p.fecha_entrega_estimada)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Endpoints (enlaces externos de entrega) */}
                        {epCount > 0 && (
                          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/5">
                            {ENDPOINTS.map((e) => {
                              const url = (p as any)[e.key] as string | undefined
                              if (!url) return null
                              const Icon = e.icon
                              return (
                                <a
                                  key={e.key}
                                  href={url.startsWith("http") ? url : `https://${url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-white/10 hover:border-primary/40 hover:bg-white/5 transition-colors"
                                  title={`Abrir ${e.label}`}
                                >
                                  <Icon className={`h-3.5 w-3.5 ${e.color}`} />
                                  <span>{e.label}</span>
                                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                </a>
                              )
                            })}
                          </div>
                        )}

                        {/* Checklist de entregables */}
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <button
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setExpandedChecklist(expanded ? null : p.id)}
                          >
                            <ListChecks className="h-4 w-4" />
                            Checklist de entregables
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${doneItems === checklist.length && checklist.length > 0 ? "bg-green-500/20 text-green-400" : "bg-white/5"}`}>
                              {doneItems}/{checklist.length}
                            </span>
                          </button>

                          {expanded && (
                            <div className="mt-3 space-y-1.5">
                              {checklist.length === 0 && (
                                <p className="text-xs text-muted-foreground pl-6">Sin tareas. Añade la primera abajo.</p>
                              )}
                              {checklist.map((item) => (
                                <div key={item.id} className="flex items-center gap-2 group">
                                  <button
                                    onClick={() => handleToggleChecklistItem(p.id, item.id)}
                                    className="shrink-0"
                                  >
                                    {item.done ? (
                                      <SquareCheck className="h-4 w-4 text-green-400" />
                                    ) : (
                                      <div className="h-4 w-4 rounded border border-white/20" />
                                    )}
                                  </button>
                                  <span className={`text-sm flex-1 ${item.done ? "line-through text-muted-foreground" : ""}`}>
                                    {item.text}
                                  </span>
                                  <Button
                                    variant="ghost" size="sm"
                                    className="h-6 px-1.5 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemoveChecklistItem(p.id, item.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              <div className="flex items-center gap-2 pt-1">
                                <Input
                                  value={newChecklistText[p.id] || ""}
                                  onChange={(e) => setNewChecklistText({ ...newChecklistText, [p.id]: e.target.value })}
                                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddChecklistItem(p.id) } }}
                                  placeholder="Añadir entregable..."
                                  className="h-8 text-sm"
                                />
                                <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => handleAddChecklistItem(p.id)}>
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
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
              <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Servicios contratados</CardTitle>
            </CardHeader>
            <CardContent>
              {servicios.length === 0 ? (
                <EmptyState icon={<Briefcase className="h-10 w-10" />} text="Este cliente aún no tiene servicios contratados." />
              ) : (
                <div className="space-y-3">
                  {servicios.map((cs) => {
                    const estadoColor: Record<string, string> = {
                      activo: "bg-green-500/20 text-green-400", completado: "bg-blue-500/20 text-blue-400",
                      pausado: "bg-amber-500/20 text-amber-400", cancelado: "bg-red-500/20 text-red-400",
                    }
                    const nombreServ = (cs as any).servicio?.nombre || "Servicio"
                    return (
                      <div key={cs.id} className="flex items-center gap-4 rounded-lg border border-white/5 p-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{nombreServ}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">Desde {formatDate(cs.fecha_inicio)}{cs.fecha_fin ? ` · hasta ${formatDate(cs.fecha_fin)}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {cs.precio_acordado != null && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground"><CircleDollarSign className="h-3.5 w-3.5" />{formatCurrency(Number(cs.precio_acordado))}</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${estadoColor[cs.estado] || estadoColor.activo}`}>{cs.estado}</span>
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
              <CardTitle className="flex items-center gap-2"><ActivityIcon className="h-5 w-5" /> Historial de actividad</CardTitle>
            </CardHeader>
            <CardContent>
              {actividad.length === 0 ? (
                <EmptyState icon={<ActivityIcon className="h-10 w-10" />} text="Sin actividad registrada." />
              ) : (
                <div className="relative space-y-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                  {actividad.map((a) => (
                    <div key={a.id} className="relative flex gap-4 pl-7">
                      <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-arena-gradient ring-4 ring-background" />
                      <div>
                        <p className="text-sm">{a.descripcion}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(a.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== DIALOG: EDITAR PROYECTO (endpoints + estado + notas) ===== */}
      <Dialog open={!!editProyecto} onOpenChange={(open) => !open && setEditProyecto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" /> {editProyecto?.nombre}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Estado + línea + progreso */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Estado</Label>
                <Select value={proyectoForm.estado} onValueChange={(v: any) => setProyectoForm({ ...proyectoForm, estado: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ESTADOS_PROYECTO).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Línea de negocio</Label>
                <Select value={proyectoForm.linea_negocio} onValueChange={(v: any) => setProyectoForm({ ...proyectoForm, linea_negocio: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LINEAS_NEGOCIO).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Progreso: {proyectoForm.progreso}%</Label>
                <input
                  type="range" min={0} max={100} step={5}
                  value={proyectoForm.progreso}
                  onChange={(e) => setProyectoForm({ ...proyectoForm, progreso: Number(e.target.value) })}
                  className="w-full accent-primary h-9"
                />
              </div>
            </div>

            {/* Endpoints externos */}
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" /> Endpoints de entrega
              </p>
              <div className="space-y-2">
                {ENDPOINTS.map((e) => {
                  const Icon = e.icon
                  return (
                    <div key={e.key} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 w-28 shrink-0 text-sm">
                        <Icon className={`h-4 w-4 ${e.color}`} /> {e.label}
                      </div>
                      <Input
                        value={(proyectoForm as any)[e.key]}
                        onChange={(ev) => setProyectoForm({ ...proyectoForm, [e.key]: ev.target.value })}
                        placeholder={`https://${e.label.toLowerCase()}.com/...`}
                        className="h-9"
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Notas internas */}
            <div className="space-y-1.5">
              <Label className="text-xs">Notas internas del equipo</Label>
              <Textarea
                rows={3}
                value={proyectoForm.notas_internas}
                onChange={(e) => setProyectoForm({ ...proyectoForm, notas_internas: e.target.value })}
                placeholder="Notas internas del proyecto..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditProyecto(null)}>Cancelar</Button>
            <Button onClick={handleSaveProyecto} disabled={savingProyecto}>
              {savingProyecto ? "Guardando..." : "Guardar proyecto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// === SUBCOMPONENTES ===

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

function Field({ label, value, onChange, type = "text", required, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} />
    </div>
  )
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-16 w-16 rounded-xl border border-white/10" style={{ backgroundColor: color }} />
      <div className="text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xs font-mono uppercase">{color}</p>
      </div>
    </div>
  )
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded-lg border border-white/10 bg-transparent cursor-pointer"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="#000000" className="font-mono uppercase" />
        {value && (
          <Button variant="ghost" size="sm" onClick={() => onChange("")}><X className="h-3.5 w-3.5" /></Button>
        )}
      </div>
    </div>
  )
}

function SocialLink({ icon, url, label }: { icon: string; url: string; label: string }) {
  return (
    <a
      href={url.startsWith("http") ? url : `https://${url}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
    >
      {icon === "instagram" && <Hash className="h-3.5 w-3.5" />}
      {icon === "linkedin" && <Briefcase className="h-3.5 w-3.5" />}
      {icon === "facebook" && <Globe className="h-3.5 w-3.5" />}
      {label}
    </a>
  )
}

function ResumenCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-white/5 p-3 text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}

function DocumentUploader({ onUpload }: {
  onUpload: (file: File, tipo: TipoDocumento, titulo: string, descripcion: string) => void
}) {
  const [tipo, setTipo] = useState<TipoDocumento>("logo")
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!titulo) setTitulo(file.name)
    onUpload(file, tipo, titulo || file.name, descripcion)
    setTitulo(""); setDescripcion("")
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div className="rounded-lg border border-dashed border-white/10 p-4 space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Tipo de documento</Label>
          <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TIPOS_DOCUMENTO).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Título</Label>
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nombre descriptivo..." />
        </div>
        <div className="space-y-2">
          <Label>Descripción (opcional)</Label>
          <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Breve nota..." />
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" /> Seleccionar archivo y subir
        </Button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
      </div>
    </div>
  )
}

function TrabajoForm({ nuevo, setNuevo, onAdd, adding }: {
  nuevo: { fecha: string; tipo_servicio: TipoServicioTrabajo; titulo: string; descripcion: string; coste: string; estado: EstadoTrabajo; notas: string }
  setNuevo: (v: any) => void
  onAdd: () => void
  adding: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-white/5 p-4">
      <button
        className="flex items-center gap-2 text-sm font-medium text-primary"
        onClick={() => setExpanded(!expanded)}
      >
        <Plus className="h-4 w-4" /> Añadir trabajo
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={nuevo.fecha} onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Servicio</Label>
              <Select value={nuevo.tipo_servicio} onValueChange={(v: any) => setNuevo({ ...nuevo, tipo_servicio: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_SERVICIO).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={nuevo.titulo} onChange={(e) => setNuevo({ ...nuevo, titulo: e.target.value })} placeholder="Ej: Diseño de logotipo" />
            </div>
            <div className="space-y-2">
              <Label>Coste (€)</Label>
              <Input type="number" min="0" step="0.01" value={nuevo.coste} onChange={(e) => setNuevo({ ...nuevo, coste: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} placeholder="Detalle del trabajo..." />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={nuevo.estado} onValueChange={(v: any) => setNuevo({ ...nuevo, estado: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADOS_TRABAJO).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Input value={nuevo.notas} onChange={(e) => setNuevo({ ...nuevo, notas: e.target.value })} placeholder="Notas internas..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setExpanded(false)}>Cerrar</Button>
            <Button onClick={onAdd} disabled={adding || !nuevo.titulo.trim()}>
              {adding ? "Añadiendo..." : "Añadir trabajo"}
            </Button>
          </div>
        </div>
      )}
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
