/**
 * Configuración editable de Supabase
 * Arena13 Panel
 *
 * IMPORTANTE: Los valores se pueden editar desde el panel en /settings
 * o modificando directamente este archivo y las variables de entorno.
 */

export interface SupabaseConfig {
  url: string
  anonKey: string
  environment: 'local' | 'produccion'
  domain: string
}

/**
 * Lee la configuración de variables de entorno
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const environment = (process.env.NEXT_PUBLIC_ENVIRONMENT as 'local' | 'produccion') || 'local'
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'arenatrece.com'

  return {
    url,
    anonKey,
    environment,
    domain,
  }
}

/**
 * Valida si la configuración está completa
 */
export function isConfigValid(): boolean {
  const config = getSupabaseConfig()
  return !!config.url && !!config.anonKey
}

/**
 * Obtiene la URL del panel según el entorno
 */
export function getPanelUrl(): string {
  const config = getSupabaseConfig()

  if (config.environment === 'local') {
    return 'http://localhost:3000'
  }

  return `https://panel.${config.domain}`
}

/**
 * Obtiene la URL del sitio principal
 */
export function getSiteUrl(): string {
  const config = getSupabaseConfig()

  if (config.environment === 'local') {
    return 'http://localhost:3000'
  }

  return `https://www.${config.domain}`
}

/**
 * Configuración por defecto para nuevos proyectos
 */
export const DEFAULT_SERVICIOS = [
  {
    nombre: 'Diseño Web',
    descripcion: 'Desarrollo de sitios web completos y optimizados',
    precio_base: 1500,
    categoria: 'web' as const,
    activo: true,
  },
  {
    nombre: 'Branding',
    descripcion: 'Identidad visual corporativa completa',
    precio_base: 800,
    categoria: 'branding' as const,
    activo: true,
  },
  {
    nombre: 'IA Aplicada',
    descripcion: 'Implementación de soluciones de Inteligencia Artificial',
    precio_base: 2000,
    categoria: 'ia' as const,
    activo: true,
  },
  {
    nombre: 'Growth Marketing',
    descripcion: 'Estrategias integrales de crecimiento digital',
    precio_base: 1200,
    categoria: 'marketing' as const,
    activo: true,
  },
  {
    nombre: 'SEO & GEO',
    descripcion: 'Optimización para motores de búsqueda e IA',
    precio_base: 600,
    categoria: 'marketing' as const,
    activo: true,
  },
  {
    nombre: 'Automatización',
    descripcion: 'Flujos conversacionales y agentes autónomos',
    precio_base: 1000,
    categoria: 'ia' as const,
    activo: true,
  },
  {
    nombre: 'Consultoría',
    descripcion: 'Asesoramiento especializado en diseño digital',
    precio_base: 500,
    categoria: 'consultoria' as const,
    activo: true,
  },
]

/**
 * Estados de proyecto con su configuración visual
 */
export const PROYECTO_ESTADOS = {
  planeacion: {
    label: 'Planificación',
    color: 'bg-blue-500/20 text-blue-400',
    icon: '📋',
  },
  en_progreso: {
    label: 'En Progreso',
    color: 'bg-amber-500/20 text-amber-400',
    icon: '🚧',
  },
  revision: {
    label: 'Revisión',
    color: 'bg-purple-500/20 text-purple-400',
    icon: '👁️',
  },
  completado: {
    label: 'Completado',
    color: 'bg-green-500/20 text-green-400',
    icon: '✅',
  },
} as const

/**
 * Prioridades con su configuración visual
 */
export const PRIORIDADES = {
  baja: {
    label: 'Baja',
    color: 'bg-gray-500/20 text-gray-400',
  },
  media: {
    label: 'Media',
    color: 'bg-blue-500/20 text-blue-400',
  },
  alta: {
    label: 'Alta',
    color: 'bg-orange-500/20 text-orange-400',
  },
  urgente: {
    label: 'Urgente',
    color: 'bg-red-500/20 text-red-400',
  },
} as const
