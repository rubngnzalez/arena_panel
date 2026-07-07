"use client"

import { useState } from "react"
import { FEATURES, getFeaturesByCategory, setFeatureEnabled } from "@/lib/features"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  Users,
  MessageSquare,
  BarChart3,
  Plug,
  Check,
  X,
} from "lucide-react"

const CATEGORIES = {
  gestion: { label: "Gestión", icon: Settings },
  comunicacion: { label: "Comunicación", icon: MessageSquare },
  integraciones: { label: "Integraciones", icon: Plug },
  analytics: { label: "Analytics", icon: BarChart3 },
}

export default function FeaturesPage() {
  const [features, setFeaturesState] = useState(FEATURES)
  const [saveCount, setSaveCount] = useState(0)

  const toggleFeature = (key: string) => {
    const newFeatures = { ...features }
    newFeatures[key].enabled = !newFeatures[key].enabled
    setFeaturesState(newFeatures)
    setFeatureEnabled(key as keyof typeof FEATURES, newFeatures[key].enabled)
    setSaveCount(prev => prev + 1)
  }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-2xl font-normal tracking-tight mb-2">Funcionalidades</h1>
        <p className="text-sm text-muted-foreground">
          Activa o desactiva módulos opcionales del panel
        </p>
      </div>

      {Object.entries(CATEGORIES).map(([catKey, catValue]) => {
        const categoryFeatures = getFeaturesByCategory(catKey as any)
        const Icon = catValue.icon

        return (
          <div key={catKey}>
            <div className="flex items-center gap-3 mb-6">
              <Icon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-normal">{catValue.label}</h2>
              <Badge variant="outline" className="text-xs">
                {Object.values(categoryFeatures).length} módulos
              </Badge>
            </div>

            <div className="space-y-px border-t border-border">
              {Object.entries(categoryFeatures).map(([key, config], index) => (
                <div
                  key={key}
                  className={`flex items-center justify-between py-4 ${index < Object.keys(categoryFeatures).length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm">{config.label}</h3>
                      {config.enabled && (
                        <Badge variant="primary" className="text-xs">
                          Activo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                  <button
                    onClick={() => toggleFeature(key)}
                    className={`ml-6 w-12 h-6 rounded-full border transition-colors ${
                      config.enabled
                        ? 'bg-primary border-primary'
                        : 'bg-transparent border-border'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full transition-transform ${
                        config.enabled
                          ? 'bg-white translate-x-6'
                          : 'bg-muted-foreground translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm mb-1">
                {Object.values(features).filter(f => f.enabled).length} de {Object.values(features).length} módulos activos
              </p>
              <p className="text-xs text-muted-foreground">
                Los cambios se aplican instantáneamente
              </p>
            </div>
            {saveCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-primary">
                <Check className="h-4 w-4" />
                <span>Guardado</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-normal mb-4">Información</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• Los módulos desactivados no consumen recursos</p>
            <p>• Algunos módulos requieren configuración adicional</p>
            <p>• Las integraciones necesitan API keys en Configuración</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
