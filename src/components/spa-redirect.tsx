"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Restaura navegaciones profundas interceptadas por 404.html en GitHub Pages.
 * Ver public/404.html.
 */
export function SpaRedirect() {
  const router = useRouter()

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("arena-spa-redirect")
      if (!raw) return
      sessionStorage.removeItem("arena-spa-redirect")

      // Normaliza el base path del site (/arena_panel en project pages, "" en dominio custom)
      const base = window.location.pathname.replace(/\/[^/]*$/, "")
      let ruta = raw
      if (base && ruta.startsWith(base)) ruta = ruta.slice(base.length)
      if (!ruta.startsWith("/")) ruta = "/" + ruta
      if (ruta === "/404.html" || ruta === "/404") return

      router.replace(ruta)
    } catch {
      /* sin sessionStorage no hay nada que restaurar */
    }
  }, [router])

  return null
}
