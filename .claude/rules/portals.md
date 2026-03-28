## Portal Reference

### Client Portal (App.jsx — `/`)
- Supabase email/password auth
- On login: fetches company via `company_users → companies`; reads `company_users.display_name`
- Shows "Loading your account…" during fetch; "No Company Assigned" if no company link
- Dashboard scoped to user's company; company name shown in topbar
- New request fields: Vehicle ID, VIN, Make, Model, Year, Mileage, **Urgency, Description** — service_type field REMOVED
- Duplicate check uses VIN + mileage only (service_type removed from check)
- Cards show: Vehicle ID, year/make/model, VIN, mileage, urgency, status

### Admin Dashboard (AdminDashboard.jsx — `/admin`)
Login verified against `admins` table.

| Tab | Description |
|-----|-------------|
| Service Requests | All SRs; columns: Date, Last Updated, SR#, Company, Vehicle, VIN, Service, Urgency, Status, Invoice badge (per-line), Updated By. Detail modal: update status/notes, view `LineInvoiceBadges` (one badge per line), read-only Parts Summary. Delete Record (two-step) permanently deletes SR + **all** linked invoices. New SR form: no service_type field. |
| Companies | Create companies; add/remove users; Account Managers subsection per company (assign/remove via `account_manager_companies`) |
| Mechanics | Create mechanic accounts; list all mechanics |
| Billing | Full invoice management — see billing.md |
| Vehicle Registry | Full CRUD; filters (status/company/search); detail modal (info + status history + SR history); inline status selector writes to `vehicle_status_logs`; stats-4 row |
| User Management | 4 stacked sections: Account Managers (first), Mechanics, Company Users, Admins; stats-5 row |

Tab navigation is state-based (not sub-routes). Adding sections requires updating `navItems`, `pageTitle`, and the tab render block.
`RequestModal` is module-level — pass `companiesMap` and any other needed state as explicit props (missing props → white-screen crash).

### Mechanic Dashboard (MechanicDashboard.jsx — `/mechanic`)
- Login verified against `mechanics` table
- Table: all SRs; columns include per-line `LineInvoiceBadges`
- Click row → **UpdateModal** (fully rewritten):
  - "Customer Reported Issue" block (read-only, amber border) — shows client's original description
  - Detail grid: no "Service" row; shows per-line `LineInvoiceBadges`
  - `ServiceLinesEditor` component replaces the old status dropdown
  - Mechanic builds Line A, B, C… with: service_name, notes, parts (tag input), is_completed toggle
  - Save = persist dirty lines; Submit = persist lines + set SR status to `in_progress` (pending SRs only)
  - NotesLog kept below service lines; Close button only (Save/Submit inside ServiceLinesEditor)
- "New Request" button: uses `scan-vin-image` + NHTSA VIN decoder; **no service_type field**
- Updates attributed to mechanic's `display_name || name` + email
- SELECT on invoices (RLS) but UI only queries `service_request_id, status, service_line_id, service_lines(line_letter)` — no financial data shown

### Account Manager Portal (AccountManagerDashboard.jsx — `/account-manager`)
- Login verified against `account_managers` table; amber accent; purple role badge
- Four tabs: **Service Requests** (default), **Billing**, **Companies**, **Vehicle Registry** — no User Management

| Tab | Description |
|-----|-------------|
| Service Requests (`AMServiceRequests`) | SRs scoped to assigned companies via RLS (no client-side filter needed). Click → `AMSRModal` to view/update. No "New Request". Modal shows `LineInvoiceBadges` + read-only `PartsSummary`. |
| Billing | Read-only invoice table + SR Status badge; InvoiceModal with linked SR status. No create/edit path. |
| Companies (`AMCompanies`) | RLS auto-scopes. Inline edit (name/email/phone/address); add/remove users via `create-user`; edit display_names inline. No "Create Company". |
| Vehicle Registry | See vehicle-registry.md |

AM portal uses `InvoiceStatusBadge` (not `InvoiceBillingBadge`) and `SRStatusBadge` (not `StatusBadge`) — same visuals, different names defined locally.

## Cross-Status Linking (Billing ↔ Service Requests)

Invoice status shown on SR views (per-line); SR status shown on invoice views. All read-only badges.

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
