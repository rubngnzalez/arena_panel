"use client"

import type { TurnoTranscripcion } from "@/types"
import { cn } from "@/lib/utils"
import { Bot, User } from "lucide-react"

interface TranscripcionChatProps {
  turnos: TurnoTranscripcion[]
}

export function TranscripcionChat({ turnos }: TranscripcionChatProps) {
  if (!turnos || turnos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Sin transcripción disponible para esta interacción.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {turnos.map((turno, i) => {
        const esAsistente = turno.rol === "asistente"
        return (
          <div
            key={i}
            className={cn("flex gap-2.5", !esAsistente && "flex-row-reverse")}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-pill mt-0.5",
                esAsistente
                  ? "bg-primary/15 border border-primary/30 text-primary"
                  : "bg-accent/15 border border-accent/30 text-accent"
              )}
            >
              {esAsistente ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                esAsistente
                  ? "glass rounded-tl-sm text-foreground"
                  : "bg-accent/10 border border-accent/20 rounded-tr-sm text-foreground"
              )}
            >
              {turno.texto}
            </div>
          </div>
        )
      })}
    </div>
  )
}
