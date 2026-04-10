-- Rename vehicle status "Active" → "Road Worthy"
UPDATE vehicles SET status = 'Road Worthy' WHERE status = 'Active';
UPDATE vehicle_status_logs SET old_status = 'Road Worthy' WHERE old_status = 'Active';
UPDATE vehicle_status_logs SET new_status = 'Road Worthy' WHERE new_status = 'Active';

-- Update check constraint
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_status_check;
ALTER TABLE vehicles ADD CONSTRAINT vehicles_status_check CHECK (status IN ('Road Worthy', 'Retired', 'Not Road Worthy'));
