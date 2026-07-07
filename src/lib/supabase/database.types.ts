/**
 * Tipos auto-generados de Supabase
 * Generado con: npx supabase gen types typescript --local
 *
 * Este es un placeholder. Ejecuta el comando para generar los tipos reales:
 * npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string
          nombre: string
          email: string
          telefono: string | null
          empresa: string | null
          estado: 'activo' | 'inactivo' | 'potencial'
          fecha_alta: string
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          email: string
          telefono?: string | null
          empresa?: string | null
          estado?: 'activo' | 'inactivo' | 'potencial'
          fecha_alta?: string
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          email?: string
          telefono?: string | null
          empresa?: string | null
          estado?: 'activo' | 'inactivo' | 'potencial'
          fecha_alta?: string
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      servicios: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          precio_base: number | null
          activo: boolean
          categoria: string
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          precio_base?: number | null
          activo?: boolean
          categoria: string
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          precio_base?: number | null
          activo?: boolean
          categoria?: string
          created_at?: string
        }
      }
      cliente_servicios: {
        Row: {
          id: string
          cliente_id: string
          servicio_id: string
          estado: 'activo' | 'completado' | 'pausado' | 'cancelado'
          fecha_inicio: string
          fecha_fin: string | null
          precio_acordado: number | null
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          servicio_id: string
          estado?: 'activo' | 'completado' | 'pausado' | 'cancelado'
          fecha_inicio?: string
          fecha_fin?: string | null
          precio_acordado?: number | null
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          servicio_id?: string
          estado?: 'activo' | 'completado' | 'pausado' | 'cancelado'
          fecha_inicio?: string
          fecha_fin?: string | null
          precio_acordado?: number | null
          notas?: string | null
          created_at?: string
        }
      }
      proyectos: {
        Row: {
          id: string
          cliente_id: string
          servicio_id: string
          nombre: string
          descripcion: string | null
          estado: 'planeacion' | 'en_progreso' | 'revision' | 'completado'
          prioridad: 'baja' | 'media' | 'alta' | 'urgente'
          fecha_entrega_estimada: string | null
          progreso: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          servicio_id: string
          nombre: string
          descripcion?: string | null
          estado?: 'planeacion' | 'en_progreso' | 'revision' | 'completado'
          prioridad?: 'baja' | 'media' | 'alta' | 'urgente'
          fecha_entrega_estimada?: string | null
          progreso?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          servicio_id?: string
          nombre?: string
          descripcion?: string | null
          estado?: 'planeacion' | 'en_progreso' | 'revision' | 'completado'
          prioridad?: 'baja' | 'media' | 'alta' | 'urgente'
          fecha_entrega_estimada?: string | null
          progreso?: number
          created_at?: string
          updated_at?: string
        }
      }
      tareas: {
        Row: {
          id: string
          proyecto_id: string
          titulo: string
          descripcion: string | null
          estado: 'pendiente' | 'en_progreso' | 'completada'
          prioridad: 'baja' | 'media' | 'alta'
          fecha_limite: string | null
          orden: number
          created_at: string
        }
        Insert: {
          id?: string
          proyecto_id: string
          titulo: string
          descripcion?: string | null
          estado?: 'pendiente' | 'en_progreso' | 'completada'
          prioridad?: 'baja' | 'media' | 'alta'
          fecha_limite?: string | null
          orden?: number
          created_at?: string
        }
        Update: {
          id?: string
          proyecto_id?: string
          titulo?: string
          descripcion?: string | null
          estado?: 'pendiente' | 'en_progreso' | 'completada'
          prioridad?: 'baja' | 'media' | 'alta'
          fecha_limite?: string | null
          orden?: number
          created_at?: string
        }
      }
      actividad: {
        Row: {
          id: string
          usuario_id: string | null
          cliente_id: string | null
          tipo: string
          descripcion: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id?: string | null
          cliente_id?: string | null
          tipo: string
          descripcion: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string | null
          cliente_id?: string | null
          tipo?: string
          descripcion?: string
          metadata?: Json | null
          created_at?: string
        }
      }
    }
  }
}
