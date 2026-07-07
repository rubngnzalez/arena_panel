-- ============================================
-- Arena13 Panel - Portal del Cliente
-- ============================================

-- Vista simplificada para clientes (solo sus datos)
CREATE OR REPLACE VIEW vw_cliente_dashboard AS
SELECT
  c.id,
  c.nombre,
  c.empresa,
  c.email,
  c.telefono,
  -- Contar sus servicios activos
  (SELECT COUNT(*) FROM cliente_servicios cs WHERE cs.cliente_id = c.id AND cs.estado = 'activo') AS servicios_activos,
  -- Contar sus proyectos en curso
  (SELECT COUNT(*) FROM proyectos p WHERE p.cliente_id = c.id AND p.estado IN ('planeacion', 'en_progreso', 'revision')) AS proyectos_curso,
  -- Último proyecto
  (SELECT p.nombre FROM proyectos p WHERE p.cliente_id = c.id ORDER BY p.created_at DESC LIMIT 1) AS ultimo_proyecto
FROM clientes c;

-- Tabla de documentos compartidos con clientes
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE SET NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50), -- diseño, documento, imagen, video, otro
  archivo_url TEXT NOT NULL,
  archivo_tamano BIGINT,
  visible_cliente BOOLEAN DEFAULT true,
  fecha_subida TIMESTAMP DEFAULT NOW(),
  subido_por UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_documentos_cliente ON documentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_proyecto ON documentos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos(tipo);

-- Políticas RLS para documentos (clientes solo ven los suyos)
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes pueden ver sus documentos"
  ON documentos FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins pueden gestionar documentos"
  ON documentos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Comentario
COMMENT ON TABLE documentos IS 'Documentos compartidos con clientes (diseños, entregables, etc.)';
