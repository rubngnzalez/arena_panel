"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Filter,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/utils"

interface Document {
  id: string
  nombre: string
  descripcion?: string
  tipo: string
  archivo_url: string
  cliente_id?: string
  proyecto_id?: string
  visible_cliente: boolean
  fecha_subida: string
}

export default function DocumentosPage() {
  const supabase = useSupabase()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFilter, setTipoFilter] = useState("todos")

  useEffect(() => {
    fetchDocuments()
  }, [supabase])

  const fetchDocuments = async () => {
    try {
      const { data } = await supabase
        .from("documentos")
        .select(`
          *,
          clientes (
            id,
            nombre,
            empresa
          ),
          proyectos (
            id,
            nombre
          )
        `)
        .order("fecha_subida", { ascending: false })

      setDocuments(data || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const tipos = ["todos", "diseño", "documento", "imagen", "video", "otro"]

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTipo = tipoFilter === "todos" || doc.tipo === tipoFilter

    return matchesSearch && matchesTipo
  })

  const getTipoBadge = (tipo: string) => {
    const badges: Record<string, string> = {
      diseño: "bg-pink-500/20 text-pink-400",
      documento: "bg-blue-500/20 text-blue-400",
      imagen: "bg-green-500/20 text-green-400",
      video: "bg-purple-500/20 text-purple-400",
      otro: "bg-gray-500/20 text-gray-400",
    }
    return badges[tipo] || "bg-gray-500/20 text-gray-400"
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal tracking-tight mb-2">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            {documents.length} archivos
          </p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Subir Archivo
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {tipos.map(tipo => (
            <Button
              key={tipo}
              variant={tipoFilter === tipo ? "default" : "outline"}
              size="sm"
              onClick={() => setTipoFilter(tipo)}
            >
              {tipo === "todos" ? "Todos" : tipo}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-xs text-muted-foreground">Cargando...</div>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            {searchTerm || tipoFilter !== "todos"
              ? "No se encontraron documentos con los filtros aplicados"
              : "No hay documentos aún"}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <Badge className={getTipoBadge(doc.tipo) + " text-xs"}>
                  {doc.tipo}
                </Badge>
              </div>
              <h3 className="text-sm font-normal mb-1">{doc.nombre}</h3>
              {doc.descripcion && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {doc.descripcion}
                </p>
              )}
              {(doc as any).clientes && (
                <p className="text-xs text-muted-foreground mb-3">
                  {(doc as any).clientes.empresa || (doc as any).clientes.nombre}
                </p>
              )}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted-foreground">
                  {formatDate(doc.fecha_subida)}
                </span>
                <Badge variant={doc.visible_cliente ? "primary" : "outline"} className="text-xs">
                  {doc.visible_cliente ? "Visible" : "Oculto"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="h-3 w-3 mr-1" />
                  Descargar
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
