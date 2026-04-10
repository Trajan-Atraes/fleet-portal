## Known Gotchas

### Archive System
- `archived_at` column on both `service_requests` and `invoices` — nullable timestamptz; null = active
- **Only admins** can archive/unarchive from the admin dashboard
- SRs: only `completed` or `cancelled` can be archived; archiving an SR also archives its linked `paid` invoices
- Invoices: only `paid` invoices can be archived independently
- **Admin tabs** fetch all rows and filter client-side (`!r.archived_at` for active/completed, `!!r.archived_at` for archived section)
- **All other portals** (Client, AM, Mechanic) add `.is("archived_at", null)` to queries — archived items are hidden
- **Vehicle service history queries** (by `vehicle_registry_id`) do NOT filter by `archived_at` — full history always shown
- Unarchiving an SR also unarchives all its linked invoices
- Partial indexes `idx_sr_active` and `idx_inv_active` optimize active queries (`WHERE archived_at IS NULL`)

### Supabase / Data
- **Supabase credentials** are in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) — never hardcode in source files. Also set as Vercel env vars for production.
- **Supabase client is centralized** in `src/lib/supabase.js` — all files import from there. Do NOT create new `createClient()` instances.
- Always use `@supabase/supabase-js` SDK — never raw fetch for Supabase calls
- `useEffect` in Dashboard **MUST** depend on `company?.id` — `[]` causes infinite loading
- RLS silent failures → missing policy (check Supabase policies dashboard first)
- Service role key: server-side only; never in browser
- Always enable RLS + add policies when creating new tables
- `supabase.exe` is in project root (not in PATH) — call as `supabase.exe` (or `.\supabase.exe` in PowerShell)
- `updated_at` on `service_requests` and `invoices` is trigger-managed — do NOT set manually in frontend
- `invoices.labor_total`, `invoices.subtotal`, `invoices.total` are GENERATED ALWAYS — never in INSERT/UPDATE payloads

### Invoices & Billing
- `invoices.is_incognito` — admin-only invoices; ALL non-admin invoice queries MUST include `.eq("is_incognito", false)`
- `invoices.line_items` JSONB has 4 formats (v1–v4) — current is `{ lineItems: [...], settings }`. `servicestolineItems()` in `LineItemsEditor.jsx` converts all legacy formats on load. Do not drop backward compat without migrating.
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
- `parts_ordered` lives on `service_lines` (per-line), NOT on `service_requests` — SR table derives tri-state from lines
- `updated_by_id` is nullable — admins write null (not in mechanics table)
- `request_number` starts at 1000 — always ≥4 digits, displayed as `{request_number}`
- `updated_by_name` is denormalized at save time — later display_name changes don't retroactively update old records

### Vehicle Registry
- `vehicles` unique constraint `(company_id, vehicle_id)` — duplicate inserts error with code `23505`; UI shows user-friendly message
- Company locked on vehicle edit — changing company_id would break uniqueness; deactivate + recreate to move
- `vehicle_registry_id` ON DELETE SET NULL — deleting a vehicle nulls the reference on SRs without breaking them
- Registry lookup no longer uses `.eq("active", true)` — queries all statuses and branches on result
- **Mechanic portal**: vehicle selection is dropdown-only (no manual entry); mechanics cannot create vehicles; blocked from creating duplicate active SRs for same vehicle

### UI / Components
- `RequestModal` is module-level — cannot access `AdminApp` state directly; pass `companiesMap` + any needed state as explicit props (missing props → white-screen crash on modal open)
- `InvoiceBillingBadge` and `SRStatusBadge` are defined locally per portal file — not shared across files
- AM portal: `InvoiceStatusBadge` (not `InvoiceBillingBadge`) and `SRStatusBadge` (not `StatusBadge`) — same visuals, different local names
- Sidebar is collapsible on all portals; `sidebarOpen` defaults to `true`
- SR tables have `overflow-x:auto` for horizontal scroll on mobile

### Auth / Users
- **Never manually INSERT into `auth.users`** — GoTrue requires users be created via the admin API (`supabaseAdmin.auth.admin.createUser()`). Manual SQL inserts cause "Database error querying schema" on login. Use edge functions (`create-user`, `create-mechanic`, `create-account-manager-user`, `create-admin-user`) instead.
- `company_users` stores `user_id` UUID + optional `display_name`; `auth.users` not client-accessible
- `adminDisplayName` fetched at login only — changes take effect on next login
- `account_manager_companies` composite PK `(account_manager_id, company_id)` — UI filters already-assigned AMs from dropdown to prevent duplicate insert errors
- AM portal RLS enforced server-side — `AMCompanies` queries with no client-side filter; Supabase returns only assigned companies

### Inventory / Barcode Scanning
- `inventory_items.sku` is auto-generated (`SKU-XXXXXXXX`) on insert — never include in form state; read-only on edit
- `inventory_items.barcode` is NOT unique — multiple SKUs (different vendors) can share the same barcode value
- `inventory_items.part_number` groups SKUs for billing — multiple items can share the same part_number
- `inventory_items.supplier_id` is a direct FK to suppliers — each item row is one vendor's version of a part
- `supplier_pricing` still exists alongside `supplier_id` — used for alternative vendor pricing and PO cost pre-fill
- Barcode scan queries join `suppliers(name)` — if the join breaks, check that `supplier_id` FK is correct
- `BarcodeScanner.jsx` uses `@ericblade/quagga2` — fullscreen layout; Quagga.stop() on scan/unmount; CSS overrides force video/canvas to fill container
- Mechanic barcode scan is read-only (SELECT on inventory_items via RLS) — no write actions allowed
- `ScanResultModal.showNewItem` can be `true` (no part number link) or a string (part number to pre-fill) — check `typeof` before using
- Barcode match with no `name` = incomplete item — admin sees amber prompt + "Complete Item Details" (opens ItemModal in edit mode via `showEditIncomplete`); mechanic sees "Contact an admin to finish adding this item"

### Edge Function Validation
- All user creation edge functions (`create-user`, `create-mechanic`, `create-account-manager-user`, `create-admin-user`) validate: email format (regex), password ≥ 7 chars, required fields (company_id for users, name for mechanics)
- Email is trimmed and lowercased before creating the auth user
- Validation only applies to **new user creation** — existing accounts with shorter passwords (e.g. "test") still log in normally via Supabase Auth

### Square Payment Edge Functions
- **CORS**: All 4 payment functions (`save-card`, `remove-card`, `process-square-payment`, `reverse-payment`) use `corsHeaders(req)` restricted to `fleet-portal.vercel.app` + `localhost:5173` — NOT wildcard `*`
- **Idempotency keys**: Must be ≤ 45 chars (Square limit). Use `crypto.randomUUID()` (36 chars). Do NOT concatenate UUIDs.
- **App ID / Location ID**: `src/lib/square.js` applies `.trim()` — Vercel env vars can have trailing newlines
- **SDK CDN**: Hardcoded to `https://web.squarecdn.com/v1/square.js` (production only, no sandbox toggle)
- **generate-invoice-pdf**: Clients can download PDFs for `approved`, `client_billed`, and `paid` invoices; paid/billed skip line_items and completion checks
