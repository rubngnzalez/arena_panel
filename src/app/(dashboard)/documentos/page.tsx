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
import { Label } from "@/components/ui/label"
import { formatDate, cn } from "@/lib/utils"
import { obtenerRol, type Rol } from "@/lib/roles"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { Cliente } from "@/types"

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
  const [rol, setRol] = useState<Rol>("admin")

  // Subida de documentos
  const [subirOpen, setSubirOpen] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [subirError, setSubirError] = useState("")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [subirForm, setSubirForm] = useState({ nombre: "", descripcion: "", tipo: "documento", cliente_id: "", visible_cliente: true })
  const [clientesLista, setClientesLista] = useState<Cliente[]>([])

  useEffect(() => {
    const cargarRol = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) setRol(await obtenerRol(supabase as any, session.user.id))
    }
    cargarRol()
    fetchDocuments()
    supabase
      .from("clientes")
      .select("id,nombre,empresa")
      .order("nombre")
      .then(({ data }) => setClientesLista((data as Cliente[]) || []))
  }, [supabase])

  const elegirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setArchivo(f)
    if (!subirForm.nombre) {
      setSubirForm((prev) => ({ ...prev, nombre: f.name.replace(/\.[^.]+$/, "") }))
    }
  }

  const subirDocumento = async () => {
    if (!archivo) {
      setSubirError("Selecciona un archivo.")
      return
    }
    setSubiendo(true)
    setSubirError("")
    try {
      const ext = archivo.name.split(".").pop()
      const path = `documentos/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error: upErr } = await supabase.storage
        .from("cliente-docs")
        .upload(path, archivo, { upsert: false })
      if (upErr) throw upErr
      const { data } = supabase.storage.from("cliente-docs").getPublicUrl(path)

      const { error: insErr } = await supabase.from("documentos").insert({
        nombre: subirForm.nombre.trim() || archivo.name,
        descripcion: subirForm.descripcion.trim() || null,
        tipo: subirForm.tipo,
        archivo_url: data.publicUrl,
        archivo_tamano: archivo.size,
        cliente_id: subirForm.cliente_id || null,
        visible_cliente: subirForm.visible_cliente,
      })
      if (insErr) throw insErr

      setSubirOpen(false)
      setArchivo(null)
      setSubirForm({ nombre: "", descripcion: "", tipo: "documento", cliente_id: "", visible_cliente: true })
      fetchDocuments()
    } catch (err: any) {
      console.error("Error subiendo documento:", err)
      setSubirError(err?.message || "No se pudo subir el documento.")
    } finally {
      setSubiendo(false)
    }
  }

  const eliminarDocumento = async (doc: Document) => {
    if (!confirm(`¿Eliminar «${doc.nombre}»?`)) return
    try {
      const { error } = await supabase.from("documentos").delete().eq("id", doc.id)
      if (error) throw error
      setDocuments(documents.filter((d) => d.id !== doc.id))
    } catch (err) {
      console.error("Error eliminando documento:", err)
      alert("No se pudo eliminar el documento.")
    }
  }

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
        {rol !== "cliente" && (
          <Button onClick={() => setSubirOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Subir Archivo
          </Button>
        )}
      </div>

      {/* Diálogo: subir documento */}
      <Dialog open={subirOpen} onOpenChange={(open) => { setSubirOpen(open); if (!open) setSubirError("") }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subir Archivo</DialogTitle>
            <DialogDescription>Sube un documento a la biblioteca</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {subirError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {subirError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Archivo *</Label>
              <input
                type="file"
                onChange={elegirArchivo}
                className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-pill file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:text-foreground hover:file:bg-white/20 cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={subirForm.nombre}
                onChange={(e) => setSubirForm({ ...subirForm, nombre: e.target.value })}
                placeholder="Nombre visible del documento"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={subirForm.descripcion}
                onChange={(e) => setSubirForm({ ...subirForm, descripcion: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={subirForm.tipo} onValueChange={(v) => setSubirForm({ ...subirForm, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diseño">Diseño</SelectItem>
                    <SelectItem value="documento">Documento</SelectItem>
                    <SelectItem value="imagen">Imagen</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={subirForm.cliente_id || "ninguno"} onValueChange={(v) => setSubirForm({ ...subirForm, cliente_id: v === "ninguno" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno">Sin asignar</SelectItem>
                    {clientesLista.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.empresa || c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSubirForm({ ...subirForm, visible_cliente: !subirForm.visible_cliente })}
              className={cn(
                "w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm text-left transition-colors",
                subirForm.visible_cliente
                  ? "border-primary/40 bg-primary/10"
                  : "border-white/10 bg-white/[0.02] text-muted-foreground"
              )}
            >
              <span>Visible para el cliente</span>
              <span className={cn("relative h-5 w-9 rounded-pill transition-colors shrink-0 ml-3", subirForm.visible_cliente ? "bg-arena-gradient" : "bg-white/10")}>
                <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", subirForm.visible_cliente ? "left-[1.15rem]" : "left-0.5")} />
              </span>
            </button>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSubirOpen(false)}>Cancelar</Button>
              <Button onClick={subirDocumento} disabled={subiendo || !archivo}>
                {subiendo ? "Subiendo..." : "Subir"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
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
                {rol !== "cliente" && (
                  <Badge variant={doc.visible_cliente ? "primary" : "outline"} className="text-xs">
                    {doc.visible_cliente ? "Visible" : "Oculto"}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {doc.archivo_url && (
                  <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="h-3 w-3 mr-1" />
                      Descargar
                    </Button>
                  </a>
                )}
                {rol !== "cliente" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Eliminar documento"
                    onClick={() => eliminarDocumento(doc)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
