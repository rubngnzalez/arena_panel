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
  email?: string
  telefono?: string
  empresa?: string
  estado: 'activo' | 'inactivo' | 'potencial'
  fecha_alta: string
  notas?: string
  created_at: string
  updated_at: string
  servicios?: ClienteServicio[]
  proyectos?: Proyecto[]
  // Campos ampliados
  logo_url?: string
  fecha_captacion?: string
  sector?: string
  web?: string
  direccion?: string
  ciudad?: string
  codigo_postal?: string
  descripcion?: string
  // Identidad visual
  color_primario?: string
  color_secundario?: string
  color_acento?: string
  fuente_principal?: string
  fuente_secundaria?: string
  descripcion_marca?: string
  // Redes sociales
  instagram?: string
  linkedin?: string
  facebook?: string
  // Plan financiero (retainer + overage)
  plan_nombre?: string
  precio_base_mensual?: number
  limite_minutos_incluidos?: number
  limite_mensajes_whatsapp_incluidos?: number
  precio_minuto_extra?: number
  precio_mensaje_extra?: number
  minutos_consumidos_mes?: number
  mensajes_whatsapp_consumidos_mes?: number
  saldo_pendiente_pago?: number
  estado_pago?: EstadoPago
  // Acceso y portal
  usuario_auth_id?: string
  permisos_portal?: PermisoPortal
  // Integraciones IA
  retell_agent_id?: string
  google_calendar_id?: string
  webhook_make_url?: string
  telefono_asignado?: string
}

export type EstadoPago = 'al_dia' | 'pendiente_facturacion' | 'deuda_vencida'

export interface PermisoPortal {
  ver_audios?: boolean
  ver_transcripciones?: boolean
  descargar_pdf?: boolean
  ver_precios?: boolean
}

// Liquidación devuelta por la RPC calcular_liquidacion_cliente
export interface LiquidacionCliente {
  ok: boolean
  error?: string
  plan_nombre?: string
  precio_base_mensual?: number
  limite_minutos_incluidos?: number
  limite_mensajes_whatsapp_incluidos?: number
  precio_minuto_extra?: number
  precio_mensaje_extra?: number
  minutos_consumidos_mes?: number
  mensajes_whatsapp_consumidos_mes?: number
  minutos_extra?: number
  mensajes_extra?: number
  coste_minutos_extra?: number
  coste_mensajes_extra?: number
  total_overage?: number
  total_final?: number
  saldo_pendiente_pago?: number
  estado_pago?: EstadoPago
}

// Historial de cierre mensual
export interface ConsumoMensual {
  id: string
  cliente_id: string
  periodo_mes: string
  minutos_consumidos: number
  mensajes_consumidos: number
  total_base: number
  total_overage: number
  total_facturado: number
  created_at: string
}

// Documento/material del cliente (descargable)
export type TipoDocumento =
  | 'logo'
  | 'manual_marca'
  | 'fuentes'
  | 'colores'
  | 'paleta'
  | 'presentacion'
  | 'contrato'
  | 'factura'
  | 'otro'

export interface ClienteDocumento {
  id: string
  cliente_id: string
  tipo: TipoDocumento
  titulo: string
  descripcion?: string
  nombre_archivo: string
  storage_path: string
  mime_type?: string
  tamano_bytes?: number
  es_publico: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

// Trabajo realizado o presupuestado
export type TipoServicioTrabajo =
  | 'imagen_marca'
  | 'web'
  | 'redes_sociales'
  | 'sem'
  | 'seo'
  | 'diseno_grafico'
  | 'contenido'
  | 'fotografia'
  | 'video'
  | 'consultoria'
  | 'automatizacion'
  | 'ia'
  | 'otro'

export type EstadoTrabajo =
  | 'presupuestado'
  | 'aprobado'
  | 'en_proceso'
  | 'completado'
  | 'facturado'
  | 'cancelado'

export interface Trabajo {
  id: string
  cliente_id: string
  fecha: string
  tipo_servicio: TipoServicioTrabajo
  titulo: string
  descripcion?: string
  coste: number
  estado: EstadoTrabajo
  fecha_factura?: string
  num_factura?: string
  notas?: string
  created_by?: string
  created_at: string
  updated_at: string
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
  // Campos pipeline
  linea_negocio?: 'ia' | 'diseno' | 'mixto'
  checklist?: ChecklistItem[]
  figma_url?: string
  github_url?: string
  webflow_url?: string
  drive_url?: string
  notas_internas?: string
}

export type ProyectoEstado =
  | 'planeacion'
  | 'en_progreso'
  | 'bloqueado'
  | 'revision'
  | 'completado'

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

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

// ============================================
// Presupuestos
// ============================================
export type PresupuestoEstado = 'borrador' | 'enviado' | 'aceptado' | 'rechazado' | 'expirado'

export interface PresupuestoLinea {
  id: string
  presupuesto_id: string
  orden: number
  descripcion: string
  cantidad: number
  precio_unitario: number
  created_at: string
}

export interface Presupuesto {
  id: string
  cliente_id: string
  cliente?: Pick<Cliente, 'id' | 'nombre' | 'empresa' | 'email'>
  numero: string
  titulo: string
  estado: PresupuestoEstado
  fecha_emision: string
  fecha_validez?: string
  descuento_porcentaje: number
  iva_porcentaje: number
  notas?: string
  notas_internas?: string
  token_publico?: string
  respondido_at?: string
  proyecto_generado_id?: string
  created_by?: string
  created_at: string
  updated_at: string
  lineas?: PresupuestoLinea[]
}

// ============================================
// Imputaciones de horas (time tracking)
// ============================================
export interface ImputacionHoras {
  id: string
  proyecto_id: string
  usuario_id?: string
  inicio: string
  fin?: string
  duracion_minutos?: number
  descripcion?: string
  created_at: string
}

// ============================================
// Leads (inbox de triaje)
// ============================================
export type LeadOrigen = 'retell' | 'whatsapp' | 'formulario' | 'webhook' | 'manual'
export type LeadEstado = 'nuevo' | 'convertido' | 'archivado' | 'spam'
export type LeadNivelInteres = 'bajo' | 'medio' | 'alto'

export interface Lead {
  id: string
  origen: LeadOrigen
  nombre?: string
  email?: string
  telefono?: string
  empresa?: string
  mensaje?: string
  resumen_ia?: string
  nivel_interes: LeadNivelInteres
  estado: LeadEstado
  metadata?: Record<string, any>
  created_at: string
}

// ============================================
// Interacciones de asistentes IA
// ============================================
export interface TurnoTranscripcion {
  rol: 'asistente' | 'usuario'
  texto: string
  t?: number
}

export interface InteraccionIA {
  id: string
  cliente_id?: string
  cliente?: Pick<Cliente, 'id' | 'nombre' | 'empresa'> | null
  tipo: 'llamada' | 'chat'
  origen?: string
  audio_url?: string
  duracion_seg?: number
  transcripcion?: TurnoTranscripcion[]
  resumen?: string
  resumen_ejecutivo?: string
  telefono_contacto?: string
  variables_extraidas?: {
    nombre?: string
    telefono?: string
    servicio?: string
    motivo?: string
    [k: string]: unknown
  }
  valoracion?: number
  valoracion_tags?: string[]
  metadata?: Record<string, any>
  created_at: string
}

// ============================================
// Citas (agendadas por asistentes IA o manual)
// ============================================
export type CitaEstado = 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_show'
export type CitaOrigen = 'ia' | 'manual' | 'webhook'

export interface Cita {
  id: string
  cliente_id?: string
  cliente?: Pick<Cliente, 'id' | 'nombre' | 'empresa'> | null
  contacto_nombre?: string
  contacto_email?: string
  contacto_telefono?: string
  titulo: string
  fecha_hora: string
  duracion_min?: number
  estado: CitaEstado
  origen: CitaOrigen
  notas?: string
  metadata?: Record<string, any>
  created_at: string
}

// ============================================
// Plantillas de presupuesto
// ============================================
export interface PlantillaPresupuesto {
  id: string
  nombre: string
  descripcion?: string
  plantilla: {
    titulo?: string
    descuento_porcentaje?: number
    iva_porcentaje?: number
    lineas: { descripcion: string; cantidad: number; precio_unitario: number }[]
  }
  created_at: string
}

// ============================================
// Facturación
// ============================================
export type FacturaEstado = 'borrador' | 'emitida' | 'pagada' | 'vencida' | 'anulada'
export type MetodoPago = 'transferencia' | 'tarjeta' | 'efectivo' | 'bizum' | 'paypal' | 'otro'

export interface FacturaLinea {
  id: string
  factura_id: string
  orden: number
  descripcion: string
  cantidad: number
  precio_unitario: number
  created_at: string
}

export interface Factura {
  id: string
  cliente_id: string
  cliente?: Pick<Cliente, 'id' | 'nombre' | 'empresa' | 'email'>
  presupuesto_id?: string
  numero: string
  estado: FacturaEstado
  fecha_emision: string
  fecha_vencimiento?: string
  fecha_pago?: string
  descuento_porcentaje: number
  iva_porcentaje: number
  metodo_pago?: MetodoPago
  link_pago?: string
  notas?: string
  created_by?: string
  created_at: string
  updated_at: string
  lineas?: FacturaLinea[]
}

// ============================================
// Newsletter
// ============================================
export type NewsletterEstado = 'borrador' | 'programada' | 'enviada'

export interface NewsletterCampana {
  id: string
  titulo: string
  asunto: string
  contenido: string
  estado: NewsletterEstado
  segmento: 'todos' | 'activos' | 'personalizado'
  destinatarios_ids: string[]
  enviados_count: number
  fecha_programada?: string
  fecha_envio?: string
  created_at: string
  updated_at: string
}

// ============================================
// Tickets de soporte (extendido)
// ============================================
export type TicketEstado = 'abierto' | 'en_proceso' | 'esperando_respuesta' | 'resuelto' | 'cerrado'
export type TicketPrioridad = 'baja' | 'normal' | 'alta' | 'urgente'
export type TicketCategoria = 'tecnico' | 'facturacion' | 'consulta' | 'otro'

export interface TicketMensaje {
  id: string
  ticket_id: string
  remitente_id?: string
  mensaje: string
  adjuntos?: Record<string, any>
  es_interno: boolean
  created_at: string
}

export interface Ticket {
  id: string
  cliente_id?: string
  cliente?: Pick<Cliente, 'id' | 'nombre' | 'empresa'>
  titulo: string
  descripcion: string
  estado: TicketEstado
  prioridad: TicketPrioridad
  categoria?: TicketCategoria
  creado_por?: string
  asignado_a?: string
  created_at: string
  updated_at: string
  mensajes?: TicketMensaje[]
}

// ============================================
// Auditoria: logueos y descargas
// ============================================
export interface LoginHistory {
  id: string
  user_id?: string
  email?: string
  ip_address?: string
  user_agent?: string
  dispositivo?: string
  exito: boolean
  created_at: string
}

export interface VaultDescarga {
  id: string
  cliente_id: string
  cliente?: Pick<Cliente, 'id' | 'nombre' | 'empresa'>
  documento_id?: string
  documento_titulo?: string
  user_id?: string
  ip_address?: string
  created_at: string
}

// ============================================
// Banners promocionales / notificaciones
// ============================================
export type BannerTipo = 'info' | 'promocion' | 'aviso' | 'urgente'
export type BannerPosicion = 'top' | 'dashboard'

export interface Banner {
  id: string
  titulo: string
  mensaje: string
  tipo: BannerTipo
  color: string
  icono: string
  activo: boolean
  fecha_inicio: string
  fecha_fin?: string
  dias_caducidad?: number
  mostrar_boton: boolean
  boton_texto?: string
  boton_url?: string
  posicion: BannerPosicion
  orden: number
  descartable: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

// ============================================
// Metodos de contacto del admin
// ============================================
export type TipoContacto = 'whatsapp' | 'telefono' | 'email' | 'telegram' | 'instagram' | 'linkedin' | 'web' | 'otro'

export interface MetodoContacto {
  id: string
  tipo: TipoContacto
  etiqueta: string
  valor: string
  icono: string
  orden: number
  activo: boolean
  created_at: string
  updated_at: string
}
