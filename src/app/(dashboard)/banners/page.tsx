"use client"

import { useEffect, useState, useCallback } from "react"
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
  Megaphone, Plus, Trash2, Pencil, Power, Clock, Tag, AlertTriangle, Zap, Info, Eye, EyeOff,
} from "lucide-react"
import { formatDate, cn } from "@/lib/utils"
import type { Banner, BannerTipo, BannerPosicion } from "@/types"

const TIPOS: Record<BannerTipo, { label: string; icon: typeof Info; color: string }> = {
  info: { label: "Información", icon: Info, color: "text-cyan-400" },
  promocion: { label: "Promoción", icon: Tag, color: "text-purple-400" },
  aviso: { label: "Aviso", icon: AlertTriangle, color: "text-amber-400" },
  urgente: { label: "Urgente", icon: Zap, color: "text-red-400" },
}

function estaVigente(b: Banner): boolean {
  if (!b.activo) return false
  const now = new Date()
  if (b.fecha_inicio && new Date(b.fecha_inicio) > now) return false
  if (b.fecha_fin && new Date(b.fecha_fin) < now) return false
  return true
}

function estadoCaducidad(b: Banner): { label: string; color: string } {
  if (!b.activo) return { label: "Inactivo", color: "text-slate-400" }
  const now = new Date()
  if (b.fecha_inicio && new Date(b.fecha_inicio) > now) return { label: "Programado", color: "text-blue-400" }
  if (b.fecha_fin) {
    const fin = new Date(b.fecha_fin)
    if (fin < now) return { label: "Caducado", color: "text-red-400" }
    const dias = Math.ceil((fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (dias <= 3) return { label: `Caduca en ${dias}d`, color: "text-amber-400" }
    return { label: `Caduca ${formatDate(b.fecha_fin)}`, color: "text-green-400" }
  }
  if (b.dias_caducidad) {
    const creado = new Date(b.created_at)
    const fin = new Date(creado.getTime() + b.dias_caducidad * 86400000)
    if (fin < now) return { label: "Caducado", color: "text-red-400" }
    const dias = Math.ceil((fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return { label: `Caduca en ${dias}d`, color: dias <= 3 ? "text-amber-400" : "text-green-400" }
  }
  return { label: "Permanente", color: "text-green-400" }
}

export default function BannersPage() {
  const supabase = useSupabase()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    titulo: "", mensaje: "", tipo: "info" as BannerTipo, color: "cyan",
    activo: true, fecha_inicio: "", fecha_fin: "", dias_caducidad: "",
    mostrar_boton: false, boton_texto: "", boton_url: "", posicion: "dashboard" as BannerPosicion,
    orden: 0, descartable: true,
  })

  const fetchBanners = useCallback(async () => {
    try {
      const { data } = await supabase.from("banners").select("*").order("created_at", { ascending: false })
      setBanners((data as Banner[]) || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchBanners() }, [fetchBanners])

  const openNew = () => {
    setEditing(null)
    setFormData({
      titulo: "", mensaje: "", tipo: "info", color: "cyan", activo: true,
      fecha_inicio: "", fecha_fin: "", dias_caducidad: "",
      mostrar_boton: false, boton_texto: "", boton_url: "", posicion: "dashboard",
      orden: 0, descartable: true,
    })
    setDialogOpen(true)
  }

  const openEdit = (b: Banner) => {
    setEditing(b)
    setFormData({
      titulo: b.titulo, mensaje: b.mensaje, tipo: b.tipo, color: b.color,
      activo: b.activo,
      fecha_inicio: b.fecha_inicio ? b.fecha_inicio.split("T")[0] : "",
      fecha_fin: b.fecha_fin ? b.fecha_fin.split("T")[0] : "",
      dias_caducidad: b.dias_caducidad?.toString() || "",
      mostrar_boton: b.mostrar_boton, boton_texto: b.boton_texto || "",
      boton_url: b.boton_url || "", posicion: b.posicion, orden: b.orden,
      descartable: b.descartable,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.titulo.trim() || !formData.mensaje.trim()) return
    setSaving(true)
    try {
      const payload = {
        titulo: formData.titulo.trim(), mensaje: formData.mensaje.trim(),
        tipo: formData.tipo, color: formData.color, activo: formData.activo,
        fecha_inicio: formData.fecha_inicio || null,
        fecha_fin: formData.fecha_fin || null,
        dias_caducidad: formData.dias_caducidad ? parseInt(formData.dias_caducidad) : null,
        mostrar_boton: formData.mostrar_boton,
        boton_texto: formData.boton_texto || null,
        boton_url: formData.boton_url || null,
        posicion: formData.posicion, orden: formData.orden,
        descartable: formData.descartable,
      }
      if (editing) {
        await supabase.from("banners").update(payload).eq("id", editing.id)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from("banners").insert({ ...payload, created_by: user?.id })
      }
      setDialogOpen(false)
      fetchBanners()
    } catch (error) {
      console.error("Error:", error)
      alert("No se pudo guardar.")
    } finally {
      setSaving(false)
    }
  }

  const toggleActivo = async (b: Banner) => {
    await supabase.from("banners").update({ activo: !b.activo }).eq("id", b.id)
    setBanners(banners.map((x) => x.id === b.id ? { ...x, activo: !x.activo } : x))
  }

  const handleDelete = async (b: Banner) => {
    if (!confirm(`¿Eliminar el banner "${b.titulo}"?`)) return
    await supabase.from("banners").delete().eq("id", b.id)
    setBanners(banners.filter((x) => x.id !== b.id))
  }

  const vigentes = banners.filter(estaVigente).length

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal tracking-tight mb-1 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" /> Banners y Notificaciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Configura mensajes promocionales y avisos para el panel · {vigentes} vigentes
          </p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nuevo banner</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center text-center text-muted-foreground">
            <Megaphone className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-sm">No hay banners configurados.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" /> Crear primer banner
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {banners.map((b) => {
            const tipoInfo = TIPOS[b.tipo] || TIPOS.info
            const TipoIcon = tipoInfo.icon
            const cad = estadoCaducidad(b)
            const vigente = estaVigente(b)
            return (
              <Card key={b.id} className={cn("transition-opacity", !b.activo && "opacity-50")}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={cn("shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-white/5", tipoInfo.color)}>
                      <TipoIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-medium">{b.titulo}</h3>
                        {vigente && <Badge variant="success" className="text-xs">Vigente</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{b.mensaje}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> <span className={cad.color}>{cad.label}</span></span>
                        {b.mostrar_boton && b.boton_texto && <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {b.boton_texto}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-white/5">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleActivo(b)} title={b.activo ? "Desactivar" : "Activar"}>
                      {b.activo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(b)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(b)} title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" /> {editing ? "Editar banner" : "Nuevo banner"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} placeholder="Ej: Oferta de verano" />
            </div>
            <div className="space-y-2">
              <Label>Mensaje *</Label>
              <Textarea rows={2} value={formData.mensaje} onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })} placeholder="Contenido del banner..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.tipo} onValueChange={(v: any) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPOS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Posición</Label>
                <Select value={formData.posicion} onValueChange={(v: any) => setFormData({ ...formData, posicion: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="top">Top (global)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-xl border border-white/5 p-4 space-y-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Caducidad</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Fecha inicio</Label>
                  <Input type="date" value={formData.fecha_inicio} onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Fecha fin</Label>
                  <Input type="date" value={formData.fecha_fin} onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input type="number" min="1" value={formData.dias_caducidad} onChange={(e) => setFormData({ ...formData, dias_caducidad: e.target.value })} placeholder="Días de caducidad" className="h-9" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">días desde creación</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/5 p-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.mostrar_boton} onChange={(e) => setFormData({ ...formData, mostrar_boton: e.target.checked })} className="accent-primary" />
                <span className="text-sm">Mostrar botón de acción</span>
              </label>
              {formData.mostrar_boton && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Texto del botón</Label>
                    <Input value={formData.boton_texto} onChange={(e) => setFormData({ ...formData, boton_texto: e.target.value })} placeholder="Ej: Abrir ticket" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">URL o ruta</Label>
                    <Input value={formData.boton_url} onChange={(e) => setFormData({ ...formData, boton_url: e.target.value })} placeholder="/tickets o https://..." />
                  </div>
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.descartable} onChange={(e) => setFormData({ ...formData, descartable: e.target.checked })} className="accent-primary" />
              <span className="text-sm">Permitir descartar (el usuario puede cerrarlo)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.activo} onChange={(e) => setFormData({ ...formData, activo: e.target.checked })} className="accent-primary" />
              <span className="text-sm">Activo</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !formData.titulo.trim() || !formData.mensaje.trim()}>
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
