-- Add 'revise' to allowed invoice statuses
-- Drop any existing check constraint on invoices.status and re-create with revise included
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'revise', 'client_billed', 'paid'));
