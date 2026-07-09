/**
 * Sistema de temas del panel Arena13
 * Cada tema define un conjunto de variables CSS que se aplican a :root
 */

export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  border: string
  input: string
  ring: string
}

export interface Theme {
  id: string
  name: string
  description: string
  isLight: boolean
  colors: ThemeColors
  gradient: string
  gradientRev: string
  glowPrimary: string
  glowSecondary: string
  bgGlow1: string
  bgGlow2: string
  bgGlow3: string
  bgSolid: string
}

export const THEMES: Theme[] = [
  {
    id: "arena-dark",
    name: "Arena Dark",
    description: "Negro puro · Gradiente cian → púrpura",
    isLight: false,
    colors: {
      background: "0 0% 0%",
      foreground: "0 0% 100%",
      card: "0 0% 4%",
      cardForeground: "0 0% 100%",
      popover: "0 0% 4%",
      popoverForeground: "0 0% 100%",
      primary: "238 100% 75%",
      primaryForeground: "0 0% 100%",
      secondary: "0 0% 9%",
      secondaryForeground: "0 0% 100%",
      muted: "0 0% 9%",
      mutedForeground: "0 0% 55%",
      accent: "198 98% 48%",
      accentForeground: "0 0% 100%",
      border: "0 0% 16%",
      input: "0 0% 16%",
      ring: "238 100% 75%",
    },
    gradient: "linear-gradient(90deg, #01a9f2, #787dff)",
    gradientRev: "linear-gradient(90deg, #787dff, #01a9f2)",
    glowPrimary: "0 0 24px rgba(120, 125, 255, 0.35)",
    glowSecondary: "0 0 24px rgba(1, 169, 242, 0.3)",
    bgGlow1: "rgba(120, 125, 255, 0.14)",
    bgGlow2: "rgba(1, 169, 242, 0.12)",
    bgGlow3: "rgba(120, 125, 255, 0.04)",
    bgSolid: "#000000",
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    description: "Azul marino · Gradiente turquesa → azul",
    isLight: false,
    colors: {
      background: "222 47% 5%",
      foreground: "210 40% 96%",
      card: "222 40% 8%",
      cardForeground: "210 40% 96%",
      popover: "222 40% 8%",
      popoverForeground: "210 40% 96%",
      primary: "210 100% 56%",
      primaryForeground: "0 0% 100%",
      secondary: "222 35% 12%",
      secondaryForeground: "210 40% 96%",
      muted: "222 35% 12%",
      mutedForeground: "215 25% 55%",
      accent: "187 85% 43%",
      accentForeground: "0 0% 100%",
      border: "222 30% 18%",
      input: "222 30% 18%",
      ring: "210 100% 56%",
    },
    gradient: "linear-gradient(90deg, #14b8c4, #3b82f6)",
    gradientRev: "linear-gradient(90deg, #3b82f6, #14b8c4)",
    glowPrimary: "0 0 24px rgba(59, 130, 246, 0.35)",
    glowSecondary: "0 0 24px rgba(20, 184, 196, 0.3)",
    bgGlow1: "rgba(59, 130, 246, 0.14)",
    bgGlow2: "rgba(20, 184, 196, 0.12)",
    bgGlow3: "rgba(59, 130, 246, 0.04)",
    bgSolid: "#06101f",
  },
  {
    id: "emerald",
    name: "Emerald",
    description: "Verde profundo · Gradiente esmeralda → lima",
    isLight: false,
    colors: {
      background: "150 30% 4%",
      foreground: "140 30% 95%",
      card: "150 25% 7%",
      cardForeground: "140 30% 95%",
      popover: "150 25% 7%",
      popoverForeground: "140 30% 95%",
      primary: "142 71% 45%",
      primaryForeground: "0 0% 100%",
      secondary: "150 22% 11%",
      secondaryForeground: "140 30% 95%",
      muted: "150 22% 11%",
      mutedForeground: "145 15% 55%",
      accent: "160 84% 39%",
      accentForeground: "0 0% 100%",
      border: "150 18% 18%",
      input: "150 18% 18%",
      ring: "142 71% 45%",
    },
    gradient: "linear-gradient(90deg, #10b981, #84cc16)",
    gradientRev: "linear-gradient(90deg, #84cc16, #10b981)",
    glowPrimary: "0 0 24px rgba(16, 185, 129, 0.35)",
    glowSecondary: "0 0 24px rgba(132, 204, 22, 0.3)",
    bgGlow1: "rgba(16, 185, 129, 0.14)",
    bgGlow2: "rgba(132, 204, 22, 0.10)",
    bgGlow3: "rgba(16, 185, 129, 0.04)",
    bgSolid: "#051008",
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Cálido oscuro · Gradiente rosa → naranja",
    isLight: false,
    colors: {
      background: "20 30% 5%",
      foreground: "30 25% 95%",
      card: "20 25% 8%",
      cardForeground: "30 25% 95%",
      popover: "20 25% 8%",
      popoverForeground: "30 25% 95%",
      primary: "24 95% 53%",
      primaryForeground: "0 0% 100%",
      secondary: "20 20% 12%",
      secondaryForeground: "30 25% 95%",
      muted: "20 20% 12%",
      mutedForeground: "20 12% 55%",
      accent: "340 82% 60%",
      accentForeground: "0 0% 100%",
      border: "20 15% 18%",
      input: "20 15% 18%",
      ring: "24 95% 53%",
    },
    gradient: "linear-gradient(90deg, #f43f5e, #f97316)",
    gradientRev: "linear-gradient(90deg, #f97316, #f43f5e)",
    glowPrimary: "0 0 24px rgba(249, 115, 22, 0.35)",
    glowSecondary: "0 0 24px rgba(244, 63, 94, 0.3)",
    bgGlow1: "rgba(249, 115, 22, 0.14)",
    bgGlow2: "rgba(244, 63, 94, 0.10)",
    bgGlow3: "rgba(249, 115, 22, 0.04)",
    bgSolid: "#100c08",
  },
  {
    id: "royal",
    name: "Royal Purple",
    description: "Púrpura intenso · Gradiente magenta → violeta",
    isLight: false,
    colors: {
      background: "270 40% 5%",
      foreground: "270 30% 95%",
      card: "270 35% 8%",
      cardForeground: "270 30% 95%",
      popover: "270 35% 8%",
      popoverForeground: "270 30% 95%",
      primary: "280 85% 65%",
      primaryForeground: "0 0% 100%",
      secondary: "270 30% 12%",
      secondaryForeground: "270 30% 95%",
      muted: "270 30% 12%",
      mutedForeground: "270 15% 55%",
      accent: "320 85% 60%",
      accentForeground: "0 0% 100%",
      border: "270 25% 18%",
      input: "270 25% 18%",
      ring: "280 85% 65%",
    },
    gradient: "linear-gradient(90deg, #ec4899, #a855f7)",
    gradientRev: "linear-gradient(90deg, #a855f7, #ec4899)",
    glowPrimary: "0 0 24px rgba(168, 85, 247, 0.35)",
    glowSecondary: "0 0 24px rgba(236, 72, 153, 0.3)",
    bgGlow1: "rgba(168, 85, 247, 0.14)",
    bgGlow2: "rgba(236, 72, 153, 0.10)",
    bgGlow3: "rgba(168, 85, 247, 0.04)",
    bgSolid: "#0d0814",
  },
  {
    id: "light",
    name: "Light Clean",
    description: "Claro luminoso · Gradiente azul → cian",
    isLight: true,
    colors: {
      background: "0 0% 98%",
      foreground: "222 47% 11%",
      card: "0 0% 100%",
      cardForeground: "222 47% 11%",
      popover: "0 0% 100%",
      popoverForeground: "222 47% 11%",
      primary: "238 76% 60%",
      primaryForeground: "0 0% 100%",
      secondary: "220 14% 94%",
      secondaryForeground: "222 47% 11%",
      muted: "220 14% 94%",
      mutedForeground: "220 9% 46%",
      accent: "198 90% 45%",
      accentForeground: "0 0% 100%",
      border: "220 13% 88%",
      input: "220 13% 88%",
      ring: "238 76% 60%",
    },
    gradient: "linear-gradient(90deg, #0ea5e9, #6366f1)",
    gradientRev: "linear-gradient(90deg, #6366f1, #0ea5e9)",
    glowPrimary: "0 0 20px rgba(99, 102, 241, 0.15)",
    glowSecondary: "0 0 20px rgba(14, 165, 233, 0.12)",
    bgGlow1: "rgba(99, 102, 241, 0.08)",
    bgGlow2: "rgba(14, 165, 233, 0.06)",
    bgGlow3: "rgba(99, 102, 241, 0.02)",
    bgSolid: "#f5f5f7",
  },
]

export const DEFAULT_THEME_ID = "arena-dark"
const STORAGE_KEY = "arena13-theme"

export function getThemeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) || THEMES[0]
}

export function getStoredThemeId(): string {
  if (typeof window === "undefined") return DEFAULT_THEME_ID
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME_ID
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  const c = theme.colors

  const set = (key: string, val: string) => root.style.setProperty(key, val)

  set("--background", c.background)
  set("--foreground", c.foreground)
  set("--card", c.card)
  set("--card-foreground", c.cardForeground)
  set("--popover", c.popover)
  set("--popover-foreground", c.popoverForeground)
  set("--primary", c.primary)
  set("--primary-foreground", c.primaryForeground)
  set("--secondary", c.secondary)
  set("--secondary-foreground", c.secondaryForeground)
  set("--muted", c.muted)
  set("--muted-foreground", c.mutedForeground)
  set("--accent", c.accent)
  set("--accent-foreground", c.accentForeground)
  set("--border", c.border)
  set("--input", c.input)
  set("--ring", c.ring)

  set("--arena-gradient", theme.gradient)
  set("--arena-gradient-rev", theme.gradientRev)
  set("--arena-glow-purple", theme.glowPrimary)
  set("--arena-glow-cyan", theme.glowSecondary)
  set("--arena-purple-hsl", c.primary)
  set("--arena-cyan-hsl", c.accent)

  set("--theme-glow-1", theme.bgGlow1)
  set("--theme-glow-2", theme.bgGlow2)
  set("--theme-glow-3", theme.bgGlow3)
  set("--theme-bg", theme.bgSolid)

  if (theme.isLight) {
    root.classList.remove("dark")
    root.classList.add("light")
  } else {
    root.classList.remove("light")
    root.classList.add("dark")
  }
}

export function setTheme(themeId: string) {
  const theme = getThemeById(themeId)
  localStorage.setItem(STORAGE_KEY, themeId)
  applyTheme(theme)
}

export const ANTI_FLASH_SCRIPT = `
(function(){try{var t=localStorage.getItem('${STORAGE_KEY}')||'${DEFAULT_THEME_ID}';var themes=${JSON.stringify(THEMES.map(t=>({id:t.id,isLight:t.isLight,bgSolid:t.bgSolid})))};var th=themes.find(function(x){return x.id===t})||themes[0];var r=document.documentElement;var c={'arena-dark':['0 0% 0%','0 0% 4%','0 0% 100%','0 0% 55%','0 0% 16%','238 100% 75%','198 98% 48%','linear-gradient(90deg, #01a9f2, #787dff)','rgba(120, 125, 255, 0.14)','rgba(1, 169, 242, 0.12)','rgba(120, 125, 255, 0.04)','#000000'],'ocean':['222 47% 5%','222 40% 8%','210 40% 96%','215 25% 55%','222 30% 18%','210 100% 56%','187 85% 43%','linear-gradient(90deg, #14b8c4, #3b82f6)','rgba(59, 130, 246, 0.14)','rgba(20, 184, 196, 0.12)','rgba(59, 130, 246, 0.04)','#06101f'],'emerald':['150 30% 4%','150 25% 7%','140 30% 95%','145 15% 55%','150 18% 18%','142 71% 45%','160 84% 39%','linear-gradient(90deg, #10b981, #84cc16)','rgba(16, 185, 129, 0.14)','rgba(132, 204, 22, 0.10)','rgba(16, 185, 129, 0.04)','#051008'],'sunset':['20 30% 5%','20 25% 8%','30 25% 95%','20 12% 55%','20 15% 18%','24 95% 53%','340 82% 60%','linear-gradient(90deg, #f43f5e, #f97316)','rgba(249, 115, 22, 0.14)','rgba(244, 63, 94, 0.10)','rgba(249, 115, 22, 0.04)','#100c08'],'royal':['270 40% 5%','270 35% 8%','270 30% 95%','270 15% 55%','270 25% 18%','280 85% 65%','320 85% 60%','linear-gradient(90deg, #ec4899, #a855f7)','rgba(168, 85, 247, 0.14)','rgba(236, 72, 153, 0.10)','rgba(168, 85, 247, 0.04)','#0d0814'],'light':['0 0% 98%','0 0% 100%','222 47% 11%','220 9% 46%','220 13% 88%','238 76% 60%','198 90% 45%','linear-gradient(90deg, #0ea5e9, #6366f1)','rgba(99, 102, 241, 0.08)','rgba(14, 165, 233, 0.06)','rgba(99, 102, 241, 0.02)','#f5f5f7']};var v=c[t]||c['arena-dark'];var s=r.style;s.setProperty('--background',v[0]);s.setProperty('--card',v[1]);s.setProperty('--foreground',v[2]);s.setProperty('--muted-foreground',v[3]);s.setProperty('--border',v[4]);s.setProperty('--input',v[4]);s.setProperty('--primary',v[5]);s.setProperty('--ring',v[5]);s.setProperty('--accent',v[6]);s.setProperty('--arena-purple-hsl',v[5]);s.setProperty('--arena-cyan-hsl',v[6]);s.setProperty('--arena-gradient',v[7]);s.setProperty('--arena-gradient-rev',v[7]);s.setProperty('--theme-glow-1',v[8]);s.setProperty('--theme-glow-2',v[9]);s.setProperty('--theme-glow-3',v[10]);s.setProperty('--theme-bg',v[11]);s.setProperty('--arena-glow-purple','0 0 24px '+v[8].replace(/0\\.\\d+/,'0.35')+')');s.setProperty('--arena-glow-cyan','0 0 24px '+v[9].replace(/0\\.\\d+/,'0.3')+')');if(th.isLight){r.classList.remove('dark');r.classList.add('light')}else{r.classList.remove('light');r.classList.add('dark')}}catch(e){}})();
`
