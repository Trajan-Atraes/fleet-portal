## Known Gotchas

### Supabase / Data
- Always use `@supabase/supabase-js` SDK — never raw fetch for Supabase calls
- `useEffect` in Dashboard **MUST** depend on `company?.id` — `[]` causes infinite loading
- RLS silent failures → missing policy (check Supabase policies dashboard first)
- Service role key: server-side only; never in browser
- Always enable RLS + add policies when creating new tables
- `supabase.exe` is in project root (not in PATH) — call as `supabase.exe` (or `.\supabase.exe` in PowerShell)
- `updated_at` on `service_requests` and `invoices` is trigger-managed — do NOT set manually in frontend
- `invoices.labor_total`, `invoices.subtotal`, `invoices.total` are GENERATED ALWAYS — never in INSERT/UPDATE payloads

### Invoices & Billing
- `invoices.line_items` JSONB has 3 historical formats — handle all three; do not simplify without migrating data
- `invoices` has no `invoice_number` or `due_date` columns — add via migration if needed
- Pricing history written once per invoice (first approval/rejection); re-saves don't add duplicates
- `pricing_intelligence` view has no RLS — access controlled by underlying `pricing_history` RLS
- `vehicleType` in pricing_history = `vehicle_make + " " + vehicle_model` — must be consistent between writes and reads; falls back to `vehicle_id`
- `generate-invoice-pdf` verifies admin via JWT — do not remove the auth check
- `BUSINESS` constant in `generate-invoice-pdf/index.ts` has placeholder info — update before sending PDFs to clients
- **Bill To**: `invoices.bill_to_id` is the FK to `bill_to_contacts`; `submission_target` is kept as the contact's name for pricing intel. Never drop `submission_target` — legacy invoices still use it.
- `bill_to_contacts` RLS: admins full, AMs SELECT only — AMs can select but not create/delete
- `submission_target` column is now nullable — old NOT NULL constraint was removed (was blocking SR inserts via trigger)

### Service Requests
- `updated_by_id` is nullable — admins write null (not in mechanics table)
- `request_number` starts at 1000 — always ≥4 digits, displayed as `SR-{request_number}`
- `updated_by_name` is denormalized at save time — later display_name changes don't retroactively update old records

### Vehicle Registry
- `vehicles` unique constraint `(company_id, vehicle_id)` — duplicate inserts error with code `23505`; UI shows user-friendly message
- Company locked on vehicle edit — changing company_id would break uniqueness; deactivate + recreate to move
- `vehicle_registry_id` ON DELETE SET NULL — deleting a vehicle nulls the reference on SRs without breaking them
- Registry lookup no longer uses `.eq("active", true)` — queries all statuses and branches on result

### UI / Components
- `RequestModal` is module-level — cannot access `AdminApp` state directly; pass `companiesMap` + any needed state as explicit props (missing props → white-screen crash on modal open)
- `InvoiceBillingBadge` and `SRStatusBadge` are defined locally per portal file — not shared across files
- AM portal: `InvoiceStatusBadge` (not `InvoiceBillingBadge`) and `SRStatusBadge` (not `StatusBadge`) — same visuals, different local names
- Sidebar is collapsible on all portals; `sidebarOpen` defaults to `true`
- SR tables have `overflow-x:auto` for horizontal scroll on mobile

### Auth / Users
- `company_users` stores `user_id` UUID + optional `display_name`; `auth.users` not client-accessible
- `adminDisplayName` fetched at login only — changes take effect on next login
- `account_manager_companies` composite PK `(account_manager_id, company_id)` — UI filters already-assigned AMs from dropdown to prevent duplicate insert errors
- AM portal RLS enforced server-side — `AMCompanies` queries with no client-side filter; Supabase returns only assigned companies
