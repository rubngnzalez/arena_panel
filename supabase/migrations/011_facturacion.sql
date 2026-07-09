-- ============================================
-- Arena13 Panel - Sistema de Facturación
-- Migración: 011
-- ============================================
-- Facturas + líneas de detalle. Permite convertir
-- un presupuesto aceptado en factura.

-- ============================================
-- 1. TABLA: facturas
-- ============================================
CREATE TABLE IF NOT EXISTS facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE SET NULL,
  numero VARCHAR(50) UNIQUE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador','emitida','pagada','vencida','anulada')),
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  fecha_pago DATE,
  descuento_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
  iva_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 21 CHECK (iva_porcentaje >= 0),
  metodo_pago VARCHAR(50)
    CHECK (metodo_pago IS NULL OR metodo_pago IN ('transferencia','tarjeta','efectivo','bizum','paypal','otro')),
  notas TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON facturas(fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_facturas_presupuesto ON facturas(presupuesto_id);

COMMENT ON TABLE facturas IS 'Facturas emitidas a clientes';

-- ============================================
-- 2. TABLA: factura_lineas
-- ============================================
CREATE TABLE IF NOT EXISTS factura_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL DEFAULT 0,
  descripcion TEXT NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_factura_lineas_factura ON factura_lineas(factura_id);

COMMENT ON TABLE factura_lineas IS 'Líneas de detalle de una factura';

-- ============================================
-- 3. TRIGGERS updated_at
-- ============================================
CREATE TRIGGER update_facturas_updated_at
  BEFORE UPDATE ON facturas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. RLS
-- ============================================
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE factura_lineas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins pueden gestionar facturas"
  ON facturas FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins pueden gestionar lineas de factura"
  ON factura_lineas FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM facturas WHERE facturas.id = factura_lineas.factura_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM facturas WHERE facturas.id = factura_lineas.factura_id)
  );

-- ============================================
-- 5. FUNCIONES calculo de totales
-- ============================================
CREATE OR REPLACE FUNCTION public.factura_subtotal(f_id UUID)
RETURNS DECIMAL(10,2) AS $$
  SELECT COALESCE(SUM(cantidad * precio_unitario), 0)
  FROM factura_lineas
  WHERE factura_id = f_id;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.factura_total(f_id UUID)
RETURNS DECIMAL(10,2) AS $$
  SELECT ROUND(
    (factura_subtotal(f_id) * (1 - descuento_porcentaje / 100.0)) * (1 + iva_porcentaje / 100.0),
    2
  )
  FROM facturas
  WHERE id = f_id;
$$ LANGUAGE sql STABLE;
