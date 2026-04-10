-- Sequential invoice number for standalone invoices
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number bigint;

-- Auto-populate on insert for standalone invoices (no linked SR)
CREATE OR REPLACE FUNCTION fn_set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.service_request_id IS NULL AND NEW.invoice_number IS NULL THEN
    NEW.invoice_number := nextval('invoice_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_set_invoice_number ON invoices;
CREATE TRIGGER tr_set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_invoice_number();
