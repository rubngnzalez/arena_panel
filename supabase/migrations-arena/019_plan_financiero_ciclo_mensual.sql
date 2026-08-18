-- [AUTO] Variante esquema arena_panel (proyecto PabloRecursos)
-- 019: Rol propietario, plan financiero por cliente (retainer + overage voz/WhatsApp),
--      cierre de ciclo mensual, liquidación RPC, permisos de portal y campos para PDF.
CREATE SCHEMA IF NOT EXISTS arena_panel;
SET search_path TO arena_panel, public, extensions;

-- ============================================
-- 1. ROL PROPIETARIO (+ editor, ausente del CHECK original)
-- ============================================
ALTER TABLE perfiles_usuario DROP CONSTRAINT IF EXISTS perfiles_usuario_rol_check;
ALTER TABLE perfiles_usuario ADD CONSTRAINT perfiles_usuario_rol_check
  CHECK (rol IN ('propietario', 'admin', 'editor', 'cliente', 'colaborador'));

-- is_admin incluye propietario (permisos totales en todas las policies existentes)
CREATE OR REPLACE FUNCTION arena_panel.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = arena_panel
AS $$
  SELECT EXISTS (
    SELECT 1 FROM arena_panel.perfiles_usuario
    WHERE id = auth.uid() AND rol IN ('propietario', 'admin') AND activo = true
  )
$$;

-- is_editor incluye propietario
CREATE OR REPLACE FUNCTION arena_panel.is_editor()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = arena_panel
AS $$
  SELECT EXISTS (
    SELECT 1 FROM arena_panel.perfiles_usuario
    WHERE id = auth.uid() AND rol IN ('propietario', 'admin', 'editor') AND activo = true
  )
$$;

CREATE OR REPLACE FUNCTION arena_panel.is_propietario()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = arena_panel
AS $$
  SELECT EXISTS (
    SELECT 1 FROM arena_panel.perfiles_usuario
    WHERE id = auth.uid() AND rol = 'propietario' AND activo = true
  )
$$;

-- ============================================
-- 2. CLIENTES: plan financiero + acceso + renombres coherentes
-- ============================================
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS plan_nombre TEXT NOT NULL DEFAULT 'Plan Básico';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS precio_base_mensual NUMERIC(10,2) NOT NULL DEFAULT 150.00;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS limite_minutos_incluidos INTEGER NOT NULL DEFAULT 300;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS limite_mensajes_whatsapp_incluidos INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS precio_minuto_extra NUMERIC(6,2) NOT NULL DEFAULT 0.25;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS precio_mensaje_extra NUMERIC(6,3) NOT NULL DEFAULT 0.05;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS minutos_consumidos_mes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS mensajes_whatsapp_consumidos_mes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS saldo_pendiente_pago NUMERIC(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(25) NOT NULL DEFAULT 'al_dia'
  CHECK (estado_pago IN ('al_dia', 'pendiente_facturacion', 'deuda_vencida'));
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS usuario_auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS permisos_portal JSONB NOT NULL DEFAULT
  '{"ver_audios": true, "ver_transcripciones": true, "descargar_pdf": true, "ver_precios": true}'::jsonb;

-- Renombres de la 018 a la nomenclatura unificada (migrando valores)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS webhook_make_url TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefono_asignado TEXT;

UPDATE clientes SET google_calendar_id = COALESCE(google_calendar_id, arena_panel.clientes.calendar_id)
  WHERE calendar_id IS NOT NULL;
UPDATE clientes SET webhook_make_url = COALESCE(webhook_make_url, arena_panel.clientes.make_webhook_url)
  WHERE make_webhook_url IS NOT NULL;
UPDATE clientes SET telefono_asignado = COALESCE(telefono_asignado, arena_panel.clientes.ia_phone_number)
  WHERE ia_phone_number IS NOT NULL;
UPDATE clientes SET limite_minutos_incluidos = GREATEST(limite_minutos_incluidos, COALESCE(minutos_contratados, 0))
  WHERE minutos_contratados IS NOT NULL AND minutos_contratados > 0;

ALTER TABLE clientes DROP COLUMN IF EXISTS calendar_id;
ALTER TABLE clientes DROP COLUMN IF EXISTS make_webhook_url;
ALTER TABLE clientes DROP COLUMN IF EXISTS ia_phone_number;
ALTER TABLE clientes DROP COLUMN IF EXISTS minutos_contratados;

COMMENT ON COLUMN clientes.precio_base_mensual IS 'Retainer mensual base (€)';
COMMENT ON COLUMN clientes.permisos_portal IS 'Permisos del portal: {ver_audios, ver_transcripciones, descargar_pdf, ver_precios}';

-- ============================================
-- 3. TABLA: consumos_mensuales (histórico de cierre)
-- ============================================
CREATE TABLE IF NOT EXISTS consumos_mensuales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  periodo_mes VARCHAR(7) NOT NULL,
  minutos_consumidos INTEGER NOT NULL DEFAULT 0,
  mensajes_consumidos INTEGER NOT NULL DEFAULT 0,
  total_base NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_overage NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_facturado NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cliente_id, periodo_mes)
);

CREATE INDEX IF NOT EXISTS idx_consumos_cliente ON consumos_mensuales(cliente_id);
CREATE INDEX IF NOT EXISTS idx_consumos_periodo ON consumos_mensuales(periodo_mes DESC);

COMMENT ON TABLE consumos_mensuales IS 'Liquidación mensual cerrada por cliente (cierre de ciclo)';

ALTER TABLE consumos_mensuales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Equipo gestiona consumos mensuales" ON consumos_mensuales;
CREATE POLICY "Equipo gestiona consumos mensuales"
  ON consumos_mensuales FOR ALL
  TO authenticated
  USING (arena_panel.is_editor())
  WITH CHECK (arena_panel.is_editor());

DROP POLICY IF EXISTS "Clientes ven su historial de consumos" ON consumos_mensuales;
CREATE POLICY "Clientes ven su historial de consumos"
  ON consumos_mensuales FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes
      WHERE email = arena_panel.user_email() OR usuario_auth_id = auth.uid()
    )
  );

-- ============================================
-- 4. INTERACCIONES IA: campos para el informe PDF
-- ============================================
ALTER TABLE interacciones_ia ADD COLUMN IF NOT EXISTS variables_extraidas JSONB DEFAULT '{}'::jsonb;
ALTER TABLE interacciones_ia ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(50);
ALTER TABLE interacciones_ia ADD COLUMN IF NOT EXISTS resumen_ejecutivo TEXT;

COMMENT ON COLUMN interacciones_ia.variables_extraidas IS 'Variables que extrajo el agente: {nombre, telefono, servicio, motivo...}';

-- ============================================
-- 5. RPC: calcular_liquidacion_cliente
--    Desglose inalterable del mes en curso.
-- ============================================
CREATE OR REPLACE FUNCTION arena_panel.calcular_liquidacion_cliente(p_cliente_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = arena_panel, public
AS $$
DECLARE
  cli RECORD;
BEGIN
  SELECT * INTO cli FROM clientes WHERE id = p_cliente_id;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'cliente_no_encontrado');
  END IF;

  RETURN json_build_object(
    'ok', true,
    'plan_nombre', cli.plan_nombre,
    'precio_base_mensual', cli.precio_base_mensual,
    'limite_minutos_incluidos', cli.limite_minutos_incluidos,
    'limite_mensajes_whatsapp_incluidos', cli.limite_mensajes_whatsapp_incluidos,
    'precio_minuto_extra', cli.precio_minuto_extra,
    'precio_mensaje_extra', cli.precio_mensaje_extra,
    'minutos_consumidos_mes', cli.minutos_consumidos_mes,
    'mensajes_whatsapp_consumidos_mes', cli.mensajes_whatsapp_consumidos_mes,
    'minutos_extra', GREATEST(0, cli.minutos_consumidos_mes - cli.limite_minutos_incluidos),
    'mensajes_extra', GREATEST(0, cli.mensajes_whatsapp_consumidos_mes - cli.limite_mensajes_whatsapp_incluidos),
    'coste_minutos_extra', ROUND(GREATEST(0, cli.minutos_consumidos_mes - cli.limite_minutos_incluidos) * cli.precio_minuto_extra, 2),
    'coste_mensajes_extra', ROUND(GREATEST(0, cli.mensajes_whatsapp_consumidos_mes - cli.limite_mensajes_whatsapp_incluidos) * cli.precio_mensaje_extra, 2),
    'total_overage', ROUND(
      GREATEST(0, cli.minutos_consumidos_mes - cli.limite_minutos_incluidos) * cli.precio_minuto_extra
      + GREATEST(0, cli.mensajes_whatsapp_consumidos_mes - cli.limite_mensajes_whatsapp_incluidos) * cli.precio_mensaje_extra, 2),
    'total_final', cli.precio_base_mensual + ROUND(
      GREATEST(0, cli.minutos_consumidos_mes - cli.limite_minutos_incluidos) * cli.precio_minuto_extra
      + GREATEST(0, cli.mensajes_whatsapp_consumidos_mes - cli.limite_mensajes_whatsapp_incluidos) * cli.precio_mensaje_extra, 2),
    'saldo_pendiente_pago', cli.saldo_pendiente_pago,
    'estado_pago', cli.estado_pago
  );
END;
$$;

GRANT EXECUTE ON FUNCTION arena_panel.calcular_liquidacion_cliente(UUID) TO authenticated;

-- ============================================
-- 6. RPC: cerrar_ciclo_mensual_cliente
--    Historiza el periodo, resetea contadores y actualiza saldo.
-- ============================================
CREATE OR REPLACE FUNCTION arena_panel.cerrar_ciclo_mensual_cliente(p_cliente_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = arena_panel, public
AS $$
DECLARE
  cli RECORD;
  v_periodo VARCHAR(7) := to_char(CURRENT_DATE, 'YYYY-MM');
  v_min_extra INTEGER;
  v_msg_extra INTEGER;
  v_overage NUMERIC(10,2);
  v_total NUMERIC(10,2);
  ya_existe BOOLEAN;
BEGIN
  SELECT * INTO cli FROM clientes WHERE id = p_cliente_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'cliente_no_encontrado');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM consumos_mensuales
    WHERE cliente_id = p_cliente_id AND periodo_mes = v_periodo
  ) INTO ya_existe;
  IF ya_existe THEN
    RETURN json_build_object('ok', false, 'error', 'ciclo_ya_cerrado', 'periodo', v_periodo);
  END IF;

  v_min_extra := GREATEST(0, cli.minutos_consumidos_mes - cli.limite_minutos_incluidos);
  v_msg_extra := GREATEST(0, cli.mensajes_whatsapp_consumidos_mes - cli.limite_mensajes_whatsapp_incluidos);
  v_overage := ROUND(v_min_extra * cli.precio_minuto_extra + v_msg_extra * cli.precio_mensaje_extra, 2);
  v_total := cli.precio_base_mensual + v_overage;

  INSERT INTO consumos_mensuales
    (cliente_id, periodo_mes, minutos_consumidos, mensajes_consumidos, total_base, total_overage, total_facturado)
  VALUES
    (p_cliente_id, v_periodo, cli.minutos_consumidos_mes, cli.mensajes_whatsapp_consumidos_mes,
     cli.precio_base_mensual, v_overage, v_total);

  UPDATE clientes
    SET minutos_consumidos_mes = 0,
        mensajes_whatsapp_consumidos_mes = 0,
        saldo_pendiente_pago = saldo_pendiente_pago + v_total,
        estado_pago = 'pendiente_facturacion'
    WHERE id = p_cliente_id;

  RETURN json_build_object('ok', true, 'periodo', v_periodo,
    'minutos_consumidos', cli.minutos_consumidos_mes,
    'mensajes_consumidos', cli.mensajes_whatsapp_consumidos_mes,
    'total_base', cli.precio_base_mensual,
    'total_overage', v_overage,
    'total_facturado', v_total);
END;
$$;

GRANT EXECUTE ON FUNCTION arena_panel.cerrar_ciclo_mensual_cliente(UUID) TO authenticated;

-- ============================================
-- 7. RPC: generar_factura_excesos
--    Factura borrador con el desglose de overage del mes (anti-duplicado).
--    Sustituye a facturar_overage (018).
-- ============================================
CREATE OR REPLACE FUNCTION arena_panel.generar_factura_excesos(p_cliente_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = arena_panel, public
AS $$
DECLARE
  cli RECORD;
  inicio_mes DATE := date_trunc('month', CURRENT_DATE)::date;
  v_min_extra INTEGER;
  v_msg_extra INTEGER;
  v_coste_min NUMERIC(10,2);
  v_coste_msg NUMERIC(10,2);
  v_overage NUMERIC(10,2);
  v_total NUMERIC(10,2);
  numero_factura VARCHAR(50);
  factura_id UUID;
  orden INTEGER := 0;
BEGIN
  SELECT * INTO cli FROM clientes WHERE id = p_cliente_id;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'cliente_no_encontrado');
  END IF;

  v_min_extra := GREATEST(0, cli.minutos_consumidos_mes - cli.limite_minutos_incluidos);
  v_msg_extra := GREATEST(0, cli.mensajes_whatsapp_consumidos_mes - cli.limite_mensajes_whatsapp_incluidos);
  v_coste_min := ROUND(v_min_extra * cli.precio_minuto_extra, 2);
  v_coste_msg := ROUND(v_msg_extra * cli.precio_mensaje_extra, 2);
  v_overage := v_coste_min + v_coste_msg;
  v_total := cli.precio_base_mensual + v_overage;

  IF v_overage <= 0 AND cli.precio_base_mensual <= 0 THEN
    RETURN json_build_object('ok', false, 'error', 'sin_importes');
  END IF;

  IF EXISTS (
    SELECT 1 FROM facturas
    WHERE cliente_id = p_cliente_id
      AND metadata->>'tipo' = 'excesos'
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
          'Liquidación ' || to_char(inicio_mes, 'MM/YYYY') || ' — ' || cli.plan_nombre
          || ': base ' || cli.precio_base_mensual || ' € + excesos ' || v_overage || ' €',
          json_build_object('tipo', 'excesos', 'periodo', to_char(inicio_mes, 'YYYY-MM')))
  RETURNING id INTO factura_id;

  INSERT INTO factura_lineas (factura_id, orden, descripcion, cantidad, precio_unitario)
  VALUES (factura_id, orden, 'Retainer mensual — ' || cli.plan_nombre || ' (' || to_char(inicio_mes, 'TMmon YYYY') || ')',
          1, cli.precio_base_mensual);
  orden := orden + 1;

  IF v_min_extra > 0 THEN
    INSERT INTO factura_lineas (factura_id, orden, descripcion, cantidad, precio_unitario)
    VALUES (factura_id, orden,
            'Minutos extra de voz (' || to_char(inicio_mes, 'TMmon YYYY') || ') — ' || v_min_extra || ' min',
            v_min_extra, cli.precio_minuto_extra);
    orden := orden + 1;
  END IF;

  IF v_msg_extra > 0 THEN
    INSERT INTO factura_lineas (factura_id, orden, descripcion, cantidad, precio_unitario)
    VALUES (factura_id, orden,
            'Mensajes WhatsApp extra (' || to_char(inicio_mes, 'TMmon YYYY') || ') — ' || v_msg_extra || ' msg',
            v_msg_extra, cli.precio_mensaje_extra);
  END IF;

  RETURN json_build_object('ok', true, 'factura_id', factura_id, 'numero', numero_factura,
          'total_base', cli.precio_base_mensual, 'total_overage', v_overage, 'total', v_total);
END;
$$;

GRANT EXECUTE ON FUNCTION arena_panel.generar_factura_excesos(UUID) TO authenticated;

DROP FUNCTION IF EXISTS arena_panel.facturar_overage(UUID);

-- ============================================
-- 8. ACTUALIZAR trigger de alerta (nombres nuevos de columnas)
-- ============================================
DROP TRIGGER IF EXISTS trg_alerta_consumo_ia ON interacciones_ia;
DROP FUNCTION IF EXISTS arena_panel.alerta_consumo_ia();

CREATE OR REPLACE FUNCTION arena_panel.alerta_consumo_ia()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = arena_panel, public
AS $$
DECLARE
  pct INTEGER;
  ya_alertado_80 BOOLEAN := false;
  ya_alertado_100 BOOLEAN := false;
  inicio_mes DATE := date_trunc('month', CURRENT_DATE)::date;
BEGIN
  -- Trigger sobre UPDATE de clientes: NEW es la fila del propio cliente
  IF NEW.limite_minutos_incluidos IS NULL OR NEW.limite_minutos_incluidos <= 0 THEN
    RETURN NEW;
  END IF;

  pct := (NEW.minutos_consumidos_mes * 100) / NEW.limite_minutos_incluidos;

  SELECT
    EXISTS (SELECT 1 FROM actividad
            WHERE cliente_id = NEW.id
              AND descripcion LIKE 'Consumo IA 80%%' AND created_at >= inicio_mes),
    EXISTS (SELECT 1 FROM actividad
            WHERE cliente_id = NEW.id
              AND descripcion LIKE 'Consumo IA 100%%' AND created_at >= inicio_mes)
  INTO ya_alertado_80, ya_alertado_100;

  BEGIN
    IF pct >= 100 AND NOT ya_alertado_100 THEN
      INSERT INTO actividad (tipo, cliente_id, descripcion)
      VALUES ('config_actualizada', NEW.id,
              'Consumo IA 100%: ' || NEW.minutos_consumidos_mes || ' de ' || NEW.limite_minutos_incluidos || ' min — pack agotado');
    ELSIF pct >= 80 AND NOT ya_alertado_80 THEN
      INSERT INTO actividad (tipo, cliente_id, descripcion)
      VALUES ('config_actualizada', NEW.id,
              'Consumo IA 80%: ' || NEW.minutos_consumidos_mes || ' de ' || NEW.limite_minutos_incluidos || ' min');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_alerta_consumo_ia
  AFTER UPDATE OF minutos_consumidos_mes ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION arena_panel.alerta_consumo_ia();

-- ============================================
-- 9. POLICY clientes: vinculación también por usuario_auth_id
-- ============================================
DROP POLICY IF EXISTS "Clientes pueden ver su propio perfil" ON clientes;
CREATE POLICY "Clientes pueden ver su propio perfil"
  ON clientes FOR SELECT
  TO authenticated
  USING (
    email = arena_panel.user_email() OR usuario_auth_id = auth.uid()
  );

-- [AUTO] Grants para roles API
GRANT USAGE ON SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA arena_panel TO anon, authenticated, service_role;
