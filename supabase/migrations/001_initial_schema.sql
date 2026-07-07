-- ============================================
-- Arena13 Panel - Esquema Inicial de Base de Datos
-- Migración: 001_initial_schema
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: clientes
-- ============================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefono VARCHAR(20),
  empresa VARCHAR(100),
  estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'potencial')),
  fecha_alta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa);

-- ============================================
-- TABLA: servicios (catálogo)
-- ============================================
CREATE TABLE IF NOT EXISTS servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio_base DECIMAL(10,2) CHECK (precio_base >= 0),
  activo BOOLEAN DEFAULT true,
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('web', 'branding', 'ia', 'marketing', 'consultoria', 'otro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para servicios
CREATE INDEX IF NOT EXISTS idx_servicios_categoria ON servicios(categoria);
CREATE INDEX IF NOT EXISTS idx_servicios_activo ON servicios(activo);

-- ============================================
-- TABLA: cliente_servicios (servicios contratados)
-- ============================================
CREATE TABLE IF NOT EXISTS cliente_servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  servicio_id UUID NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
  estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'completado', 'pausado', 'cancelado')),
  fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_fin TIMESTAMP WITH TIME ZONE,
  precio_acordado DECIMAL(10,2) CHECK (precio_acordado >= 0),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cliente_id, servicio_id)
);

-- Índices para cliente_servicios
CREATE INDEX IF NOT EXISTS idx_cliente_servicios_cliente ON cliente_servicios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_servicios_servicio ON cliente_servicios(servicio_id);
CREATE INDEX IF NOT EXISTS idx_cliente_servicios_estado ON cliente_servicios(estado);

-- ============================================
-- TABLA: proyectos
-- ============================================
CREATE TABLE IF NOT EXISTS proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  servicio_id UUID NOT NULL REFERENCES cliente_servicios(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(20) DEFAULT 'planeacion' CHECK (estado IN ('planeacion', 'en_progreso', 'revision', 'completado')),
  prioridad VARCHAR(20) DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  fecha_entrega_estimada TIMESTAMP WITH TIME ZONE,
  progreso INTEGER DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para proyectos
CREATE INDEX IF NOT EXISTS idx_proyectos_cliente ON proyectos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_servicio ON proyectos(servicio_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_prioridad ON proyectos(prioridad);

-- ============================================
-- TABLA: tareas
-- ============================================
CREATE TABLE IF NOT EXISTS tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada')),
  prioridad VARCHAR(20) DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta')),
  fecha_limite TIMESTAMP WITH TIME ZONE,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para tareas
CREATE INDEX IF NOT EXISTS idx_tareas_proyecto ON tareas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas(estado);
CREATE INDEX IF NOT EXISTS idx_tareas_prioridad ON tareas(prioridad);

-- ============================================
-- TABLA: actividad (logs)
-- ============================================
CREATE TABLE IF NOT EXISTS actividad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  tipo VARCHAR(50) NOT NULL,
  descripcion TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para actividad
CREATE INDEX IF NOT EXISTS idx_actividad_usuario ON actividad(usuario_id);
CREATE INDEX IF NOT EXISTS idx_actividad_cliente ON actividad(cliente_id);
CREATE INDEX IF NOT EXISTS idx_actividad_tipo ON actividad(tipo);
CREATE INDEX IF NOT EXISTS idx_actividad_created ON actividad(created_at DESC);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para clientes
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para proyectos
CREATE TRIGGER update_proyectos_updated_at
  BEFORE UPDATE ON proyectos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividad ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES (se ajustarán según autenticación)
-- ============================================

-- Políticas para clientes (admin todo, clientes solo sus datos)
CREATE POLICY "Admins pueden ver todos los clientes"
  ON clientes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'rol' = 'admin'
    )
  );

CREATE POLICY "Clientes pueden ver su propio perfil"
  ON clientes FOR SELECT
  TO authenticated
  USING (email = (auth.jwt()->>'email'));

-- Políticas similares para otras tablas...
-- (se implementarán completamente cuando se defina el sistema de auth)

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar servicios por defecto
INSERT INTO servicios (nombre, descripcion, precio_base, activo, categoria) VALUES
  ('Diseño Web', 'Desarrollo de sitios web completos y optimizados', 1500, true, 'web'),
  ('Branding', 'Identidad visual corporativa completa', 800, true, 'branding'),
  ('IA Aplicada', 'Implementación de soluciones de Inteligencia Artificial', 2000, true, 'ia'),
  ('Growth Marketing', 'Estrategias integrales de crecimiento digital', 1200, true, 'marketing'),
  ('SEO & GEO', 'Optimización para motores de búsqueda e IA', 600, true, 'marketing'),
  ('Automatización', 'Flujos conversacionales y agentes autónomos', 1000, true, 'ia'),
  ('Consultoría', 'Asesoramiento especializado en diseño digital', 500, true, 'consultoria')
ON CONFLICT DO NOTHING;

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: clientes con servicios activos
CREATE OR REPLACE VIEW vw_clientes_con_servicios AS
SELECT
  c.*,
  COUNT(cs.id) FILTER (WHERE cs.estado = 'activo') AS servicios_activos,
  COUNT(cs.id) AS total_servicios
FROM clientes c
LEFT JOIN cliente_servicios cs ON c.id = cs.cliente_id
GROUP BY c.id;

-- Vista: resumen de proyectos
CREATE OR REPLACE VIEW vw_resumen_proyectos AS
SELECT
  p.*,
  c.nombre AS cliente_nombre,
  c.empresa AS cliente_empresa,
  s.nombre AS servicio_nombre,
  COUNT(t.id) FILTER (WHERE t.estado = 'completada') AS tareas_completadas,
  COUNT(t.id) AS total_tareas
FROM proyectos p
JOIN clientes c ON p.cliente_id = c.id
JOIN cliente_servicios cs ON p.servicio_id = cs.id
JOIN servicios s ON cs.servicio_id = s.id
LEFT JOIN tareas t ON p.id = t.proyecto_id
GROUP BY p.id, c.nombre, c.empresa, s.nombre;

-- ============================================
-- COMENTARIOS EN TABLAS
-- ============================================

COMMENT ON TABLE clientes IS 'Clientes de Arena13 con información de contacto y estado';
COMMENT ON TABLE servicios IS 'Catálogo de servicios ofrecidos por Arena13';
COMMENT ON TABLE cliente_servicios IS 'Servicios contratados por cada cliente';
COMMENT ON TABLE proyectos IS 'Proyectos activos y entregados para clientes';
COMMENT ON TABLE tareas IS 'Tareas específicas dentro de cada proyecto';
COMMENT ON TABLE actividad IS 'Registro de actividad del sistema para auditoría';
