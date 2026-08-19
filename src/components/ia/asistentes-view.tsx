"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AudioPlayer } from "@/components/ia/audio-player"
import { TranscripcionChat } from "@/components/ia/transcripcion-chat"
import { formatDate, formatRelativeTime, cn } from "@/lib/utils"
import type { InteraccionIA } from "@/types"
import { Phone, Bot, Sparkles, AlertCircle, Star } from "lucide-react"

interface AsistentesViewProps {
  todos: boolean
}

const TAGS_FEEDBACK = [
  { key: "venta_exitosa", label: "Venta exitosa" },
  { key: "alucinacion", label: "Alucinación" },
  { key: "corte_audio", label: "Corte de audio" },
  { key: "info_incompleta", label: "Info incompleta" },
]

// Etiqueta de canal sin filtración de proveedor (marca blanca en vistas de cliente)
const CANAL_LABEL: Record<string, string> = {
  llamada: "Llamada de Voz",
  chat: "WhatsApp",
}

export function AsistentesView({ todos }: AsistentesViewProps) {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [items, setItems] = useState<InteraccionIA[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const valorar = async (id: string, valoracion: number) => {
    const actual = items.find((i) => i.id === id)
    const nueva = actual?.valoracion === valoracion ? null : valoracion
    setItems(items.map((i) => (i.id === id ? { ...i, valoracion: nueva ?? undefined } : i)))
    const { error } = await supabase
      .from("interacciones_ia")
      .update({ valoracion: nueva })
      .eq("id", id)
    if (error) console.error("Error guardando valoración:", error)
  }

  const toggleTag = async (id: string, tag: string) => {
    const actual = items.find((i) => i.id === id)
    if (!actual) return
    const actuales = actual.valoracion_tags || []
    const nuevas = actuales.includes(tag) ? actuales.filter((t) => t !== tag) : [...actuales, tag]
    setItems(items.map((i) => (i.id === id ? { ...i, valoracion_tags: nuevas } : i)))
    const { error } = await supabase
      .from("interacciones_ia")
      .update({ valoracion_tags: nuevas })
      .eq("id", id)
    if (error) console.error("Error guardando tags:", error)
  }

  useEffect(() => {
    const cargar = async () => {
      try {
        setError("")
        let query = supabase
          .from("interacciones_ia")
          .select("*, cliente:clientes(id,nombre,empresa)")
          .order("created_at", { ascending: false })
          .limit(100)

        // Vista personal (todos=false): solo las interacciones del cliente
        // vinculado al usuario (por email o usuario_auth_id)
        if (!todos) {
          const { data: { session } } = await supabase.auth.getSession()
          const email = session?.user?.email
          const uid = session?.user?.id
          if (!email && !uid) {
            setItems([])
            setLoading(false)
            return
          }
          const partes: string[] = []
          if (email) partes.push(`email.eq.${JSON.stringify(email)}`)
          if (uid) partes.push(`usuario_auth_id.eq.${uid}`)
          const { data: cli } = await supabase
            .from("clientes")
            .select("id")
            .or(partes.join(","))
            .maybeSingle()
          if (!cli?.id) {
            setItems([])
            setLoading(false)
            return
          }
          query = query.eq("cliente_id", cli.id)
        }

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
  }, [supabase, todos])

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
                    <Badge variant="outline" className="text-[0.65rem] shrink-0">
                      {CANAL_LABEL[item.tipo] || "Asistente IA"}
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
                  <Badge variant="primary">{CANAL_LABEL[seleccionada.tipo] || "Asistente IA"}</Badge>
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

                {todos && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Calidad de la interacción
                    </p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => valorar(seleccionada.id, n)}
                          aria-label={`Valorar ${n} estrellas`}
                          className="p-0.5 transition-transform hover:scale-110"
                        >
                          <Star
                            className={cn(
                              "h-5 w-5",
                              (seleccionada.valoracion ?? 0) >= n
                                ? "text-amber-400 fill-amber-400"
                                : "text-muted-foreground/40"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TAGS_FEEDBACK.map((tag) => {
                        const activo = (seleccionada.valoracion_tags || []).includes(tag.key)
                        return (
                          <button
                            key={tag.key}
                            onClick={() => toggleTag(seleccionada.id, tag.key)}
                            className={cn(
                              "rounded-pill border px-2.5 py-1 text-[0.65rem] transition-colors",
                              activo
                                ? "border-primary/50 bg-primary/15 text-primary"
                                : "border-white/10 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {tag.label}
                          </button>
                        )
                      })}
                    </div>
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
