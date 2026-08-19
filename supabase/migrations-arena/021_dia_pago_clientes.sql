-- [AUTO] Variante esquema arena_panel (proyecto PabloRecursos)
-- 021: Dia de cobro mensual por cliente para la lista de clientes.
CREATE SCHEMA IF NOT EXISTS arena_panel;
SET search_path TO arena_panel, public, extensions;

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS dia_pago INTEGER NOT NULL DEFAULT 1
  CHECK (dia_pago BETWEEN 1 AND 28);

COMMENT ON COLUMN clientes.dia_pago IS 'Dia del mes en que se cobra el plan (1-28)';

-- [AUTO] Grants para roles API
GRANT USAGE ON SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA arena_panel TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA arena_panel TO anon, authenticated, service_role;
