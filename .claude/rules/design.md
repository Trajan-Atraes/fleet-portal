## Key Design Decisions

### Styling
- No external UI library — all styles in a `const css` string injected via `<style>`
- CSS variables in `:root`; max content width 1400px with 32px padding
- **All portals share amber accent** (`--accent: #f59e0b`)
- Role badge colors are hardcoded (not `var(--accent)`):
  - Client: amber | Admin: dark maroon (`rgba(127,29,29)` / `#fca5a5`)
  - Mechanic: teal (`rgba(13,148,136)` / `#2dd4bf`) | Account Manager: purple (`rgba(139,92,246)` / `#a78bfa`)
  - Billing: blue (`rgba(59,130,246)` / `#60a5fa`)
- When adding portals: keep `--accent` amber, give `.portal-tag` its own hardcoded color

### Architecture
- Each portal is a separate file at a separate route
- `useEffect` in Dashboard **MUST** depend on `company?.id` — changing to `[]` causes infinite loading
- Admin tab navigation is state-based (not React Router sub-routes)
- Attribution columns on `service_requests` are denormalized (name+email stored directly) — no join needed
- `InvoiceBillingBadge` and `LineInvoiceBadges` are exported from `src/components/StatusBadge.jsx` and used by admin tabs
- AM portal defines `InvoiceStatusBadge` and `LineInvoiceBadges` locally — same visuals, local names
- `SRStatusBadge` defined locally in each portal file — not shared

### DB Triggers (Supabase/Postgres)
- **SR insert** → `fn_create_line_a_on_sr_insert()`: auto-creates **Line A** service_line record (not an invoice directly — the service_lines trigger handles that)
- **service_lines insert** → `tr_create_invoice_on_service_line_insert`: auto-creates a draft invoice for every new service_line; invoice gets `service_line_id` set; company/vehicle pre-filled from SR
- **SR delete** → `fn_delete_invoices_on_sr_delete()`: deletes ALL line invoices + any orphaned invoices before SR delete (permanent, no soft-delete)
- **SR update** → `fn_sync_invoices_on_sr_update()`: syncs company/vehicle fields to **all** linked line invoices when those fields change on the SR; does NOT sync service_type
- **Duplicate guard**: `WHERE NOT EXISTS` in service_lines insert trigger — prevents duplicate invoice per line
- **`updated_at`**: managed by `tr_service_requests_updated_at` and `trg_invoices_updated_at` via shared `set_updated_at()` — **do NOT set `updated_at` in frontend code**

### Edge Functions
- Service role key is server-side only — never in browser; use edge functions for privileged ops
- Always wrap edge function fetch calls in try/catch — uncaught throws leave `setSaving(false)` unreached (infinite spinner)
- All edge functions must be explicitly deployed before use; use `.\` prefix in PowerShell: `.\supabase.exe functions deploy <name> ...`
- `scan-vin-image` has `verify_jwt: false` — no Authorization header needed from MechanicDashboard
