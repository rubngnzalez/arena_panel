-- ============================================
-- Arena13 Panel - Calculadora de Presupuestos
-- Migración: 010
-- ============================================
-- Presupuestos (cotizaciones) + líneas de detalle

-- ============================================
-- 1. TABLA: presupuestos
-- ============================================
CREATE TABLE IF NOT EXISTS presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  numero VARCHAR(50) UNIQUE NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'borrano'
    CHECK (estado IN ('borrador','enviado','aceptado','rechazado','expirado')),
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_validez DATE,
  descuento_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
  iva_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 21 CHECK (iva_porcentaje >= 0),
  notas TEXT,
  notas_internas TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presupuestos_cliente ON presupuestos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado ON presupuestos(estado);
CREATE INDEX IF NOT EXISTS idx_presupuestos_fecha ON presupuestos(fecha_emision DESC);

COMMENT ON TABLE presupuestos IS 'Presupuestos / cotizaciones para clientes';

-- ============================================
-- 2. TABLA: presupuesto_lineas
-- ============================================
CREATE TABLE IF NOT EXISTS presupuesto_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL DEFAULT 0,
  descripcion TEXT NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presupuesto_lineas_presupuesto ON presupuesto_lineas(presupuesto_id);

COMMENT ON TABLE presupuesto_lineas IS 'Líneas de detalle de un presupuesto';

-- ============================================
-- 3. TRIGGERS updated_at
-- ============================================
CREATE TRIGGER update_presupuestos_updated_at
  BEFORE UPDATE ON presupuestos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. RLS
-- ============================================
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuesto_lineas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins pueden gestionar presupuestos"
  ON presupuestos FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins pueden gestionar lineas de presupuesto"
  ON presupuesto_lineas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM presupuestos
      WHERE presupuestos.id = presupuesto_lineas.presupuesto_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presupuestos
      WHERE presupuestos.id = presupuesto_lineas.presupuesto_id
    )
  );

-- ============================================
-- 5. FUNCIONES calculo de totales
-- ============================================
-- Subtotal (suma de líneas)
CREATE OR REPLACE FUNCTION public.presupuesto_subtotal(p_id UUID)
RETURNS DECIMAL(10,2) AS $$
  SELECT COALESCE(SUM(cantidad * precio_unitario), 0)
  FROM presupuesto_lineas
  WHERE presupuesto_id = p_id;
$$ LANGUAGE sql STABLE;

-- Total con descuento + IVA
CREATE OR REPLACE FUNCTION public.presupuesto_total(p_id UUID)
RETURNS DECIMAL(10,2) AS $$
  SELECT ROUND(
    (presupuesto_subtotal(p_id) * (1 - descuento_porcentaje / 100.0)) * (1 + iva_porcentaje / 100.0),
    2
  )
  FROM presupuestos
  WHERE id = p_id;
$$ LANGUAGE sql STABLE;
