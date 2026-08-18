export type Rol = "propietario" | "admin" | "editor" | "cliente"

export const RUTAS_CLIENTE = ["/asistentes", "/consumo", "/documentos", "/citas", "/mi-configuracion"]

interface QueryableSupabase {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{ data: { rol?: string } | null; error: any }>
      }
    }
  }
}

const ROLES_EQUIPO: Rol[] = ["propietario", "admin", "editor"]

export async function obtenerRol(
  supabase: QueryableSupabase,
  userId: string
): Promise<Rol> {
  try {
    const { data } = await supabase
      .from("perfiles_usuario")
      .select("rol")
      .eq("id", userId)
      .single()
    const rol = data?.rol as Rol | undefined
    if (rol && [...ROLES_EQUIPO, "cliente"].includes(rol)) return rol
    return "cliente"
  } catch {
    return "cliente"
  }
}

export function esEquipo(rol: Rol | null | undefined): boolean {
  return !!rol && ROLES_EQUIPO.includes(rol)
}

export function esRutaPermitidaCliente(pathname: string | null): boolean {
  if (!pathname) return false
  return RUTAS_CLIENTE.some((r) => pathname === r || pathname.startsWith(r + "/"))
}
