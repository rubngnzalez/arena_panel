"use client"

import { useEffect, useState } from "react"
import { BrandLogo } from "@/components/brand-logo"

/**
 * Pantalla de carga del panel: logo de marca + barra de progreso.
 * Se muestra mientras se verifican sesión y rol.
 */
export function SplashScreen({ texto = "Cargando panel…" }: { texto?: string }) {
  const [progreso, setProgreso] = useState(12)

  // Progreso suave e indeterminado: crece hasta 90% y se completa al montar el panel
  useEffect(() => {
    const t = setInterval(() => {
      setProgreso((p) => (p < 90 ? p + Math.max(1, (90 - p) * 0.12) : p))
    }, 180)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      {/* Halo neón tras el logo */}
      <div className="relative flex items-center justify-center mb-8">
        <span
          aria-hidden
          className="absolute h-24 w-24 rounded-full bg-arena-gradient blur-2xl opacity-40 animate-arena-neon-halo"
        />
        <BrandLogo
          className="animate-arena-float drop-shadow-[0_0_10px_rgba(120,125,255,0.45)]"
          imgClassName="h-16"
          fallbackSize="text-6xl"
        />
      </div>

      <p className="text-xs uppercase tracking-widest2 text-muted-foreground mb-4 font-light">
        {texto}
      </p>

      {/* Barrita de carga */}
      <div className="w-48 h-1 rounded-pill bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-pill bg-arena-gradient transition-all duration-200 ease-out"
          style={{ width: `${Math.min(progreso, 100)}%` }}
        />
      </div>
    </div>
  )
}
