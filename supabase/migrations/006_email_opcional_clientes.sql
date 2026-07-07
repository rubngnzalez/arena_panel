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
