-- [AUTO] Variante esquema arena_panel (proyecto PabloRecursos)
-- 018: Citas, parámetros de integración IA por cliente, plantillas de
--      presupuestos, feedback de interacciones, overage y expiración de tokens.
CREATE SCHEMA IF NOT EXISTS arena_panel;
SET search_path TO arena_panel, public, extensions;

-- ============================================
-- 1. TABLA: citas (agendadas por asistentes IA)
-- ============================================
CREATE TABLE IF NOT EXISTS citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  contacto_nombre VARCHAR(200),
  contacto_email VARCHAR(255),
  contacto_telefono VARCHAR(50),
  titulo VARCHAR(200) NOT NULL,
  fecha_hora TIMESTAMPTZ NOT NULL,
  duracion_min INTEGER CHECK (duracion_min IS NULL OR duracion_min > 0),
  estado VARCHAR(15) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada', 'no_show')),
  origen VARCHAR(20) NOT NULL DEFAULT 'ia'
    CHECK (origen IN ('ia', 'manual', 'webhook')),
  notas TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citas_cliente ON citas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha_hora ASC);

COMMENT ON TABLE citas IS 'Citas agendadas por asistentes IA o manualmente';

ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Equipo gestiona citas" ON citas;
CREATE POLICY "Equipo gestiona citas"
  ON citas FOR ALL
  TO authenticated
  USING (arena_panel.is_editor())
  WITH CHECK (arena_panel.is_editor());

DROP POLICY IF EXISTS "Clientes ven sus citas" ON citas;
CREATE POLICY "Clientes ven sus citas"
  ON citas FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE email = arena_panel.user_email()
    )
  );

-- ============================================
-- 2. CLIENTES: parámetros de integración IA
-- ============================================
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS retell_agent_id VARCHAR(100);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ia_phone_number VARCHAR(50);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS calendar_id VARCHAR(200);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS make_webhook_url TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS precio_minuto_extra DECIMAL(6,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN clientes.retell_agent_id IS 'ID del agente en Retell AI';
COMMENT ON COLUMN clientes.ia_phone_number IS 'Número de teléfono del asistente IA';
COMMENT ON COLUMN clientes.calendar_id IS 'ID de calendario Google para citas';
COMMENT ON COLUMN clientes.make_webhook_url IS 'Webhook de entrada Make.com para este cliente';
COMMENT ON COLUMN clientes.precio_minuto_extra IS 'Precio por minuto excedido (overage)';

-- ============================================
-- 3. TABLA: presupuesto_plantillas
-- ============================================
CREATE TABLE IF NOT EXISTS presupuesto_plantillas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  plantilla JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE presupuesto_plantillas IS 'Estructuras reutilizables de presupuestos: {titulo, descuento, iva, lineas[]}';
COMMENT ON COLUMN presupuesto_plantillas.plantilla IS '{titulo, descuento_porcentaje, iva_porcentaje, lineas: [{descripcion, cantidad, precio_unitario}]}';

ALTER TABLE presupuesto_plantillas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Equipo gestiona plantillas de presupuesto" ON presupuesto_plantillas;
CREATE POLICY "Equipo gestiona plantillas de presupuesto"
  ON presupuesto_plantillas FOR ALL
  TO authenticated
  USING (arena_panel.is_editor())
  WITH CHECK (arena_panel.is_editor());

-- ============================================
-- 4. INTERACCIONES IA: feedback de calidad
-- ============================================
ALTER TABLE interacciones_ia ADD COLUMN IF NOT EXISTS valoracion SMALLINT
  CHECK (valoracion IS NULL OR (valoracion >= 1 AND valoracion <= 5));
ALTER TABLE interacciones_ia ADD COLUMN IF NOT EXISTS valoracion_tags JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN interacciones_ia.valoracion IS 'Calidad de la interacción 1-5';
COMMENT ON COLUMN interacciones_ia.valoracion_tags IS 'Tags de auditoría: alucinacion, corte_audio, venta_exitosa...';

-- ============================================
-- 5. facturas.metadata (para marcar overage)
-- ============================================
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- 6. RPC: facturar_overage(cliente)
--    Genera factura borrador con los minutos extra del mes en curso.
-- ============================================
CREATE OR REPLACE FUNCTION arena_panel.facturar_overage(p_cliente_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = arena_panel, public
AS $$
DECLARE
  cli RECORD;
  minutos_consumidos INTEGER;
  minutos_extra INTEGER;
  importe_extra DECIMAL(10,2);
  numero_factura VARCHAR(50);
  factura_id UUID;
  inicio_mes DATE := date_trunc('month', CURRENT_DATE)::date;
BEGIN
  SELECT * INTO cli FROM clientes WHERE id = p_cliente_id;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'cliente_no_encontrado');
  END IF;

  SELECT COALESCE(SUM(duracion_seg), 0) / 60 INTO minutos_consumidos
  FROM interacciones_ia
  WHERE cliente_id = p_cliente_id
    AND created_at >= inicio_mes;

  minutos_extra := minutos_consumidos - cli.minutos_contratados;
  IF minutos_extra <= 0 OR cli.precio_minuto_extra <= 0 THEN
    RETURN json_build_object('ok', false, 'error', 'sin_overage',
      'consumidos', minutos_consumidos, 'contratados', cli.minutos_contratados);
  END IF;

  importe_extra := ROUND(minutos_extra * cli.precio_minuto_extra, 2);

  -- Evitar duplicar la factura de overage del mes
  IF EXISTS (
    SELECT 1 FROM facturas
    WHERE cliente_id = p_cliente_id
      AND metadata->>'tipo' = 'overage'
      AND fecha_emision >= inicio_mes
  ) THEN
    RETURN json_build_object('ok', false, 'error', 'ya_facturado');
  END IF;

  SELECT 'F-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' ||
         LPAD((COUNT(*) + 1)::text, 3, '0')
  INTO numero_factura
  FROM facturas
  WHERE numero LIKE 'F-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-%';

  INSERT INTO facturas (cliente_id, numero, estado, descuento_porcentaje, iva_porcentaje,
                        metodo_pago, notas, metadata)
  VALUES (p_cliente_id, numero_factura, 'borrador', 0, 21, 'tarjeta',
          'Minutos extra de asistente IA (' || to_char(inicio_mes, 'MM/YYYY') || '): '
          || minutos_extra || ' min a ' || cli.precio_minuto_extra || ' €/min',
          json_build_object('tipo', 'overage'))
  RETURNING id INTO factura_id;

  INSERT INTO factura_lineas (factura_id, orden, descripcion, cantidad, precio_unitario)
  VALUES (factura_id, 0,
          'Overage asistente IA — ' || to_char(inicio_mes, 'TMmon YYYY'),
          minutos_extra, cli.precio_minuto_extra);

  RETURN json_build_object('ok', true, 'factura_id', factura_id, 'numero', numero_factura,
          'minutos_extra', minutos_extra, 'importe', importe_extra);
END;
$$;

GRANT EXECUTE ON FUNCTION arena_panel.facturar_overage(UUID) TO authenticated;

-- ============================================
-- 6. RPC: responder_presupuesto v2 (expiración)
--    Reemplaza la versión de la 016 respetando fecha_validez.
-- ============================================
CREATE OR REPLACE FUNCTION arena_panel.responder_presupuesto(p_token TEXT, p_aceptar BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = arena_panel, public
AS $$
DECLARE
  p RECORD;
  nuevo_proyecto_id UUID;
BEGIN
  IF p_token IS NULL OR trim(p_token) = '' THEN
    RETURN json_build_object('ok', false, 'error', 'token_invalido');
  END IF;

  SELECT * INTO p FROM presupuestos WHERE token_publico = trim(p_token) FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'no_encontrado');
  END IF;

  IF p.estado NOT IN ('enviado') THEN
    RETURN json_build_object('ok', false, 'error', 'ya_respondido', 'estado', p.estado);
  END IF;

  -- Expiración: si venció la validez, se marca expirado y no se acepta
  IF p.fecha_validez IS NOT NULL AND p.fecha_validez < CURRENT_DATE THEN
    UPDATE presupuestos SET estado = 'expirado', respondido_at = NOW() WHERE id = p.id;
    RETURN json_build_object('ok', false, 'error', 'expirado');
  END IF;

  UPDATE presupuestos
    SET estado = CASE WHEN p_aceptar THEN 'aceptado' ELSE 'rechazado' END,
        respondido_at = NOW()
    WHERE id = p.id;

  IF p_aceptar AND p.proyecto_generado_id IS NULL THEN
    INSERT INTO proyectos (cliente_id, servicio_id, nombre, descripcion, estado, prioridad, progreso)
    VALUES (p.cliente_id, NULL, p.titulo,
            'Proyecto creado automáticamente desde el presupuesto ' || p.numero || '.',
            'planeacion', 'media', 0)
    RETURNING id INTO nuevo_proyecto_id;

    UPDATE presupuestos SET proyecto_generado_id = nuevo_proyecto_id WHERE id = p.id;

    BEGIN
      INSERT INTO actividad (tipo, cliente_id, descripcion)
      VALUES ('proyecto_creado', p.cliente_id,
              'Proyecto «' || p.titulo || '» creado automáticamente: presupuesto ' || p.numero || ' aceptado por el cliente');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN json_build_object(
    'ok', true,
    'aceptado', p_aceptar,
    'proyecto_id', nuevo_proyecto_id
  );
END;
$$;

REVOKE ALL ON FUNCTION arena_panel.responder_presupuesto(TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arena_panel.responder_presupuesto(TEXT, BOOLEAN) TO anon, authenticated;

-- ============================================
-- 7. TRIGGER: alerta de consumo 80% / 100%
--    Inserta en actividad cuando se cruza un umbral del pack mensual.
-- ============================================
CREATE OR REPLACE FUNCTION arena_panel.alerta_consumo_ia()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = arena_panel, public
AS $$
DECLARE
  cli RECORD;
  consumido INTEGER;
  pct INTEGER;
  ya_alertado_80 BOOLEAN := false;
  ya_alertado_100 BOOLEAN := false;
  inicio_mes DATE := date_trunc('month', CURRENT_DATE)::date;
BEGIN
  IF NEW.cliente_id IS NULL THEN RETURN NEW; END IF;

  SELECT * INTO cli FROM clientes WHERE id = NEW.cliente_id;
  IF cli IS NULL OR cli.minutos_contratados IS NULL OR cli.minutos_contratados <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(duracion_seg), 0) / 60 INTO consumido
  FROM interacciones_ia
  WHERE cliente_id = NEW.cliente_id AND created_at >= inicio_mes;

  pct := (consumido * 100) / cli.minutos_contratados;

  SELECT
    EXISTS (SELECT 1 FROM actividad
            WHERE cliente_id = NEW.cliente_id AND tipo = 'config_actualizada'
              AND descripcion LIKE 'Consumo IA 80%%' AND created_at >= inicio_mes),
    EXISTS (SELECT 1 FROM actividad
            WHERE cliente_id = NEW.cliente_id AND tipo = 'config_actualizada'
              AND descripcion LIKE 'Consumo IA 100%%' AND created_at >= inicio_mes)
  INTO ya_alertado_80, ya_alertado_100;

  BEGIN
    IF pct >= 100 AND NOT ya_alertado_100 THEN
      INSERT INTO actividad (tipo, cliente_id, descripcion)
      VALUES ('config_actualizada', NEW.cliente_id,
              'Consumo IA 100%: ' || consumido || ' de ' || cli.minutos_contratados || ' min — pack agotado');
    ELSIF pct >= 80 AND NOT ya_alertado_80 THEN
      INSERT INTO actividad (tipo, cliente_id, descripcion)
      VALUES ('config_actualizada', NEW.cliente_id,
              'Consumo IA 80%: ' || consumido || ' de ' || cli.minutos_contratados || ' min');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_alerta_consumo_ia ON interacciones_ia;
CREATE TRIGGER trg_alerta_consumo_ia
  AFTER INSERT ON interacciones_ia
  FOR EACH ROW
  EXECUTE FUNCTION arena_panel.alerta_consumo_ia();

-- ============================================
-- 8. REALTIME: citas en vivo
-- ============================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE arena_panel.citas;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- [AUTO] Grants para roles API
GRANT USAGE ON SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA arena_panel TO anon, authenticated, service_role;
