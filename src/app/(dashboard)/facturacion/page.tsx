"use client"

import { useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft, Plus, Trash2, Receipt, Check, Printer, FileText,
  Copy, Euro, Calendar, AlertTriangle, CheckCircle2, Clock,
} from "lucide-react"
import { formatCurrency, formatDate, getInitials } from "@/lib/utils"
import type { Factura, FacturaLinea, FacturaEstado, MetodoPago, Presupuesto } from "@/types"

const ESTADOS: Record<FacturaEstado, { label: string; color: string }> = {
  borrador: { label: "Borrador", color: "bg-slate-500/20 text-slate-300" },
  emitida: { label: "Emitida", color: "bg-blue-500/20 text-blue-400" },
  pagada: { label: "Pagada", color: "bg-green-500/20 text-green-400" },
  vencida: { label: "Vencida", color: "bg-red-500/20 text-red-400" },
  anulada: { label: "Anulada", color: "bg-zinc-500/20 text-zinc-400" },
}

const METODOS: Record<MetodoPago, string> = {
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  efectivo: "Efectivo",
  bizum: "Bizum",
  paypal: "PayPal",
  otro: "Otro",
}

function calcSubtotal(lineas: { cantidad: number; precio_unitario: number }[]) {
  return lineas.reduce((s, l) => s + (Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0), 0)
}

function calcFacturaTotal(f: { lineas?: FacturaLinea[]; descuento_porcentaje: number; iva_porcentaje: number }) {
  const sub = calcSubtotal(f.lineas || [])
  const base = sub * (1 - (f.descuento_porcentaje ?? 0) / 100)
  return base * (1 + (f.iva_porcentaje ?? 0) / 100)
}

interface LineaForm { id: string; descripcion: string; cantidad: string; precio_unitario: string }

export default function FacturacionPage() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [clientes, setClientes] = useState<{ id: string; nombre: string; empresa?: string }[]>([])
  const [presupuestosAceptados, setPresupuestosAceptados] = useState<Presupuesto[]>([])
  const [vista, setVista] = useState<"lista" | "form" | "detalle">("lista")
  const [editando, setEditando] = useState<Factura | null>(null)
  const [detalle, setDetalle] = useState<Factura | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")

  const [form, setForm] = useState({
    cliente_id: "", fecha_vencimiento: "", descuento_porcentaje: "0",
    iva_porcentaje: "21", metodo_pago: "transferencia", notas: "",
  })
  const [lineas, setLineas] = useState<LineaForm[]>([
    { id: crypto.randomUUID(), descripcion: "", cantidad: "1", precio_unitario: "0" },
  ])

  const cargar = useCallback(async () => {
    setLoading(true)
    const [facRes, cliRes, preRes] = await Promise.all([
      supabase.from("facturas").select("*, cliente:clientes(id,nombre,empresa,email), factura_lineas(*)").order("created_at", { ascending: false }),
      supabase.from("clientes").select("id,nombre,empresa").order("nombre"),
      supabase.from("presupuestos").select("*, presupuesto_lineas(*)").eq("estado", "aceptado").order("created_at", { ascending: false }),
    ])
    if (facRes.data) setFacturas(facRes.data as Factura[])
    if (cliRes.data) setClientes(cliRes.data)
    if (preRes.data) setPresupuestosAceptados(preRes.data as Presupuesto[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { cargar() }, [cargar])

  const subtotal = calcSubtotal(lineas)
  const base = subtotal * (1 - (Number(form.descuento_porcentaje) || 0) / 100)
  const total = base * (1 + (Number(form.iva_porcentaje) || 0) / 100)

  const resetForm = () => {
    setForm({ cliente_id: "", fecha_vencimiento: "", descuento_porcentaje: "0", iva_porcentaje: "21", metodo_pago: "transferencia", notas: "" })
    setLineas([{ id: crypto.randomUUID(), descripcion: "", cantidad: "1", precio_unitario: "0" }])
    setError("")
  }

  const nuevaFactura = () => { setEditando(null); resetForm(); setVista("form") }

  const editarFactura = (f: Factura) => {
    setEditando(f)
    setForm({
      cliente_id: f.cliente_id || "", fecha_vencimiento: f.fecha_vencimiento || "",
      descuento_porcentaje: String(f.descuento_porcentaje ?? 0), iva_porcentaje: String(f.iva_porcentaje ?? 21),
      metodo_pago: f.metodo_pago || "transferencia", notas: f.notas || "",
    })
    setLineas(
      (f.lineas && f.lineas.length ? f.lineas : [{ id: crypto.randomUUID(), descripcion: "", cantidad: "1", precio_unitario: "0" } as any]).map((l: any) => ({
        id: l.id || crypto.randomUUID(), descripcion: l.descripcion || "",
        cantidad: String(l.cantidad ?? 1), precio_unitario: String(l.precio_unitario ?? 0),
      }))
    )
    setError("")
    setVista("form")
  }

  const addLinea = () => setLineas([...lineas, { id: crypto.randomUUID(), descripcion: "", cantidad: "1", precio_unitario: "0" }])
  const removeLinea = (id: string) => setLineas(lineas.filter((l) => l.id !== id))
  const updateLinea = (id: string, field: keyof LineaForm, value: string) =>
    setLineas(lineas.map((l) => (l.id === id ? { ...l, [field]: value } : l)))

  // Convertir presupuesto aceptado en factura
  const convertirPresupuesto = (p: Presupuesto) => {
    setEditando(null)
    setForm({
      cliente_id: p.cliente_id, fecha_vencimiento: "",
      descuento_porcentaje: String(p.descuento_porcentaje ?? 0),
      iva_porcentaje: String(p.iva_porcentaje ?? 21),
      metodo_pago: "transferencia", notas: p.notas || "",
    })
    setLineas(
      (p.lineas && p.lineas.length ? p.lineas : [{ id: crypto.randomUUID(), descripcion: "", cantidad: "1", precio_unitario: "0" } as any]).map((l: any) => ({
        id: crypto.randomUUID(), descripcion: l.descripcion || "",
        cantidad: String(l.cantidad ?? 1), precio_unitario: String(l.precio_unitario ?? 0),
      }))
    )
    setError("")
    setVista("form")
  }

  const generarNumero = async () => {
    const year = new Date().getFullYear()
    const count = facturas.filter((f) => f.numero?.includes(`F-${year}`)).length + 1
    return `F-${year}-${String(count).padStart(3, "0")}`
  }

  const guardar = async (emitir = false) => {
    if (!form.cliente_id) { setError("Selecciona un cliente."); return }
    const lineasValidas = lineas.filter((l) => l.descripcion.trim() && Number(l.cantidad) > 0)
    if (lineasValidas.length === 0) { setError("Añade al menos una línea."); return }

    setSaving(true); setError("")
    try {
      const estado = editando ? (emitir && editando.estado === "borrador" ? "emitida" : editando.estado) : (emitir ? "emitida" : "borrador")
      const payload = {
        cliente_id: form.cliente_id,
        estado,
        fecha_vencimiento: form.fecha_vencimiento || null,
        descuento_porcentaje: Number(form.descuento_porcentaje) || 0,
        iva_porcentaje: Number(form.iva_porcentaje) || 0,
        metodo_pago: form.metodo_pago,
        notas: form.notas.trim() || null,
      }

      let facturaId = editando?.id
      if (editando) {
        const { error: e } = await supabase.from("facturas").update(payload).eq("id", editando.id)
        if (e) throw e
        await supabase.from("factura_lineas").delete().eq("factura_id", editando.id)
      } else {
        const numero = await generarNumero()
        const { data, error: e } = await supabase.from("facturas").insert({ ...payload, numero }).select().single()
        if (e) throw e
        facturaId = data.id
      }

      const lineasInsert = lineasValidas.map((l, i) => ({
        factura_id: facturaId, orden: i, descripcion: l.descripcion.trim(),
        cantidad: Number(l.cantidad), precio_unitario: Number(l.precio_unitario),
      }))
      const { error: lErr } = await supabase.from("factura_lineas").insert(lineasInsert)
      if (lErr) throw lErr

      await cargar()
      setVista("lista")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "No se pudo guardar.")
    } finally {
      setSaving(false)
    }
  }

  const cambiarEstado = async (f: Factura, estado: FacturaEstado) => {
    const update: any = { estado }
    if (estado === "pagada") update.fecha_pago = new Date().toISOString().split("T")[0]
    try {
      const { error } = await supabase.from("facturas").update(update).eq("id", f.id)
      if (error) throw error
      setFacturas(facturas.map((x) => (x.id === f.id ? { ...x, ...update } : x)))
      if (detalle?.id === f.id) setDetalle({ ...detalle, ...update })
    } catch (err) { console.error(err) }
  }

  const verDetalle = async (f: Factura) => {
    const { data } = await supabase.from("facturas").select("*, cliente:clientes(*), factura_lineas(*)").eq("id", f.id).single()
    setDetalle(data as Factura); setVista("detalle")
  }

  // === STATS ===
  const totalFacturado = facturas.filter((f) => ["emitida", "pagada"].includes(f.estado)).reduce((s, f) => s + calcFacturaTotal(f), 0)
  const totalCobrado = facturas.filter((f) => f.estado === "pagada").reduce((s, f) => s + calcFacturaTotal(f), 0)
  const totalPendiente = facturas.filter((f) => f.estado === "emitida").reduce((s, f) => s + calcFacturaTotal(f), 0)
  const hoy = new Date()
  const vencidas = facturas.filter((f) => f.estado === "emitida" && f.fecha_vencimiento && new Date(f.fecha_vencimiento) < hoy).length

  const facturasFiltradas = filtroEstado === "todos" ? facturas : facturas.filter((f) => f.estado === filtroEstado)

  // ===== VISTA: DETALLE =====
  if (vista === "detalle" && detalle) {
    const c = detalle.cliente
    const sub = calcSubtotal(detalle.lineas || [])
    const dsc = sub * ((detalle.descuento_porcentaje ?? 0) / 100)
    const baseD = sub - dsc
    const imp = baseD * ((detalle.iva_porcentaje ?? 0) / 100)
    const tot = baseD + imp
    const est = ESTADOS[detalle.estado]

    return (
      <div className="space-y-6 animate-in">
        <div className="flex items-center justify-between print:hidden">
          <Button variant="ghost" size="sm" onClick={() => setVista("lista")}><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1.5" /> Imprimir / PDF</Button>
        </div>

        <Card className="print:border-0 print:shadow-none">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-bold">Arena13</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${est.color}`}>{est.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">Diseño de Producto Digital & IA</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Factura</p>
                <p className="text-lg font-bold font-mono">{detalle.numero}</p>
                <p className="text-xs text-muted-foreground mt-1">Emitida: {formatDate(detalle.fecha_emision)}</p>
                {detalle.fecha_vencimiento && <p className="text-xs text-muted-foreground">Vence: {formatDate(detalle.fecha_vencimiento)}</p>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="rounded-lg border border-white/5 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Facturar a</p>
                <p className="font-medium">{c?.nombre || "—"}</p>
                {c?.empresa && <p className="text-sm text-muted-foreground">{c.empresa}</p>}
                {c?.email && <p className="text-sm text-muted-foreground">{c.email}</p>}
              </div>
              <div className="rounded-lg border border-white/5 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Pago</p>
                <p className="font-medium">{detalle.metodo_pago ? METODOS[detalle.metodo_pago] : "—"}</p>
                {detalle.estado === "pagada" && detalle.fecha_pago && <p className="text-sm text-green-400">Pagada: {formatDate(detalle.fecha_pago)}</p>}
              </div>
            </div>

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

            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(sub)}</span></div>
                {(detalle.descuento_porcentaje ?? 0) > 0 && <div className="flex justify-between text-green-400"><span>Descuento ({detalle.descuento_porcentaje}%)</span><span>−{formatCurrency(dsc)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Base</span><span>{formatCurrency(baseD)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IVA ({detalle.iva_porcentaje}%)</span><span>{formatCurrency(imp)}</span></div>
                <div className="flex justify-between pt-2 border-t border-white/10 text-lg font-bold"><span>TOTAL</span><span className="text-gradient">{formatCurrency(tot)}</span></div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-2 print:hidden">
              {detalle.estado !== "pagada" && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => cambiarEstado(detalle, "pagada")}><Check className="h-3.5 w-3.5 mr-1.5" /> Marcar pagada</Button>
              )}
              {detalle.estado === "borrador" && (
                <Button variant="outline" size="sm" onClick={() => cambiarEstado(detalle, "emitida")}>Emitir</Button>
              )}
              <Button variant="outline" size="sm" onClick={() => editarFactura(detalle)}><FileText className="h-3.5 w-3.5 mr-1.5" /> Editar</Button>
              <Button variant="ghost" size="sm" className="text-red-400" onClick={() => cambiarEstado(detalle, "anulada")} disabled={detalle.estado === "anulada"}>Anular</Button>
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
          <Button variant="ghost" size="sm" onClick={() => setVista("lista")}><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Button>
          <h1 className="text-xl font-semibold">{editando ? "Editar factura" : "Nueva factura"}</h1>
          <div className="w-24" />
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

            {/* Convertir desde presupuesto */}
            {!editando && presupuestosAceptados.length > 0 && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                <p className="text-sm font-medium text-green-400 mb-2">Convertir desde presupuesto aceptado:</p>
                <div className="flex flex-wrap gap-2">
                  {presupuestosAceptados.map((p) => (
                    <Button key={p.id} variant="outline" size="sm" onClick={() => convertirPresupuesto(p)}>
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> {p.numero} · {p.cliente?.nombre || "Cliente"}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona cliente..." /></SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` · ${c.empresa}` : ""}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vencimiento</Label>
                <Input type="date" value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} />
              </div>
            </div>

            {/* Líneas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Líneas de factura</Label>
                <Button variant="outline" size="sm" onClick={addLinea}><Plus className="h-3.5 w-3.5 mr-1" /> Añadir</Button>
              </div>
              <div className="space-y-2">
                {lineas.map((l, i) => (
                  <div key={l.id} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-12 sm:col-span-6" value={l.descripcion} onChange={(e) => updateLinea(l.id, "descripcion", e.target.value)} placeholder={`Línea ${i + 1}`} />
                    <Input className="col-span-4 sm:col-span-2 text-center" type="number" min="0" step="0.01" value={l.cantidad} onChange={(e) => updateLinea(l.id, "cantidad", e.target.value)} />
                    <Input className="col-span-5 sm:col-span-2 text-right" type="number" min="0" step="0.01" value={l.precio_unitario} onChange={(e) => updateLinea(l.id, "precio_unitario", e.target.value)} />
                    <div className="col-span-2 sm:col-span-1 text-right text-sm font-medium">{formatCurrency((Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0))}</div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="sm" className="text-destructive h-8 w-8 p-0" onClick={() => removeLinea(l.id)} disabled={lineas.length === 1}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Descuento (%)</Label><Input type="number" min="0" max="100" step="0.5" value={form.descuento_porcentaje} onChange={(e) => setForm({ ...form, descuento_porcentaje: e.target.value })} /></div>
              <div className="space-y-2"><Label>IVA (%)</Label><Input type="number" min="0" step="0.5" value={form.iva_porcentaje} onChange={(e) => setForm({ ...form, iva_porcentaje: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <Select value={form.metodo_pago} onValueChange={(v) => setForm({ ...form, metodo_pago: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(METODOS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2"><Label>Notas</Label><Textarea rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Notas de la factura..." /></div>

            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-sm rounded-lg border border-white/5 p-4">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Base</span><span>{formatCurrency(base)}</span></div>
                <div className="flex justify-between pt-2 border-t border-white/10 text-lg font-bold"><span>TOTAL</span><span className="text-gradient">{formatCurrency(total)}</span></div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <Button variant="ghost" onClick={() => setVista("lista")}>Cancelar</Button>
              <Button variant="outline" onClick={() => guardar(false)} disabled={saving}>{saving ? "Guardando..." : "Guardar borrador"}</Button>
              <Button onClick={() => guardar(true)} disabled={saving}>{saving ? "Guardando..." : "Guardar y emitir"}</Button>
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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Receipt className="h-6 w-6 text-primary" /> Facturación</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona facturas y cobros</p>
        </div>
        <Button onClick={nuevaFactura}><Plus className="h-4 w-4 mr-2" /> Nueva factura</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Euro className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Facturado</span></div>
          <p className="text-xl font-bold">{formatCurrency(totalFacturado)}</p>
        </div>
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><CheckCircle2 className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Cobrado</span></div>
          <p className="text-xl font-bold text-green-400">{formatCurrency(totalCobrado)}</p>
        </div>
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Clock className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Pendiente</span></div>
          <p className="text-xl font-bold text-blue-400">{formatCurrency(totalPendiente)}</p>
        </div>
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><AlertTriangle className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Vencidas</span></div>
          <p className="text-xl font-bold text-red-400">{vencidas}</p>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {["todos", ...Object.keys(ESTADOS)].map((es) => (
          <Button key={es} variant={filtroEstado === es ? "default" : "outline"} size="sm" className="capitalize" onClick={() => setFiltroEstado(es)}>
            {es === "todos" ? "Todas" : ESTADOS[es as FacturaEstado].label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" /></div>
      ) : facturasFiltradas.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <Receipt className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground mb-4">{facturas.length === 0 ? "No hay facturas todavía" : "Sin facturas en este estado"}</p>
          {facturas.length === 0 && <Button onClick={nuevaFactura}><Plus className="h-4 w-4 mr-2" /> Crear primera factura</Button>}
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {facturasFiltradas.map((f) => {
            const est = ESTADOS[f.estado]
            const tot = calcFacturaTotal(f)
            const estaVencida = f.estado === "emitida" && f.fecha_vencimiento && new Date(f.fecha_vencimiento) < hoy
            return (
              <Card key={f.id} className={`hover:border-primary/30 transition-colors cursor-pointer ${estaVencida ? "border-red-500/30" : ""}`}>
                <CardContent className="p-4" onClick={() => verDetalle(f)}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-arena-gradient shrink-0">
                      <span className="text-sm font-semibold text-white">{getInitials(f.cliente?.nombre || "?")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium font-mono text-sm">{f.numero}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${est.color}`}>{est.label}</span>
                        {estaVencida && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Vencida</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                        <span>{f.cliente?.nombre || "Sin cliente"}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(f.fecha_emision)}</span>
                        {f.fecha_vencimiento && <span>Vence {formatDate(f.fecha_vencimiento)}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gradient">{formatCurrency(tot)}</p>
                      {f.estado === "pagada" && <p className="text-xs text-green-400">Cobrada</p>}
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
