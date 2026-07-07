import { z } from 'zod'

/**
 * Esquemas de validación Zod para el panel Arena13
 */

// Validación de email
export const emailSchema = z.string().email('Email inválido')

// Validación de cliente
export const clienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  empresa: z.string().optional(),
  estado: z.enum(['activo', 'inactivo', 'potencial']),
  notas: z.string().optional(),
})

export type ClienteInput = z.infer<typeof clienteSchema>

// Validación de servicio
export const servicioSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
  precio_base: z.number().min(0, 'El precio no puede ser negativo'),
  activo: z.boolean().default(true),
  categoria: z.enum(['web', 'branding', 'ia', 'marketing', 'consultoria', 'otro']),
})

export type ServicioInput = z.infer<typeof servicioSchema>

// Validación de proyecto
export const proyectoSchema = z.object({
  cliente_id: z.string().uuid('ID de cliente inválido'),
  servicio_id: z.string().uuid('ID de servicio inválido'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
  estado: z.enum(['planeacion', 'en_progreso', 'revision', 'completado']),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']),
  fecha_entrega_estimada: z.string().optional(),
  progreso: z.number().min(0).max(100),
})

export type ProyectoInput = z.infer<typeof proyectoSchema>

// Validación de tarea
export const tareaSchema = z.object({
  proyecto_id: z.string().uuid('ID de proyecto inválido'),
  titulo: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
  estado: z.enum(['pendiente', 'en_progreso', 'completada']),
  prioridad: z.enum(['baja', 'media', 'alta']),
  fecha_limite: z.string().optional(),
  orden: z.number().default(0),
})

export type TareaInput = z.infer<typeof tareaSchema>

// Validación de login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type LoginInput = z.infer<typeof loginSchema>

// Validación de registro
export const registroSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export type RegistroInput = z.infer<typeof registroSchema>

// Validación de configuración Supabase
export const supabaseConfigSchema = z.object({
  url: z.string().url('URL de Supabase inválida'),
  anonKey: z.string().min(10, 'Clave anónima inválida'),
})

export type SupabaseConfigInput = z.infer<typeof supabaseConfigSchema>

// Validación de settings
export const settingsSchema = z.object({
  siteName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  siteDescription: z.string().optional(),
  emailContact: z.string().email('Email inválido').optional(),
  environment: z.enum(['local', 'produccion']),
  enableNotifications: z.boolean().default(false),
})

export type SettingsInput = z.infer<typeof settingsSchema>
