"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import type { Cliente, InteraccionIA } from "@/types"
import { GaugeCircle, Phone, Bot, AlertCircle } from "lucide-react"

export default function ConsumoPage() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [interacciones, setInteracciones] = useState<InteraccionIA[]>([])

  useEffect(() => {
    const cargar = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) { setLoading(false); return }

      const [cliRes, intRes] = await Promise.all([
        supabase.from("clientes").select("*").eq("email", session.user.email).maybeSingle(),
        supabase
          .from("interacciones_ia")
          .select("id,tipo,duracion_seg,created_at")
          .order("created_at", { ascending: false })
          .limit(100),
      ])

      if (cliRes.data) setCliente(cliRes.data as Cliente)
      if (intRes.data) setInteracciones(intRes.data as InteraccionIA[])
      setLoading(false)
    }
    cargar()
  }, [supabase])

  const minutosConsumidos = Math.round(
    interacciones.reduce((s, i) => s + (i.duracion_seg || 0), 0) / 60
  )
  const contratados = cliente?.minutos_contratados || 0
  const porcentaje = contratados > 0 ? Math.min(100, Math.round((minutosConsumidos / contratados) * 100)) : 0
  const restantes = Math.max(0, contratados - minutosConsumidos)
  const excedido = contratados > 0 && minutosConsumidos > contratados

  const mesActual = new Date().getMonth()
  const mesAnterior = new Date().getMonth() - 1
  const consumoMes = (mes: number) =>
    Math.round(
      interacciones
        .filter((i) => new Date(i.created_at).getMonth() === (mes + 12) % 12)
        .reduce((s, i) => s + (i.duracion_seg || 0), 0) / 60
    )

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi Consumo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Minutos de asistente IA contratados frente a los consumidos
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
        </div>
      ) : !cliente ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              No hay una cuenta de cliente vinculada a este usuario. Contacta con Arena13 para activar tus asistentes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <GaugeCircle className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">Contratados</span>
              </div>
              <p className="text-2xl font-bold">{contratados}<span className="text-sm font-normal text-muted-foreground"> min</span></p>
            </div>
            <div className="rounded-xl border border-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Phone className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">Consumidos</span>
              </div>
              <p className="text-2xl font-bold text-accent">{minutosConsumidos}<span className="text-sm font-normal text-muted-foreground"> min</span></p>
            </div>
            <div className="rounded-xl border border-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <GaugeCircle className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">Restantes</span>
              </div>
              <p className={`text-2xl font-bold ${excedido ? "text-red-400" : "text-green-400"}`}>
                {restantes}<span className="text-sm font-normal text-muted-foreground"> min</span>
              </p>
            </div>
            <div className="rounded-xl border border-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Bot className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">Interacciones</span>
              </div>
              <p className="text-2xl font-bold">{interacciones.length}</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Uso del pack contratado</p>
                <span className={`text-sm font-bold ${excedido ? "text-red-400" : "text-gradient"}`}>{porcentaje}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${excedido ? "bg-red-400" : "bg-arena-gradient"}`}
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
              {excedido && (
                <p className="text-xs text-red-400">
                  Has superado los minutos contratados este periodo. Arena13 te contactará para ampliar el pack.
                </p>
              )}
              {contratados === 0 && (
                <p className="text-xs text-muted-foreground">
                  Tu plan todavía no tiene minutos asignados. Contacta con Arena13 para contratar un pack.
                </p>
              )}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Este mes</p>
                  <p className="text-lg font-semibold">{consumoMes(mesActual)} min</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Mes anterior</p>
                  <p className="text-lg font-semibold text-muted-foreground">{consumoMes(mesAnterior)} min</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium mb-4">Detalle de interacciones</p>
              {interacciones.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin interacciones registradas todavía.</p>
              ) : (
                <div className="space-y-2">
                  {interacciones.slice(0, 15).map((i) => (
                    <div key={i.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/5 px-4 py-2.5">
                      <span className="flex items-center gap-2 text-sm">
                        {i.tipo === "llamada" ? (
                          <Phone className="h-3.5 w-3.5 text-accent" />
                        ) : (
                          <Bot className="h-3.5 w-3.5 text-primary" />
                        )}
                        {i.tipo === "llamada" ? "Llamada" : "Chat"}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(i.created_at, "long")}</span>
                      <span className="text-sm font-medium tabular-nums">
                        {i.duracion_seg ? `${Math.floor(i.duracion_seg / 60)}m ${i.duracion_seg % 60}s` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
