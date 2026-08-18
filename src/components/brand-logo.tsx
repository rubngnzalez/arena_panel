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
 * Logo de marca: usa logo.png en temas oscuros y logo-dark.png en el
 * tema claro (si existen); si no, fallback «A13».
 * Reacciona al cambio de tema observando la clase light de <html>.
 */
export function BrandLogo({ className, imgClassName, fallbackSize = "text-3xl" }: BrandLogoProps) {
  const [disponibles, setDisponibles] = useState<{ oscuro: boolean; claro: boolean } | null>(null)
  const [esClaro, setEsClaro] = useState(false)

  useEffect(() => {
    let vivo = true
    // Comprobar en cada montaje (sin caché negativa: los ficheros pueden
    // añadirse después del primer render)
    Promise.all([
      fetch(basePath() + LOGO_OSCURO, { method: "HEAD" }).then((r) => r.ok).catch(() => false),
      fetch(basePath() + LOGO_CLARO, { method: "HEAD" }).then((r) => r.ok).catch(() => false),
    ]).then(([oscuro, claro]) => {
      if (vivo) setDisponibles({ oscuro, claro })
    })

    setEsClaro(usarTemaClaro())
    const obs = new MutationObserver(() => setEsClaro(usarTemaClaro()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => {
      vivo = false
      obs.disconnect()
    }
  }, [])

  // Selección: la versión del tema si existe; si solo hay una, esa; si no, fallback
  const src =
    disponibles === null
      ? null
      : esClaro
        ? disponibles.claro
          ? LOGO_CLARO
          : disponibles.oscuro ? LOGO_OSCURO : null
        : disponibles.oscuro
          ? LOGO_OSCURO
          : disponibles.claro ? LOGO_CLARO : null

  return (
    <span className={cn("relative inline-flex items-center justify-center", className)}>
      {src ? (
        <img
          src={basePath() + src}
          alt="Arena13"
          className={cn("h-10 w-auto object-contain", imgClassName)}
        />
      ) : (
        <span className={cn("font-semibold tracking-tight text-gradient", fallbackSize)}>A13</span>
      )}
    </span>
  )
}
