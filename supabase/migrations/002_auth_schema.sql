-- ============================================
-- Arena13 Panel - Esquema de Autenticación
-- Migración: 002_auth_schema
-- ============================================

-- ============================================
-- TABLA: perfiles_usuario (extiende auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS perfiles_usuario (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(100),
  rol VARCHAR(20) DEFAULT 'cliente' CHECK (rol IN ('admin', 'cliente', 'colaborador')),
  avatar_url TEXT,
  telefono VARCHAR(20),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_perfiles_usuario_rol ON perfiles_usuario(rol);

-- ============================================
-- TRIGGER para crear perfil automáticamente
-- ============================================

-- Función para crear perfil al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles_usuario (id, nombre, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'cliente')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ACTUALIZACIÓN DE RLS PARA AUTENTICACIÓN
-- ============================================

-- Políticas para perfiles_usuario
ALTER TABLE perfiles_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON perfiles_usuario FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins pueden ver todos los perfiles"
  ON perfiles_usuario FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Usuarios pueden actualizar su perfil"
  ON perfiles_usuario FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- ============================================
-- ACTUALIZAR POLÍTICAS DE CLIENTES CON AUTH
-- ============================================

DROP POLICY IF EXISTS "Clientes pueden ver su propio perfil" ON clientes;
CREATE POLICY "Clientes pueden ver su propio perfil"
  ON clientes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles_usuario pu
      JOIN auth.users u ON pu.id = u.id
      WHERE pu.id = auth.uid()
      AND (pu.rol = 'admin' OR u.email = clientes.email)
    )
  );

DROP POLICY IF EXISTS "Admins pueden ver todos los clientes" ON clientes;
CREATE POLICY "Admins pueden ver todos los clientes"
  ON clientes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Admins pueden insertar clientes"
  ON clientes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Admins pueden actualizar clientes"
  ON clientes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- ============================================
-- POLÍTICAS PARA PROYECTOS
-- ============================================

-- (no hay políticas previas en proyectos que eliminar)
CREATE POLICY "Admins pueden ver todos los proyectos"
  ON proyectos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Colaboradores pueden ver proyectos asignados"
  ON proyectos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE id = auth.uid() AND rol IN ('admin', 'colaborador')
    )
  );

-- ============================================
-- FUNCIÓN: Verificar rol de usuario
-- ============================================

CREATE OR REPLACE FUNCTION usuario_rol(usuario_id UUID)
RETURNS VARCHAR AS $$
BEGIN
  RETURN (
    SELECT rol FROM perfiles_usuario
    WHERE id = usuario_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Verificar si es admin
-- ============================================

CREATE OR REPLACE FUNCTION es_admin(usuario_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE id = usuario_id AND rol = 'admin' AND activo = true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VISTA: usuarios con sus roles
-- ============================================

CREATE OR REPLACE VIEW vw_usuarios AS
SELECT
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  p.nombre,
  p.rol,
  p.avatar_url,
  p.telefono,
  p.activo
FROM auth.users u
JOIN perfiles_usuario p ON u.id = p.id;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE perfiles_usuario IS 'Perfiles extendidos de usuarios de autenticación';
COMMENT ON FUNCTION usuario_rol IS 'Devuelve el rol de un usuario';
COMMENT ON FUNCTION es_admin IS 'Verifica si un usuario es administrador';
COMMENT ON VIEW vw_usuarios IS 'Vista de usuarios con información de perfil';
