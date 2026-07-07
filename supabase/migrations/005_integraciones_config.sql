-- ============================================
-- MIGRACIÓN 005: CONFIGURACIÓN DE INTEGRACIONES
-- ============================================

-- Tabla para guardar configuraciones de integraciones
CREATE TABLE IF NOT EXISTS integraciones_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio VARCHAR(50) NOT NULL UNIQUE, -- 'kilocode', 'opendesign', etc.
  api_key TEXT,
  project_id TEXT, -- Para KiloCode
  team_id TEXT, -- Para OpenDesign
  webhook_url TEXT,
  activo BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_integraciones_config_updated_at
  BEFORE UPDATE ON integraciones_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Permisos RLS
ALTER TABLE integraciones_config ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden gestionar configuraciones
CREATE POLICY "Solo admins pueden ver configuraciones"
  ON integraciones_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Solo admins pueden insertar configuraciones"
  ON integraciones_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Solo admins pueden actualizar configuraciones"
  ON integraciones_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Tabla para guardar proyectos generados por KiloCode
CREATE TABLE IF NOT EXISTS kilocode_proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  proyecto_id VARCHAR(100),
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50), -- 'landing', 'portfolio', 'ecommerce', 'blog', etc.
  template VARCHAR(100),
  estado VARCHAR(20) DEFAULT 'borrador', -- 'borrador', 'generando', 'completado', 'error'
  codigo_generado TEXT,
  preview_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_kilocode_proyectos_updated_at
  BEFORE UPDATE ON kilocode_proyectos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE kilocode_proyectos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver proyectos propios"
  ON kilocode_proyectos FOR SELECT
  USING (true);

CREATE POLICY "Admins gestionan proyectos"
  ON kilocode_proyectos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Tabla para sincronizar diseños con OpenDesign
CREATE TABLE IF NOT EXISTS opendesign_proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  team_id VARCHAR(100),
  proyecto_id VARCHAR(100),
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(20) DEFAULT 'sincronizando', -- 'sincronizando', 'activo', 'pausado'
  ultimo_sync TIMESTAMP,
  colaboradores TEXT[],
  archivos_count INTEGER DEFAULT 0,
  preview_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_opendesign_proyectos_updated_at
  BEFORE UPDATE ON opendesign_proyectos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE opendesign_proyectos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver diseños propios"
  ON opendesign_proyectos FOR SELECT
  USING (true);

CREATE POLICY "Admins gestionan diseños"
  ON opendesign_proyectos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Insertar configuraciones placeholder
INSERT INTO integraciones_config (servicio, activo, metadata)
VALUES
  ('kilocode', true, '{"label": "KiloCode", "description": "Generación de código con IA"}'),
  ('opendesign', true, '{"label": "OpenDesign", "description": "Colaboración en diseños"}')
ON CONFLICT (servicio) DO NOTHING;

-- Vista para estado de integraciones
CREATE OR REPLACE VIEW vw_integraciones_status AS
SELECT
  ic.servicio,
  ic.activo,
  ic.api_key IS NOT NULL AND ic.api_key != '' AS configurado,
  ic.metadata->>'label' as label,
  ic.metadata->>'description' as description,
  ic.updated_at as ultima_actualizacion,
  COUNT(DISTINCT kcp.id) FILTER (WHERE ic.servicio = 'kilocode') AS proyectos_kilocode,
  COUNT(DISTINCT odp.id) FILTER (WHERE ic.servicio = 'opendesign') AS proyectos_opendesign
FROM integraciones_config ic
LEFT JOIN kilocode_proyectos kcp ON true
LEFT JOIN opendesign_proyectos odp ON true
GROUP BY ic.servicio, ic.activo, ic.api_key, ic.metadata, ic.updated_at;

-- Índices
CREATE INDEX IF NOT EXISTS idx_kilocode_proyectos_cliente ON kilocode_proyectos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_kilocode_proyectos_estado ON kilocode_proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_opendesign_proyectos_cliente ON opendesign_proyectos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_opendesign_proyectos_estado ON opendesign_proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_integraciones_config_servicio ON integraciones_config(servicio);
