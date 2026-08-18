/**
 * Configuración global del panel (logo, título, favicon)
 * Almacenada en localStorage para aplicación instantánea en cliente
 */

export interface PanelConfig {
  titulo?: string
  nombrePanel?: string
  faviconUrl?: string
}

const STORAGE_KEY = "arena13-panel-config"

export function getPanelConfig(): PanelConfig {
  if (typeof window === "undefined") return {}
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    // Saneado: el logo ya no se configura aquí (vive en public/branding/)
    if (raw && typeof raw === "object" && "logoUrl" in raw) {
      delete raw.logoUrl
      localStorage.setItem(STORAGE_KEY, JSON.stringify(raw))
    }
    return raw
  } catch {
    return {}
  }
}

export function savePanelConfig(config: PanelConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  applyPanelConfig(config)
}

export function applyPanelConfig(config: PanelConfig) {
  if (typeof document === "undefined") return
  if (config.titulo) {
    document.title = config.titulo
  }
  if (config.faviconUrl) {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
    if (!link) {
      link = document.createElement("link")
      link.rel = "icon"
      document.head.appendChild(link)
    }
    link.href = config.faviconUrl
  }
}
