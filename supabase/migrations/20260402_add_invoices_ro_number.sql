-- Add RO# (Repair Order number) to invoices — manual entry field
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ro_number text;
