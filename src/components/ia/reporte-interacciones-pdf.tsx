"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { InteraccionIA } from "@/types"
import { FileDown, CalendarDays, MessageSquare, Phone, Bot, Clock } from "lucide-react"

type Periodo = "hoy" | "semana" | "mes"

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: "hoy", label: "Hoy" },
  { key: "semana", label: "Esta Semana" },
  { key: "mes", label: "Este Mes" },
]

function inicioDePeriodo(p: Periodo): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  if (p === "semana") {
    const dia = (d.getDay() + 6) % 7 // lunes = 0
    d.setDate(d.getDate() - dia)
  } else if (p === "mes") {
    d.setDate(1)
  }
  return d
}

/**
 * Parseo defensivo: nunca revienta con JSONB nulos o llamadas cortadas.
 */
function nombreDe(item: InteraccionIA): string {
  return item.variables_extraidas?.nombre || item.cliente?.nombre || "Contacto no registrado"
}
function telefonoDe(item: InteraccionIA): string {
  return (
    item.variables_extraidas?.telefono ||
    item.telefono_contacto ||
    "No disponible"
  )
}
function resumenDe(item: InteraccionIA): string {
  return item.resumen_ejecutivo || item.resumen || "Interacción breve sin resumen disponible"
}
function motivoDe(item: InteraccionIA): string {
  const v = item.variables_extraidas
  return (v && (v.servicio || v.motivo)) || "Consulta general"
}

interface ReporteInteraccionesPDFProps {
  /** Título del informe; suele ser el nombre del cliente o "Todos los clientes" */
  titulo?: string
  className?: string
}

export function ReporteInteraccionesPDF({ titulo = "Todos los clientes", className }: ReporteInteraccionesPDFProps) {
  const supabase = useSupabase()
  const [periodo, setPeriodo] = useState<Periodo>("mes")
  const [items, setItems] = useState<InteraccionIA[]>([])
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    setCargando(true)
    const desde = inicioDePeriodo(periodo).toISOString()
    const { data } = await supabase
      .from("interacciones_ia")
      .select("*, cliente:clientes(id,nombre,empresa)")
      .gte("created_at", desde)
      .order("created_at", { ascending: false })
      .limit(500)
    setItems((data as InteraccionIA[]) || [])
    setCargando(false)
  }, [supabase, periodo])

  useEffect(() => { cargar() }, [cargar])

  const kpis = useMemo(() => {
    const llamadas = items.filter((i) => i.tipo === "llamada").length
    const chats = items.filter((i) => i.tipo === "chat").length
    const minutos = Math.round(items.reduce((s, i) => s + (i.duracion_seg || 0), 0) / 60)
    const citas = items.filter((i) => (i.metadata as any)?.cita_cerrada === true).length
    return { llamadas, chats, minutos, citas }
  }, [items])

  const periodoLabel = {
    hoy: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }),
    semana: `Semana del ${inicioDePeriodo("semana").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`,
    mes: new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
  }[periodo]

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controles (ocultos al imprimir) */}
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

      {/* Documento imprimible */}
      <div className="arena-card print:!border-0">
        <div className="p-6 sm:p-8 space-y-6">
          {/* Cabecera */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                Arena<span className="text-gradient">13</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Informe de interacciones de asistentes IA — Diseño de Producto Digital &amp; IA
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Periodo auditado</p>
              <p className="font-medium capitalize">{periodoLabel}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {items.length} interacciones · {titulo}
              </p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/5 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" /> Llamadas atendidas</p>
              <p className="text-xl font-bold tabular-nums">{kpis.llamadas}</p>
            </div>
            <div className="rounded-xl border border-white/5 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><MessageSquare className="h-3 w-3" /> Chats WhatsApp</p>
              <p className="text-xl font-bold tabular-nums">{kpis.chats}</p>
            </div>
            <div className="rounded-xl border border-white/5 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> Citas cerradas</p>
              <p className="text-xl font-bold tabular-nums">{kpis.citas}</p>
            </div>
            <div className="rounded-xl border border-white/5 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3" /> Minutos acumulados</p>
              <p className="text-xl font-bold tabular-nums">{kpis.minutos}</p>
            </div>
          </div>

          {/* Tabla detallada */}
          {cargando ? (
            <p className="text-sm text-muted-foreground text-center py-8">Cargando interacciones…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay interacciones registradas en este periodo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[640px]">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-2.5 font-medium">Fecha</th>
                    <th className="text-left p-2.5 font-medium">Canal</th>
                    <th className="text-left p-2.5 font-medium">Contacto</th>
                    <th className="text-left p-2.5 font-medium">Motivo</th>
                    <th className="text-left p-2.5 font-medium">Resumen</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const f = new Date(item.created_at)
                    return (
                      <tr key={item.id} className="border-t border-white/5 align-top">
                        <td className="p-2.5 whitespace-nowrap tabular-nums">
                          {f.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })}
                          <span className="text-muted-foreground block">
                            {f.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="inline-flex items-center gap-1">
                            {item.tipo === "llamada" ? (
                              <><Phone className="h-3 w-3" /> Voz</>
                            ) : (
                              <><Bot className="h-3 w-3" /> WhatsApp</>
                            )}
                          </span>
                        </td>
                        <td className="p-2.5">
                          {nombreDe(item)}
                          <span className="text-muted-foreground block">{telefonoDe(item)}</span>
                        </td>
                        <td className="p-2.5">{motivoDe(item)}</td>
                        <td className="p-2.5 max-w-[280px]">
                          <span className="line-clamp-2">{resumenDe(item)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-center text-[0.6rem] text-muted-foreground">
            Generado el {new Date().toLocaleString("es-ES")} · Arena13 — arenatrece.com
          </p>
        </div>
      </div>
    </div>
  )
}
