-- ============================================
-- Arena13 Panel - Ficha de cliente ampliada
-- Migración: 008
-- ============================================
-- Añade: logo, identidad visual, materiales descargables,
-- trabajos/costes, datos comerciales ampliados

-- ============================================
-- 1. AMPLIAR TABLA clientes
-- ============================================
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_captacion DATE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS sector VARCHAR(100);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS web VARCHAR(255);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(10);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Identidad visual / marca
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS color_primario VARCHAR(7);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS color_secundario VARCHAR(7);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS color_acento VARCHAR(7);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fuente_principal VARCHAR(100);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fuente_secundaria VARCHAR(100);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS descripcion_marca TEXT;

-- Redes sociales
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS facebook VARCHAR(255);

-- ============================================
-- 2. TABLA: cliente_documentos (materiales descargables)
-- ============================================
CREATE TABLE IF NOT EXISTS cliente_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL DEFAULT 'otro'
    CHECK (tipo IN ('logo','manual_marca','fuentes','colores','paleta','presentacion','contrato','factura','otro')),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  nombre_archivo VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type VARCHAR(100),
  tamano_bytes BIGINT,
  es_publico BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cliente_documentos_cliente ON cliente_documentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_documentos_tipo ON cliente_documentos(tipo);

COMMENT ON TABLE cliente_documentos IS 'Materiales y documentos del cliente (logos, manuales, fuentes, etc.)';

-- ============================================
-- 3. TABLA: trabajos (registro de trabajos y costes)
-- ============================================
CREATE TABLE IF NOT EXISTS trabajos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_servicio VARCHAR(40) NOT NULL DEFAULT 'otro'
    CHECK (tipo_servicio IN (
      'imagen_marca','web','redes_sociales','sem','seo','diseno_grafico',
      'contenido','fotografia','video','consultoria','automatizacion','ia','otro'
    )),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  coste DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (coste >= 0),
  estado VARCHAR(20) NOT NULL DEFAULT 'presupuestado'
    CHECK (estado IN ('presupuestado','aprobado','en_proceso','completado','facturado','cancelado')),
  fecha_factura DATE,
  num_factura VARCHAR(50),
  notas TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trabajos_cliente ON trabajos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_trabajos_fecha ON trabajos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_trabajos_estado ON trabajos(estado);
CREATE INDEX IF NOT EXISTS idx_trabajos_tipo ON trabajos(tipo_servicio);

COMMENT ON TABLE trabajos IS 'Registro de trabajos realizados y presupuestados con costes';

-- ============================================
-- 4. TRIGGERS updated_at
-- ============================================
CREATE TRIGGER update_cliente_documentos_updated_at
  BEFORE UPDATE ON cliente_documentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trabajos_updated_at
  BEFORE UPDATE ON trabajos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. STORAGE BUCKET para documentos
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('cliente-docs', 'cliente-docs', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. RLS para cliente_documentos
-- ============================================
ALTER TABLE cliente_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins pueden gestionar documentos"
  ON cliente_documentos FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Clientes pueden ver documentos públicos de su ficha
-- (cuando el portal del cliente esté activo)
CREATE POLICY "Clientes pueden ver documentos públicos propios"
  ON cliente_documentos FOR SELECT
  TO authenticated
  USING (
    es_publico = true
    AND EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = cliente_documentos.cliente_id
      AND clientes.email = (auth.jwt() ->> 'email')
    )
  );

-- ============================================
-- 7. RLS para trabajos
-- ============================================
ALTER TABLE trabajos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins pueden gestionar trabajos"
  ON trabajos FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 8. POLÍTICAS DE STORAGE
-- ============================================
-- Admin puede subir/modificar/eliminar archivos
CREATE POLICY "Admin upload cliente-docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'cliente-docs'
    AND public.is_admin()
  );

CREATE POLICY "Admin update cliente-docs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'cliente-docs'
    AND public.is_admin()
  );

CREATE POLICY "Admin delete cliente-docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'cliente-docs'
    AND public.is_admin()
  );

-- Lectura pública (bucket es público)
CREATE POLICY "Public read cliente-docs"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'cliente-docs');

-- ============================================
-- 9. DATOS INICIALES: copiar fecha_alta a fecha_captacion
-- ============================================
UPDATE clientes
SET fecha_captacion = DATE(fecha_alta)
WHERE fecha_captacion IS NULL;
