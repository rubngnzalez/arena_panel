"use client"

import { AsistentesView } from "@/components/ia/asistentes-view"
import { ReporteInteraccionesPDF } from "@/components/ia/reporte-interacciones-pdf"

export default function MonitorIaPage() {
  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Monitor IA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Todas las interacciones de los asistentes IA de tus clientes
        </p>
      </div>
      <AsistentesView todos />
      <ReporteInteraccionesPDF titulo="Todos los clientes" />
    </div>
  )
}
