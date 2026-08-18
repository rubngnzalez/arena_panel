-- [AUTO] Variante esquema arena_panel (proyecto PabloRecursos)
-- 016: Aprobación pública de presupuestos (token único) + imputación de horas.
--      - presupuestos: token_publico, respondido_at, proyecto_generado_id
--      - proyectos: servicio_id pasa a ser nullable (proyectos creados desde presupuesto)
--      - nueva tabla imputaciones_horas (time tracking)
--      - RPCs SECURITY DEFINER para acceso anónimo por token (sin exponer tablas)
CREATE SCHEMA IF NOT EXISTS arena_panel;
SET search_path TO arena_panel, public, extensions;

-- ============================================
-- 1. PRESUPUESTOS: columnas de aprobación pública
-- ============================================
ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS token_publico VARCHAR(64);
ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS respondido_at TIMESTAMPTZ;
ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS proyecto_generado_id UUID REFERENCES proyectos(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_presupuestos_token ON presupuestos(token_publico) WHERE token_publico IS NOT NULL;

-- ============================================
-- 2. PROYECTOS: servicio_id nullable
--    (un proyecto creado desde un presupuesto aceptado aún no tiene
--     servicio contratado; se asigna después)
-- ============================================
ALTER TABLE proyectos ALTER COLUMN servicio_id DROP NOT NULL;

-- ============================================
-- 3. TABLA: imputaciones_horas (time tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS imputaciones_horas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  inicio TIMESTAMPTZ NOT NULL,
  fin TIMESTAMPTZ,
  duracion_minutos INTEGER CHECK (duracion_minutos IS NULL OR duracion_minutos > 0),
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_imputaciones_proyecto ON imputaciones_horas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_imputaciones_fecha ON imputaciones_horas(inicio DESC);

COMMENT ON TABLE imputaciones_horas IS 'Imputaciones de tiempo por proyecto (timer)';

ALTER TABLE imputaciones_horas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Equipo puede gestionar imputaciones" ON imputaciones_horas;
CREATE POLICY "Equipo puede gestionar imputaciones"
  ON imputaciones_horas FOR ALL
  TO authenticated
  USING (arena_panel.is_admin() OR arena_panel.is_editor())
  WITH CHECK (arena_panel.is_admin() OR arena_panel.is_editor());

-- ============================================
-- 4. RPC: obtener_presupuesto_publico(token)
--    Devuelve el presupuesto + líneas + datos mínimos del cliente.
--    SECURITY DEFINER: el rol anon nunca toca las tablas directamente.
-- ============================================
CREATE OR REPLACE FUNCTION arena_panel.obtener_presupuesto_publico(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = arena_panel, public
AS $$
DECLARE
  p RECORD;
  resultado JSON;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RETURN json_build_object('ok', false, 'error', 'token_invalido');
  END IF;

  SELECT * INTO p FROM presupuestos WHERE token_publico = trim(p_token);
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'no_encontrado');
  END IF;

  SELECT json_build_object(
    'ok', true,
    'presupuesto', json_build_object(
      'id', p.id,
      'numero', p.numero,
      'titulo', p.titulo,
      'estado', p.estado,
      'fecha_emision', p.fecha_emision,
      'fecha_validez', p.fecha_validez,
      'descuento_porcentaje', p.descuento_porcentaje,
      'iva_porcentaje', p.iva_porcentaje,
      'notas', p.notas,
      'respondido_at', p.respondido_at
    ),
    'cliente', (
      SELECT json_build_object('nombre', c.nombre, 'empresa', c.empresa)
      FROM clientes c WHERE c.id = p.cliente_id
    ),
    'lineas', (
      SELECT COALESCE(json_agg(json_build_object(
        'descripcion', l.descripcion,
        'cantidad', l.cantidad,
        'precio_unitario', l.precio_unitario
      ) ORDER BY l.orden), '[]'::json)
      FROM presupuesto_lineas l WHERE l.presupuesto_id = p.id
    )
  ) INTO resultado;

  RETURN resultado;
END;
$$;

-- ============================================
-- 5. RPC: responder_presupuesto(token, aceptar)
--    Acepta o rechaza. Al aceptar crea el proyecto automáticamente.
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

    -- Registro de actividad (best-effort: nunca bloquea la aceptación)
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

-- ============================================
-- 6. Permisos: solo estas dos RPC son ejecutables por anon
-- ============================================
REVOKE ALL ON FUNCTION arena_panel.obtener_presupuesto_publico(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION arena_panel.responder_presupuesto(TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arena_panel.obtener_presupuesto_publico(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION arena_panel.responder_presupuesto(TEXT, BOOLEAN) TO anon, authenticated;

-- [AUTO] Grants para roles API
GRANT USAGE ON SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA arena_panel TO anon, authenticated, service_role;
