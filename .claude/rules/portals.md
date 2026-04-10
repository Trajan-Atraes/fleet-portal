## Portal Reference

### Client Portal (App.jsx — `/`)
- Supabase email/password auth
- On login: fetches company via `company_users → companies`; reads `company_users.display_name` + `is_billing_user`
- Shows "Loading your account…" during fetch; "No Company Assigned" if no company link
- Dashboard scoped to user's company; company name shown in topbar
- **Payments tab** only visible to users with `is_billing_user = true` (set by admin/AM in Companies tab)
- Payments tab shows: outstanding invoices (`client_billed`), saved cards (Square), **Payment History** section (paid invoices with PDF download button)
- Stats rows on My Requests and My Vehicles tabs are compact (`stats-4`, max-width 480px)
- New request form includes photo/video upload section below description (uploads to `note-attachments` bucket, creates client-visible sr_note)
- New request fields: Vehicle ID, VIN, Make, Model, Year, Mileage, **Urgency, Description** — service_type field REMOVED
- **My Vehicles** tab shows vehicles grouped by `vehicle_groups`; collapsible sections; "Unassigned" section for ungrouped; click row to open detail modal with service history
- **Est. Completion** column in SR table and detail modal (set by admins/AMs)
- **Vehicle Status** column in SR table + detail modal (joined from `vehicles!vehicle_registry_id`); shows Road Worthy / Not Road Worthy / Retired badge
- Duplicate check uses VIN + mileage only (service_type removed from check)
- Cards show: Vehicle ID, year/make/model, VIN, mileage, urgency, status

### Admin Dashboard (AdminDashboard.jsx — `/admin`)
Login verified against `admins` table.

| Tab | Description |
|-----|-------------|
| Service Requests | **Two sections**: Active (top: pending/in_progress/cancelled) + Completed (bottom: completed). Each section: 25-per-page pagination, independent sort. Active has status filter buttons (All/Pending/In Progress/Cancelled) + company dropdown + search. Completed has own company dropdown + search. Shared `SRTable` component. Columns: Date, Last Updated, SR# (**blue dot = unread notes**), Company, Vehicle, Service, **Parts Ordered** (tri-state), **Service Status**, **Billing Status** (per-line), Updated By. Detail modal: update status/notes + **estimated completion date** + **mileage** (editable), view `LineInvoiceBadges`, read-only Parts Summary, **Vehicle Status toggle**. Opening modal marks notes as seen (localStorage). Service lines auto-save; deletable (except Line A). Delete Record (two-step). New SR form: no service_type field. Filters persist via sessionStorage (`ssGet`/`ssSet`). |
| Companies | Create companies; add/remove users; toggle `is_billing_user` per user; edit DSP contact info inline; Account Managers subsection per company (assign/remove via `account_manager_companies`) |
| Billing | **Two sections**: Active (top: draft/submitted/approved/rejected) + Completed (bottom: paid/client_billed). Each section: 25-per-page pagination, independent sort. Active has status filter buttons + company dropdown + search + service/bill-to filter chips + **checkbox column for merge selection**. Completed has own company dropdown + search. Shared `InvoiceTable` component. Invoice editor uses `LineItemsEditor` with flat line items, service presets autocomplete, drag-reorder. **Merge Invoices**: select 2+ same-company invoices → Merge button; MergeModal picks primary, concatenates lineItems, deletes secondaries; supports cross-SR merge. See billing.md for full spec. Filters persist via sessionStorage. |
| Vehicle Registry | Full CRUD; filters (status/company/search); detail modal (info + status history + enriched SR history with service lines, mechanic, est. completion); inline status selector writes to `vehicle_status_logs`; "Manage Groups" button for vehicle_groups CRUD per DSP; group dropdown on add/edit form; stats-4 row |
| Inventory | Items (CRUD, stock tracking, barcode scanning, part detail modal); Purchase Orders (create/advance status); Suppliers (CRUD + per-item pricing); 3 sub-tabs. Barcode scanner (@ericblade/quagga2, fullscreen) with manual entry fallback. SKU auto-generated on new items (`SKU-XXXXXXXX`), read-only on edit. Items have: barcode, sku, part_number (billing), supplier_id. Click row → ItemDetailModal (info + supplier pricing + recent activity + Edit button). "Scan Barcode" button opens camera scanner; scan result modal handles no-match/single/multi/fuzzy/incomplete (no name) with add-stock (+qty), "Save & Scan New", and "Complete Item Details" flows. Mechanic "Scan Part" button is read-only lookup. |
| User Management | 4 stacked sections: Account Managers (first), Mechanics, Company Users, Admins; stats-5 row |
| Audit Log | **Super admin only** (`isSuper` gate). AlertsPanel (unacknowledged alerts with Ack/Ack All). Filters: category, action, table, email search, date range. Expandable rows with DiffView (Before/After JSONB). CSV export + compliance report (JSON download via `generate_compliance_report` RPC). 25-per-page pagination. 30-day retention (pg_cron cleanup daily 3am UTC). |

**Hidden tabs** (code retained, commented out in AdminDashboard.jsx):
- **Mechanics** — removed from nav; mechanic CRUD still available in User Management
- **Receivables** — hidden; marked `// hidden — restore when ready`

Tab navigation is state-based (not sub-routes) with URL `?tab=` persistence. Adding sections requires updating `navItems`, `pageTitle`, and the tab render block.
Realtime subscriptions show "New updates — click to refresh" banner in header; user-triggered refresh bumps `refreshKey` which re-mounts the active tab.
`RequestModal` is module-level — pass `companiesMap` and any other needed state as explicit props (missing props → white-screen crash).

**Notifications bell** in main-header (left of page title). Per-user unread tracking via `notification_reads` table. Red badge with count. Dropdown panel shows recent notifications; clicking marks read for that user only. "Mark all read" button. Realtime subscription on `notifications` table. Notifications with `link_tab` navigate to that admin tab on click. Super admins can create/delete notifications.

### Mechanic Dashboard (MechanicDashboard.jsx — `/mechanic`)
- Login verified against `mechanics` table
- Table: all SRs; columns: **Date, SR #, Company, Vehicle, Service, Service Status** + Update button (VIN, Last Updated, Billing Status, Updated By hidden)
- Click row → **UpdateModal** (fully rewritten):
  - "Customer Reported Issue" block (read-only, amber border) — shows client's original description
  - Detail grid: no "Service" row; shows per-line `LineInvoiceBadges`
  - **Vehicle Status toggle** (below service lines, above notes): "Road Worthy" / "Not Road Worthy" buttons; required step; writes to `vehicles` + `vehicle_status_logs`
  - `ServiceLinesEditor` component replaces the old status dropdown
  - Mechanic builds Line A, B, C… with: service_name, notes, parts (tag input), is_completed toggle
  - Save = persist dirty lines; Submit = persist lines + set SR status to `in_progress` (pending SRs only)
  - NotesLog kept below service lines; Close button only (Save/Submit inside ServiceLinesEditor)
- "New Request" button: vehicle dropdown (populated from registry by selected DSP); **no manual vehicle entry, no VIN scan, no save-to-registry** — mechanics must select an existing registered vehicle
- Mechanic new SR blocked if vehicle already has an active (pending/in_progress) SR — error shows existing SR number(s)
- Vehicle fields (VIN, Year, Make, Model, License Plate) are read-only, auto-populated from registry selection
- Updates attributed to mechanic's `display_name || name` + email
- SELECT on invoices (RLS) but UI only queries `service_request_id, status, service_line_id, service_lines(line_letter)` — no financial data shown
- "Scan Part" button in header — opens `BarcodeScanner`, results shown in `MechanicScanResult` (read-only lookup: item name, SKU, part number, supplier, qty on hand). No write actions — "Contact an admin" shown on no-match or incomplete item (no name)

### Account Manager Portal (AccountManagerDashboard.jsx — `/account-manager`)
- Login verified against `account_managers` table; amber accent; purple role badge
- Four tabs: **Service Requests** (default), **Billing**, **Companies**, **Vehicle Registry** — no User Management

| Tab | Description |
|-----|-------------|
| Service Requests (`AMServiceRequests`) | SRs scoped to assigned companies via RLS (no client-side filter needed). Click → `AMSRModal` to view/update. No "New Request". Modal shows `LineInvoiceBadges` + read-only `PartsSummary` + **Vehicle Status toggle** (Road Worthy / Not Road Worthy). |
| Billing | Read-only invoice table + per-line completion badge (Complete/In Progress); InvoiceModal with linked line status. No create/edit path. |
| Companies (`AMCompanies`) | RLS auto-scopes. Inline edit (name/email/phone/address); add/remove users via `create-user`; edit display_names inline. No "Create Company". |
| Vehicle Registry | See vehicle-registry.md |

AM portal uses `InvoiceStatusBadge` (not `InvoiceBillingBadge`) and `SRStatusBadge` (not `StatusBadge`) — same visuals, different names defined locally.

## Cross-Status Linking (Billing ↔ Service Requests)

Invoice status shown on SR views (per-line); per-line completion status shown on invoice views. All read-only badges.

### Badge locations
| Badge | Where |
|-------|-------|
| `LineInvoiceBadges` | Admin SR table + RequestModal; Mechanic SR table + UpdateModal; AM SR table + AMSRModal |
| `SRStatusBadge` | Admin Billing table + InvoiceModal; AM Billing table + InvoiceModal |

`InvoiceBillingBadge` (with optional `label` prop) and `LineInvoiceBadges` are exported from `src/components/StatusBadge.jsx` for admin tabs.
AM portal defines both locally under the same interface.

### Data fetching
- SR tabs: fetch `invoices(service_request_id, status, service_line_id, service_lines(line_letter))` → `linesInvoiceMap[sr_id]` = `[{line_letter, status}]`
- Billing tabs: fetch `invoices(*, service_lines(line_letter))` → use `inv.service_lines?.line_letter` for reference display
- `LineInvoiceBadges` with empty/null array → "Not Invoiced" (muted)
- `SRStatusBadge` with no linked SR → "—"
