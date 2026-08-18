-- [AUTO] Variante esquema arena_panel (proyecto PabloRecursos)
-- 020: Configuración del área de cliente (marca propia, tema, conocimiento IA,
--      alertas) con RPC de escritura restringida a columnas seguras.
CREATE SCHEMA IF NOT EXISTS arena_panel;
SET search_path TO arena_panel, public, extensions;

-- ============================================
-- 1. CLIENTES: columnas de autoservicio
-- ============================================
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nombre_comercial VARCHAR(200);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tema_preferido VARCHAR(20) NOT NULL DEFAULT 'dark_pure'
  CHECK (tema_preferido IN ('dark_pure', 'dark_slate', 'light_clean'));
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS horario_atencion_texto TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS notas_conocimiento_ia TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS alerta_email_citas BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS alerta_email_urgente BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN clientes.nombre_comercial IS 'Nombre comercial que el cliente muestra en su panel e informes';
COMMENT ON COLUMN clientes.tema_preferido IS 'Tema visual del área de cliente: dark_pure | dark_slate | light_clean';
COMMENT ON COLUMN clientes.horario_atencion_texto IS 'Horarios especiales/festivos que consulta el asistente IA';
COMMENT ON COLUMN clientes.notas_conocimiento_ia IS 'Instrucciones y novedades del mes para el asistente IA';

-- ============================================
-- 2. RPC: actualizar_mi_configuracion
--    El rol cliente NO obtiene UPDATE directo sobre su fila (RLS es row-level,
--    expondría columnas sensibles como precio_base_mensual). Esta RPC
--    SECURITY DEFINER solo toca una whitelist de columnas seguras y verifica
--    la titularidad de la fila.
-- ============================================
CREATE OR REPLACE FUNCTION arena_panel.actualizar_mi_configuracion(p_data JSONB)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = arena_panel, public
AS $$
DECLARE
  v_cliente RECORD;
  v_nombre_comercial VARCHAR(200);
  v_logo_url TEXT;
  v_tema VARCHAR(20);
  v_horario TEXT;
  v_notas TEXT;
  v_alerta_citas BOOLEAN;
  v_alerta_urgente BOOLEAN;
BEGIN
  IF p_data IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'sin_datos');
  END IF;

  SELECT * INTO v_cliente FROM clientes
  WHERE usuario_auth_id = auth.uid() OR email = arena_panel.user_email()
  LIMIT 1;

  IF v_cliente IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'cliente_no_vinculado');
  END IF;

  v_nombre_comercial := NULLIF(trim(p_data->>'nombre_comercial'), '');
  v_logo_url         := NULLIF(trim(p_data->>'logo_url'), '');
  v_tema             := p_data->>'tema_preferido';
  v_horario          := NULLIF(p_data->>'horario_atencion_texto', '');
  v_notas            := NULLIF(p_data->>'notas_conocimiento_ia', '');
  v_alerta_citas     := COALESCE((p_data->>'alerta_email_citas')::boolean, false);
  v_alerta_urgente   := COALESCE((p_data->>'alerta_email_urgente')::boolean, false);

  IF v_tema IS NOT NULL AND v_tema NOT IN ('dark_pure', 'dark_slate', 'light_clean') THEN
    RETURN json_build_object('ok', false, 'error', 'tema_invalido');
  END IF;

  UPDATE clientes SET
    nombre_comercial        = COALESCE(v_nombre_comercial, nombre_comercial),
    logo_url                = CASE WHEN p_data ? 'logo_url' THEN v_logo_url ELSE logo_url END,
    tema_preferido          = COALESCE(v_tema, tema_preferido),
    horario_atencion_texto  = CASE WHEN p_data ? 'horario_atencion_texto' THEN v_horario ELSE horario_atencion_texto END,
    notas_conocimiento_ia   = CASE WHEN p_data ? 'notas_conocimiento_ia' THEN v_notas ELSE notas_conocimiento_ia END,
    alerta_email_citas      = v_alerta_citas,
    alerta_email_urgente    = v_alerta_urgente,
    updated_at              = NOW()
  WHERE id = v_cliente.id;

  RETURN json_build_object(
    'ok', true,
    'nombre_comercial', COALESCE(v_nombre_comercial, v_cliente.nombre_comercial),
    'tema_preferido', COALESCE(v_tema, v_cliente.tema_preferido)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION arena_panel.actualizar_mi_configuracion(JSONB) TO authenticated;

-- [AUTO] Grants para roles API
GRANT USAGE ON SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA arena_panel TO anon, authenticated, service_role;
