"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, cn } from "@/lib/utils"
import type { Cliente, LiquidacionCliente, ConsumoMensual } from "@/types"
import { GaugeCircle, Phone, Bot, AlertCircle, Sparkles, History } from "lucide-react"

function BarraConsumo({ valor, limite, label }: { valor: number; limite: number; label: string }) {
  const pct = Math.min(100, Math.round((valor / Math.max(1, limite)) * 100))
  const exceso = valor > limite
  const cerca = pct >= 80 && !exceso
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("tabular-nums font-medium", exceso && "text-red-400")}>
          {valor.toLocaleString("es-ES")} / {limite.toLocaleString("es-ES")}
        </span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            exceso ? "bg-red-400" : cerca ? "bg-amber-400" : "bg-arena-gradient"
          )}
          style={{ width: `${Math.max(pct, valor > 0 ? 4 : 0)}%` }}
        />
      </div>
      {exceso && (
        <p className="text-[0.65rem] text-red-400 mt-1">
          Has superado el cupo incluido: {(valor - limite).toLocaleString("es-ES")} unidades extra este mes.
        </p>
      )}
    </div>
  )
}

export default function ConsumoPage() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [liquidacion, setLiquidacion] = useState<LiquidacionCliente | null>(null)
  const [historial, setHistorial] = useState<ConsumoMensual[]>([])

  useEffect(() => {
    const cargar = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) { setLoading(false); return }

      const { data: cli } = await supabase
        .from("clientes")
        .select("id")
        .or(`email.eq.${JSON.stringify(session.user.email)},usuario_auth_id.eq.${session.user.id}`)
        .maybeSingle()

      if (!cli?.id) { setLoading(false); return }

      const [liqRes, histRes, cliFullRes] = await Promise.all([
        supabase.rpc("calcular_liquidacion_cliente", { p_cliente_id: cli.id }),
        supabase
          .from("consumos_mensuales")
          .select("*")
          .order("periodo_mes", { ascending: false })
          .limit(12),
        supabase.from("clientes").select("*").eq("id", cli.id).single(),
      ])

      if (liqRes.data) setLiquidacion(liqRes.data as LiquidacionCliente)
      if (histRes.data) setHistorial(histRes.data as ConsumoMensual[])
      if (cliFullRes.data) setCliente(cliFullRes.data as Cliente)
      setLoading(false)
    }
    cargar()
  }, [supabase])

  const verPrecios = cliente?.permisos_portal?.ver_precios !== false

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
      </div>
    )
  }

  if (!cliente) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
          <p className="text-sm text-muted-foreground text-center max-w-md">
            No hay una cuenta de cliente vinculada a este usuario. Contacta con Arena13 para activar tus asistentes.
          </p>
        </CardContent>
      </Card>
    )
  }

  const renovacion = new Date()
  renovacion.setMonth(renovacion.getMonth() + 1)
  renovacion.setDate(1)

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi Consumo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tu plan, consumo y liquidación del mes en curso
        </p>
      </div>

      {/* Tarifa base */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Plan</span>
          </div>
          <p className="text-lg font-bold truncate">{liquidacion?.plan_nombre || cliente.plan_nombre || "Plan Básico"}</p>
          {verPrecios && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatCurrency(liquidacion?.precio_base_mensual ?? cliente.precio_base_mensual ?? 0)} / mes
            </p>
          )}
        </div>
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Phone className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Minutos voz</span>
          </div>
          <p className="text-2xl font-bold text-accent tabular-nums">
            {liquidacion?.minutos_consumidos_mes ?? cliente.minutos_consumidos_mes ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">
            de {(liquidacion?.limite_minutos_incluidos ?? cliente.limite_minutos_incluidos ?? 0).toLocaleString("es-ES")} incluidos
          </p>
        </div>
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Bot className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Mensajes WhatsApp</span>
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {liquidacion?.mensajes_whatsapp_consumidos_mes ?? cliente.mensajes_whatsapp_consumidos_mes ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">
            de {(liquidacion?.limite_mensajes_whatsapp_incluidos ?? cliente.limite_mensajes_whatsapp_incluidos ?? 0).toLocaleString("es-ES")} incluidos
          </p>
        </div>
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <GaugeCircle className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Renovación</span>
          </div>
          <p className="text-lg font-bold">
            {renovacion.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
          </p>
          <p className="text-xs text-muted-foreground">Próximo ciclo mensual</p>
        </div>
      </div>

      {/* Barras de consumo */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <p className="text-sm font-medium">Consumo del mes en curso</p>
          <BarraConsumo
            valor={liquidacion?.minutos_consumidos_mes ?? 0}
            limite={liquidacion?.limite_minutos_incluidos ?? 1}
            label="Minutos de voz"
          />
          <BarraConsumo
            valor={liquidacion?.mensajes_whatsapp_consumidos_mes ?? 0}
            limite={liquidacion?.limite_mensajes_whatsapp_incluidos ?? 1}
            label="Mensajes de WhatsApp"
          />
        </CardContent>
      </Card>

      {/* Liquidación proyectada */}
      {liquidacion?.ok && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <p className="text-sm font-medium mb-2">Liquidación proyectada del mes</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cuota fija — {liquidacion.plan_nombre}</span>
                <span className="tabular-nums">{formatCurrency(liquidacion.precio_base_mensual || 0)}</span>
              </div>
              {(liquidacion.minutos_extra || 0) > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Exceso de voz: {liquidacion.minutos_extra} min extra</span>
                  <span className="tabular-nums">{formatCurrency(liquidacion.coste_minutos_extra || 0)}</span>
                </div>
              )}
              {(liquidacion.mensajes_extra || 0) > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Exceso de WhatsApp: {liquidacion.mensajes_extra} msg extra</span>
                  <span className="tabular-nums">{formatCurrency(liquidacion.coste_mensajes_extra || 0)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-white/10 text-lg font-bold">
                <span>Total estimado</span>
                <span className="text-gradient tabular-nums">{formatCurrency(liquidacion.total_final || 0)}</span>
              </div>
            </div>

            {/* Tabla de precios unitarios */}
            {verPrecios && (
              <div className="pt-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Tarifas por unidad</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-white/5 px-3 py-2 flex justify-between">
                    <span className="text-muted-foreground">Minuto extra</span>
                    <span className="font-medium tabular-nums">{liquidacion.precio_minuto_extra} €</span>
                  </div>
                  <div className="rounded-lg border border-white/5 px-3 py-2 flex justify-between">
                    <span className="text-muted-foreground">Mensaje extra</span>
                    <span className="font-medium tabular-nums">{liquidacion.precio_mensaje_extra} €</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historial de cierres */}
      <Card>
        <CardContent className="p-6">
          <p className="flex items-center gap-2 text-sm font-medium mb-4">
            <History className="h-4 w-4" /> Historial de meses anteriores
          </p>
          {historial.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay ciclos cerrados. El primero aparecerá al finalizar el mes.
            </p>
          ) : (
            <div className="space-y-2">
              {historial.map((h) => (
                <div
                  key={h.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 px-4 py-3"
                >
                  <span className="text-sm font-medium tabular-nums">
                    {new Date(`${h.periodo_mes}-01T00:00:00`).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {h.minutos_consumidos} min · {h.mensajes_consumidos} msg
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(Number(h.total_facturado))}
                    {Number(h.total_overage) > 0 && (
                      <span className="text-amber-400 font-normal text-xs ml-1.5">
                        (+{formatCurrency(Number(h.total_overage))} excesos)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
