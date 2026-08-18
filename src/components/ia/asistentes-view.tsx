"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AudioPlayer } from "@/components/ia/audio-player"
import { TranscripcionChat } from "@/components/ia/transcripcion-chat"
import { formatDate, formatRelativeTime, cn } from "@/lib/utils"
import type { InteraccionIA } from "@/types"
import { Phone, Bot, Sparkles, AlertCircle } from "lucide-react"

interface AsistentesViewProps {
  todos: boolean
}

export function AsistentesView({ todos }: AsistentesViewProps) {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [items, setItems] = useState<InteraccionIA[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const cargar = async () => {
      try {
        setError("")
        const query = supabase
          .from("interacciones_ia")
          .select("*, cliente:clientes(id,nombre,empresa)")
          .order("created_at", { ascending: false })
          .limit(100)
        const { data, error: err } = await query
        if (err) throw err
        setItems((data as InteraccionIA[]) || [])
        if (data && data.length > 0) setSelectedId(data[0].id)
      } catch {
        setError("No se pudieron cargar las interacciones.")
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [supabase])

  const seleccionada = items.find((i) => i.id === selectedId) || null

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bot className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-sm text-muted-foreground">
              {todos
                ? "Aún no hay interacciones registradas."
                : "Todavía no hay llamadas de tus asistentes. Cuando se registren aparecerán aquí."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[340px_1fr] gap-6 items-start">
          <div className="space-y-3 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
            {items.map((item) => {
              const activa = item.id === selectedId
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "w-full text-left glass rounded-2xl p-4 transition-colors",
                    activa ? "border-primary/40" : "hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="flex items-center gap-2 text-sm font-medium truncate">
                      {item.tipo === "llamada" ? (
                        <Phone className="h-3.5 w-3.5 text-accent shrink-0" />
                      ) : (
                        <Bot className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                      {todos
                        ? item.cliente?.empresa || item.cliente?.nombre || "Sin cliente"
                        : formatRelativeTime(item.created_at)}
                    </span>
                    <Badge variant="outline" className="text-[0.65rem] shrink-0 capitalize">
                      {item.origen || "ia"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.resumen || item.transcripcion?.[0]?.texto || "Sin resumen"}
                  </p>
                  {todos && (
                    <p className="text-[0.65rem] text-muted-foreground/60 mt-1">
                      {formatRelativeTime(item.created_at)}
                    </p>
                  )}
                </button>
              )
            })}
          </div>

          {seleccionada && (
            <Card className="lg:sticky lg:top-6">
              <CardContent className="p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      {seleccionada.tipo === "llamada" ? "Llamada atendida" : "Conversación"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(seleccionada.created_at, "long")}
                      {seleccionada.duracion_seg
                        ? ` · ${Math.round(seleccionada.duracion_seg / 60)} min ${seleccionada.duracion_seg % 60}s`
                        : ""}
                      {todos && seleccionada.cliente
                        ? ` · ${seleccionada.cliente.empresa || seleccionada.cliente.nombre}`
                        : ""}
                    </p>
                  </div>
                  <Badge variant="primary" className="capitalize">{seleccionada.origen || "ia"}</Badge>
                </div>

                {seleccionada.audio_url ? (
                  <AudioPlayer src={seleccionada.audio_url} duracionSeg={seleccionada.duracion_seg} />
                ) : (
                  <p className="text-xs text-muted-foreground">Sin grabación de audio.</p>
                )}

                {seleccionada.resumen && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-primary uppercase tracking-wider mb-2">
                      <Sparkles className="h-3.5 w-3.5" /> Resumen IA
                    </p>
                    <p className="text-sm leading-relaxed">{seleccionada.resumen}</p>
                  </div>
                )}

                <div className="pt-2 border-t border-white/5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                    Transcripción
                  </p>
                  <TranscripcionChat turnos={seleccionada.transcripcion || []} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
