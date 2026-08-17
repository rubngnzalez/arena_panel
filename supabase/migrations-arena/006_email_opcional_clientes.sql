-- [AUTO] Variante esquema arena_panel (proyecto PabloRecursos)
-- Generado desde supabase/migrations. NO editar a mano.
CREATE SCHEMA IF NOT EXISTS arena_panel;
SET search_path TO arena_panel, public, extensions;

-- ============================================
-- Arena13 Panel - Email opcional en clientes
-- Migración: 006
-- ============================================

-- Hacer email opcional (nullable)
ALTER TABLE clientes ALTER COLUMN email DROP NOT NULL;

-- Qitar el constraint UNIQUE existente
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_email_key;

-- Recrear UNIQUE solo para emails no nulos (permite multiples clientes sin email)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_email_unique
  ON clientes(email) WHERE email IS NOT NULL;


-- [AUTO] Grants para roles API
GRANT USAGE ON SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA arena_panel TO anon, authenticated, service_role;
