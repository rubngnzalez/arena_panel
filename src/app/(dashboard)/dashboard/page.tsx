"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  Briefcase,
  FolderKanban,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Activity,
  Phone,
  Bot,
  GaugeCircle,
  CalendarDays,
} from "lucide-react"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import type { Cliente, Proyecto, InteraccionIA, Cita } from "@/types"

export default function DashboardPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [miCliente, setMiCliente] = useState<Cliente | null>(null)

  // Datos personales (modo cliente vinculado)
  const [misProyectos, setMisProyectos] = useState<Proyecto[]>([])
  const [misInteracciones, setMisInteracciones] = useState<InteraccionIA[]>([])
  const [miCita, setMiCita] = useState<Cita | null>(null)

  // Datos globales (modo gestión)
  const [stats, setStats] = useState({
    clientes_activos: 0,
    proyectos_en_curso: 0,
    servicios_activos: 0,
    ingreso_mensual: 0,
  })
  const [proyectosRecientes, setProyectosRecientes] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const email = session?.user?.email
        const uid = session?.user?.id

        // ¿Tiene cliente vinculado? -> dashboard personal
        let vinculado: Cliente | null = null
        if (email || uid) {
          let q = supabase.from("clientes").select("*")
          const partes: string[] = []
          if (email) partes.push(`email.eq.${JSON.stringify(email)}`)
          if (uid) partes.push(`usuario_auth_id.eq.${uid}`)
          const { data: cli } = await q.or(partes.join(",")).maybeSingle()
          vinculado = (cli as Cliente) || null
        }
        setMiCliente(vinculado)

        if (vinculado) {
          const inicioMes = new Date()
          inicioMes.setDate(1)
          inicioMes.setHours(0, 0, 0, 0)

          const [proRes, intRes, citaRes] = await Promise.all([
            supabase
              .from("proyectos")
              .select("*")
              .eq("cliente_id", vinculado.id)
              .in("estado", ["planeacion", "en_progreso", "revision"])
              .order("created_at", { ascending: false })
              .limit(5),
            supabase
              .from("interacciones_ia")
              .select("id,tipo,origen,resumen,resumen_ejecutivo,duracion_seg,created_at")
              .eq("cliente_id", vinculado.id)
              .gte("created_at", inicioMes.toISOString())
              .order("created_at", { ascending: false })
              .limit(6),
            supabase
              .from("citas")
              .select("*")
              .eq("cliente_id", vinculado.id)
              .gte("fecha_hora", new Date().toISOString())
              .neq("estado", "cancelada")
              .order("fecha_hora", { ascending: true })
              .limit(1),
          ])
          setMisProyectos((proRes.data as Proyecto[]) || [])
          setMisInteracciones((intRes.data as InteraccionIA[]) || [])
          setMiCita((citaRes.data?.[0] as Cita) || null)
        } else {
          // Modo gestión global (equipo sin cliente vinculado)
          const { count: clientesCount } = await supabase
            .from("clientes")
            .select("*", { count: "exact", head: true })
            .eq("estado", "activo")

          const { count: proyectosCount } = await supabase
            .from("proyectos")
            .select("*", { count: "exact", head: true })
            .in("estado", ["planeacion", "en_progreso", "revision"])

          const { count: serviciosCount } = await supabase
            .from("servicios")
            .select("*", { count: "exact", head: true })
            .eq("activo", true)

          const { data: clienteServicios } = await supabase
            .from("cliente_servicios")
            .select("precio_acordado")
            .eq("estado", "activo")

          const ingresoMensual = clienteServicios?.reduce(
            (total, cs) => total + (cs.precio_acordado || 0),
            0
          ) || 0

          setStats({
            clientes_activos: clientesCount || 0,
            proyectos_en_curso: proyectosCount || 0,
            servicios_activos: serviciosCount || 0,
            ingreso_mensual: ingresoMensual,
          })

          const { data: proyectos } = await supabase
            .from("proyectos")
            .select(`*, clientes (nombre, empresa)`)
            .in("estado", ["planeacion", "en_progreso"])
            .order("created_at", { ascending: false })
            .limit(5)
          setProyectosRecientes(proyectos || [])
        }
      } catch (error) {
        console.error("Error loading dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
      </div>
    )
  }

  // ============================================================
  // MODO PERSONAL — solo los datos del cliente vinculado
  // ============================================================
  if (miCliente) {
    const minutos = miCliente.minutos_consumidos_mes ?? 0
    const limite = miCliente.limite_minutos_incluidos ?? 0
    const pct = limite > 0 ? Math.min(100, Math.round((minutos / limite) * 100)) : 0
    const marca = miCliente.nombre_comercial || miCliente.empresa || miCliente.nombre

    const estadoMap: Record<string, { label: string; cls: string }> = {
      planeacion: { label: "Planificación", cls: "text-cyan-400 border-cyan-400/40 bg-cyan-400/10" },
      en_progreso: { label: "En Progreso", cls: "text-amber-400 border-amber-400/40 bg-amber-400/10" },
      revision: { label: "Revisión", cls: "text-purple-400 border-purple-400/40 bg-purple-400/10" },
      completado: { label: "Completado", cls: "text-green-400 border-green-400/40 bg-green-400/10" },
    }

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">{marca}</h1>
            <p className="text-sm text-muted-foreground font-light mt-1">
              Tu espacio de trabajo
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/citas")}>
              <CalendarDays className="h-4 w-4 mr-2" />
              Mis citas
            </Button>
            <Button size="sm" onClick={() => router.push("/asistentes")}>
              <Bot className="h-4 w-4 mr-2" />
              Mis asistentes
            </Button>
          </div>
        </div>

        {/* KPIs personales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-light">Proyectos en curso</p>
                  <p className="text-2xl font-medium mt-1.5">{misProyectos.length}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-pill bg-arena-gradient/10 border border-primary/20 text-primary">
                  <FolderKanban className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-light">Interacciones este mes</p>
                  <p className="text-2xl font-medium mt-1.5">{misInteracciones.length}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-pill bg-arena-gradient/10 border border-primary/20 text-primary">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-light flex items-center gap-1.5">
                <GaugeCircle className="h-3.5 w-3.5" /> Minutos consumidos
              </p>
              <p className="text-2xl font-medium mt-1.5 tabular-nums">
                {minutos}
                {limite > 0 && <span className="text-sm text-muted-foreground font-light"> / {limite}</span>}
              </p>
              {limite > 0 && (
                <div className="mt-3 h-1.5 bg-white/5 rounded-pill overflow-hidden">
                  <div
                    className={cn("h-full rounded-pill", pct >= 100 ? "bg-red-400" : pct >= 80 ? "bg-amber-400" : "bg-arena-gradient")}
                    style={{ width: `${Math.max(pct, minutos > 0 ? 4 : 0)}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-light flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" /> Próxima cita
              </p>
              {miCita ? (
                <>
                  <p className="text-base font-medium mt-1.5 truncate">{miCita.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(miCita.fecha_hora, "long")}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">Sin citas programadas</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mis proyectos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Mis proyectos</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  Proyectos activos de {marca}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push("/proyectos")}>
                Ver todos <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {misProyectos.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="text-sm font-light">Sin proyectos en curso</p>
              </div>
            ) : (
              <div className="space-y-3">
                {misProyectos.map((proyecto) => {
                  const est = estadoMap[proyecto.estado] || { label: proyecto.estado, cls: "text-muted-foreground border-border" }
                  return (
                    <div
                      key={proyecto.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-medium truncate">{proyecto.nombre}</h3>
                          <span className={`arena-badge ${est.cls}`}>{est.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{proyecto.progreso}%</div>
                          <div className="w-20 h-1.5 bg-white/5 rounded-pill overflow-hidden mt-1">
                            <div
                              className="h-full bg-arena-gradient rounded-pill"
                              style={{ width: `${proyecto.progreso}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mis últimas interacciones */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Últimas interacciones</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  Atendidas por tus asistentes este mes
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push("/asistentes")}>
                Ver todas <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {misInteracciones.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="text-sm font-light">Sin interacciones este mes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {misInteracciones.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => router.push("/asistentes")}
                    className="w-full flex items-center gap-4 p-3 rounded-xl border border-white/5 hover:border-primary/30 transition-colors text-left"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border ${
                      item.tipo === "llamada"
                        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-400"
                        : "border-purple-400/30 bg-purple-400/10 text-purple-400"
                    }`}>
                      {item.tipo === "llamada" ? <Phone className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {item.resumen_ejecutivo || item.resumen || "Interacción registrada"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(item.created_at, "long")}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============================================================
  // MODO GESTIÓN GLOBAL (equipo sin cliente vinculado)
  // ============================================================
  const statCards = [
    { title: "Clientes Activos", value: stats.clientes_activos, icon: Users, change: "+12%" },
    { title: "Proyectos en Curso", value: stats.proyectos_en_curso, icon: FolderKanban, change: "+3" },
    { title: "Servicios Activos", value: stats.servicios_activos, icon: Briefcase, change: "7 tipos" },
    { title: "Ingreso Mensual", value: formatCurrency(stats.ingreso_mensual), icon: TrendingUp, change: "+18%" },
  ]

  const estadoMap: Record<string, { label: string; cls: string }> = {
    planeacion: { label: "Planificación", cls: "text-cyan-400 border-cyan-400/40 bg-cyan-400/10" },
    en_progreso: { label: "En Progreso", cls: "text-amber-400 border-amber-400/40 bg-amber-400/10" },
    revision: { label: "Revisión", cls: "text-purple-400 border-purple-400/40 bg-purple-400/10" },
    completado: { label: "Completado", cls: "text-green-400 border-green-400/40 bg-green-400/10" },
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground font-light mt-1">
            Resumen global del negocio
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/auditoria")}>
            <Activity className="h-4 w-4 mr-2" />
            Actividad
          </Button>
          <Button size="sm" onClick={() => router.push("/clientes?nuevo=1")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-light">{stat.title}</p>
                  <p className="text-2xl font-medium mt-1.5">{stat.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-pill bg-arena-gradient/10 border border-primary/20 text-primary">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="arena-badge text-primary border-primary/40 bg-primary/10">{stat.change}</span>
                <span className="text-muted-foreground font-light">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Proyectos Recientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium">Proyectos Recientes</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Últimos proyectos actualizados
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/proyectos")}>
              Ver todos
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {proyectosRecientes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="text-sm font-light">No hay proyectos en curso</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/proyectos?nuevo=1")}>
                Crear primer proyecto
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {proyectosRecientes.map((proyecto) => {
                const est = estadoMap[proyecto.estado] || { label: proyecto.estado, cls: "text-muted-foreground border-border" }
                return (
                  <div
                    key={proyecto.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-medium truncate">{proyecto.nombre}</h3>
                        <span className={`arena-badge ${est.cls}`}>{est.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 font-light">
                        {proyecto.clientes?.empresa || proyecto.clientes?.nombre}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{proyecto.progreso}%</div>
                        <div className="w-20 h-1.5 bg-white/5 rounded-pill overflow-hidden mt-1">
                          <div
                            className="h-full bg-arena-gradient rounded-pill"
                            style={{ width: `${proyecto.progreso}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Acciones Rápidas</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Gestiona frecuentes al alcance de un clic
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Users, label: "Nuevo Cliente", href: "/clientes?nuevo=1" },
              { icon: Briefcase, label: "Nuevo Servicio", href: "/servicios" },
              { icon: FolderKanban, label: "Nuevo Proyecto", href: "/proyectos?nuevo=1" },
              { icon: Activity, label: "Ver Actividad", href: "/auditoria" },
            ].map((a) => (
              <Button
                key={a.label}
                variant="secondary"
                className="h-auto flex-col gap-2 py-5"
                onClick={() => router.push(a.href)}
              >
                <a.icon className="h-5 w-5 text-primary" />
                <span className="text-xs">{a.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
