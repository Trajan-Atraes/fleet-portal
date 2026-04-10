-- Add optional labor line fields to service_presets
ALTER TABLE service_presets
  ADD COLUMN IF NOT EXISTS labor_rate  numeric,
  ADD COLUMN IF NOT EXISTS labor_hours numeric;
