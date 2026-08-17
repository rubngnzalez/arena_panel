"use client"

import { useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  ScrollText, Download, LogIn, Search, Smartphone, Monitor, Tablet,
  CheckCircle2, XCircle, FileText, Calendar, TrendingUp, Users,
} from "lucide-react"
import { formatDate, formatRelativeTime } from "@/lib/utils"
import type { LoginHistory, VaultDescarga } from "@/types"

function detectarDispositivo(ua?: string): { tipo: string; icon: typeof Monitor } {
  if (!ua) return { tipo: "Desconocido", icon: Monitor }
  if (/mobile|android|iphone|ipad/i.test(ua)) return { tipo: "Móvil", icon: Smartphone }
  if (/tablet|ipad/i.test(ua)) return { tipo: "Tablet", icon: Tablet }
  return { tipo: "Escritorio", icon: Monitor }
}

export default function AuditoriaPage() {
  const supabase = useSupabase()
  const [logins, setLogins] = useState<LoginHistory[]>([])
  const [descargas, setDescargas] = useState<VaultDescarga[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroBusqueda, setFiltroBusqueda] = useState("")
  const [filtroCliente, setFiltroCliente] = useState("todos")
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([])

  const fetchData = useCallback(async () => {
    try {
      const [logRes, descRes, cliRes] = await Promise.all([
        supabase.from("login_history").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("vault_descargas").select("*, clientes ( id, nombre, empresa )").order("created_at", { ascending: false }).limit(100),
        supabase.from("clientes").select("id, nombre").order("nombre"),
      ])
      setLogins(logRes.data || [])
      setDescargas((descRes.data as VaultDescarga[]) || [])
      setClientes(cliRes.data || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const descargasFiltradas = descargas.filter((d) => {
    if (filtroCliente !== "todos" && d.cliente_id !== filtroCliente) return false
    if (filtroBusqueda) {
      const q = filtroBusqueda.toLowerCase()
      return (d.documento_titulo || "").toLowerCase().includes(q) || (d.cliente?.nombre || "").toLowerCase().includes(q)
    }
    return true
  })

  const loginsFiltrados = logins.filter((l) => {
    if (!filtroBusqueda) return true
    const q = filtroBusqueda.toLowerCase()
    return (l.email || "").toLowerCase().includes(q)
  })

  const stats = {
    totalLogins: logins.length,
    loginsHoy: logins.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length,
    totalDescargas: descargas.length,
    descargasHoy: descargas.filter((d) => new Date(d.created_at).toDateString() === new Date().toDateString()).length,
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-normal tracking-tight mb-1 flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-primary" /> Auditoría
        </h1>
        <p className="text-sm text-muted-foreground">Historial de accesos y descargas de la bóveda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Accesos totales", value: stats.totalLogins, icon: LogIn, color: "text-cyan-400" },
          { label: "Accesos hoy", value: stats.loginsHoy, icon: TrendingUp, color: "text-green-400" },
          { label: "Descargas totales", value: stats.totalDescargas, icon: Download, color: "text-purple-400" },
          { label: "Descargas hoy", value: stats.descargasHoy, icon: FileText, color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center">
            <s.icon className={`h-5 w-5 mx-auto mb-2 ${s.color}`} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="logins">
        <TabsList>
          <TabsTrigger value="logins"><LogIn className="h-3.5 w-3.5 mr-1.5" /> Logueos ({logins.length})</TabsTrigger>
          <TabsTrigger value="descargas"><Download className="h-3.5 w-3.5 mr-1.5" /> Descargas bóveda ({descargas.length})</TabsTrigger>
        </TabsList>

        {/* LOGUEOS */}
        <TabsContent value="logins">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Historial de accesos</CardTitle>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={filtroBusqueda} onChange={(e) => setFiltroBusqueda(e.target.value)} placeholder="Buscar por email..." className="pl-10 h-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
                </div>
              ) : loginsFiltrados.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <LogIn className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No hay registros de acceso.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {loginsFiltrados.map((l) => {
                    const disp = detectarDispositivo(l.user_agent)
                    const DispIcon = disp.icon
                    return (
                      <div key={l.id} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                        <div className={`shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${l.exito ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                          {l.exito ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{l.email || "Usuario desconocido"}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><DispIcon className="h-3 w-3" /> {disp.tipo}</span>
                            {l.ip_address && <span>{l.ip_address}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">{formatDate(l.created_at)}</p>
                          <p className="text-xs text-muted-foreground/60">{formatRelativeTime(l.created_at)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DESCARGAS */}
        <TabsContent value="descargas">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <CardTitle className="text-sm">Descargas de la bóveda</CardTitle>
                <div className="flex gap-2">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={filtroBusqueda} onChange={(e) => setFiltroBusqueda(e.target.value)} placeholder="Buscar..." className="pl-10 h-9" />
                  </div>
                  <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                    <SelectTrigger className="w-full sm:w-48 h-9"><SelectValue placeholder="Cliente" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los clientes</SelectItem>
                      {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
                </div>
              ) : descargasFiltradas.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Download className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No hay descargas registradas.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {descargasFiltradas.map((d) => (
                    <div key={d.id} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                      <div className="shrink-0 h-9 w-9 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-400">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.documento_titulo || "Documento eliminado"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {d.cliente?.nombre || "Cliente desconocido"}{d.cliente?.empresa ? ` · ${d.cliente.empresa}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">{formatDate(d.created_at)}</p>
                        <p className="text-xs text-muted-foreground/60">{formatRelativeTime(d.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
