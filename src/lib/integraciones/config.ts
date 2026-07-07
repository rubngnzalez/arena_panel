/**
 * Gestión de configuraciones de integraciones con Supabase
 */

import { supabase } from '@/lib/supabase/client'

export interface IntegrationConfig {
  servicio: string
  api_key?: string
  project_id?: string
  team_id?: string
  webhook_url?: string
  activo: boolean
  metadata?: Record<string, any>
}

/**
 * Obtiene la configuración de una integración
 */
export async function getIntegrationConfig(servicio: string): Promise<IntegrationConfig | null> {
  try {
    const { data, error } = await supabase
      .from('integraciones_config')
      .select('*')
      .eq('servicio', servicio)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error(`Error getting config for ${servicio}:`, error)
    return null
  }
}

/**
 * Guarda o actualiza la configuración de una integración
 */
export async function saveIntegrationConfig(config: IntegrationConfig): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('integraciones_config')
      .upsert({
        servicio: config.servicio,
        api_key: config.api_key,
        project_id: config.project_id,
        team_id: config.team_id,
        webhook_url: config.webhook_url,
        activo: config.activo,
        metadata: config.metadata || {},
        updated_at: new Date().toISOString(),
      })

    return !error
  } catch (error) {
    console.error('Error saving integration config:', error)
    return false
  }
}

/**
 * Obtiene el estado de todas las integraciones
 */
export async function getIntegrationsStatus(): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase
      .from('vw_integraciones_status')
      .select('*')

    if (error) throw error

    return (data || []).reduce((acc, item) => {
      acc[item.servicio] = item
      return acc
    }, {} as Record<string, any>)
  } catch (error) {
    console.error('Error getting integrations status:', error)
    return {}
  }
}

/**
 * Activa o desactiva una integración
 */
export async function toggleIntegration(servicio: string, activo: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('integraciones_config')
      .update({ activo, updated_at: new Date().toISOString() })
      .eq('servicio', servicio)

    return !error
  } catch (error) {
    console.error('Error toggling integration:', error)
    return false
  }
}

/**
 * Obtiene configuración de KiloCode
 */
export async function getKiloCodeConfig(): Promise<{
  apiKey?: string
  projectId?: string
  activo: boolean
}> {
  const config = await getIntegrationConfig('kilocode')
  return {
    apiKey: config?.api_key,
    projectId: config?.project_id,
    activo: config?.activo ?? false,
  }
}

/**
 * Guarda configuración de KiloCode
 */
export async function saveKiloCodeConfig(params: {
  apiKey?: string
  projectId?: string
  activo?: boolean
}): Promise<boolean> {
  return saveIntegrationConfig({
    servicio: 'kilocode',
    api_key: params.apiKey,
    project_id: params.projectId,
    activo: params.activo ?? true,
  })
}

/**
 * Obtiene configuración de OpenDesign
 */
export async function getOpenDesignConfig(): Promise<{
  apiKey?: string
  teamId?: string
  activo: boolean
}> {
  const config = await getIntegrationConfig('opendesign')
  return {
    apiKey: config?.api_key,
    teamId: config?.team_id,
    activo: config?.activo ?? false,
  }
}

/**
 * Guarda configuración de OpenDesign
 */
export async function saveOpenDesignConfig(params: {
  apiKey?: string
  teamId?: string
  activo?: boolean
}): Promise<boolean> {
  return saveIntegrationConfig({
    servicio: 'opendesign',
    api_key: params.apiKey,
    team_id: params.teamId,
    activo: params.activo ?? true,
  })
}
