-- Moved parts_ordered from service_requests to service_lines (per-line tracking)
ALTER TABLE service_lines ADD COLUMN IF NOT EXISTS parts_ordered boolean NOT NULL DEFAULT false;
ALTER TABLE service_requests DROP COLUMN IF EXISTS parts_ordered;
