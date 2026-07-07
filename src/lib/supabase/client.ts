import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

/**
 * Cliente Supabase para uso en el navegador (Client Components)
 * Arena13 Panel - Configuración segura con variables de entorno
 */

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getBrowserClient() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    if (!url || !key) {
      console.error('⚠️ Supabase: Credenciales no configuradas. Configura .env.local')
      throw new Error('Supabase credentials not configured')
    }

    supabaseClient = createBrowserClient<Database>(url, key)
  }

  return supabaseClient
}

/**
 * Obtiene el cliente Supabase (alias)
 */
export const supabase = getBrowserClient

/**
 * Hook personalizado para usar Supabase en Client Components
 */
export function useSupabase() {
  return getBrowserClient()
}
