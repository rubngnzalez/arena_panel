"use client"

import { useState, useEffect, useRef } from "react"
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
  Database, Rocket, Globe, HelpCircle, Copy, Check, Save, RefreshCw,
  Palette, Upload, CheckCircle2,
} from "lucide-react"
import { getSupabaseConfig, getPanelUrl } from "@/lib/supabase/config"
import { THEMES, getThemeById, getStoredThemeId, setTheme as applyThemeId } from "@/lib/themes"
import { getPanelConfig, savePanelConfig } from "@/lib/panel-config"
import { useSupabase } from "@/lib/supabase/client"

export default function SettingsPage() {
  const supabase = useSupabase()
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [environment, setEnvironment] = useState<"local" | "produccion">("local")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dnsDialogOpen, setDnsDialogOpen] = useState(false)

  // Appearance
  const [currentThemeId, setCurrentThemeId] = useState(getStoredThemeId())
  const [panelCfg, setPanelCfg] = useState({ titulo: "", nombrePanel: "", logoUrl: "", faviconUrl: "" })
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [cfgSaved, setCfgSaved] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const faviconRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const config = getSupabaseConfig()
    setSupabaseUrl(config.url)
    setSupabaseKey(config.anonKey)
    setEnvironment(config.environment)

    const pc = getPanelConfig()
    setPanelCfg({
      titulo: pc.titulo || "",
      nombrePanel: pc.nombrePanel || "",
      logoUrl: pc.logoUrl || "",
      faviconUrl: pc.faviconUrl || "",
    })
  }, [])

  const handleThemeChange = (themeId: string) => {
    setCurrentThemeId(themeId)
    applyThemeId(themeId)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const path = `panel/logo_${Date.now()}.${file.name.split(".").pop()}`
      const { error } = await supabase.storage.from("cliente-docs").upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from("cliente-docs").getPublicUrl(path)
      setPanelCfg({ ...panelCfg, logoUrl: data.publicUrl })
    } catch (err) {
      console.error("Error:", err)
      alert("No se pudo subir el logo.")
    } finally {
      setUploadingLogo(false)
      if (logoRef.current) logoRef.current.value = ""
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFavicon(true)
    try {
      const path = `panel/favicon_${Date.now()}.${file.name.split(".").pop()}`
      const { error } = await supabase.storage.from("cliente-docs").upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from("cliente-docs").getPublicUrl(path)
      setPanelCfg({ ...panelCfg, faviconUrl: data.publicUrl })
    } catch (err) {
      console.error("Error:", err)
      alert("No se pudo subir el favicon.")
    } finally {
      setUploadingFavicon(false)
      if (faviconRef.current) faviconRef.current.value = ""
    }
  }

  const handleSavePanelCfg = () => {
    const config = {
      titulo: panelCfg.titulo.trim() || undefined,
      nombrePanel: panelCfg.nombrePanel.trim() || undefined,
      logoUrl: panelCfg.logoUrl || undefined,
      faviconUrl: panelCfg.faviconUrl || undefined,
    }
    savePanelConfig(config)
    window.dispatchEvent(new Event("panel-config-changed"))
    setCfgSaved(true)
    setTimeout(() => setCfgSaved(false), 2500)
  }

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

      {/* Apariencia */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Palette className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle>Apariencia y Marca</CardTitle>
              <CardDescription>Personaliza el panel con tu identidad visual</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selector de temas */}
          <div>
            <Label className="mb-3 block">Tema del panel</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {THEMES.map((theme) => {
                const isSelected = theme.id === currentThemeId
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                      isSelected ? "border-primary" : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </span>
                    )}
                    <div className="flex gap-1.5 mb-2">
                      <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: theme.bgSolid }} />
                      <div className="h-8 w-8 rounded-lg" style={{ background: theme.gradient }} />
                    </div>
                    <p className="text-sm font-medium">{theme.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{theme.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Logo y favicon */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Logo del panel</Label>
              <div className="flex items-center gap-3">
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                {panelCfg.logoUrl ? (
                  <img src={panelCfg.logoUrl} alt="Logo" className="h-12 w-12 rounded-lg object-cover border border-white/10" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-arena-gradient flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">A</span>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()} disabled={uploadingLogo}>
                  {uploadingLogo ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  {uploadingLogo ? "Subiendo..." : "Subir logo"}
                </Button>
                {panelCfg.logoUrl && (
                  <Button variant="ghost" size="sm" onClick={() => setPanelCfg({ ...panelCfg, logoUrl: "" })}>
                    Quitar
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Favicon</Label>
              <div className="flex items-center gap-3">
                <input ref={faviconRef} type="file" accept="image/*,.ico" className="hidden" onChange={handleFaviconUpload} />
                {panelCfg.faviconUrl ? (
                  <img src={panelCfg.faviconUrl} alt="Favicon" className="h-8 w-8 rounded border border-white/10" />
                ) : (
                  <div className="h-8 w-8 rounded border border-white/10 flex items-center justify-center text-xs">16</div>
                )}
                <Button variant="outline" size="sm" onClick={() => faviconRef.current?.click()} disabled={uploadingFavicon}>
                  {uploadingFavicon ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  {uploadingFavicon ? "Subiendo..." : "Subir favicon"}
                </Button>
                {panelCfg.faviconUrl && (
                  <Button variant="ghost" size="sm" onClick={() => setPanelCfg({ ...panelCfg, faviconUrl: "" })}>
                    Quitar
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Títulos */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo-nav">Título del navegador (pestaña)</Label>
              <Input id="titulo-nav" value={panelCfg.titulo} onChange={(e) => setPanelCfg({ ...panelCfg, titulo: e.target.value })}
                placeholder="Arena13 - Panel de Gestión" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre-panel">Nombre visible en el sidebar</Label>
              <Input id="nombre-panel" value={panelCfg.nombrePanel} onChange={(e) => setPanelCfg({ ...panelCfg, nombrePanel: e.target.value })}
                placeholder="Arena13" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            {cfgSaved && (
              <span className="flex items-center gap-1.5 text-sm text-green-400">
                <CheckCircle2 className="h-4 w-4" /> Guardado
              </span>
            )}
            <Button onClick={handleSavePanelCfg}>
              <Save className="h-4 w-4 mr-2" /> Guardar configuración
            </Button>
          </div>
        </CardContent>
      </Card>

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
