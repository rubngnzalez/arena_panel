-- [AUTO] Variante esquema arena_panel (proyecto PabloRecursos)
-- 017: Acceso unico con vistas por rol + ingesta IA + cobros.
--      - Tablas: leads (inbox de triaje) e interacciones_ia (llamadas/transcripciones)
--      - RLS: rol cliente solo SELECT sobre sus filas (vinculo por email)
--      - Columnas: clientes.minutos_contratados, facturas.link_pago
--      - Realtime publication para leads e interacciones_ia
CREATE SCHEMA IF NOT EXISTS arena_panel;
SET search_path TO arena_panel, public, extensions;

-- ============================================
-- 1. TABLA: leads (inbox de triaje)
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origen VARCHAR(20) NOT NULL DEFAULT 'formulario'
    CHECK (origen IN ('retell', 'whatsapp', 'formulario', 'webhook', 'manual')),
  nombre VARCHAR(200),
  email VARCHAR(255),
  telefono VARCHAR(50),
  empresa VARCHAR(200),
  mensaje TEXT,
  resumen_ia TEXT,
  nivel_interes VARCHAR(10) NOT NULL DEFAULT 'medio'
    CHECK (nivel_interes IN ('bajo', 'medio', 'alto')),
  estado VARCHAR(15) NOT NULL DEFAULT 'nuevo'
    CHECK (estado IN ('nuevo', 'convertido', 'archivado', 'spam')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_estado ON leads(estado);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

COMMENT ON TABLE leads IS 'Leads capturados por webhooks externos (Retell/WhatsApp/formularios) en triaje';

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Equipo gestiona leads" ON leads;
CREATE POLICY "Equipo gestiona leads"
  ON leads FOR ALL
  TO authenticated
  USING (arena_panel.is_editor())
  WITH CHECK (arena_panel.is_editor());

-- ============================================
-- 2. TABLA: interacciones_ia (llamadas / chats de asistentes)
-- ============================================
CREATE TABLE IF NOT EXISTS interacciones_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL DEFAULT 'llamada' CHECK (tipo IN ('llamada', 'chat')),
  origen VARCHAR(20) DEFAULT 'retell',
  audio_url TEXT,
  duracion_seg INTEGER CHECK (duracion_seg IS NULL OR duracion_seg >= 0),
  transcripcion JSONB DEFAULT '[]'::jsonb,
  resumen TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interacciones_cliente ON interacciones_ia(cliente_id);
CREATE INDEX IF NOT EXISTS idx_interacciones_created ON interacciones_ia(created_at DESC);

COMMENT ON TABLE interacciones_ia IS 'Interacciones de asistentes IA por cliente (llamadas con audio/transcripcion)';
COMMENT ON COLUMN interacciones_ia.transcripcion IS 'Turnos [{rol: asistente|usuario, texto, t?}]';

ALTER TABLE interacciones_ia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Equipo gestiona interacciones IA" ON interacciones_ia;
CREATE POLICY "Equipo gestiona interacciones IA"
  ON interacciones_ia FOR ALL
  TO authenticated
  USING (arena_panel.is_editor())
  WITH CHECK (arena_panel.is_editor());

DROP POLICY IF EXISTS "Clientes ven sus interacciones IA" ON interacciones_ia;
CREATE POLICY "Clientes ven sus interacciones IA"
  ON interacciones_ia FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE email = arena_panel.user_email()
    )
  );

-- ============================================
-- 3. RLS cliente (solo SELECT sobre lo suyo)
-- ============================================
DROP POLICY IF EXISTS "Clientes pueden ver sus proyectos" ON proyectos;
CREATE POLICY "Clientes pueden ver sus proyectos"
  ON proyectos FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE email = arena_panel.user_email()
    )
  );

DROP POLICY IF EXISTS "Clientes pueden ver sus presupuestos" ON presupuestos;
CREATE POLICY "Clientes pueden ver sus presupuestos"
  ON presupuestos FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE email = arena_panel.user_email()
    )
  );

DROP POLICY IF EXISTS "Clientes pueden ver lineas de sus presupuestos" ON presupuesto_lineas;
CREATE POLICY "Clientes pueden ver lineas de sus presupuestos"
  ON presupuesto_lineas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM presupuestos p
      JOIN clientes c ON c.id = p.cliente_id
      WHERE p.id = presupuesto_lineas.presupuesto_id
        AND c.email = arena_panel.user_email()
    )
  );

DROP POLICY IF EXISTS "Clientes pueden ver sus facturas" ON facturas;
CREATE POLICY "Clientes pueden ver sus facturas"
  ON facturas FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE email = arena_panel.user_email()
    )
  );

DROP POLICY IF EXISTS "Clientes pueden ver lineas de sus facturas" ON factura_lineas;
CREATE POLICY "Clientes pueden ver lineas de sus facturas"
  ON factura_lineas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facturas f
      JOIN clientes c ON c.id = f.cliente_id
      WHERE f.id = factura_lineas.factura_id
        AND c.email = arena_panel.user_email()
    )
  );

-- ============================================
-- 4. COLUMNAS: consumo y cobro
-- ============================================
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS minutos_contratados INTEGER NOT NULL DEFAULT 0;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS link_pago TEXT;

COMMENT ON COLUMN clientes.minutos_contratados IS 'Minutos de asistente IA contratados al mes';
COMMENT ON COLUMN facturas.link_pago IS 'Enlace de pago (Stripe Checkout Link / Payment Link)';

-- ============================================
-- 5. REALTIME (inbox en vivo)
-- ============================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE arena_panel.leads;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE arena_panel.interacciones_ia;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- [AUTO] Grants para roles API
GRANT USAGE ON SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA arena_panel TO anon, authenticated, service_role;
