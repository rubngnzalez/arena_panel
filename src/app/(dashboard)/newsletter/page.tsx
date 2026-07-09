"use client"

import { useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft, Plus, Mail, Send, Eye, Copy, Check, Users, Trash2,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { NewsletterCampana, NewsletterEstado, Cliente } from "@/types"

const ESTADOS: Record<NewsletterEstado, { label: string; color: string }> = {
  borrador: { label: "Borrador", color: "bg-slate-500/20 text-slate-300" },
  programada: { label: "Programada", color: "bg-blue-500/20 text-blue-400" },
  enviada: { label: "Enviada", color: "bg-green-500/20 text-green-400" },
}

export default function NewsletterPage() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [campanas, setCampanas] = useState<NewsletterCampana[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vista, setVista] = useState<"lista" | "form" | "preview">("lista")
  const [editando, setEditando] = useState<NewsletterCampana | null>(null)
  const [previewCampana, setPreviewCampana] = useState<NewsletterCampana | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [copiado, setCopiado] = useState(false)

  const [form, setForm] = useState({
    titulo: "", asunto: "", contenido: "", segmento: "todos" as NewsletterCampana["segmento"],
  })
  const [destinatariosSel, setDestinatariosSel] = useState<string[]>([])

  const cargar = useCallback(async () => {
    setLoading(true)
    const [cRes, cliRes] = await Promise.all([
      supabase.from("newsletter_campanas").select("*").order("created_at", { ascending: false }),
      supabase.from("clientes").select("*").order("nombre"),
    ])
    if (cRes.data) setCampanas(cRes.data as NewsletterCampana[])
    if (cliRes.data) setClientes(cliRes.data as Cliente[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { cargar() }, [cargar])

  // Destinatarios según segmento
  const clientesConEmail = clientes.filter((c) => c.email)
  const audiencia =
    form.segmento === "todos" ? clientesConEmail
      : form.segmento === "activos" ? clientesConEmail.filter((c) => c.estado === "activo")
        : clientesConEmail.filter((c) => destinatariosSel.includes(c.id))
  const emailsDestinatarios = audiencia.map((c) => c.email).filter(Boolean) as string[]

  const nuevaCampana = () => {
    setEditando(null)
    setForm({ titulo: "", asunto: "", contenido: "", segmento: "todos" })
    setDestinatariosSel([])
    setError("")
    setVista("form")
  }

  const editarCampana = (c: NewsletterCampana) => {
    setEditando(c)
    setForm({ titulo: c.titulo, asunto: c.asunto, contenido: c.contenido, segmento: c.segmento })
    setDestinatariosSel(c.destinatarios_ids || [])
    setError("")
    setVista("form")
  }

  const toggleDestinatario = (id: string) =>
    setDestinatariosSel(destinatariosSel.includes(id) ? destinatariosSel.filter((x) => x !== id) : [...destinatariosSel, id])

  const guardar = async (enviar = false) => {
    if (!form.titulo.trim()) { setError("El título es obligatorio."); return }
    if (!form.asunto.trim()) { setError("El asunto es obligatorio."); return }
    if (!form.contenido.trim()) { setError("El contenido no puede estar vacío."); return }

    setSaving(true); setError("")
    try {
      const payload = {
        titulo: form.titulo.trim(),
        asunto: form.asunto.trim(),
        contenido: form.contenido,
        segmento: form.segmento,
        destinatarios_ids: form.segmento === "personalizado" ? destinatariosSel : [],
        estado: enviar ? "enviada" : "borrador",
        enviados_count: enviar ? emailsDestinatarios.length : 0,
        fecha_envio: enviar ? new Date().toISOString() : null,
      }
      if (editando) {
        const { error: e } = await supabase.from("newsletter_campanas").update(payload).eq("id", editando.id)
        if (e) throw e
      } else {
        const { error: e } = await supabase.from("newsletter_campanas").insert(payload)
        if (e) throw e
      }
      await cargar()
      setVista("lista")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "No se pudo guardar.")
    } finally {
      setSaving(false)
    }
  }

  const copiarEmails = () => {
    navigator.clipboard.writeText(emailsDestinatarios.join(", "))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  // mailto con destinatarios
  const mailtoLink = `mailto:${emailsDestinatarios.join(",")}?subject=${encodeURIComponent(form.asunto)}&body=${encodeURIComponent(form.contenido)}`

  // ===== VISTA: PREVIEW =====
  if (vista === "preview" && previewCampana) {
    const c = previewCampana
    return (
      <div className="space-y-6 animate-in">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setVista("lista")}><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Button>
          <Badge className={ESTADOS[c.estado].color}>{ESTADOS[c.estado].label}</Badge>
        </div>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-1">{c.titulo}</h2>
            <p className="text-sm text-muted-foreground mb-4">Asunto: <span className="text-foreground font-medium">{c.asunto}</span></p>
            <div className="rounded-lg border border-white/5 p-6 bg-white/[0.02]">
              <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{ __html: c.contenido }} />
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              {c.fecha_envio && <span>Enviada: {formatDate(c.fecha_envio)}</span>}
              <span>{c.enviados_count} destinatarios</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===== VISTA: FORMULARIO =====
  if (vista === "form") {
    return (
      <div className="space-y-6 animate-in">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setVista("lista")}><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Button>
          <h1 className="text-xl font-semibold">{editando ? "Editar campaña" : "Nueva campaña"}</h1>
          <div className="w-24" />
        </div>

        <Card>
          <CardContent className="p-6 space-y-5">
            {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

            <div className="space-y-2">
              <Label>Título interno *</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Oferta de verano 2026" />
            </div>
            <div className="space-y-2">
              <Label>Asunto del email *</Label>
              <Input value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} placeholder="Asunto que verán los destinatarios" />
            </div>
            <div className="space-y-2">
              <Label>Contenido (HTML) *</Label>
              <Textarea rows={10} value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })} placeholder="<h2>Hola {{nombre}}</h2><p>Contenido del email...</p>" className="font-mono text-sm" />
            </div>

            {/* Audiencia */}
            <div className="space-y-3">
              <Label>Audiencia</Label>
              <Select value={form.segmento} onValueChange={(v) => setForm({ ...form, segmento: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los clientes ({clientesConEmail.length})</SelectItem>
                  <SelectItem value="activos">Clientes activos ({clientesConEmail.filter((c) => c.estado === "activo").length})</SelectItem>
                  <SelectItem value="personalizado">Selección personalizada</SelectItem>
                </SelectContent>
              </Select>

              {form.segmento === "personalizado" && (
                <div className="rounded-lg border border-white/5 p-3 max-h-48 overflow-y-auto space-y-1">
                  {clientesConEmail.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-white/5">
                      <input type="checkbox" checked={destinatariosSel.includes(c.id)} onChange={() => toggleDestinatario(c.id)} className="accent-primary" />
                      <span className="text-sm flex-1">{c.nombre}</span>
                      <span className="text-xs text-muted-foreground">{c.email}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border border-white/5 p-3">
                <span className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {emailsDestinatarios.length} destinatarios</span>
                <Button variant="ghost" size="sm" onClick={copiarEmails}>
                  {copiado ? <><Check className="h-3.5 w-3.5 mr-1" /> Copiado</> : <><Copy className="h-3.5 w-3.5 mr-1" /> Copiar emails</>}
                </Button>
              </div>
            </div>

            {/* Envío */}
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
              <p className="text-sm font-medium text-blue-400">Enviar campaña</p>
              <p className="text-xs text-muted-foreground">Puedes marcar como enviada y copiar los emails, o usar el botón para abrir tu cliente de correo con todo precargado.</p>
              <a href={mailtoLink} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm"><Mail className="h-3.5 w-3.5 mr-1.5" /> Abrir en cliente de correo</Button>
              </a>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <Button variant="ghost" onClick={() => setVista("lista")}>Cancelar</Button>
              <Button variant="outline" onClick={() => guardar(false)} disabled={saving}>{saving ? "Guardando..." : "Guardar borrador"}</Button>
              <Button onClick={() => guardar(true)} disabled={saving}><Send className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Enviando..." : "Marcar enviada"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===== VISTA: LISTA =====
  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Mail className="h-6 w-6 text-primary" /> Newsletter</h1>
          <p className="text-sm text-muted-foreground mt-1">Crea y gestiona campañas de email</p>
        </div>
        <Button onClick={nuevaCampana}><Plus className="h-4 w-4 mr-2" /> Nueva campaña</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Mail className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Campañas</span></div>
          <p className="text-2xl font-bold">{campanas.length}</p>
        </div>
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Send className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Enviadas</span></div>
          <p className="text-2xl font-bold text-green-400">{campanas.filter((c) => c.estado === "enviada").length}</p>
        </div>
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Users className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Suscriptores</span></div>
          <p className="text-2xl font-bold">{clientesConEmail.length}</p>
        </div>
        <div className="rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Eye className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Alcance total</span></div>
          <p className="text-2xl font-bold">{campanas.reduce((s, c) => s + (c.enviados_count || 0), 0)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" /></div>
      ) : campanas.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <Mail className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground mb-4">No hay campañas todavía</p>
          <Button onClick={nuevaCampana}><Plus className="h-4 w-4 mr-2" /> Crear primera campaña</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {campanas.map((c) => {
            const est = ESTADOS[c.estado]
            return (
              <Card key={c.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-arena-gradient shrink-0">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setPreviewCampana(c); setVista("preview") }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{c.titulo}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${est.color}`}>{est.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{c.asunto}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.enviados_count > 0 ? `${c.enviados_count} destinatarios · ` : ""}
                        {c.fecha_envio ? `Enviada ${formatDate(c.fecha_envio)}` : `Creada ${formatDate(c.created_at)}`}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => editarCampana(c)}><Eye className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
