-- [AUTO] Variante esquema arena_panel (proyecto PabloRecursos)
-- Generado desde supabase/migrations. NO editar a mano.
CREATE SCHEMA IF NOT EXISTS arena_panel;
SET search_path TO arena_panel, public, extensions;

-- ============================================
-- Arena13 Panel - Newsletter
-- Migración: 012
-- ============================================
-- Campañas de newsletter. Los destinatarios se
-- obtienen de la tabla clientes (campo email).

-- ============================================
-- 1. TABLA: newsletter_campanas
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_campanas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(200) NOT NULL,
  asunto VARCHAR(300) NOT NULL,
  contenido TEXT NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'borrano'
    CHECK (estado IN ('borrador','programada','enviada')),
  segmento VARCHAR(50) DEFAULT 'todos'
    CHECK (segmento IN ('todos','activos','personalizado')),
  destinatarios_ids UUID[] DEFAULT '{}',
  enviados_count INTEGER NOT NULL DEFAULT 0,
  fecha_programada TIMESTAMP WITH TIME ZONE,
  fecha_envio TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_campanas_estado ON newsletter_campanas(estado);

COMMENT ON TABLE newsletter_campanas IS 'Campañas de newsletter';

-- ============================================
-- 2. TRIGGER updated_at
-- ============================================
CREATE TRIGGER update_newsletter_campanas_updated_at
  BEFORE UPDATE ON newsletter_campanas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. RLS
-- ============================================
ALTER TABLE newsletter_campanas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins pueden gestionar newsletter"
  ON newsletter_campanas FOR ALL
  TO authenticated
  USING (arena_panel.is_admin())
  WITH CHECK (arena_panel.is_admin());


-- [AUTO] Grants para roles API
GRANT USAGE ON SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA arena_panel TO anon, authenticated, service_role;
