-- ============================================
-- Arena13 Panel - Pipeline Kanban
-- Migración: 009
-- ============================================

-- 1. Añadir estado 'bloqueado' a proyectos
DO $$
BEGIN
  -- Buscar y eliminar el constraint existente en estado
  ALTER TABLE proyectos DROP CONSTRAINT IF EXISTS proyectos_estado_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE proyectos ADD CONSTRAINT proyectos_estado_check
  CHECK (estado IN ('planeacion', 'en_progreso', 'bloqueado', 'revision', 'completado'));

-- 2. Línea de negocio (IA = cian, Diseño = púrpura)
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS linea_negocio VARCHAR(10) DEFAULT 'mixto'
  CHECK (linea_negocio IN ('ia', 'diseno', 'mixto'));

-- 3. Checklist atómico (JSONB array de {text, done})
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;

-- 4. Enlaces externos (Figma, GitHub, Webflow, Drive)
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS figma_url TEXT;
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS webflow_url TEXT;
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS drive_url TEXT;

-- 5. Notas internas del equipo
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS notas_internas TEXT;

COMMENT ON COLUMN proyectos.linea_negocio IS 'IA (cian), Diseno (púrpura), o mixto';
COMMENT ON COLUMN proyectos.checklist IS 'Lista de subtareas atómicas [{text, done}]';
