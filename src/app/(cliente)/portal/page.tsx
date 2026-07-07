"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FolderKanban,
  Download,
  Calendar,
  FileText,
  TrendingUp,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface ClientData {
  id: string
  nombre: string
  empresa?: string
  email: string
  telefono?: string
  servicios_activos: number
  proyectos_curso: number
  ultimo_proyecto?: string
}

interface Project {
  id: string
  nombre: string
  descripcion?: string
  estado: string
  progreso: number
  fecha_entrega_estimada?: string
}

interface Document {
  id: string
  nombre: string
  descripcion?: string
  tipo: string
  archivo_url: string
  fecha_subida: string
}

export default function ClientePortal() {
  const supabase = useSupabase()
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      // Cargar datos del cliente
      const { data: clienteData } = await supabase
        .from("vw_cliente_dashboard")
        .select("*")
        .eq("email", session.user.email)
        .single()

      if (clienteData) {
        setClientData(clienteData)

        // Cargar proyectos del cliente
        const { data: projectsData } = await supabase
          .from("proyectos")
          .select("*")
          .eq("cliente_id", clienteData.id)
          .order("created_at", { ascending: false })

        setProjects(projectsData || [])

        // Cargar documentos
        const { data: docsData } = await supabase
          .from("documentos")
          .select("*")
          .eq("cliente_id", clienteData.id)
          .eq("visible_cliente", true)
          .order("fecha_subida", { ascending: false })

        setDocuments(docsData || [])
      }

      setLoading(false)
    }

    loadData()
  }, [supabase])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-xs text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  if (!clientData) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground mb-4">
          No se encontró información de cliente
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Bienvenida */}
      <div>
        <h1 className="text-2xl font-normal tracking-tight mb-2">
          Hola, {clientData.nombre}
        </h1>
        <p className="text-sm text-muted-foreground">
          {clientData.empresa || "Cliente"} — {clientData.email}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Servicios</p>
              <p className="text-lg font-normal">{clientData.servicios_activos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FolderKanban className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Proyectos</p>
              <p className="text-lg font-normal">{clientData.proyectos_curso}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Documentos</p>
              <p className="text-lg font-normal">{documents.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Último Proyecto</p>
              <p className="text-sm font-normal truncate">
                {clientData.ultimo_proyecto || "—"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Proyectos */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-normal mb-6">Tus Proyectos</h3>

          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tienes proyectos activos
            </p>
          ) : (
            <div className="space-y-px border-t border-border">
              {projects.map((proyecto, index) => (
                <div
                  key={proyecto.id}
                  className={`py-4 ${index < projects.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm">{proyecto.nombre}</h4>
                    <Badge variant="primary" className="text-xs">
                      {proyecto.estado}
                    </Badge>
                  </div>
                  {proyecto.descripcion && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {proyecto.descripcion}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {proyecto.fecha_entrega_estimada
                        ? formatDate(proyecto.fecha_entrega_estimada)
                        : "Sin fecha"}
                    </span>
                    <span>Progreso: {proyecto.progreso}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentos */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-normal mb-6">Documentos Compartidos</h3>

          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay documentos disponibles
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {doc.tipo}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-normal mb-1">{doc.nombre}</h4>
                  {doc.descripcion && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {doc.descripcion}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(doc.fecha_subida)}
                    </span>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      Descargar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacto */}
      <Card className="p-6">
        <h3 className="text-sm font-normal mb-4">¿Necesitas ayuda?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Contacta con nosotros para cualquier consulta sobre tus proyectos
        </p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Abrir Ticket
          </Button>
          <Button size="sm">
            Enviar Email
          </Button>
        </div>
      </Card>
    </div>
  )
}
