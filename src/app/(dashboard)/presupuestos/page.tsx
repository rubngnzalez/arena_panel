"use client"

import { useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft, Plus, Trash2, Calculator, FileText, Check, X, Printer,
  Send, Copy, TrendingUp, Euro, Calendar,
} from "lucide-react"
import { formatCurrency, formatDate, getInitials } from "@/lib/utils"
import type { Presupuesto, PresupuestoLinea, PresupuestoEstado } from "@/types"

const ESTADOS: Record<PresupuestoEstado, { label: string; color: string }> = {
  borrador: { label: "Borrador", color: "bg-slate-500/20 text-slate-300" },
  enviado: { label: "Enviado", color: "bg-blue-500/20 text-blue-400" },
  aceptado: { label: "Aceptado", color: "bg-green-500/20 text-green-400" },
  rechazado: { label: "Rechazado", color: "bg-red-500/20 text-red-400" },
  expirado: { label: "Expirado", color: "bg-amber-500/20 text-amber-400" },
}

// Subtotal de una lista de líneas
function calcSubtotal(lineas: { cantidad: number; precio_unitario: number }[]) {
  return lineas.reduce((s, l) => s + (Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0), 0)
}

interface LineaForm {
  id: string
  descripcion: string
  cantidad: string
  precio_unitario: string
}

export default function PresupuestosPage() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [clientes, setClientes] = useState<{ id: string; nombre: string; empresa?: string }[]>([])
  const [vista, setVista] = useState<"lista" | "form" | "detalle">("lista")
  const [editando, setEditando] = useState<Presupuesto | null>(null)
  const [detalle, setDetalle] = useState<Presupuesto | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [form, setForm] = useState({
    cliente_id: "",
    titulo: "",
    descuento_porcentaje: "0",
    iva_porcentaje: "21",
    fecha_validez: "",
    notas: "",
    notas_internas: "",
  })
  const [lineas, setLineas] = useState<LineaForm[]>([
    { id: crypto.randomUUID(), descripcion: "", cantidad: "1", precio_unitario: "0" },
  ])

  const cargar = useCallback(async () => {
    setLoading(true)
    const [preRes, cliRes] = await Promise.all([
      supabase.from("presupuestos").select("*, cliente:clientes(id,nombre,empresa,email), presupuesto_lineas(*)").order("created_at", { ascending: false }),
      supabase.from("clientes").select("id,nombre,empresa").order("nombre"),
    ])
    if (preRes.data) setPresupuestos(preRes.data as Presupuesto[])
    if (cliRes.data) setClientes(cliRes.data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { cargar() }, [cargar])

  // Totales en vivo
  const subtotal = calcSubtotal(lineas)
  const descuento = subtotal * ((Number(form.descuento_porcentaje) || 0) / 100)
  const baseImponible = subtotal - descuento
  const iva = baseImponible * ((Number(form.iva_porcentaje) || 0) / 100)
  const total = baseImponible + iva

  const nuevoPresupuesto = () => {
    setEditando(null)
    setForm({
      cliente_id: "", titulo: "", descuento_porcentaje: "0", iva_porcentaje: "21",
      fecha_validez: "", notas: "", notas_internas: "",
    })
    setLineas([{ id: crypto.randomUUID(), descripcion: "", cantidad: "1", precio_unitario: "0" }])
    setError("")
    setVista("form")
  }

  const editarPresupuesto = (p: Presupuesto) => {
    setEditando(p)
    setForm({
      cliente_id: p.cliente_id || "",
      titulo: p.titulo,
      descuento_porcentaje: String(p.descuento_porcentaje ?? 0),
      iva_porcentaje: String(p.iva_porcentaje ?? 21),
      fecha_validez: p.fecha_validez || "",
      notas: p.notas || "",
      notas_internas: p.notas_internas || "",
    })
    setLineas(
      (p.lineas && p.lineas.length > 0 ? p.lineas : [{ id: crypto.randomUUID(), descripcion: "", cantidad: "1", precio_unitario: "0" } as any]).map((l: any) => ({
        id: l.id || crypto.randomUUID(),
        descripcion: l.descripcion || "",
        cantidad: String(l.cantidad ?? 1),
        precio_unitario: String(l.precio_unitario ?? 0),
      }))
    )
    setError("")
    setVista("form")
  }

  const addLinea = () => setLineas([...lineas, { id: crypto.randomUUID(), descripcion: "", cantidad: "1", precio_unitario: "0" }])
  const removeLinea = (id: string) => setLineas(lineas.filter((l) => l.id !== id))
  const updateLinea = (id: string, field: keyof LineaForm, value: string) =>
    setLineas(lineas.map((l) => (l.id === id ? { ...l, [field]: value } : l)))

  const generarNumero = async () => {
    const year = new Date().getFullYear()
    const count = presupuestos.filter((p) => p.numero?.includes(`P-${year}`)).length + 1
    return `P-${year}-${String(count).padStart(3, "0")}`
  }

  const guardar = async (estadoNuevo?: PresupuestoEstado) => {
    if (!form.titulo.trim()) { setError("El título es obligatorio."); return }
    if (!form.cliente_id) { setError("Selecciona un cliente."); return }
    const lineasValidas = lineas.filter((l) => l.descripcion.trim() && Number(l.cantidad) > 0)
    if (lineasValidas.length === 0) { setError("Añade al menos una línea con descripción y cantidad."); return }

    setSaving(true)
    setError("")
    try {
      const payload = {
        cliente_id: form.cliente_id,
        titulo: form.titulo.trim(),
        estado: estadoNuevo || (editando ? editando.estado : "borrador"),
        descuento_porcentaje: Number(form.descuento_porcentaje) || 0,
        iva_porcentaje: Number(form.iva_porcentaje) || 0,
        fecha_validez: form.fecha_validez || null,
        notas: form.notas.trim() || null,
        notas_internas: form.notas_internas.trim() || null,
      }

      let presupuestoId = editando?.id

      if (editando) {
        const { error: e } = await supabase.from("presupuestos").update(payload).eq("id", editando.id)
        if (e) throw e
        await supabase.from("presupuesto_lineas").delete().eq("presupuesto_id", editando.id)
      } else {
        const numero = await generarNumero()
        const { data, error: e } = await supabase.from("presupuestos").insert({ ...payload, numero }).select().single()
        if (e) throw e
        presupuestoId = data.id
      }

      const lineasInsert = lineasValidas.map((l, i) => ({
        presupuesto_id: presupuestoId,
        orden: i,
        descripcion: l.descripcion.trim(),
        cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario),
      }))
      const { error: lErr } = await supabase.from("presupuesto_lineas").insert(lineasInsert)
      if (lErr) throw lErr

      await cargar()
      setVista("lista")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "No se pudo guardar el presupuesto.")
    } finally {
      setSaving(false)
    }
  }

  const cambiarEstado = async (p: Presupuesto, estado: PresupuestoEstado) => {
    try {
      const { error } = await supabase.from("presupuestos").update({ estado }).eq("id", p.id)
      if (error) throw error
      setPresupuestos(presupuestos.map((x) => (x.id === p.id ? { ...x, estado } : x)))
      if (detalle?.id === p.id) setDetalle({ ...detalle, estado })
    } catch (err) {
      console.error(err)
    }
  }

  const duplicar = async (p: Presupuesto) => {
    try {
      const numero = await generarNumero()
      const { data, error } = await supabase.from("presupuestos").insert({
        cliente_id: p.cliente_id, numero, titulo: `${p.titulo} (copia)`,
        estado: "borrador", descuento_porcentaje: p.descuento_porcentaje,
        iva_porcentaje: p.iva_porcentaje, notas: p.notas, notas_internas: p.notas_internas,
      }).select().single()
      if (error) throw error
      const lineasCopy = (p.lineas || []).map((l, i) => ({
        presupuesto_id: data.id, orden: i, descripcion: l.descripcion,
        cantidad: l.cantidad, precio_unitario: l.precio_unitario,
      }))
      if (lineasCopy.length) await supabase.from("presupuesto_lineas").insert(lineasCopy)
      await cargar()
    } catch (err) {
      console.error(err)
    }
  }

  const verDetalle = async (p: Presupuesto) => {
    const { data } = await supabase
      .from("presupuestos")
      .select("*, cliente:clientes(*), presupuesto_lineas(*)")
      .eq("id", p.id)
      .single()
    setDetalle(data as Presupuesto)
    setVista("detalle")
  }

  // === STATS ===
  const totalAceptado = presupuestos.filter((p) => p.estado === "aceptado")
    .reduce((s, p) => s + calcPresupuestoTotal(p), 0)
  const totalEnviado = presupuestos.filter((p) => p.estado === "enviado")
    .reduce((s, p) => s + calcPresupuestoTotal(p), 0)
  const tasaAceptacion = presupuestos.filter((p) => ["aceptado", "rechazado"].includes(p.estado)).length > 0
    ? Math.round((presupuestos.filter((p) => p.estado === "aceptado").length / presupuestos.filter((p) => ["aceptado", "rechazado"].includes(p.estado)).length) * 100)
    : 0

  // ===== VISTA: DETALLE / IMPRESIÓN =====
  if (vista === "detalle" && detalle) {
    const c = detalle.cliente
    const sub = calcSubtotal(detalle.lineas || [])
    const dsc = sub * ((detalle.descuento_porcentaje ?? 0) / 100)
    const base = sub - dsc
    const imp = base * ((detalle.iva_porcentaje ?? 0) / 100)
    const tot = base + imp
    const est = ESTADOS[detalle.estado]

    return (
      <div className="space-y-6 animate-in">
        <div className="flex items-center justify-between print:hidden">
          <Button variant="ghost" size="sm" onClick={() => setVista("lista")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => editarPresupuesto(detalle)}>
              <FileText className="h-3.5 w-3.5 mr-1.5" /> Editar
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5 mr-1.5" /> Imprimir / PDF
            </Button>
          </div>
        </div>

        <Card className="print:border-0 print:shadow-none">
          <CardContent className="p-8">
            {/* Encabezado */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-bold">Arena13</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${est.color}`}>{est.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">Diseño de Producto Digital & IA</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Presupuesto</p>
                <p className="text-lg font-bold font-mono">{detalle.numero}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(detalle.fecha_emision)}</p>
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-6">{detalle.titulo}</h1>

            {/* Cliente */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="rounded-lg border border-white/5 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Cliente</p>
                <p className="font-medium">{c?.nombre || "—"}</p>
                {c?.empresa && <p className="text-sm text-muted-foreground">{c.empresa}</p>}
                {c?.email && <p className="text-sm text-muted-foreground">{c.email}</p>}
              </div>
              <div className="rounded-lg border border-white/5 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Validez</p>
                <p className="font-medium">{detalle.fecha_validez ? formatDate(detalle.fecha_validez) : "30 días"}</p>
              </div>
            </div>

            {/* Líneas */}
            <div className="rounded-lg border border-white/5 overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-3 font-medium">Descripción</th>
                    <th className="text-center p-3 font-medium w-20">Cant.</th>
                    <th className="text-right p-3 font-medium w-28">Precio</th>
                    <th className="text-right p-3 font-medium w-32">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(detalle.lineas || []).sort((a, b) => a.orden - b.orden).map((l) => (
                    <tr key={l.id} className="border-t border-white/5">
                      <td className="p-3">{l.descripcion}</td>
                      <td className="p-3 text-center">{l.cantidad}</td>
                      <td className="p-3 text-right">{formatCurrency(Number(l.precio_unitario))}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(Number(l.cantidad) * Number(l.precio_unitario))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(sub)}</span></div>
                {(detalle.descuento_porcentaje ?? 0) > 0 && (
                  <div className="flex justify-between text-green-400"><span>Descuento ({detalle.descuento_porcentaje}%)</span><span>−{formatCurrency(dsc)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Base imponible</span><span>{formatCurrency(base)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IVA ({detalle.iva_porcentaje}%)</span><span>{formatCurrency(imp)}</span></div>
                <div className="flex justify-between pt-2 border-t border-white/10 text-lg font-bold">
                  <span>TOTAL</span><span className="text-gradient">{formatCurrency(tot)}</span>
                </div>
              </div>
            </div>

            {detalle.notas && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Notas</p>
                <p className="text-sm whitespace-pre-wrap">{detalle.notas}</p>
              </div>
            )}

            {/* Acciones de estado */}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={() => cambiarEstado(detalle, "enviado")} disabled={detalle.estado === "enviado"}>
                <Send className="h-3.5 w-3.5 mr-1.5" /> Marcar enviado
              </Button>
              <Button variant="outline" size="sm" className="text-green-400" onClick={() => cambiarEstado(detalle, "aceptado")} disabled={detalle.estado === "aceptado"}>
                <Check className="h-3.5 w-3.5 mr-1.5" /> Aceptar
              </Button>
              <Button variant="outline" size="sm" className="text-red-400" onClick={() => cambiarEstado(detalle, "rechazado")} disabled={detalle.estado === "rechazado"}>
                <X className="h-3.5 w-3.5 mr-1.5" /> Rechazar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => duplicar(detalle)}>
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Duplicar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===== VISTA: FORMULARIO =====
  if (vista === "form") {
    return (
      <div className="space-y-6 animate-in">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setVista("lista")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <h1 className="text-xl font-semibold">{editando ? "Editar presupuesto" : "Nuevo presupuesto"}</h1>
          <div className="w-24" />
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
            )}

            {/* Datos generales */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona cliente..." /></SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` · ${c.empresa}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Título del presupuesto *</Label>
                <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Diseño web corporativo" />
              </div>
            </div>

            {/* Líneas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Líneas de presupuesto</Label>
                <Button variant="outline" size="sm" onClick={addLinea}><Plus className="h-3.5 w-3.5 mr-1" /> Añadir línea</Button>
              </div>
              <div className="space-y-2">
                {lineas.map((l, i) => (
                  <div key={l.id} className="grid grid-cols-12 gap-2 items-center">
                    <Input
                      className="col-span-12 sm:col-span-6"
                      value={l.descripcion}
                      onChange={(e) => updateLinea(l.id, "descripcion", e.target.value)}
                      placeholder={`Descripción de la línea ${i + 1}`}
                    />
                    <Input
                      className="col-span-4 sm:col-span-2 text-center"
                      type="number" min="0" step="0.01"
                      value={l.cantidad}
                      onChange={(e) => updateLinea(l.id, "cantidad", e.target.value)}
                    />
                    <Input
                      className="col-span-5 sm:col-span-2 text-right"
                      type="number" min="0" step="0.01"
                      value={l.precio_unitario}
                      onChange={(e) => updateLinea(l.id, "precio_unitario", e.target.value)}
                    />
                    <div className="col-span-2 sm:col-span-1 text-right text-sm font-medium">
                      {formatCurrency((Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0))}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="sm" className="text-destructive h-8 w-8 p-0" onClick={() => removeLinea(l.id)} disabled={lineas.length === 1}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Descuento, IVA y validez */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Descuento (%)</Label>
                <Input type="number" min="0" max="100" step="0.5" value={form.descuento_porcentaje} onChange={(e) => setForm({ ...form, descuento_porcentaje: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>IVA (%)</Label>
                <Input type="number" min="0" step="0.5" value={form.iva_porcentaje} onChange={(e) => setForm({ ...form, iva_porcentaje: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Válido hasta</Label>
                <Input type="date" value={form.fecha_validez} onChange={(e) => setForm({ ...form, fecha_validez: e.target.value })} />
              </div>
            </div>

            {/* Notas */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Notas (visibles para el cliente)</Label>
                <Textarea rows={3} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Condiciones, forma de pago..." />
              </div>
              <div className="space-y-2">
                <Label>Notas internas</Label>
                <Textarea rows={3} value={form.notas_internas} onChange={(e) => setForm({ ...form, notas_internas: e.target.value })} placeholder="Notas privadas del equipo..." />
              </div>
            </div>

            {/* Totales en vivo */}
            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-sm rounded-lg border border-white/5 p-4">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {descuento > 0 && (
                  <div className="flex justify-between text-green-400"><span>Descuento ({form.descuento_porcentaje}%)</span><span>−{formatCurrency(descuento)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Base</span><span>{formatCurrency(baseImponible)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IVA ({form.iva_porcentaje}%)</span><span>{formatCurrency(iva)}</span></div>
                <div className="flex justify-between pt-2 border-t border-white/10 text-lg font-bold">
                  <span>TOTAL</span><span className="text-gradient">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <Button variant="ghost" onClick={() => setVista("lista")}>Cancelar</Button>
              <Button onClick={() => guardar()} disabled={saving}>{saving ? "Guardando..." : "Guardar borrador"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===== VISTA: LISTA =====
  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" /> Presupuestos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Genera y gestiona cotizaciones para tus clientes</p>
        </div>
        <Button onClick={nuevoPresupuesto}><Plus className="h-4 w-4 mr-2" /> Nuevo presupuesto</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><FileText className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Total</span></div>
          <p className="text-2xl font-bold">{presupuestos.length}</p>
        </div>
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Euro className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Aceptado</span></div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalAceptado)}</p>
        </div>
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Send className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Enviado</span></div>
          <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalEnviado)}</p>
        </div>
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><TrendingUp className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Conversión</span></div>
          <p className="text-2xl font-bold text-gradient">{tasaAceptacion}%</p>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" /></div>
      ) : presupuestos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calculator className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">Aún no has creado ningún presupuesto</p>
            <Button onClick={nuevoPresupuesto}><Plus className="h-4 w-4 mr-2" /> Crear primer presupuesto</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {presupuestos.map((p) => {
            const est = ESTADOS[p.estado]
            const tot = calcPresupuestoTotal(p)
            return (
              <Card key={p.id} className="hover:border-primary/30 transition-colors cursor-pointer" >
                <CardContent className="p-4" onClick={() => verDetalle(p)}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-arena-gradient shrink-0">
                      <span className="text-sm font-semibold text-white">{getInitials(p.cliente?.nombre || "?")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{p.titulo}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${est.color}`}>{est.label}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                        <span className="font-mono">{p.numero}</span>
                        <span>{p.cliente?.nombre || "Sin cliente"}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(p.fecha_emision)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gradient">{formatCurrency(tot)}</p>
                      <p className="text-xs text-muted-foreground">{(p.lineas || []).length} líneas</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => editarPresupuesto(p)}><FileText className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => duplicar(p)}><Copy className="h-3.5 w-3.5" /></Button>
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

// Calcula el total de un presupuesto guardado
function calcPresupuestoTotal(p: Presupuesto): number {
  const sub = calcSubtotal(p.lineas || [])
  const dsc = sub * ((p.descuento_porcentaje ?? 0) / 100)
  const base = sub - dsc
  return base * (1 + (p.iva_porcentaje ?? 0) / 100)
}
