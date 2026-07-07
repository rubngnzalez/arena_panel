"use client"

import { useEffect, useState } from "react"
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
  Activity,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function DashboardPage() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
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
          .select(`
            *,
            clientes (
              nombre,
              empresa
            )
          `)
          .in("estado", ["planeacion", "en_progreso"])
          .order("created_at", { ascending: false })
          .limit(5)

        setProyectosRecientes(proyectos || [])
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

  const statCards = [
    {
      title: "Clientes Activos",
      value: stats.clientes_activos,
      icon: Users,
      change: "+12%",
    },
    {
      title: "Proyectos en Curso",
      value: stats.proyectos_en_curso,
      icon: FolderKanban,
      change: "+3",
    },
    {
      title: "Servicios Activos",
      value: stats.servicios_activos,
      icon: Briefcase,
      change: "7 tipos",
    },
    {
      title: "Ingreso Mensual",
      value: formatCurrency(stats.ingreso_mensual),
      icon: TrendingUp,
      change: "+18%",
    },
  ]

  const estadoMap: Record<string, { label: string; cls: string }> = {
    planeacion: { label: "Planificación", cls: "text-arena-cyan border-arena-cyan/40 bg-arena-cyan/10" },
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
            Resumen de tu actividad en Arena13
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Actividad
          </Button>
          <Button size="sm">
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
            <Button variant="outline" size="sm">
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
              <Button variant="outline" size="sm" className="mt-4">
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
              { icon: Users, label: "Nuevo Cliente" },
              { icon: Briefcase, label: "Nuevo Servicio" },
              { icon: FolderKanban, label: "Nuevo Proyecto" },
              { icon: Activity, label: "Ver Actividad" },
            ].map((a) => (
              <Button key={a.label} variant="secondary" className="h-auto flex-col gap-2 py-5">
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
