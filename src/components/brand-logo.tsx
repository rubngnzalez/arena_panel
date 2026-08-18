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
export const TEMA_CLARO_ACTIVO_EVENTO = "arena-theme-changed"

function usarTemaClaro(): boolean {
  if (typeof document === "undefined") return false
  return document.documentElement.classList.contains("light")
}

interface BrandLogoProps {
  className?: string
  imgClassName?: string
  /** Clases extra del wordmark si no existen ficheros de logo */
  fallbackSize?: string
}

/**
 * Logo de marca: logo.png en temas oscuros, logo-dark.png en el claro.
 * - Sin flash de contenido sustituto mientras comprueba qué ficheros existen
 *   (no renderiza nada hasta saberlo).
 * - Reacciona al cambio de tema por evento (setTheme) y observando la
 *   clase light de <html> (anti-flash script / applyTheme directos).
 * - Si no hubiera logos, muestra el wordmark «Arena13».
 */
export function BrandLogo({ className, imgClassName, fallbackSize = "text-2xl" }: BrandLogoProps) {
  const [disponibles, setDisponibles] = useState<{ oscuro: boolean; claro: boolean } | null>(null)
  const [esClaro, setEsClaro] = useState(false)

  useEffect(() => {
    let vivo = true

    const sincronizarTema = () => setEsClaro(usarTemaClaro())

    // Comprobar ficheros en cada montaje (sin caché negativa)
    Promise.all([
      fetch(basePath() + LOGO_OSCURO, { method: "HEAD" }).then((r) => r.ok).catch(() => false),
      fetch(basePath() + LOGO_CLARO, { method: "HEAD" }).then((r) => r.ok).catch(() => false),
    ]).then(([oscuro, claro]) => {
      if (vivo) setDisponibles({ oscuro, claro })
    })

    sincronizarTema()

    // Doble mecanismo de reacción al cambio de tema
    window.addEventListener(TEMA_CLARO_ACTIVO_EVENTO, sincronizarTema)
    const obs = new MutationObserver(sincronizarTema)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    return () => {
      vivo = false
      window.removeEventListener(TEMA_CLARO_ACTIVO_EVENTO, sincronizarTema)
      obs.disconnect()
    }
  }, [])

  // Selección: la versión del tema si existe; si solo hay una, esa; si no, wordmark
  const src =
    disponibles === null
      ? null // comprobando: no renderizar nada (evita flash)
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
      ) : disponibles === null ? (
        <span aria-hidden className={cn("h-10 w-20", imgClassName)} />
      ) : (
        <span className={cn("font-medium tracking-tight text-gradient", fallbackSize)}>Arena13</span>
      )}
    </span>
  )
}
