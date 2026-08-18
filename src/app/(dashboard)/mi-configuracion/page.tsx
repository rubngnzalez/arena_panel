"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { setTheme as aplicarTemaGlobal } from "@/lib/themes"
import type { Cliente } from "@/types"
import {
  Palette, Bot, BellRing, Save, Check, Building2, ImageIcon,
} from "lucide-react"

type TemaCliente = "dark_pure" | "dark_slate" | "light_clean"

const TEMAS: {
  key: TemaCliente
  nombre: string
  descripcion: string
  themeId: string
  swatch: string
  texto: string
}[] = [
  {
    key: "dark_pure",
    nombre: "Oscuro Puro",
    descripcion: "Negro #000000 con acentos cian y púrpura",
    themeId: "arena-dark",
    swatch: "bg-[#000000] border-white/20",
    texto: "#ffffff",
  },
  {
    key: "dark_slate",
    nombre: "Slate",
    descripcion: "Azul pizarra profundo, más suave para la vista",
    themeId: "ocean",
    swatch: "bg-[#06101f] border-white/20",
    texto: "#e2e8f0",
  },
  {
    key: "light_clean",
    nombre: "Claro Limpio",
    descripcion: "Fondo blanco con textos oscuros",
    themeId: "light",
    swatch: "bg-[#f5f5f7] border-black/20",
    texto: "#0a0a0a",
  },
]

const MAP_TEMA_A_THEME: Record<TemaCliente, string> = {
  dark_pure: "arena-dark",
  dark_slate: "ocean",
  light_clean: "light",
}

export default function MiConfiguracionPage() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [sinCliente, setSinCliente] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const [marca, setMarca] = useState({
    nombre_comercial: "",
    logo_url: "",
  })
  const [tema, setTema] = useState<TemaCliente>("dark_pure")
  const [conocimiento, setConocimiento] = useState({
    horario_atencion_texto: "",
    notas_conocimiento_ia: "",
  })
  const [alertas, setAlertas] = useState({
    alerta_email_citas: false,
    alerta_email_urgente: false,
  })

  useEffect(() => {
    const cargar = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) { setLoading(false); setSinCliente(true); return }

      const { data: cli } = await supabase
        .from("clientes")
        .select("*")
        .or(`email.eq.${JSON.stringify(session.user.email)},usuario_auth_id.eq.${session.user.id}`)
        .maybeSingle()

      if (!cli) { setSinCliente(true); setLoading(false); return }

      const c = cli as Cliente
      setMarca({
        nombre_comercial: c.nombre_comercial || c.empresa || c.nombre || "",
        logo_url: c.logo_url || "",
      })
      setTema(c.tema_preferido || "dark_pure")
      setConocimiento({
        horario_atencion_texto: c.horario_atencion_texto || "",
        notas_conocimiento_ia: c.notas_conocimiento_ia || "",
      })
      setAlertas({
        alerta_email_citas: c.alerta_email_citas ?? false,
        alerta_email_urgente: c.alerta_email_urgente ?? false,
      })
      setLoading(false)
    }
    cargar()
  }, [supabase])

  const elegirTema = (t: (typeof TEMAS)[number]) => {
    setTema(t.key)
    aplicarTemaGlobal(t.themeId)
  }

  const guardar = async () => {
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      const { data, error: rpcError } = await supabase.rpc("actualizar_mi_configuracion", {
        p_data: {
          nombre_comercial: marca.nombre_comercial.trim(),
          logo_url: marca.logo_url.trim(),
          tema_preferido: tema,
          horario_atencion_texto: conocimiento.horario_atencion_texto,
          notas_conocimiento_ia: conocimiento.notas_conocimiento_ia,
          alerta_email_citas: alertas.alerta_email_citas,
          alerta_email_urgente: alertas.alerta_email_urgente,
        },
      })
      if (rpcError) throw rpcError
      const r = data as { ok: boolean; error?: string }
      if (!r.ok) throw new Error(r.error || "error")
      aplicarTemaGlobal(MAP_TEMA_A_THEME[tema])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError("No se pudo guardar la configuración. Inténtalo de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
      </div>
    )
  }

  if (sinCliente) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground max-w-md">
            No hay una cuenta de cliente vinculada a este usuario. Contacta con el equipo para configurar tu acceso.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-in max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personaliza tu panel y la información de tu asistente
          </p>
        </div>
        <Button onClick={guardar} disabled={saving}>
          {saved ? (
            <><Check className="h-4 w-4 mr-2" /> Guardado</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> {saving ? "Guardando..." : "Guardar cambios"}</>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
      )}

      {/* ===== 1. Identidad visual ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Marca y aspecto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3 w-3" /> Nombre comercial
              </Label>
              <Input
                value={marca.nombre_comercial}
                onChange={(e) => setMarca({ ...marca, nombre_comercial: e.target.value })}
                placeholder="Tu negocio"
              />
              <p className="text-[0.65rem] text-muted-foreground">
                Se muestra en tu panel y en los informes PDF.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3 w-3" /> URL del logo
              </Label>
              <Input
                value={marca.logo_url}
                onChange={(e) => setMarca({ ...marca, logo_url: e.target.value })}
                placeholder="https://tu-web.com/logo.png"
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Vista previa */}
          {(marca.logo_url || marca.nombre_comercial) && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center gap-4">
              {marca.logo_url ? (
                <img src={marca.logo_url} alt="Logo" className="h-10 w-10 rounded-xl object-contain" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-arena-gradient text-sm font-semibold text-white">
                  {(marca.nombre_comercial || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{marca.nombre_comercial || "Tu negocio"}</p>
                <p className="text-[0.65rem] text-muted-foreground">Así se verá tu marca en los informes</p>
              </div>
            </div>
          )}

          {/* Tema */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Tema del panel</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {TEMAS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => elegirTema(t)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    tema === t.key
                      ? "border-primary/50 bg-primary/10"
                      : "border-white/10 hover:border-white/25"
                  )}
                >
                  <span className={cn("block h-10 w-full rounded-lg border mb-3", t.swatch)} />
                  <p className="text-sm font-medium flex items-center justify-between">
                    {t.nombre}
                    {tema === t.key && <Check className="h-3.5 w-3.5 text-primary" />}
                  </p>
                  <p className="text-[0.65rem] text-muted-foreground mt-0.5">{t.descripcion}</p>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== 2. Información para el asistente ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-accent" /> Información para tu asistente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Horarios especiales o festivos próximos
            </Label>
            <Textarea
              rows={3}
              value={conocimiento.horario_atencion_texto}
              onChange={(e) => setConocimiento({ ...conocimiento, horario_atencion_texto: e.target.value })}
              placeholder={"Ejemplo:\n· 15 de agosto: cerrado por festivo\n· Viernes 22: cerramos a las 14:00\n· Semana del 5 al 9: vacaciones"}
            />
            <p className="text-[0.65rem] text-muted-foreground">
              Tu asistente consultará esta información al atender llamadas y mensajes.
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Instrucciones o novedades del mes
            </Label>
            <Textarea
              rows={3}
              value={conocimiento.notas_conocimiento_ia}
              onChange={(e) => setConocimiento({ ...conocimiento, notas_conocimiento_ia: e.target.value })}
              placeholder={"Ejemplo:\n· El menú del día ahora cuesta 14 €\n· Nuevo servicio de cata de café los sábados"}
            />
          </div>
        </CardContent>
      </Card>

      {/* ===== 3. Notificaciones ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BellRing className="h-5 w-5" /> Alertas por email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {([
            ["alerta_email_citas", "Cuando tu asistente agende una cita nueva"],
            ["alerta_email_urgente", "Cuando detecte una llamada clasificada como urgente"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setAlertas({ ...alertas, [key]: !alertas[key] })}
              className={cn(
                "w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm text-left transition-colors",
                alertas[key]
                  ? "border-primary/40 bg-primary/10"
                  : "border-white/10 bg-white/[0.02] text-muted-foreground"
              )}
            >
              <span>{label}</span>
              <span
                className={cn(
                  "relative h-5 w-9 rounded-pill transition-colors shrink-0 ml-3",
                  alertas[key] ? "bg-arena-gradient" : "bg-white/10"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                    alertas[key] ? "left-[1.15rem]" : "left-0.5"
                  )}
                />
              </span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
