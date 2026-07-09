-- ============================================
-- Arena13 Panel - Fix recursión infinita en RLS
-- Migración: 007
-- ============================================
-- Problema: las políticas usan EXISTS(SELECT ... FROM perfiles_usuario)
-- pero perfiles_usuario tiene RLS que vuelve a hacer ese mismo SELECT → bucle infinito
-- Solución: función is_admin() con SECURITY DEFINER (ejecuta sin RLS)

-- ============================================
-- FUNCIÓN: is_admin (SECURITY DEFINER = salta RLS)
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles_usuario
    WHERE id = auth.uid() AND rol = 'admin' AND activo = true
  )
$$;

-- ============================================
-- FIX perfiles_usuario (causa raíz de la recursión)
-- ============================================
DROP POLICY IF EXISTS "Admins pueden ver todos los perfiles" ON perfiles_usuario;
CREATE POLICY "Admins pueden ver todos los perfiles"
  ON perfiles_usuario FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- CLIENTES: políticas completas con is_admin()
-- ============================================
DROP POLICY IF EXISTS "Admins pueden ver todos los clientes" ON clientes;
CREATE POLICY "Admins pueden ver todos los clientes"
  ON clientes FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Clientes pueden ver su propio perfil" ON clientes;
CREATE POLICY "Clientes pueden ver su propio perfil"
  ON clientes FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR email = (auth.jwt() ->> 'email')
  );

DROP POLICY IF EXISTS "Admins pueden insertar clientes" ON clientes;
CREATE POLICY "Admins pueden insertar clientes"
  ON clientes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins pueden actualizar clientes" ON clientes;
CREATE POLICY "Admins pueden actualizar clientes"
  ON clientes FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins pueden eliminar clientes"
  ON clientes FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- PROYECTOS: políticas con is_admin()
-- ============================================
DROP POLICY IF EXISTS "Admins pueden ver todos los proyectos" ON proyectos;
CREATE POLICY "Admins pueden ver todos los proyectos"
  ON proyectos FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Colaboradores pueden ver proyectos asignados" ON proyectos;
CREATE POLICY "Admins y colaboradores pueden ver proyectos"
  ON proyectos FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.perfiles_usuario p
      WHERE p.id = auth.uid() AND p.rol = 'colaborador'
    )
  );

CREATE POLICY "Admins pueden gestionar proyectos"
  ON proyectos FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins pueden actualizar proyectos"
  ON proyectos FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins pueden eliminar proyectos"
  ON proyectos FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- CLIENTE_SERVICIOS: permitir gestión admin
-- ============================================
CREATE POLICY "Admins pueden ver cliente_servicios"
  ON cliente_servicios FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins pueden insertar cliente_servicios"
  ON cliente_servicios FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins pueden actualizar cliente_servicios"
  ON cliente_servicios FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins pueden eliminar cliente_servicios"
  ON cliente_servicios FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- TAREAS: permitir gestión admin
-- ============================================
CREATE POLICY "Admins pueden ver tareas"
  ON tareas FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins pueden gestionar tareas"
  ON tareas FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- ACTIVIDAD: admin puede ver todo, cualquiera autenticado puede insertar
-- ============================================
CREATE POLICY "Admins pueden ver actividad"
  ON actividad FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Usuarios autenticados pueden insertar actividad"
  ON actividad FOR INSERT
  TO authenticated
  WITH CHECK (true);
