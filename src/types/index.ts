/**
 * Tipos principales del panel Arena13
 */

// Usuario autenticado
export interface User {
  id: string
  email: string
  nombre?: string
  rol: 'admin' | 'cliente' | 'colaborador'
  avatar_url?: string
  created_at: string
}

// Cliente
export interface Cliente {
  id: string
  nombre: string
  email: string
  telefono?: string
  empresa?: string
  estado: 'activo' | 'inactivo' | 'potencial'
  fecha_alta: string
  notas?: string
  created_at: string
  updated_at: string
  servicios?: ClienteServicio[]
  proyectos?: Proyecto[]
}

// Servicio (catálogo)
export interface Servicio {
  id: string
  nombre: string
  descripcion?: string
  precio_base?: number
  activo: boolean
  categoria: ServicioCategoria
  created_at: string
}

export type ServicioCategoria =
  | 'web'
  | 'branding'
  | 'ia'
  | 'marketing'
  | 'consultoria'
  | 'otro'

// Servicio contratado por cliente
export interface ClienteServicio {
  id: string
  cliente_id: string
  servicio_id: string
  servicio?: Servicio
  estado: 'activo' | 'completado' | 'pausado' | 'cancelado'
  fecha_inicio: string
  fecha_fin?: string
  precio_acordado?: number
  notas?: string
  created_at: string
}

// Proyecto
export interface Proyecto {
  id: string
  cliente_id: string
  cliente?: Cliente
  servicio_id: string
  servicio?: ClienteServicio
  nombre: string
  descripcion?: string
  estado: ProyectoEstado
  prioridad: 'baja' | 'media' | 'alta' | 'urgente'
  fecha_entrega_estimada?: string
  progreso: number
  created_at: string
  updated_at: string
  tareas?: Tarea[]
}

export type ProyectoEstado =
  | 'planeacion'
  | 'en_progreso'
  | 'revision'
  | 'completado'

// Tarea
export interface Tarea {
  id: string
  proyecto_id: string
  titulo: string
  descripcion?: string
  estado: 'pendiente' | 'en_progreso' | 'completada'
  prioridad: 'baja' | 'media' | 'alta'
  fecha_limite?: string
  orden: number
  created_at: string
}

// Actividad/Log
export interface Actividad {
  id: string
  usuario_id?: string
  usuario?: User
  cliente_id?: string
  cliente?: Cliente
  tipo: ActividadTipo
  descripcion: string
  metadata?: Record<string, any>
  created_at: string
}

export type ActividadTipo =
  | 'cliente_creado'
  | 'cliente_actualizado'
  | 'servicio_asignado'
  | 'proyecto_creado'
  | 'proyecto_actualizado'
  | 'proyecto_completado'
  | 'tarea_creada'
  | 'tarea_completada'
  | 'usuario_creado'
  | 'config_actualizada'

// Estadísticas del dashboard
export interface DashboardStats {
  clientes_activos: number
  proyectos_en_curso: number
  servicios_activos: number
  ingreso_mensual_estimado: number
  clientes_nuevos_mes: number
  proyectos_completados_mes: number
}

// Filtros de búsqueda
export interface FiltrosClientes {
  estado?: Cliente['estado'][]
  buscar?: string
  servicio?: string
  fecha_desde?: string
  fecha_hasta?: string
}

// Metadatos de paginación
export interface Paginacion {
  pagina: number
  por_pagina: number
  total: number
  total_paginas: number
}

// Respuesta de API con paginación
export interface PaginatedResponse<T> {
  data: T[]
  paginacion: Paginacion
}

// Configuración del sitio
export interface SiteConfig {
  siteName: string
  siteDescription: string
  emailContact: string
  environment: 'local' | 'produccion'
  enableNotifications: boolean
  supabaseUrl?: string
  supabaseAnonKey?: string
}

// Servicio con estadísticas
export interface ServicioConEstadisticas extends Servicio {
  clientes_activos: number
  proyectos_activos: number
  ingreso_total: number
}

// Cliente con métricas
export interface ClienteConMetricas extends Cliente {
  servicios_count: number
  proyectos_count: number
  proyectos_activos: number
  ultimo_proyecto?: Proyecto
}
