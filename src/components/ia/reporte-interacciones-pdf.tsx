"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { InteraccionIA } from "@/types"
import {
  FileDown, CalendarDays, MessageSquare, Phone, Clock, CalendarCheck,
} from "lucide-react"

type Periodo = "hoy" | "semana" | "mes"

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: "hoy", label: "Hoy" },
  { key: "semana", label: "Esta Semana" },
  { key: "mes", label: "Este Mes" },
]

// ============================================
// FILTRADO ESTRICTO POR ZONA HORARIA LOCAL
// ============================================
const filtrarInteracciones = (items: InteraccionIA[], periodo: Periodo): InteraccionIA[] => {
  const ahora = new Date()

  if (periodo === "hoy") {
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0).getTime()
    const finHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999).getTime()
    return items.filter((item) => {
      const fecha = new Date(item.created_at).getTime()
      return fecha >= inicioHoy && fecha <= finHoy
    })
  }

  if (periodo === "semana") {
    const diaSemana = ahora.getDay() || 7 // Lunes = 1
    const inicioSemana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - diaSemana + 1, 0, 0, 0, 0).getTime()
    return items.filter((item) => new Date(item.created_at).getTime() >= inicioSemana)
  }

  if (periodo === "mes") {
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0).getTime()
    return items.filter((item) => new Date(item.created_at).getTime() >= inicioMes)
  }

  return items
}

const rangoTexto = (periodo: Periodo): string => {
  const ahora = new Date()
  const fmt = (d: Date) => d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
  if (periodo === "hoy") return fmt(ahora)
  if (periodo === "semana") {
    const diaSemana = ahora.getDay() || 7
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - diaSemana + 1)
    return `${fmt(inicio)} — ${fmt(ahora)}`
  }
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  return `${fmt(inicioMes)} — ${fmt(ahora)}`
}

// ============================================
// PARSEO DEFENSIVO (JSONB nulos / llamadas cortadas)
// ============================================
function nombreDe(item: InteraccionIA): string {
  return item.variables_extraidas?.nombre || item.cliente?.nombre || "Contacto no registrado"
}
function telefonoDe(item: InteraccionIA): string {
  return item.variables_extraidas?.telefono || item.telefono_contacto || "No disponible"
}
function resumenDe(item: InteraccionIA): string {
  return item.resumen_ejecutivo || item.resumen || "Interacción breve sin resumen disponible"
}
function motivoDe(item: InteraccionIA): string {
  const v = item.variables_extraidas
  return (v && (v.servicio || v.motivo)) || "Consulta general"
}

interface ReporteInteraccionesPDFProps {
  /** Marca blanca: nombre que encabeza el informe (el del cliente por defecto). */
  marca?: string
  className?: string
}

export function ReporteInteraccionesPDF({ marca, className }: ReporteInteraccionesPDFProps) {
  const supabase = useSupabase()
  const [periodo, setPeriodo] = useState<Periodo>("mes")
  const [todas, setTodas] = useState<InteraccionIA[]>([])
  const [cargando, setCargando] = useState(true)

  // Ventana amplia de descarga (2 meses); el recorte exacto se hace en cliente
  const cargar = useCallback(async () => {
    setCargando(true)
    const desde = new Date()
    desde.setMonth(desde.getMonth() - 2)
    const { data } = await supabase
      .from("interacciones_ia")
      .select("*, cliente:clientes(id,nombre,empresa)")
      .gte("created_at", desde.toISOString())
      .order("created_at", { ascending: false })
      .limit(1000)
    setTodas((data as InteraccionIA[]) || [])
    setCargando(false)
  }, [supabase])

  useEffect(() => { cargar() }, [cargar])

  // Filtrado matemático local (evalúa la fecha del navegador)
  const items = useMemo(() => filtrarInteracciones(todas, periodo), [todas, periodo])

  const marcaInforme =
    marca ||
    items.find((i) => i.cliente?.empresa)?.cliente?.empresa ||
    items.find((i) => i.cliente?.nombre)?.cliente?.nombre ||
    "Informe de Servicio"

  const kpis = useMemo(() => {
    const llamadas = items.filter((i) => i.tipo === "llamada").length
    const chats = items.filter((i) => i.tipo === "chat").length
    const minutos = Math.round(items.reduce((s, i) => s + (i.duracion_seg || 0), 0) / 60)
    const citas = items.filter((i) => (i.metadata as any)?.cita_cerrada === true).length
    return { llamadas, chats, minutos, citas }
  }, [items])

  const generadoEl = new Date().toLocaleString("es-ES")

  return (
    <div className={cn("space-y-4", className)}>
      {/* ====== CONTROLES (fuera del documento, ocultos al imprimir) ====== */}
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <CalendarDays className="h-4 w-4 text-muted-foreground mr-1" />
        {PERIODOS.map((p) => (
          <Button
            key={p.key}
            variant={periodo === p.key ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodo(p.key)}
          >
            {p.label}
          </Button>
        ))}
        <Button size="sm" onClick={() => window.print()} disabled={cargando || items.length === 0}>
          <FileDown className="h-4 w-4 mr-1.5" />
          Descargar PDF ({items.length})
        </Button>
      </div>

      {/* ====== DOCUMENTO EJECUTIVO ====== */}
      <article className="reporte-doc rounded-2xl bg-[#0A0A0A] border border-[#1A1A1A] print:!rounded-none print:!border-0 print:!bg-white">
        {/* --- Cabecera corporativa --- */}
        <header className="px-8 pt-8 pb-6 border-b border-[#1A1A1A] print:!border-[#e2e2e2]">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground print:!text-[#6b6b6b]">
                Informe Ejecutivo de Asistente Virtual
              </p>
              <h1 className="text-2xl font-semibold tracking-tight mt-1.5 truncate">{marcaInforme}</h1>
            </div>
            <div className="sm:text-right shrink-0">
              <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground print:!text-[#6b6b6b]">Periodo auditado</p>
              <p className="text-sm font-medium mt-0.5">{rangoTexto(periodo)}</p>
              <span className="inline-flex items-center gap-1.5 mt-2 rounded-pill border border-[#1A1A1A] bg-white/5 print:!border-[#e2e2e2] print:!bg-[#f6f6f6] px-3 py-1 text-[0.65rem] font-medium">
                <CalendarCheck className="h-3 w-3" />
                {items.length} interacciones registradas
              </span>
            </div>
          </div>
        </header>

        {/* --- KPIs del periodo --- */}
        <section className="px-8 py-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Phone, label: "Llamadas de voz atendidas", valor: kpis.llamadas },
            { icon: MessageSquare, label: "Conversaciones WhatsApp", valor: kpis.chats },
            { icon: CalendarCheck, label: "Citas cerradas", valor: kpis.citas },
            { icon: Clock, label: "Minutos acumulados", valor: kpis.minutos },
          ].map((kpi) => {
            const Icon = kpi.icon
            return (
              <div
                key={kpi.label}
                className="rounded-xl border border-[#1A1A1A] print:!border-[#e2e2e2] bg-white/[0.02] print:!bg-white p-4"
              >
                <Icon className="h-4 w-4 text-muted-foreground print:!text-[#6b6b6b]" />
                <p className="text-2xl font-semibold tabular-nums mt-2">{kpi.valor}</p>
                <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground print:!text-[#6b6b6b] mt-0.5">
                  {kpi.label}
                </p>
              </div>
            )
          })}
        </section>

        {/* --- Resumen ejecutivo --- */}
        <section className="px-8 pb-6">
          <div className="rounded-xl border border-[#1A1A1A] print:!border-[#e2e2e2] bg-white/[0.02] print:!bg-[#fafafa] p-5">
            <p className="text-[0.6rem] uppercase tracking-widest text-muted-foreground print:!text-[#6b6b6b] mb-2">
              Resumen ejecutivo
            </p>
            <p className="text-sm leading-relaxed">
              Durante el periodo auditado, el asistente virtual atendió{" "}
              <strong>{items.length} interacciones</strong> ({kpis.llamadas} llamadas de voz y {kpis.chats}{" "}
              conversaciones de WhatsApp), acumulando <strong>{kpis.minutos} minutos</strong> de atención
              {kpis.citas > 0 ? (
                <> y cerrando <strong>{kpis.citas} citas</strong></>
              ) : (
                <> sin citas cerradas registradas</>
              )}
              . El detalle turno a turno de cada interacción se desglosa a continuación.
            </p>
          </div>
        </section>

        {/* --- Tabla detallada --- */}
        <section className="px-8 pb-6">
          <p className="text-[0.6rem] uppercase tracking-widest text-muted-foreground print:!text-[#6b6b6b] mb-3">
            Detalle de interacciones
          </p>

          {cargando ? (
            <p className="text-sm text-muted-foreground text-center py-10">Cargando interacciones…</p>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#1A1A1A] print:!border-[#e2e2e2] py-12 text-center">
              <p className="text-sm font-medium">Sin interacciones en este periodo</p>
              <p className="text-xs text-muted-foreground print:!text-[#6b6b6b] mt-1">
                Selecciona otro periodo para consultar datos.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto print:!overflow-visible">
              <table className="w-full text-xs min-w-[680px] print:!min-w-0">
                <thead>
                  <tr className="border-b border-[#1A1A1A] print:!border-[#e2e2e2]">
                    <th className="text-left py-2.5 pr-3 font-semibold w-24">Fecha</th>
                    <th className="text-left py-2.5 pr-3 font-semibold w-28">Canal</th>
                    <th className="text-left py-2.5 pr-3 font-semibold">Contacto</th>
                    <th className="text-left py-2.5 pr-3 font-semibold w-36">Motivo</th>
                    <th className="text-left py-2.5 font-semibold">Resumen</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const f = new Date(item.created_at)
                    const esLlamada = item.tipo === "llamada"
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-[#1A1A1A]/60 print:!border-[#eee] align-top page-break-inside-avoid"
                      >
                        <td className="py-3 pr-3 whitespace-nowrap tabular-nums">
                          {f.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                          <span className="block text-muted-foreground print:!text-[#6b6b6b]">
                            {f.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-[0.6rem] font-medium whitespace-nowrap",
                              esLlamada
                                ? "border-[#01A9F2]/30 bg-[#01A9F2]/10 text-[#01A9F2] print:!border-[#01A9F2]/50 print:!bg-[#01A9F2]/10 print:!text-[#0272a3]"
                                : "border-[#787DFF]/30 bg-[#787DFF]/10 text-[#787DFF] print:!border-[#787DFF]/50 print:!bg-[#787DFF]/10 print:!text-[#4b4fb0]"
                            )}
                          >
                            {esLlamada ? <Phone className="h-2.5 w-2.5" /> : <MessageSquare className="h-2.5 w-2.5" />}
                            {esLlamada ? "Llamada de Voz" : "WhatsApp"}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="font-medium">{nombreDe(item)}</span>
                          <span className="block text-muted-foreground print:!text-[#6b6b6b] tabular-nums">
                            {telefonoDe(item)}
                          </span>
                        </td>
                        <td className="py-3 pr-3">{motivoDe(item)}</td>
                        <td className="py-3 max-w-[300px]">
                          <span className="line-clamp-2">{resumenDe(item)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* --- Pie corporativo --- */}
        <footer className="px-8 py-5 border-t border-[#1A1A1A] print:!border-[#e2e2e2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-[0.6rem] text-muted-foreground print:!text-[#6b6b6b]">
            Documento generado automáticamente · {generadoEl}
          </p>
          <p className="text-[0.6rem] text-muted-foreground print:!text-[#6b6b6b]">
            {marcaInforme} — Informe Ejecutivo de Asistente Virtual
          </p>
        </footer>
      </article>
    </div>
  )
}
