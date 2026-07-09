"use client"

import { useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart3, Download, TrendingUp, Users, FolderKanban, Euro,
  Target, Trophy, PieChart,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { Cliente, Proyecto, Trabajo, Presupuesto, Factura } from "@/types"

// Exporta un array de objetos a CSV y dispara descarga
function exportCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => {
      const v = r[h] ?? ""
      const s = String(v).replace(/"/g, '""')
      return /[",\n]/.test(s) ? `"${s}"` : s
    }).join(",")),
  ].join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function calcPresupuestoTotal(p: Presupuesto) {
  const sub = (p.lineas || []).reduce((s, l) => s + Number(l.cantidad) * Number(l.precio_unitario), 0)
  return sub * (1 - (p.descuento_porcentaje ?? 0) / 100) * (1 + (p.iva_porcentaje ?? 0) / 100)
}
function calcFacturaTotal(f: Factura) {
  const sub = (f.lineas || []).reduce((s, l) => s + Number(l.cantidad) * Number(l.precio_unitario), 0)
  return sub * (1 - (f.descuento_porcentaje ?? 0) / 100) * (1 + (f.iva_porcentaje ?? 0) / 100)
}

export default function ReportesPage() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [trabajos, setTrabajos] = useState<Trabajo[]>([])
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [facturas, setFacturas] = useState<Factura[]>([])

  const cargar = useCallback(async () => {
    setLoading(true)
    const [c, p, t, pre, fac] = await Promise.all([
      supabase.from("clientes").select("*"),
      supabase.from("proyectos").select("*"),
      supabase.from("trabajos").select("*"),
      supabase.from("presupuestos").select("*, presupuesto_lineas(*)"),
      supabase.from("facturas").select("*, factura_lineas(*)"),
    ])
    if (c.data) setClientes(c.data)
    if (p.data) setProyectos(p.data)
    if (t.data) setTrabajos(t.data)
    if (pre.data) setPresupuestos(pre.data)
    if (fac.data) setFacturas(fac.data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { cargar() }, [cargar])

  // === KPIs ===
  const ingresosFacturados = facturas.filter((f) => ["emitida", "pagada"].includes(f.estado)).reduce((s, f) => s + calcFacturaTotal(f), 0)
  const ingresosCobrados = facturas.filter((f) => f.estado === "pagada").reduce((s, f) => s + calcFacturaTotal(f), 0)
  const clientesActivos = clientes.filter((c) => c.estado === "activo").length
  const proyectosActivos = proyectos.filter((p) => p.estado !== "completado").length
  const presupuestoMedio = presupuestos.length > 0 ? presupuestos.reduce((s, p) => s + calcPresupuestoTotal(p), 0) / presupuestos.length : 0

  // Ingresos por mes (facturas + trabajos facturados)
  const porMes: Record<string, number> = {}
  facturas.forEach((f) => {
    const mes = (f.fecha_emision || "").slice(0, 7)
    if (mes) porMes[mes] = (porMes[mes] || 0) + (f.estado !== "anulada" && f.estado !== "borrador" ? calcFacturaTotal(f) : 0)
  })
  trabajos.filter((t) => ["facturado", "completado"].includes(t.estado)).forEach((t) => {
    const mes = (t.fecha || "").slice(0, 7)
    if (mes) porMes[mes] = (porMes[mes] || 0) + Number(t.coste || 0)
  })
  const mesesOrd = Object.keys(porMes).sort()
  const maxMes = Math.max(1, ...Object.values(porMes))
  const ultimosMeses = mesesOrd.slice(-8)

  // Ingresos por tipo de servicio (trabajos)
  const porServicio: Record<string, number> = {}
  trabajos.forEach((t) => {
    const key = t.tipo_servicio || "otro"
    porServicio[key] = (porServicio[key] || 0) + Number(t.coste || 0)
  })
  const serviciosOrd = Object.entries(porServicio).sort((a, b) => b[1] - a[1])
  const maxServicio = Math.max(1, ...serviciosOrd.map((s) => s[1]))
  const LABELS_SERVICIO: Record<string, string> = {
    imagen_marca: "Imagen de marca", web: "Web", redes_sociales: "Redes sociales", sem: "SEM",
    seo: "SEO", diseno_grafico: "Diseño gráfico", contenido: "Contenido", fotografia: "Fotografía",
    video: "Vídeo", consultoria: "Consultoría", automatizacion: "Automatización", ia: "IA", otro: "Otro",
  }

  // Top clientes por facturación
  const porCliente: Record<string, { nombre: string; total: number }> = {}
  facturas.forEach((f) => {
    if (f.estado === "anulada" || f.estado === "borrador") return
    const cli = clientes.find((c) => c.id === f.cliente_id)
    if (!porCliente[f.cliente_id]) porCliente[f.cliente_id] = { nombre: cli?.nombre || "Sin nombre", total: 0 }
    porCliente[f.cliente_id].total += calcFacturaTotal(f)
  })
  trabajos.filter((t) => ["facturado", "completado"].includes(t.estado)).forEach((t) => {
    const cli = clientes.find((c) => c.id === t.cliente_id)
    if (!porCliente[t.cliente_id]) porCliente[t.cliente_id] = { nombre: cli?.nombre || "Sin nombre", total: 0 }
    porCliente[t.cliente_id].total += Number(t.coste || 0)
  })
  const topClientes = Object.entries(porCliente).sort((a, b) => b[1].total - a[1].total).slice(0, 5)
  const maxCliente = Math.max(1, ...topClientes.map((c) => c[1].total))

  // Funnel de presupuestos
  const funnel = {
    borrador: presupuestos.filter((p) => p.estado === "borrador").length,
    enviado: presupuestos.filter((p) => p.estado === "enviado").length,
    aceptado: presupuestos.filter((p) => p.estado === "aceptado").length,
    rechazado: presupuestos.filter((p) => p.estado === "rechazado").length,
  }
  const funnelMax = Math.max(1, ...Object.values(funnel))

  const formatMes = (m: string) => {
    const [y, mo] = m.split("-")
    const nombres = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    return `${nombres[Number(mo)]} ${y.slice(2)}`
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" /></div>
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Reportes</h1>
          <p className="text-sm text-muted-foreground mt-1">Analítica y métricas de negocio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV("clientes.csv", clientes as any)}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Clientes
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportCSV("facturas.csv", facturas.map((f) => ({ numero: f.numero, cliente: f.cliente?.nombre, estado: f.estado, total: calcFacturaTotal(f).toFixed(2), fecha: f.fecha_emision })) as any)}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Facturas
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="pt-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Euro className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Ingresos</span></div>
          <p className="text-2xl font-bold text-gradient">{formatCurrency(ingresosFacturados)}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatCurrency(ingresosCobrados)} cobrados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Users className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Clientes</span></div>
          <p className="text-2xl font-bold">{clientes.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{clientesActivos} activos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><FolderKanban className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Proyectos</span></div>
          <p className="text-2xl font-bold">{proyectos.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{proyectosActivos} activos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Target className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Presup. medio</span></div>
          <p className="text-2xl font-bold">{formatCurrency(presupuestoMedio)}</p>
          <p className="text-xs text-muted-foreground mt-1">{presupuestos.length} presupuestos</p>
        </CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ingresos por mes */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" /> Ingresos por mes</CardTitle></CardHeader>
          <CardContent>
            {ultimosMeses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos de ingresos aún.</p>
            ) : (
              <div className="flex items-end justify-between gap-2 h-48">
                {ultimosMeses.map((m) => (
                  <div key={m} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium">{formatCurrency(porMes[m]).replace(/\.\d+/, "")}</span>
                    <div className="w-full bg-white/5 rounded-t-lg relative overflow-hidden flex-1 flex items-end">
                      <div className="w-full bg-arena-gradient rounded-t-lg transition-all" style={{ height: `${(porMes[m] / maxMes) * 100}%` }} />
                    </div>
                    <span className="text-[0.65rem] text-muted-foreground">{formatMes(m)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funnel presupuestos */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><PieChart className="h-4 w-4" /> Embudo de presupuestos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Borradores", val: funnel.borrador, color: "bg-slate-500" },
              { label: "Enviados", val: funnel.enviado, color: "bg-blue-500" },
              { label: "Aceptados", val: funnel.aceptado, color: "bg-green-500" },
              { label: "Rechazados", val: funnel.rechazado, color: "bg-red-500" },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1"><span>{s.label}</span><span className="font-medium">{s.val}</span></div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${(s.val / funnelMax) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-white/5 text-sm">
              <span className="text-muted-foreground">Tasa de conversión: </span>
              <span className="font-bold text-green-400">
                {funnel.enviado + funnel.aceptado + funnel.rechazado > 0
                  ? Math.round((funnel.aceptado / (funnel.enviado + funnel.aceptado + funnel.rechazado)) * 100)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Ingresos por servicio */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4" /> Ingresos por servicio</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {serviciosOrd.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sin trabajos registrados.</p>
            ) : serviciosOrd.slice(0, 7).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs w-28 shrink-0 text-muted-foreground">{LABELS_SERVICIO[key] || key}</span>
                <div className="flex-1 h-5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-arena-gradient rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max(8, (val / maxServicio) * 100)}%` }}>
                    <span className="text-[0.65rem] font-medium text-white">{formatCurrency(val).replace(/\.\d+/, "")}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top clientes */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-4 w-4" /> Top clientes por facturación</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topClientes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sin facturación registrada.</p>
            ) : topClientes.map(([id, info], i) => (
              <div key={id} className="flex items-center gap-3">
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-arena-gradient text-xs font-bold text-white shrink-0">{i + 1}</span>
                <span className="flex-1 text-sm font-medium truncate">{info.nombre}</span>
                <div className="w-24 h-2 rounded-full bg-white/5 overflow-hidden hidden sm:block">
                  <div className="h-full bg-arena-gradient rounded-full" style={{ width: `${(info.total / maxCliente) * 100}%` }} />
                </div>
                <span className="text-sm font-bold text-gradient shrink-0 w-20 text-right">{formatCurrency(info.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
