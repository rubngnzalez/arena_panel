/**
 * Sistema de Features Flags - Arena13 Panel
 * Activa/desactiva funcionalidades opcionales
 */

export interface FeatureConfig {
  enabled: boolean
  label: string
  description: string
  category: 'gestion' | 'integraciones' | 'comunicacion' | 'analytics'
}

export const FEATURES: Record<string, FeatureConfig> = {
  // Gestión
  portal_cliente: {
    enabled: true,
    label: 'Portal del Cliente',
    description: 'Permite que los clientes accedan a sus propios proyectos y documentos',
    category: 'gestion',
  },

  tickets_soporte: {
    enabled: true,
    label: 'Tickets de Soporte',
    description: 'Sistema de tickets para gestión de incidencias y consultas',
    category: 'gestion',
  },

  calculadora_presupuestos: {
    enabled: true,
    label: 'Calculadora de Presupuestos',
    description: 'Generación de presupuestos con plantillas',
    category: 'gestion',
  },

  facturacion: {
    enabled: true,
    label: 'Sistema de Facturación',
    description: 'Gestión completa de facturas y cobros',
    category: 'gestion',
  },

  documentos: {
    enabled: true,
    label: 'Gestión Documental',
    description: 'Almacenamiento y gestión de archivos por cliente',
    category: 'gestion',
  },

  colaboradores: {
    enabled: true,
    label: 'Gestión de Colaboradores',
    description: 'Sistema multi-usuario con roles personalizados',
    category: 'gestion',
  },

  // Comunicación
  notificaciones: {
    enabled: true,
    label: 'Notificaciones',
    description: 'Sistema de notificaciones por email e in-app',
    category: 'comunicacion',
  },

  newsletter: {
    enabled: true,
    label: 'Newsletter',
    description: 'Envío de newsletters a clientes',
    category: 'comunicacion',
  },

  // Integraciones
  kilocode: {
    enabled: true,
    label: 'KiloCode',
    description: 'Generación de código con IA',
    category: 'integraciones',
  },

  opendesign: {
    enabled: true,
    label: 'OpenDesign',
    description: 'Colaboración en diseños',
    category: 'integraciones',
  },

  arenatrece_sync: {
    enabled: true,
    label: 'Sincronización arenatrece.com',
    description: 'Integración con la web principal',
    category: 'integraciones',
  },

  github_sync: {
    enabled: true,
    label: 'GitHub Sync',
    description: 'Sincronización automática con GitHub',
    category: 'integraciones',
  },

  // Analytics
  analytics: {
    enabled: true,
    label: 'Analytics',
    description: 'Métricas y reportes del panel',
    category: 'analytics',
  },

  reportes: {
    enabled: true,
    label: 'Reportes Avanzados',
    description: 'Exportación de reportes personalizados',
    category: 'analytics',
  },
}

/**
 * Verifica si una feature está activada
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature]?.enabled ?? false
}

/**
 * Obtiene todas las features activadas
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(FEATURES)
    .filter(([_, config]) => config.enabled)
    .map(([key]) => key)
}

/**
 * Obtiene features por categoría
 */
export function getFeaturesByCategory(category: FeatureConfig['category']): Record<string, FeatureConfig> {
  return Object.entries(FEATURES)
    .filter(([_, config]) => config.category === category)
    .reduce((acc, [key, config]) => ({ ...acc, [key]: config }), {} as Record<string, FeatureConfig>)
}

/**
 * Activa/desactiva una feature
 */
export function setFeatureEnabled(feature: keyof typeof FEATURES, enabled: boolean): void {
  if (FEATURES[feature]) {
    FEATURES[feature].enabled = enabled
  }
}
