"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Resuelve el base path del site (GitHub Pages sirve bajo /arena_panel
 * hasta que el dominio custom propague).
 */
export function basePath(): string {
  if (typeof window === "undefined") return ""
  return window.location.pathname.startsWith("/arena_panel") ? "/arena_panel" : ""
}

const LOGO_OSCURO = "/branding/logo.png"       // logo claro para fondos oscuros
const LOGO_CLARO = "/branding/logo-dark.png"   // logo oscuro para fondo claro

/** Comprueba (una vez por sesión) qué ficheros de branding existen. */
let cache: { oscuro: boolean; claro: boolean } | null = null

async function comprobarLogos() {
  if (cache) return cache
  const head = async (url: string) => {
    try {
      const r = await fetch(url, { method: "HEAD" })
      return r.ok
    } catch {
      return false
    }
  }
  const [oscuro, claro] = await Promise.all([
    head(basePath() + LOGO_OSCURO),
    head(basePath() + LOGO_CLARO),
  ])
  cache = { oscuro, claro }
  return cache
}

function usarTemaClaro(): boolean {
  if (typeof document === "undefined") return false
  return document.documentElement.classList.contains("light")
}

interface BrandLogoProps {
  className?: string
  imgClassName?: string
  /** Tamaño del fallback tipográfico A13 */
  fallbackSize?: string
}

/**
 * Logo de marca arriba-izquierda. Usa logo.png en temas oscuros y
 * logo-dark.png en el tema claro (si existen); si no, fallback «A13».
 */
export function BrandLogo({ className, imgClassName, fallbackSize = "text-3xl" }: BrandLogoProps) {
  const [disponibles, setDisponibles] = useState<{ oscuro: boolean; claro: boolean } | null>(cache)
  const [esClaro, setEsClaro] = useState(false)

  useEffect(() => {
    comprobarLogos().then(setDisponibles)
    setEsClaro(usarTemaClaro())
    // Observar cambios de tema (applyTheme añade/quita la clase light en <html>)
    const obs = new MutationObserver(() => setEsClaro(usarTemaClaro()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  const usarLogo = esClaro
    ? disponibles?.claro && disponibles.oscuro ? LOGO_CLARO : disponibles?.oscuro ? LOGO_OSCURO : null
    : disponibles?.oscuro ? LOGO_OSCURO : null

  return (
    <span className={cn("relative inline-flex items-center justify-center", className)}>
      {usarLogo ? (
        <img
          src={basePath() + usarLogo}
          alt="Arena13"
          className={cn("h-10 w-auto object-contain", imgClassName)}
        />
      ) : (
        <span className={cn("font-semibold tracking-tight text-gradient", fallbackSize)}>A13</span>
      )}
    </span>
  )
}
