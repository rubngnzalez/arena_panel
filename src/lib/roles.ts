export type Rol = "admin" | "editor" | "cliente"

export const RUTAS_CLIENTE = ["/asistentes", "/consumo", "/documentos", "/citas"]

interface QueryableSupabase {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{ data: { rol?: string } | null; error: any }>
      }
    }
  }
}

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
    if (data?.rol === "admin" || data?.rol === "editor") return data.rol
    return "cliente"
  } catch {
    return "cliente"
  }
}

export function esRutaPermitidaCliente(pathname: string | null): boolean {
  if (!pathname) return false
  return RUTAS_CLIENTE.some((r) => pathname === r || pathname.startsWith(r + "/"))
}
