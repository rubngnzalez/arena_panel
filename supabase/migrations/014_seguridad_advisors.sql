-- ============================================
-- Arena13 Panel - Correcciones de Seguridad (Supabase Advisors)
-- Migración: 014_seguridad_advisors
-- ============================================
-- Resuelve los avisos CRÍTICOS del Security Advisor de Supabase:
--   1. rls_disabled_in_public       -> tabla `servicios` sin RLS habilitado
--   2. usuarios_autenticados_expuestos -> vista `vw_usuarios` expone auth.users
-- ============================================


-- ============================================
-- 1) TABLA `servicios`: activar RLS + políticas
--    - Lectura pública (anon + authenticated): el catálogo es visible
--    - Inserción / modificación / borrado: SOLO administradores
--      (reutiliza la función public.is_admin() creada en la migración 007)
-- ============================================
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;

-- Limpieza defensiva de políticas previas
DROP POLICY IF EXISTS "Cualquiera puede ver servicios" ON servicios;
DROP POLICY IF EXISTS "Admins pueden insertar servicios" ON servicios;
DROP POLICY IF EXISTS "Admins pueden actualizar servicios" ON servicios;
DROP POLICY IF EXISTS "Admins pueden eliminar servicios" ON servicios;

-- Lectura: catálogo accesible para todos (incluso sin sesión)
CREATE POLICY "Cualquiera puede ver servicios"
  ON servicios FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escritura / borrado: únicamente administradores
CREATE POLICY "Admins pueden insertar servicios"
  ON servicios FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins pueden actualizar servicios"
  ON servicios FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins pueden eliminar servicios"
  ON servicios FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ============================================
-- 2) VISTA `vw_usuarios`: dejar de exponer auth.users a cualquiera
--    - security_invoker = true (Postgres 15): la vista ejecuta con los
--      privilegios del usuario que la consulta, respetando el RLS de
--      `perfiles_usuario` (un admin ve todos; un usuario solo la suya).
--    - Se revoca el acceso al rol `anon` para que no sea consultable
--      desde la API REST sin sesión.
-- ============================================
ALTER VIEW vw_usuarios SET (security_invoker = true);

REVOKE ALL ON vw_usuarios FROM anon;
GRANT SELECT ON vw_usuarios TO authenticated;
