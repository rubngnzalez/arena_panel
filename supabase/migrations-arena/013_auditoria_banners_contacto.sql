-- [AUTO] Variante esquema arena_panel (proyecto PabloRecursos)
-- Generado desde supabase/migrations. NO editar a mano.
CREATE SCHEMA IF NOT EXISTS arena_panel;
SET search_path TO arena_panel, public, extensions;

-- ============================================
-- Arena13 Panel - Auditoria, Banners y Contacto
-- ============================================

-- 1. Historial de logueos
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  dispositivo VARCHAR(100),
  exito BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created ON login_history(created_at DESC);

-- 2. Descargas de boveda
CREATE TABLE IF NOT EXISTS vault_descargas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  documento_id UUID REFERENCES cliente_documentos(id) ON DELETE SET NULL,
  documento_titulo VARCHAR(255),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_descargas_cliente ON vault_descargas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vault_descargas_created ON vault_descargas(created_at DESC);

-- 3. Banners promocionales / notificaciones configurables
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR(20) DEFAULT 'info' CHECK (tipo IN ('info', 'promocion', 'aviso', 'urgente')),
  color VARCHAR(20) DEFAULT 'cyan',
  icono VARCHAR(50) DEFAULT 'Megaphone',
  activo BOOLEAN DEFAULT true,
  fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_fin TIMESTAMP WITH TIME ZONE,
  dias_caducidad INT,
  mostrar_boton BOOLEAN DEFAULT false,
  boton_texto VARCHAR(50),
  boton_url VARCHAR(500),
  posicion VARCHAR(20) DEFAULT 'dashboard' CHECK (posicion IN ('top', 'dashboard')),
  orden INT DEFAULT 0,
  descartable BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_activo ON banners(activo);
CREATE INDEX IF NOT EXISTS idx_banners_fechas ON banners(fecha_inicio, fecha_fin);

-- 4. Metodos de contacto del admin
CREATE TABLE IF NOT EXISTS metodos_contacto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('whatsapp', 'telefono', 'email', 'telegram', 'instagram', 'linkedin', 'web', 'otro')),
  etiqueta VARCHAR(100) NOT NULL,
  valor VARCHAR(500) NOT NULL,
  icono VARCHAR(50) DEFAULT 'MessageCircle',
  orden INT DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metodos_contacto_activo ON metodos_contacto(activo);

-- Triggers updated_at
CREATE TRIGGER banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER metodos_contacto_updated_at
  BEFORE UPDATE ON metodos_contacto
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- === RLS ===

-- login_history: solo admins pueden ver; cualquier autenticado puede insertar el suyo
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins ven historial de logueos"
  ON login_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND rol = 'admin')
    OR user_id = auth.uid()
  );

CREATE POLICY "Usuarios registran su login"
  ON login_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- vault_descargas: admins ven todo; usuarios registran descargas
ALTER TABLE vault_descargas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins ven descargas de boveda"
  ON vault_descargas FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Usuarios registran descargas"
  ON vault_descargas FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- banners: todos los autenticados pueden ver activos; solo admins gestionan
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados ven banners activos"
  ON banners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins gestionan banners"
  ON banners FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND rol = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND rol = 'admin')
  );

-- metodos_contacto: todos los autenticados ven; solo admins gestionan
ALTER TABLE metodos_contacto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados ven metodos de contacto"
  ON metodos_contacto FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins gestionan metodos de contacto"
  ON metodos_contacto FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND rol = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND rol = 'admin')
  );

-- Comentarios
COMMENT ON TABLE login_history IS 'Historial de accesos al panel';
COMMENT ON TABLE vault_descargas IS 'Registro de descargas de documentos de la boveda';
COMMENT ON TABLE banners IS 'Banners promocionales y de notificacion configurables';
COMMENT ON TABLE metodos_contacto IS 'Metodos de contacto del admin (whatsapp, telefono, etc.)';

-- Datos iniciales: metodos de contacto de ejemplo
INSERT INTO metodos_contacto (tipo, etiqueta, valor, icono, orden) VALUES
  ('whatsapp', 'WhatsApp', 'https://wa.me/34600000000', 'MessageCircle', 0),
  ('email', 'Email', 'hola@arenatrece.com', 'Mail', 1),
  ('telefono', 'Telefono', '+34 600 000 000', 'Phone', 2)
ON CONFLICT DO NOTHING;

-- Banner de bienvenida de ejemplo
INSERT INTO banners (titulo, mensaje, tipo, color, activo, mostrar_boton, boton_texto, boton_url, posicion, orden)
VALUES (
  'Bienvenido al panel Arena13',
  'Gestiona tus proyectos, presupuestos y entregables desde un unico lugar. ¿Necesitas ayuda? Abre un ticket.',
  'info', 'cyan', true, true, 'Abrir ticket', '/tickets', 'dashboard', 0
)
ON CONFLICT DO NOTHING;


-- [AUTO] Grants para roles API
GRANT USAGE ON SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA arena_panel TO anon, authenticated, service_role;
