ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_incognito boolean NOT NULL DEFAULT false;
