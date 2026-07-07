"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Code,
  Zap,
  Settings,
  Check,
  AlertCircle,
  Loader2,
  Download,
  Eye,
  Trash2,
  Sparkles,
  Copy,
  Check as CheckIcon,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createKiloCodeClient, CodeTemplate } from "@/lib/integraciones/kilocode"
import {
  getKiloCodeConfig,
  saveKiloCodeConfig,
} from "@/lib/integraciones/config"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase/client"

export default function KiloCodePage() {
  const { toast } = useToast()
  const supabase = useSupabase()
  const [apiKey, setApiKey] = useState("")
  const [projectId, setProjectId] = useState("")
  const [connected, setConnected] = useState(false)
  const [validating, setValidating] = useState(false)
  const [templates, setTemplates] = useState<CodeTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)

  // Estado de generación
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [prompt, setPrompt] = useState("")
  const [generating, setGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState("")
  const [generatedProjects, setGeneratedProjects] = useState<any[]>([])

  // Copia de código
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadConfig()
    loadTemplates()
    loadGeneratedProjects()
  }, [])

  const loadConfig = async () => {
    const config = await getKiloCodeConfig()
    if (config.apiKey) {
      setApiKey(config.apiKey)
      setProjectId(config.projectId || "")
      setConnected(!!config.apiKey)
    }
  }

  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const client = createKiloCodeClient({ apiKey: apiKey || 'mock', projectId })
      const templatesData = await client.getTemplates()
      setTemplates(templatesData)
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const loadGeneratedProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('kilocode_proyectos')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setGeneratedProjects(data)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const handleConnect = async () => {
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Por favor ingresa una API Key",
        variant: "destructive",
      })
      return
    }

    setValidating(true)
    try {
      const client = createKiloCodeClient({ apiKey, projectId })
      const isValid = await client.validateConfig()

      if (isValid) {
        await saveKiloCodeConfig({ apiKey, projectId, activo: true })
        setConnected(true)
        toast({
          title: "Conectado",
          description: "Conexión con KiloCode establecida correctamente",
        })
      } else {
        toast({
          title: "Error de conexión",
          description: "No se pudo validar la API Key",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al conectar con KiloCode",
        variant: "destructive",
      })
    } finally {
      setValidating(false)
    }
  }

  const handleDisconnect = async () => {
    await saveKiloCodeConfig({ apiKey: '', projectId: '', activo: false })
    setApiKey("")
    setProjectId("")
    setConnected(false)
    toast({
      title: "Desconectado",
      description: "Se ha desconectado de KiloCode",
    })
  }

  const handleGenerate = async () => {
    if (!selectedTemplate || !prompt) {
      toast({
        title: "Error",
        description: "Selecciona una plantilla y describe lo que quieres generar",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    setGeneratedCode("")

    try {
      const client = createKiloCodeClient({ apiKey: apiKey || 'mock', projectId })
      const response = await client.generateCode({
        template: selectedTemplate,
        prompt,
        targetFramework: 'nextjs',
        language: 'typescript',
        includeStyles: true,
      })

      if (response.status === 'completed' && response.code) {
        setGeneratedCode(response.code)

        // Guardar en Supabase
        const { error } = await supabase
          .from('kilocode_proyectos')
          .insert({
            proyecto_id: response.id,
            nombre: `${templates.find(t => t.id === selectedTemplate)?.name || 'Proyecto'} - ${new Date().toLocaleDateString()}`,
            descripcion: prompt,
            tipo: selectedTemplate,
            template: selectedTemplate,
            estado: 'completado',
            codigo_generado: response.code,
            preview_url: response.previewUrl,
          })

        if (!error) {
          await loadGeneratedProjects()
        }

        toast({
          title: "Código generado",
          description: "El código se ha generado correctamente",
        })
      } else if (response.status === 'error') {
        toast({
          title: "Error",
          description: response.error || "Error al generar el código",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error generating code:', error)
      toast({
        title: "Error",
        description: "Error al generar el código",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `generated-${selectedTemplate}-${Date.now()}.tsx`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: "Descargado",
      description: "El código se ha descargado correctamente",
    })
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('kilocode_proyectos')
        .delete()
        .eq('id', projectId)

      if (!error) {
        await loadGeneratedProjects()
        toast({
          title: "Eliminado",
          description: "El proyecto se ha eliminado correctamente",
        })
      }
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const loadProjectCode = async (project: any) => {
    setGeneratedCode(project.codigo_generado || "")
    setSelectedTemplate(project.template || "")
    setPrompt(project.descripcion || "")
  }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-2xl font-normal tracking-tight mb-2">KiloCode</h1>
        <p className="text-sm text-muted-foreground">
          Generación de código con IA
        </p>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generar</TabsTrigger>
          <TabsTrigger value="projects">Proyectos</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        {/* Tab Generar */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generar Código
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!connected && (
                <div className="flex items-start gap-3 p-4 border border-warning/20 bg-warning/5 rounded-md">
                  <AlertCircle className="h-5 w-5 text-warning shrink-0" />
                  <div>
                    <h3 className="text-sm font-normal mb-1">No conectado</h3>
                    <p className="text-xs text-muted-foreground">
                      Conecta tu cuenta de KiloCode en la pestaña Configuración para generar código
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Plantilla</Label>
                {loadingTemplates ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Cargando plantillas...
                  </div>
                ) : (
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <Code className="h-3 w-3" />
                            <span>{template.name}</span>
                            <Badge variant="outline" className="text-xs ml-2">
                              {template.framework}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe qué quieres generar... Ej: Landing page para una app de fitness con secciones de features, pricing y contacto"
                  rows={4}
                  disabled={!connected}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!connected || generating || !selectedTemplate || !prompt}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar Código
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedCode && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Código Generado</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyCode}>
                      {copied ? (
                        <>
                          <CheckIcon className="h-3 w-3 mr-1" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadCode}>
                      <Download className="h-3 w-3 mr-1" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-primary/5 p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{generatedCode}</code>
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Proyectos */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Proyectos Guardados</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedProjects.length === 0 ? (
                <div className="text-center py-8">
                  <Code className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No hay proyectos generados aún
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {generatedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 border border-border hover:border-primary/30 transition-colors rounded-md"
                    >
                      <div className="flex-1">
                        <p className="text-sm">{project.nombre}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {project.descripcion}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={project.estado === 'completado' ? 'default' : 'secondary'} className="text-xs">
                          {project.estado}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => loadProjectCode(project)}
                          title="Cargar código"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteProject(project.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Configuración */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Conexión API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {connected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Conectado a KiloCode</span>
                    <Badge variant="primary" className="text-xs">Activo</Badge>
                  </div>

                  {projectId && (
                    <div className="p-3 bg-primary/5 rounded-md">
                      <p className="text-xs text-muted-foreground">Project ID</p>
                      <p className="text-sm font-mono">{projectId}</p>
                    </div>
                  )}

                  <div className="p-3 bg-primary/5 rounded-md">
                    <p className="text-xs text-muted-foreground">API Key</p>
                    <p className="text-sm font-mono">
                      {apiKey?.slice(0, 8)}...{apiKey?.slice(-4)}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    className="w-full"
                  >
                    Desconectar
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="kc_..."
                      type="password"
                    />
                    <p className="text-xs text-muted-foreground">
                      Obtén tu API Key en{" "}
                      <a
                        href="https://kilocode.ai/dashboard/settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        KiloCode Dashboard
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Project ID (Opcional)</Label>
                    <Input
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      placeholder="proj_..."
                    />
                  </div>

                  <Button
                    onClick={handleConnect}
                    disabled={!apiKey || validating}
                    className="w-full"
                  >
                    {validating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Conectar
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-normal mb-2">Acerca de KiloCode</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    KiloCode utiliza IA para generar código automáticamente. Selecciona una plantilla,
                    describe lo que necesitas y obtén código listo para usar.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Los proyectos generados se guardan automáticamente en tu panel para referencia futura.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
