-- [AUTO] Variante esquema arena_panel (proyecto PabloRecursos)
-- 015: Eliminar integraciones KiloCode/OpenDesign y corregir politicas
--      que consultaban auth.users directamente (error 403 en PabloRecursos:
--      el rol authenticated no tiene SELECT sobre auth.users).
CREATE SCHEMA IF NOT EXISTS arena_panel;
SET search_path TO arena_panel, public, extensions;

-- ============================================
-- 1. ELIMINAR INTEGRACIONES (paginas y codigo ya retirados del panel)
-- ============================================
DROP VIEW IF EXISTS vw_integraciones_status;
DROP TABLE IF EXISTS kilocode_proyectos CASCADE;
DROP TABLE IF EXISTS opendesign_proyectos CASCADE;
DROP TABLE IF EXISTS integraciones_config CASCADE;

-- ============================================
-- 2. FUNCION SEGURA para el email del usuario autenticado
--    (SECURITY DEFINER: evita conceder permisos directos sobre auth.users)
-- ============================================
CREATE OR REPLACE FUNCTION arena_panel.user_email()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- ============================================
-- 3. RECREAR POLITICAS que usaban subconsulta directa sobre auth.users
-- ============================================
DROP POLICY IF EXISTS "Clientes pueden ver sus documentos" ON documentos;
CREATE POLICY "Clientes pueden ver sus documentos"
  ON documentos FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE email = arena_panel.user_email()
    )
  );

DROP POLICY IF EXISTS "Clientes pueden ver sus tickets" ON tickets;
CREATE POLICY "Clientes pueden ver sus tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE email = arena_panel.user_email()
    )
  );


-- [AUTO] Grants para roles API
GRANT USAGE ON SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA arena_panel TO anon, authenticated, service_role;
