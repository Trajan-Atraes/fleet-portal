## Key Design Decisions

### Styling
- **Shared CSS** in `src/styles/shared.css` — imported once in `main.jsx`; all portals inherit design tokens, layout, forms, buttons, tables, badges, modals, responsive breakpoints
- Portal-specific overrides live in each file's `const css` (role badge colors, unique layouts only)
- CSS variables in `:root` (defined in shared.css); max content width 1400px with 32px padding
- **All portals share amber accent** (`--accent: #f59e0b`)
- Role badge colors are hardcoded in each portal's `const css` (not `var(--accent)`):
  - Client: amber | Admin: dark maroon (`rgba(127,29,29)` / `#fca5a5`)
  - Mechanic: teal (`rgba(13,148,136)` / `#2dd4bf`) | Account Manager: purple (`rgba(139,92,246)` / `#a78bfa`)
  - Billing: blue (`rgba(59,130,246)` / `#60a5fa`)
- When adding portals: keep `--accent` amber, add `.portal-tag` + `.sidebar-portal-tag` color overrides in local `const css`
- **Contrast-boosted color scale** (applied to all portals as of 2026-04-02): `--dim:#5f7a94`, `--muted:#819cb3`, `--soft:#a8bdd1`, `--body:#cad8e8`, `--text:#e3ecf5` — two notches brighter than original
- **Text truncation**: `.truncate` utility class; `td`, `.company-name`, `.nav-item`, `.detail-value` all have overflow:ellipsis

### Architecture
- Each portal is a separate file at a separate route
- `useEffect` in Dashboard **MUST** depend on `company?.id` — changing to `[]` causes infinite loading
- Admin tab navigation is state-based (not React Router sub-routes); tab persisted via URL `?tab=` param
- **Realtime subscriptions**: Admin/AM/Mechanic dashboards subscribe to postgres_changes on key tables; show "New updates" banner; user clicks to refresh (bumps `refreshKey` which re-mounts tab components)
- **Offline indicator**: `OfflineBanner` in main.jsx listens to `online`/`offline` events; shows global red banner
- **Sidebar init**: `sidebarOpen` initialized based on viewport width (`window.innerWidth > 768`) — closed on mobile by default
- **Filter persistence**: `ssGet`/`ssSet` helpers in constants.js use sessionStorage to persist company/status/search filters across tab switches
- Attribution columns on `service_requests` are denormalized (name+email stored directly) — no join needed
- `InvoiceBillingBadge` and `LineInvoiceBadges` are exported from `src/components/StatusBadge.jsx` and used by admin tabs
- AM portal defines `InvoiceStatusBadge` and `LineInvoiceBadges` locally — same visuals, local names
- `SRStatusBadge` defined locally in each portal file — not shared

### DB Triggers (Supabase/Postgres)
- **SR insert** → `fn_create_line_a_on_sr_insert()`: auto-creates **Line A** service_line record (not an invoice directly — the service_lines trigger handles that)
- **service_lines insert** → `tr_create_invoice_on_service_line_insert`: auto-creates a draft invoice for every new service_line; invoice gets `service_line_id` set; company/vehicle pre-filled from SR
- **SR delete** → `fn_delete_invoices_on_sr_delete()`: deletes ALL line invoices + any orphaned invoices before SR delete (permanent, no soft-delete)
- **SR update** → `fn_sync_invoices_on_sr_update()`: syncs company/vehicle fields to **all** linked line invoices when those fields change on the SR; does NOT sync service_type
- **service_lines update** → `tr_auto_complete_sr_on_lines_done`: when `is_completed` flips true and all lines for that SR are now complete, sets SR `status = 'completed'` (only if currently `pending` or `in_progress`); does NOT revert if a line is later unchecked
- **Duplicate guard**: `WHERE NOT EXISTS` in service_lines insert trigger — prevents duplicate invoice per line
- **`updated_at`**: managed by `tr_service_requests_updated_at` and `trg_invoices_updated_at` via shared `set_updated_at()` — **do NOT set `updated_at` in frontend code**
- **sr_notes insert** → `fn_update_sr_last_note_at()`: updates `service_requests.last_note_at` with the new note's timestamp
- **Audit logging** → `fn_audit_log()`: trigger on service_requests, invoices, service_lines, vehicles — logs INSERT/UPDATE/DELETE to `audit_logs` table with old/new data + `auth.uid()`

### ServiceLinesEditor — Auto-Save & Status Transitions
- **Auto-save**: All line edits (mechanic + admin) are debounced (1.5s) and persisted automatically — no manual Save button. Auto-save MUST NOT close the modal — `onSaved` callback should be a no-op or silent refresh, never `setSelected(null)`
- **Mechanic pending → in_progress**: When a mechanic edits any line on a `pending` SR, auto-save transitions it to `in_progress`
- **Admin line edits auto-transition pending → in_progress** (same as mechanic); admins can also control status via the dropdown in RequestModal
- **`updated_by_name`**: Stamped on each line save via `editorName` prop (admin display name or mechanic name)
- **NotesLog "Send" button**: Notes use "Send" (not "Add Note"). Note text inserts immediately; photos upload in background (survives modal close). `NotesLog` is a `forwardRef` component exposing `{ submit }` via ref for parent "Send and Close" guard.
- **Unsent files guard**: All SR/invoice modals (admin, mechanic, AM) check for pending NotesLog files before closing. If files exist, shows inline amber warning with "Go Back" and "Send and Close" buttons — no option to discard.

### Modal Overlays
- All modal overlays use `onMouseDown` (not `onClick`) to close — prevents accidental close when dragging to select text inside the modal

### Invoice Line Items Editor (`LineItemsEditor` component)
- Shared component (`src/components/LineItemsEditor.jsx`) used by InvoiceBuilder and InvoiceModal
- Flat table layout with drag-to-reorder (HTML5 native), fr-based column widths (no resizable dividers), service presets autocomplete
- `line_items` JSONB now uses `{ lineItems: [...], settings: {...} }` format — see billing.md for full spec
- `servicestolineItems()` and `computeLineItemTotals()` exported from `LineItemsEditor.jsx` for use in AdminBilling.jsx
- `service_type` on invoices is auto-derived from `lineItems[0].service` — **no dropdown** in InvoiceBuilder or InvoiceModal
- AI Estimate button **hidden** from UI until adapted to new lineItems format

### Edge Functions
- Service role key is server-side only — never in browser; use edge functions for privileged ops
- Always wrap edge function fetch calls in try/catch — uncaught throws leave `setSaving(false)` unreached (infinite spinner)
- All edge functions must be explicitly deployed before use; use `.\` prefix in PowerShell: `.\supabase.exe functions deploy <name> ...`
- `scan-vin-image` has `verify_jwt: false` — no Authorization header needed from MechanicDashboard
