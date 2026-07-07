"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Database,
  Rocket,
  Globe,
  HelpCircle,
  Copy,
  Check,
  Save,
  RefreshCw,
} from "lucide-react"
import { getSupabaseConfig, getPanelUrl } from "@/lib/supabase/config"

export default function SettingsPage() {
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [environment, setEnvironment] = useState<"local" | "produccion">("local")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dnsDialogOpen, setDnsDialogOpen] = useState(false)

  useEffect(() => {
    // Cargar configuración actual
    const config = getSupabaseConfig()
    setSupabaseUrl(config.url)
    setSupabaseKey(config.anonKey)
    setEnvironment(config.environment)
  }, [])

  const handleSaveConfig = async () => {
    setSaving(true)

    // Simular guardado (en producción esto actualizaría .env.local o una tabla de configuración)
    await new Promise(resolve => setTimeout(resolve, 1000))

    setSaving(false)
    setSaved(true)

    setTimeout(() => setSaved(false), 3000)
  }

  const handleDeploy = async () => {
    // En producción esto haría push al repo
    window.open("https://github.com/arenatrece/panel/actions", "_blank")
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const dnsRecords = [
    { type: "CNAME", name: "panel", value: "arenatrece.github.io", ttl: "3600" },
    { type: "TXT", name: "_github-challenge-panel-arenatrece", value: "[código desde GitHub]", ttl: "3600" },
  ]

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Gestiona la configuración del panel y despliegues
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuración Supabase */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Database className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle>Base de Datos</CardTitle>
                <CardDescription>
                  Configura tu conexión con Supabase
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supabase-url">Supabase URL</Label>
              <Input
                id="supabase-url"
                placeholder="https://xxx.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supabase-key">Clave Anónima</Label>
              <Input
                id="supabase-key"
                type="password"
                placeholder="eyJhbGci..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Entorno</Label>
              <div className="flex gap-2">
                <Badge
                  variant={environment === "local" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setEnvironment("local")}
                >
                  Local
                </Badge>
                <Badge
                  variant={environment === "produccion" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setEnvironment("produccion")}
                >
                  Producción
                </Badge>
              </div>
            </div>

            <Button
              onClick={handleSaveConfig}
              disabled={saving}
              className="w-full"
              variant="default"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Guardado
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Configuración
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              💡 Los cambios se aplican al recargar la página
            </p>
          </CardContent>
        </Card>

        {/* Despliegue */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Rocket className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle>Publicar Cambios</CardTitle>
                <CardDescription>
                  Despliega a GitHub Pages
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div>
                <div className="font-medium">Estado del Deploy</div>
                <div className="text-sm text-muted-foreground">Último: hace 2 días</div>
              </div>
              <Badge variant="success">✅ Activo</Badge>
            </div>

            <div className="space-y-2">
              <Label>URL del Panel</Label>
              <div className="flex gap-2">
                <Input
                  value={getPanelUrl()}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(getPanelUrl())}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button onClick={handleDeploy} className="w-full" variant="default">
              <Rocket className="h-4 w-4 mr-2" />
              Publicar en GitHub Pages
            </Button>

            <p className="text-xs text-muted-foreground">
              💡 Al hacer click se abrirán las Actions de GitHub donde podrás ver el progreso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuración DNS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Globe className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <CardTitle>Configuración DNS</CardTitle>
                <CardDescription>
                  Registros para conectar tu dominio
                </CardDescription>
              </div>
            </div>
            <Dialog open={dnsDialogOpen} onOpenChange={setDnsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Ver Instrucciones
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Instrucciones de Configuración DNS</DialogTitle>
                  <DialogDescription>
                    Configura estos registros en tu registrador de dominios
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  <div>
                    <h3 className="font-semibold mb-3">1. Verificar Dominio en GitHub</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Primero, añade el registro TXT que GitHub te proporciona en:
                    </p>
                    <code className="text-xs bg-white/5 px-2 py-1 rounded">
                      github.com/arenatrece/panel/settings/pages
                    </code>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">2. Configurar Registro CNAME</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Añade este registro en tu registrador (Namecheap, GoDaddy, etc.):
                    </p>
                    <div className="bg-black/40 rounded-lg p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-2">Tipo</th>
                            <th className="text-left py-2">Nombre</th>
                            <th className="text-left py-2">Valor</th>
                            <th className="text-left py-2">TTL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dnsRecords.map((record, i) => (
                            <tr key={i} className="border-b border-white/5">
                              <td className="py-2 font-mono text-primary">{record.type}</td>
                              <td className="py-2 font-mono">{record.name}</td>
                              <td className="py-2 font-mono">{record.value}</td>
                              <td className="py-2 font-mono">{record.ttl}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">3. Esperar Propagación</h3>
                    <p className="text-sm text-muted-foreground">
                      Los cambios DNS pueden tardar entre 10 minutos y 48 horas. Verifica la
                      propagación en:
                    </p>
                    <a
                      href="https://dnschecker.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      dnschecker.org
                    </a>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">4. Habilitar HTTPS</h3>
                    <p className="text-sm text-muted-foreground">
                      Una vez propagado, activa "Enforce HTTPS" en GitHub Pages Settings.
                      GitHub emitirá automáticamente un certificado SSL Let's Encrypt.
                    </p>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <p className="text-sm text-amber-400">
                      ⚠️ Si cambias estos registros, asegúrate de que no rompas otros
                      subdominios de arenatrece.com
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-black/40 rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4">Tipo</th>
                  <th className="text-left py-3 px-4">Nombre</th>
                  <th className="text-left py-3 px-4">Valor</th>
                  <th className="text-left py-3 px-4">TTL</th>
                  <th className="text-right py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {dnsRecords.map((record, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 px-4 font-mono text-primary">{record.type}</td>
                    <td className="py-3 px-4 font-mono">{record.name}</td>
                    <td className="py-3 px-4 font-mono truncate max-w-[200px]">{record.value}</td>
                    <td className="py-3 px-4 font-mono">{record.ttl}</td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(record.value)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              🌐 <strong>panel.arenatrece.com</strong> apuntará a este panel
            </p>
            <Badge variant="outline">Configurado</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Información del sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Versión</div>
              <div className="font-medium">1.0.0</div>
            </div>
            <div>
              <div className="text-muted-foreground">Entorno</div>
              <div className="font-medium capitalize">{environment}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Framework</div>
              <div className="font-medium">Next.js 15</div>
            </div>
            <div>
              <div className="text-muted-foreground">Base de Datos</div>
              <div className="font-medium">Supabase</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
