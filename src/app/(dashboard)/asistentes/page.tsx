"use client"

import { AsistentesView } from "@/components/ia/asistentes-view"
import { ReporteInteraccionesPDF } from "@/components/ia/reporte-interacciones-pdf"

export default function AsistentesPage() {
  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis Asistentes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Llamadas atendidas por tus asistentes IA, con audio y transcripción
        </p>
      </div>
      <AsistentesView todos={false} />
      <ReporteInteraccionesPDF titulo="Mi cuenta" />
    </div>
  )
}
