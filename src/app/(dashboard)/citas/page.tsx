"use client"

import { useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn, formatDate } from "@/lib/utils"
import { obtenerRol, type Rol } from "@/lib/roles"
import type { Cita, CitaEstado } from "@/types"
import {
  CalendarDays, CalendarPlus, Check, X, CheckCheck, UserX,
  Bot, PencilLine, Trash2, Mail, Phone, RefreshCw,
} from "lucide-react"

const ESTADOS: Record<CitaEstado, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-amber-500/20 text-amber-400" },
  confirmada: { label: "Confirmada", color: "bg-blue-500/20 text-blue-400" },
  completada: { label: "Completada", color: "bg-green-500/20 text-green-400" },
  cancelada: { label: "Cancelada", color: "bg-red-500/20 text-red-400" },
  no_show: { label: "No show", color: "bg-gray-500/20 text-gray-400" },
}

export default function CitasPage() {
  const supabase = useSupabase()
  const [rol, setRol] = useState<Rol>("admin")
  const [loading, setLoading] = useState(true)
  const [citas, setCitas] = useState<Cita[]>([])
  const [creando, setCreando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ titulo: "", fecha: "", hora: "10:00", duracion: "30", contacto: "", notas: "" })

  const cargar = useCallback(async () => {
    setLoading(true)
    const q = supabase
      .from("citas")
      .select("*, cliente:clientes(id,nombre,empresa)")
      .order("fecha_hora", { ascending: false })
      .limit(200)
    const { data } = await q
    setCitas((data as Cita[]) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) setRol(await obtenerRol(supabase as any, session.user.id))
      await cargar()
    }
    init()
  }, [supabase, cargar])

  const esEquipo = rol !== "cliente"

  const cambiarEstado = async (cita: Cita, estado: CitaEstado) => {
    try {
      const { error } = await supabase.from("citas").update({ estado }).eq("id", cita.id)
      if (error) throw error
      setCitas(citas.map((c) => (c.id === cita.id ? { ...c, estado } : c)))
    } catch {
      setError("No se pudo actualizar la cita.")
    }
  }

  const eliminar = async (cita: Cita) => {
    try {
      const { error } = await supabase.from("citas").delete().eq("id", cita.id)
      if (error) throw error
      setCitas(citas.filter((c) => c.id !== cita.id))
    } catch {
      setError("No se pudo eliminar la cita.")
    }
  }

  const crearCita = async () => {
    if (!form.titulo.trim() || !form.fecha) {
      setError("Título y fecha son obligatorios.")
      return
    }
    setSaving(true)
    setError("")
    try {
      const { data: { session } } = await supabase.auth.getSession()
      let clienteId: string | null = null
      if (esEquipo && session?.user?.email) {
        // Por defecto se asocia al cliente cuyo email coincida con el usuario (creación desde su área)
        const { data: cli } = await supabase.from("clientes").select("id").eq("email", session.user.email).maybeSingle()
        clienteId = cli?.id ?? null
      }
      const { data, error } = await supabase
        .from("citas")
        .insert({
          titulo: form.titulo.trim(),
          fecha_hora: new Date(`${form.fecha}T${form.hora}`).toISOString(),
          duracion_min: Number(form.duracion) || 30,
          contacto_nombre: form.contacto.trim() || null,
          notas: form.notas.trim() || null,
          estado: "pendiente",
          origen: esEquipo && !clienteId ? "manual" : "manual",
          cliente_id: clienteId,
        })
        .select("*, cliente:clientes(id,nombre,empresa)")
        .single()
      if (error) throw error
      setCitas([data as Cita, ...citas])
      setCreando(false)
      setForm({ titulo: "", fecha: "", hora: "10:00", duracion: "30", contacto: "", notas: "" })
    } catch (err: any) {
      setError(err.message || "No se pudo crear la cita.")
    } finally {
      setSaving(false)
    }
  }

  const ahora = new Date()
  const futuras = citas
    .filter((c) => new Date(c.fecha_hora) >= ahora && c.estado !== "cancelada")
    .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
  const pasadas = citas.filter((c) => new Date(c.fecha_hora) < ahora || c.estado === "cancelada")
  const estaSemana = futuras.filter(
    (c) => new Date(c.fecha_hora).getTime() - ahora.getTime() < 7 * 86400000
  )

  const renderCita = (cita: Cita) => {
    const est = ESTADOS[cita.estado]
    const fecha = new Date(cita.fecha_hora)
    const esFutura = fecha >= ahora
    return (
      <Card key={cita.id} className="print:hidden">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:w-44 shrink-0">
              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-arena-gradient shrink-0">
                <span className="text-[0.6rem] uppercase text-white/80 leading-none">
                  {fecha.toLocaleDateString("es-ES", { month: "short" })}
                </span>
                <span className="text-lg font-bold text-white leading-none mt-0.5">{fecha.getDate()}</span>
              </div>
              <div className="text-sm">
                <p className="font-medium tabular-nums">
                  {fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="text-xs text-muted-foreground">{cita.duracion_min || 30} min</p>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium truncate">{cita.titulo}</p>
                <span className={cn("text-xs px-2 py-0.5 rounded-full", est.color)}>{est.label}</span>
                {cita.origen === "ia" && (
                  <Badge variant="primary" className="text-[0.65rem]">
                    <Bot className="h-3 w-3" /> IA
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                {esEquipo && cita.cliente && (
                  <span>{cita.cliente.empresa || cita.cliente.nombre}</span>
                )}
                {cita.contacto_nombre && <span>{cita.contacto_nombre}</span>}
                {cita.contacto_email && (
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {cita.contacto_email}</span>
                )}
                {cita.contacto_telefono && (
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {cita.contacto_telefono}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {esEquipo && esFutura && cita.estado !== "cancelada" && (
                <>
                  <Button variant="outline" size="sm" className="h-8" title="Confirmar" onClick={() => cambiarEstado(cita, "confirmada")}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-red-400" title="Cancelar" onClick={() => cambiarEstado(cita, "cancelada")}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" title="Eliminar" onClick={() => eliminar(cita)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              {esEquipo && esFutura === false && cita.estado === "confirmada" && (
                <>
                  <Button variant="outline" size="sm" className="h-8" title="Marcar completada" onClick={() => cambiarEstado(cita, "completada")}>
                    <CheckCheck className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8" title="No se presentó" onClick={() => cambiarEstado(cita, "no_show")}>
                    <UserX className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            {esEquipo ? "Citas" : "Mis Citas"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {esEquipo
              ? "Citas agendadas por los asistentes IA o creadas manualmente"
              : "Las citas que ha agendado tu asistente IA por ti"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={cargar}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Actualizar
          </Button>
          <Button onClick={() => setCreando(!creando)}>
            <CalendarPlus className="h-4 w-4 mr-2" /> Nueva cita
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
      )}

      {creando && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Reunión con…" />
              </div>
              <div className="space-y-2">
                <Label>Contacto</Label>
                <Input value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} placeholder="Nombre del contacto" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Duración (min)</Label>
                <Input type="number" min="10" step="10" value={form.duracion} onChange={(e) => setForm({ ...form, duracion: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Contexto de la cita…" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreando(false)}>Cancelar</Button>
              <Button onClick={crearCita} disabled={saving}>
                <PencilLine className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Creando..." : "Crear cita"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><CalendarDays className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Próximas 7 días</span></div>
          <p className="text-2xl font-bold">{estaSemana.length}</p>
        </div>
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Check className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Confirmadas</span></div>
          <p className="text-2xl font-bold text-green-400">{citas.filter((c) => c.estado === "confirmada").length}</p>
        </div>
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><CheckCheck className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Completadas</span></div>
          <p className="text-2xl font-bold">{citas.filter((c) => c.estado === "completada").length}</p>
        </div>
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><UserX className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">No show</span></div>
          <p className="text-2xl font-bold text-red-400">{citas.filter((c) => c.estado === "no_show").length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Próximas</h2>
            {futuras.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
                No hay citas programadas
              </CardContent></Card>
            ) : (
              <div className="space-y-3">{futuras.map(renderCita)}</div>
            )}
          </div>

          {pasadas.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Historial</h2>
              <div className="space-y-3 opacity-75">{pasadas.slice(0, 20).map(renderCita)}</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
