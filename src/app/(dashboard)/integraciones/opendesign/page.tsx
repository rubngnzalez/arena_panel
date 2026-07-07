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
  Palette,
  Settings,
  Check,
  AlertCircle,
  Loader2,
  Users,
  FileText,
  ExternalLink,
  Plus,
  RefreshCw,
  Trash2,
  MessageSquare,
} from "lucide-react"
import { createOpenDesignClient, DesignProject, TeamMember } from "@/lib/integraciones/opendesign"
import {
  getOpenDesignConfig,
  saveOpenDesignConfig,
} from "@/lib/integraciones/config"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { useSupabase } from "@/lib/supabase/client"

export default function OpenDesignPage() {
  const { toast } = useToast()
  const supabase = useSupabase()
  const [apiKey, setApiKey] = useState("")
  const [teamId, setTeamId] = useState("")
  const [connected, setConnected] = useState(false)
  const [validating, setValidating] = useState(false)

  // Estado de proyectos
  const [projects, setProjects] = useState<DesignProject[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Estado de equipo
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Crear proyecto
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDesc, setNewProjectDesc] = useState("")

  useEffect(() => {
    loadConfig()
  }, [])

  useEffect(() => {
    if (connected) {
      loadProjects()
      loadTeamMembers()
    }
  }, [connected])

  const loadConfig = async () => {
    const config = await getOpenDesignConfig()
    if (config.apiKey) {
      setApiKey(config.apiKey)
      setTeamId(config.teamId || "")
      setConnected(!!config.apiKey)
    }
  }

  const loadProjects = async () => {
    setLoadingProjects(true)
    try {
      const client = createOpenDesignClient({ apiKey: apiKey || 'mock', teamId })
      const projectsData = await client.listProjects()
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoadingProjects(false)
    }
  }

  const loadTeamMembers = async () => {
    setLoadingMembers(true)
    try {
      const client = createOpenDesignClient({ apiKey: apiKey || 'mock', teamId })
      const members = await client.listTeamMembers()
      setTeamMembers(members)
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoadingMembers(false)
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
      const client = createOpenDesignClient({ apiKey, teamId })
      const isValid = await client.validateConfig()

      if (isValid) {
        await saveOpenDesignConfig({ apiKey, teamId, activo: true })
        setConnected(true)
        toast({
          title: "Conectado",
          description: "Conexión con OpenDesign establecida correctamente",
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
        description: "Error al conectar con OpenDesign",
        variant: "destructive",
      })
    } finally {
      setValidating(false)
    }
  }

  const handleDisconnect = async () => {
    await saveOpenDesignConfig({ apiKey: '', teamId: '', activo: false })
    setApiKey("")
    setTeamId("")
    setConnected(false)
    setProjects([])
    setTeamMembers([])
    toast({
      title: "Desconectado",
      description: "Se ha desconectado de OpenDesign",
    })
  }

  const handleSyncProjects = async () => {
    setLoadingProjects(true)
    await loadProjects()
    toast({
      title: "Sincronizado",
      description: "Proyectos sincronizados correctamente",
    })
  }

  const handleCreateProject = async () => {
    if (!newProjectName) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre para el proyecto",
        variant: "destructive",
      })
      return
    }

    setSyncing(true)
    try {
      const client = createOpenDesignClient({ apiKey: apiKey || 'mock', teamId })
      const result = await client.syncProject({
        name: newProjectName,
        description: newProjectDesc,
      })

      if (result) {
        // Guardar en Supabase
        const { error } = await supabase
          .from('opendesign_proyectos')
          .insert({
            team_id: teamId,
            proyecto_id: result.id,
            nombre: result.name,
            descripcion: result.description,
            estado: 'activo',
            ultimo_sync: new Date().toISOString(),
          })

        if (!error) {
          setNewProjectName("")
          setNewProjectDesc("")
          await loadProjects()
          toast({
            title: "Proyecto creado",
            description: "El proyecto se ha creado correctamente",
          })
        }
      }
    } catch (error) {
      console.error('Error creating project:', error)
      toast({
        title: "Error",
        description: "Error al crear el proyecto",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      owner: "bg-primary text-primary-foreground",
      admin: "bg-blue-500/20 text-blue-400",
      editor: "bg-green-500/20 text-green-400",
      viewer: "bg-gray-500/20 text-gray-400",
    }
    return badges[role] || "bg-gray-500/20 text-gray-400"
  }

  const getProjectStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: "bg-green-500/20 text-green-400",
      draft: "bg-yellow-500/20 text-yellow-400",
      archived: "bg-gray-500/20 text-gray-400",
    }
    return badges[status] || "bg-gray-500/20 text-gray-400"
  }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-2xl font-normal tracking-tight mb-2">OpenDesign</h1>
        <p className="text-sm text-muted-foreground">
          Colaboración en diseños en tiempo real
        </p>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects">Proyectos</TabsTrigger>
          <TabsTrigger value="team">Equipo</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        {/* Tab Proyectos */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Proyectos Activos</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncProjects}
                  disabled={loadingProjects || !connected}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${loadingProjects ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!connected ? (
                <div className="text-center py-8">
                  <Palette className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Conecta tu cuenta para ver proyectos
                  </p>
                  <Button variant="outline" size="sm">
                    Ir a Configuración
                  </Button>
                </div>
              ) : loadingProjects ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 mx-auto mb-3 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Cargando proyectos...
                  </p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <Palette className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No hay proyectos en tu equipo
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((project, index) => (
                    <div
                      key={project.id}
                      className={`flex items-center justify-between p-4 border border-border hover:border-primary/30 transition-colors rounded-md ${
                        index < projects.length - 1 ? 'border-b' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {project.thumbnail && (
                          <div className="h-12 w-16 bg-primary/10 rounded overflow-hidden">
                            <img
                              src={project.thumbnail}
                              alt={project.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="text-sm">{project.name}</p>
                          {project.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(project.lastModified)}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              {project.fileCount}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {project.collaboratorCount}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Badge className={getProjectStatusBadge(project.status)} size="sm">
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Crear nuevo proyecto */}
          {connected && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del proyecto</Label>
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Mi nuevo diseño"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción (opcional)</Label>
                  <Textarea
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="Descripción del proyecto..."
                    rows={2}
                  />
                </div>
                <Button
                  onClick={handleCreateProject}
                  disabled={!newProjectName || syncing}
                  className="w-full"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Proyecto
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Equipo */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Miembros del Equipo</CardTitle>
            </CardHeader>
            <CardContent>
              {!connected ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Conecta tu cuenta para ver el equipo
                  </p>
                  <Button variant="outline" size="sm">
                    Ir a Configuración
                  </Button>
                </div>
              ) : loadingMembers ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 mx-auto mb-3 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Cargando miembros...
                  </p>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No hay miembros en el equipo
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map((member, index) => (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-3 ${
                        index < teamMembers.length - 1 ? 'border-b border-border' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <Badge className={getRoleBadge(member.role)} size="sm">
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {connected && teamId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Invitar Miembros</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Comparte este enlace de invitación para añadir nuevos miembros al equipo:
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`https://opendesign.co/invite/${teamId}`}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://opendesign.co/invite/${teamId}`)
                      toast({
                        title: "Copiado",
                        description: "Enlace copiado al portapapeles",
                      })
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
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
                    <span>Conectado a OpenDesign</span>
                    <Badge variant="primary" className="text-xs">Activo</Badge>
                  </div>

                  {teamId && (
                    <div className="p-3 bg-primary/5 rounded-md">
                      <p className="text-xs text-muted-foreground">Team ID</p>
                      <p className="text-sm font-mono">{teamId}</p>
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
                      placeholder="od_..."
                      type="password"
                    />
                    <p className="text-xs text-muted-foreground">
                      Obtén tu API Key en{" "}
                      <a
                        href="https://opendesign.co/dashboard/settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        OpenDesign Dashboard
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Team ID (Opcional)</Label>
                    <Input
                      value={teamId}
                      onChange={(e) => setTeamId(e.target.value)}
                      placeholder="team_..."
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
                        <Palette className="h-4 w-4 mr-2" />
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
                  <h3 className="text-sm font-normal mb-2">Acerca de OpenDesign</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    OpenDesign permite colaborar en diseños en tiempo real con tu equipo.
                    Sincroniza proyectos, comenta en archivos y gestiona versiones.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Los proyectos creados desde el panel se sincronizan automáticamente con tu equipo en OpenDesign.
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
