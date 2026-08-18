"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Check, X, AlertCircle, CheckCircle2, XCircle, Calendar, Clock,
} from "lucide-react"

interface PublicLinea {
  descripcion: string
  cantidad: number
  precio_unitario: number
}

interface PublicPresupuestoData {
  ok: boolean
  error?: string
  estado?: string
  presupuesto?: {
    id: string
    numero: string
    titulo: string
    estado: string
    fecha_emision: string
    fecha_validez?: string
    descuento_porcentaje: number
    iva_porcentaje: number
    notas?: string
    respondido_at?: string
  }
  cliente?: { nombre: string; empresa?: string } | null
  lineas?: PublicLinea[]
}

function PresupuestoPublicoContent() {
  const supabase = useSupabase()
  const token = useSearchParams().get("token")
  const [data, setData] = useState<PublicPresupuestoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [respondiendo, setRespondiendo] = useState(false)
  const [resultado, setResultado] = useState<{ aceptado: boolean } | null>(null)
  const [errorAccion, setErrorAccion] = useState("")

  const cargar = useCallback(async () => {
    if (!token) { setLoading(false); return }
    const { data: res, error } = await supabase.rpc("obtener_presupuesto_publico", { p_token: token })
    if (error) {
      setData({ ok: false, error: "no_encontrado" })
    } else {
      setData(res as PublicPresupuestoData)
    }
    setLoading(false)
  }, [supabase, token])

  useEffect(() => { cargar() }, [cargar])

  const responder = async (aceptar: boolean) => {
    if (!token) return
    setRespondiendo(true)
    setErrorAccion("")
    try {
      const { data: res, error } = await supabase.rpc("responder_presupuesto", { p_token: token, p_aceptar: aceptar })
      if (error) throw error
      const r = res as { ok: boolean; error?: string }
      if (!r.ok) throw new Error(r.error || "error")
      setResultado({ aceptado: aceptar })
      await cargar()
    } catch {
      setErrorAccion("No se pudo registrar tu respuesta. Inténtalo de nuevo o contacta con Arena13.")
    } finally {
      setRespondiendo(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
      </div>
    )
  }

  if (!token || !data || !data.ok || !data.presupuesto) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="arena-card max-w-md w-full text-center py-12">
          <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Enlace no válido</h1>
          <p className="text-sm text-muted-foreground">
            Este enlace de presupuesto no existe o ha caducado. Pide uno nuevo a Arena13.
          </p>
        </div>
      </div>
    )
  }

  const p = data.presupuesto
  const cliente = data.cliente
  const lineas = data.lineas || []

  const subtotal = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.precio_unitario), 0)
  const descuento = subtotal * ((Number(p.descuento_porcentaje) || 0) / 100)
  const base = subtotal - descuento
  const iva = base * ((Number(p.iva_porcentaje) || 0) / 100)
  const total = base + iva

  const estado = resultado ? (resultado.aceptado ? "aceptado" : "rechazado") : p.estado

  return (
    <div className="min-h-screen py-10 px-4 sm:py-16">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Marca */}
        <div className="text-center">
          <span className="text-3xl font-semibold tracking-tight text-gradient">A13</span>
          <p className="text-xs text-muted-foreground tracking-widest2 uppercase mt-1">
            Arena13 · Diseño de Producto Digital &amp; IA
          </p>
        </div>

        {/* Banner de estado */}
        {estado === "aceptado" && (
          <div className="glass rounded-2xl p-5 flex items-center gap-4 border-green-400/30">
            <CheckCircle2 className="h-8 w-8 text-green-400 shrink-0" />
            <div>
              <p className="font-medium text-green-400">Presupuesto aceptado</p>
              <p className="text-sm text-muted-foreground">
                {resultado
                  ? "¡Gracias! Tu proyecto se ha creado automáticamente y el equipo de Arena13 se pondrá manos a la obra."
                  : "Este presupuesto ya fue aceptado. El proyecto está en marcha."}
              </p>
            </div>
          </div>
        )}
        {estado === "rechazado" && (
          <div className="glass rounded-2xl p-5 flex items-center gap-4 border-red-400/30">
            <XCircle className="h-8 w-8 text-red-400 shrink-0" />
            <div>
              <p className="font-medium text-red-400">Presupuesto rechazado</p>
              <p className="text-sm text-muted-foreground">
                Has declinado esta propuesta. Si cambia de opinión, contacta con Arena13.
              </p>
            </div>
          </div>
        )}

        {/* Documento */}
        <div className="arena-card">
          <div className="p-6 sm:p-8">
            {/* Encabezado */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Presupuesto</p>
                <p className="text-lg font-bold font-mono">{p.numero}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> Emitido el {formatDate(p.fecha_emision)}
                </p>
                {p.fecha_validez && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3 w-3" /> Válido hasta {formatDate(p.fecha_validez)}
                  </p>
                )}
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Preparado para</p>
                <p className="font-medium">{cliente?.nombre || "Cliente"}</p>
                {cliente?.empresa && <p className="text-sm text-muted-foreground">{cliente.empresa}</p>}
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight mb-6">{p.titulo}</h1>

            {/* Líneas */}
            <div className="rounded-xl border border-white/5 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-3 font-medium">Descripción</th>
                      <th className="text-center p-3 font-medium w-16">Cant.</th>
                      <th className="text-right p-3 font-medium w-24">Precio</th>
                      <th className="text-right p-3 font-medium w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((l, i) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="p-3">{l.descripcion}</td>
                        <td className="p-3 text-center">{l.cantidad}</td>
                        <td className="p-3 text-right">{formatCurrency(Number(l.precio_unitario))}</td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(Number(l.cantidad) * Number(l.precio_unitario))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales */}
            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {descuento > 0 && (
                  <div className="flex justify-between text-green-400"><span>Descuento ({p.descuento_porcentaje}%)</span><span>−{formatCurrency(descuento)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Base imponible</span><span>{formatCurrency(base)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IVA ({p.iva_porcentaje}%)</span><span>{formatCurrency(iva)}</span></div>
                <div className="flex justify-between pt-2 border-t border-white/10 text-lg font-bold">
                  <span>TOTAL</span><span className="text-gradient">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {p.notas && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Notas</p>
                <p className="text-sm whitespace-pre-wrap">{p.notas}</p>
              </div>
            )}

            {/* Acciones */}
            {estado === "enviado" && !resultado && (
              <div className="mt-8 pt-6 border-t border-white/5">
                {errorAccion && (
                  <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    {errorAccion}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => responder(true)}
                    disabled={respondiendo}
                    className="arena-btn flex-1 py-3 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    {respondiendo ? "Registrando..." : "Aceptar presupuesto"}
                  </button>
                  <button
                    onClick={() => responder(false)}
                    disabled={respondiendo}
                    className="arena-btn-outline flex-1 py-3 !border-red-400/30 hover:!border-red-400/60 text-red-300 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Rechazar
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Al aceptar, el proyecto se crea automáticamente y el equipo queda notificado.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Arena13 — Diseño de Producto Digital &amp; IA · arenatrece.com
        </p>
      </div>
    </div>
  )
}

export default function PresupuestoPublicoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-10 w-10 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
        </div>
      }
    >
      <PresupuestoPublicoContent />
    </Suspense>
  )
}
