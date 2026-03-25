# FleetDesk — Client, Admin & Mechanic Portal

## Project Overview
Fleet maintenance portal built with React + Vite + Supabase. Clients submit service requests and track their status. Admins view all requests, update statuses, manage companies, create users, and manage mechanics. Mechanics log in to view and update service requests under their own name.

## Tech Stack
- **Frontend:** React 18, Vite
- **Routing:** react-router-dom
- **Backend/Auth/DB:** Supabase (PostgreSQL + RLS + Auth + Edge Functions)
- **Styling:** Plain CSS-in-JS (no Tailwind, no CSS modules)
- **Fonts:** Barlow + Barlow Condensed (Google Fonts)

## Project Structure
```
fleet-portal/
├── src/
│   ├── App.jsx                        # Client portal
│   ├── AdminDashboard.jsx             # Admin portal (incl. Billing tab)
│   ├── MechanicDashboard.jsx          # Mechanic portal
│   ├── BillingPortal.jsx              # Standalone billing portal (purple accent)
│   ├── AccountManagerDashboard.jsx    # Account Manager portal (purple accent, Billing + Companies + Vehicle Registry)
│   └── main.jsx                       # React Router setup
├── supabase/
│   └── functions/
│       ├── create-user/
│       │   └── index.ts               # Edge Function: create client user + link to company
│       ├── create-mechanic/
│       │   └── index.ts               # Edge Function: create mechanic user + link to mechanics table
│       ├── create-account-manager-user/
│       │   └── index.ts               # Edge Function: create account manager user + link to account_managers table
│       ├── get-ai-estimate/
│       │   └── index.ts               # Edge Function: AI-powered labor/parts estimate via Claude
│       └── scan-vin-image/
│           └── index.ts               # Edge Function: Claude Haiku vision → extract VIN from photo
├── supabase.exe                       # Supabase CLI (Windows)
├── CLAUDE.md
├── package.json
└── vite.config.js
```

## Routes
| Path               | Component                    | Description              |
|--------------------|------------------------------|--------------------------|
| /                  | App.jsx                      | Client portal            |
| /admin             | AdminDashboard.jsx           | Admin portal             |
| /mechanic          | MechanicDashboard.jsx        | Mechanic portal          |
| /account-manager   | AccountManagerDashboard.jsx  | Account Manager portal   |

## Commands
```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build

# Deploy edge functions (run from project root)
supabase.exe functions deploy create-user                 --project-ref kiayjlepwmdacojhpisq --no-verify-jwt
supabase.exe functions deploy create-mechanic             --project-ref kiayjlepwmdacojhpisq --no-verify-jwt
supabase.exe functions deploy create-account-manager-user --project-ref kiayjlepwmdacojhpisq --no-verify-jwt
supabase.exe functions deploy get-ai-estimate             --project-ref kiayjlepwmdacojhpisq --no-verify-jwt
supabase.exe functions deploy scan-vin-image              --project-ref kiayjlepwmdacojhpisq --no-verify-jwt

# Set the Anthropic API key secret (required for AI estimate + VIN scan features)
supabase.exe secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref kiayjlepwmdacojhpisq
```

## Supabase Config
- **Project URL:** https://kiayjlepwmdacojhpisq.supabase.co
- Credentials are at the top of `App.jsx`, `AdminDashboard.jsx`, and `MechanicDashboard.jsx`

## Database Schema

### service_requests
| Column              | Type        | Notes                                         |
|---------------------|-------------|-----------------------------------------------|
| id                  | uuid        | Primary key, auto-generated                   |
| client_id           | uuid        | References auth.users(id)                     |
| company_id          | uuid        | References companies(id)                      |
| vehicle_id          | text        | Unit number / vehicle identifier              |
| vin                 | text        | Vehicle Identification Number                 |
| vehicle_make        | text        |                                               |
| vehicle_model       | text        |                                               |
| vehicle_year        | text        |                                               |
| mileage             | int         | Optional                                      |
| service_type        | text        | Selected from predefined list                 |
| urgency             | text        | low / medium / high                           |
| description         | text        | Client-written issue description              |
| status              | text        | pending / in_progress / completed / cancelled |
| notes               | text        | Shared notes (mechanic + admin)               |
| updated_by_id       | uuid        | References mechanics(id), nullable            |
| updated_by_name     | text        | Denormalized name of last updater             |
| updated_by_email    | text        | Denormalized email of last updater            |
| request_number      | bigint      | Auto-incrementing from seq starting at 1000; shown as SR-XXXX |
| vehicle_registry_id | uuid        | Nullable FK → vehicles(id) ON DELETE SET NULL; set when SR was created from a registry match |
| created_at          | timestamptz | Auto-set                                      |
| updated_at          | timestamptz | Updated on any save                           |

### companies
| Column     | Type        | Notes         |
|------------|-------------|---------------|
| id         | uuid        | Primary key   |
| name       | text        | Required      |
| email      | text        |               |
| phone      | text        |               |
| address    | text        |               |
| created_at | timestamptz | Auto-set      |

### company_users
| Column       | Type        | Notes                                                        |
|--------------|-------------|--------------------------------------------------------------|
| id           | uuid        | Primary key                                                  |
| company_id   | uuid        | References companies(id)                                     |
| user_id      | uuid        | References auth.users(id)                                    |
| display_name | text        | Optional human-readable label; shown in UI in place of UUID  |
| created_at   | timestamptz | Auto-set                                                     |

### admins
| Column       | Type        | Notes                                                        |
|--------------|-------------|--------------------------------------------------------------|
| id           | uuid        | References auth.users(id)                                    |
| email        | text        |                                                              |
| display_name | text        | Optional; shown in sidebar and Updated By in place of email  |
| created_at   | timestamptz | Auto-set                                                     |

### mechanics
| Column       | Type        | Notes                                                                  |
|--------------|-------------|------------------------------------------------------------------------|
| id           | uuid        | References auth.users(id)                                              |
| email        | text        |                                                                        |
| name         | text        | Full name, required at account creation                                |
| display_name | text        | Optional; shown in UI and written to updated_by_name in place of name |
| created_at   | timestamptz | Auto-set                                                               |

### invoices
| Column             | Type        | Notes                                                              |
|--------------------|-------------|--------------------------------------------------------------------|
| id                 | uuid        | Primary key, auto-generated                                        |
| service_request_id | uuid        | Optional link to service_requests(id)                             |
| company_id         | uuid        | References companies(id)                                          |
| vehicle_id         | text        | Unit number / vehicle identifier                                   |
| vehicle_make       | text        |                                                                    |
| vehicle_model      | text        |                                                                    |
| vehicle_year       | text        |                                                                    |
| service_type       | text        | Selected from predefined list                                      |
| submission_target  | text        | auto_integrate / wheel / client                                   |
| labor_hours        | numeric     | Hours billed                                                       |
| labor_rate         | numeric     | $/hr — hard floor $185, default $220                              |
| labor_total        | numeric     | GENERATED: labor_hours × labor_rate                               |
| parts_cost         | numeric     | Total parts cost                                                   |
| diagnostic_fee     | numeric     | Diagnostic / inspection fee                                        |
| subtotal           | numeric     | GENERATED: labor_total + parts_cost + diagnostic_fee              |
| tax                | numeric     | Tax amount                                                         |
| total              | numeric     | GENERATED: subtotal + tax                                         |
| status             | text        | draft / submitted / approved / rejected / client_billed / paid    |
| rejection_reason   | text        | Populated when status = rejected                                   |
| notes              | text        | Internal notes                                                     |
| created_by         | uuid        | References auth.users(id)                                         |
| created_at         | timestamptz | Auto-set                                                           |
| updated_at         | timestamptz | Auto-updated via trigger                                           |

### pricing_history
| Column            | Type        | Notes                                                  |
|-------------------|-------------|--------------------------------------------------------|
| id                | uuid        | Primary key                                            |
| invoice_id        | uuid        | References invoices(id)                               |
| service_type      | text        | e.g. "Brake Service"                                  |
| vehicle_type      | text        | e.g. "Ford F-150" (make + model)                     |
| submission_target | text        | auto_integrate / wheel / client                       |
| submitted_amount  | numeric     | Total invoice amount submitted                        |
| outcome           | text        | approved / rejected                                   |
| created_at        | timestamptz | Auto-set                                              |

### pricing_intelligence (VIEW)
Calculated per (service_type, vehicle_type, submission_target):
| Column          | Notes                                                                        |
|-----------------|------------------------------------------------------------------------------|
| floor_price     | Highest approved amount ever (never below $185 hard floor)                  |
| ceiling_price   | Lowest rejected amount ever (null if never rejected)                        |
| suggested_price | Binary search midpoint between floor and ceiling; defaults to $220 if no history |
| confidence      | Low (<4 pts) / Medium (4–9) / High (10–19) / Very High (20+)               |
| total_points    | Total data points in this bucket                                             |
| approved_count  | Approved submissions                                                         |
| rejected_count  | Rejected submissions                                                         |

## RLS Policies
- **service_requests:** Users SELECT/INSERT where company_id matches their company; Mechanics SELECT all and UPDATE all
- **companies:** Users SELECT their own company; Admins SELECT/INSERT/UPDATE all; AMs SELECT/UPDATE assigned companies only
- **company_users:** Users SELECT their own row; Admins SELECT/INSERT/UPDATE/DELETE all; AMs SELECT/INSERT/UPDATE/DELETE for their assigned companies only
- **admins:** Users SELECT only their own row
- **mechanics:** Mechanics SELECT only their own row (role check on login)
- **invoices:** Admins full access (SELECT/INSERT/UPDATE/DELETE) via `admins` table check; Mechanics SELECT all (for billing status display on SRs only — UI queries `service_request_id, status` only); AMs SELECT all
- **pricing_history:** Admins full access via `admins` table check; AMs SELECT all
- **pricing_intelligence:** View — no RLS (inherits from pricing_history)
- **account_managers:** AMs SELECT own row (login check); Admins SELECT/UPDATE/DELETE all
- **account_manager_companies:** AMs SELECT own assignments; Admins SELECT/INSERT/DELETE all
- **vehicles:** Admins full access (`vehicles_admin_all`); Mechanics SELECT only (`vehicles_mechanic_select`); AMs SELECT/INSERT/UPDATE for their assigned companies (`vehicles_am_select`, `vehicles_am_insert`, `vehicles_am_update`)

## Admin Role
- Admins are stored in the `admins` table
- Admin role is verified on login to `/admin` — non-admins are rejected
- To add a new admin:
```sql
insert into admins (id, email)
select id, email from auth.users where email = 'admin@example.com';
```

## Mechanic Role
- Mechanics are stored in the `mechanics` table (id, email, name, display_name)
- Mechanic role is verified on login to `/mechanic` — non-mechanics are rejected
- Mechanics are created from the Admin Dashboard → Mechanics tab OR User Management tab (both call `create-mechanic` edge function)
- When a mechanic saves a service request, `updated_by_id`, `updated_by_name`, `updated_by_email` are written
- `updated_by_name` uses `mechanic.display_name || mechanic.name` — display_name takes precedence if set
- When an admin saves, `updated_by_id = null`, `updated_by_name = adminDisplayName || "Admin"`, `updated_by_email = session email`

## User Creation Flow
- Admins create client users from the Companies tab OR User Management tab → calls `create-user` Edge Function
- Admins create mechanics from the Mechanics tab OR User Management tab → calls `create-mechanic` Edge Function
- Both Edge Functions use the service role key (server-side only) and auto-confirm email

## Client Portal (App.jsx)
- Login with Supabase email/password auth
- On login, fetches user's company via two separate queries (company_users → companies); also reads `company_users.display_name`
- `displayName` state stored in `App` root; shown in topbar in place of email if set
- Shows "Loading your account…" while company is being fetched
- Shows "No Company Assigned" screen if user has no company link
- Dashboard shows all requests scoped to the user's company
- Company name shown in topbar
- Request form fields: Vehicle ID, VIN, Make, Model, Year, Mileage, Service Type, Urgency, Description
- Dashboard cards show: Vehicle ID, year/make/model, VIN, service type, mileage, urgency, status

## Admin Dashboard (AdminDashboard.jsx)
- Login verified against `admins` table — non-admins rejected
- **Service Requests tab:** Table of all requests with Date, Last Updated, SR#, Company, Vehicle, VIN, Service, Urgency, Status, **Invoice** (billing status badge), Updated By columns. Request detail modal also shows invoice billing status as a read-only badge.
- **Companies tab:** Create companies, add/remove users per company. Each expanded company card has an **Account Managers** subsection — list assigned AMs with remove, plus a dropdown to assign new AMs from the `account_manager_companies` junction table.
- **Mechanics tab:** Create mechanic accounts, list all mechanics
- **Billing tab:** Full invoice management with pricing intelligence and AI estimates. Table includes Date, Last Updated, SR#, Company, Vehicle, VIN, Service, Target, Total, **SR Status** (service request status badge), Status columns. InvoiceModal header shows linked SR# + SR status badge.
- **Vehicle Registry tab:** Full CRUD for fleet vehicles. Table with Active/Retired/Not Road Worthy/All filter, company dropdown filter, and full-text search. Click row → detail modal with vehicle info + status change history + linked SR history. Add/Edit modal (company locked on edit) includes status dropdown. Inline status selector in table row actions writes to `vehicle_status_logs`. Stats row is stats-4 (Total, Active, Retired, Not Road Worthy).
- **User Management tab:** Four stacked sections — **Account Managers** (new, first), Mechanics, Company Users, Admins. Account Managers section: Add modal (calls `create-account-manager-user` edge function), Edit modal (display_name + live company assignment/unassignment panel), Remove. Stats row is stats-5 (5 cards including Acct Managers count).
- Request detail modal: update status, add notes, view VIN, see who last updated the request

## Billing System (Admin Dashboard → Billing Tab)

### Invoice Status Flow
```
draft → submitted → approved  → client_billed → paid
                 → rejected
                 → client_billed (direct from submitted for client-pay invoices)
```

### Invoice Builder
- Optional link to an existing service request (auto-fills vehicle/service fields)
- Line items: labor (hours × rate), parts cost, diagnostic fee, tax
- Labor rate hard floor: **$185/hr** (enforced in UI + DB check constraint)
- Default starting labor rate: **$220/hr**
- Totals (labor_total, subtotal, total) are GENERATED columns — never write them directly

### Pricing Intelligence Panel
- Appears in the invoice builder once service_type + vehicle (make+model) + submission_target are all set
- Queries the `pricing_intelligence` view for floor / ceiling / suggested / confidence
- "Apply Suggested Total" button redistributes the suggested total into labor hours (parts/diag/tax stay fixed)
- vehicleType key = `{vehicle_make} {vehicle_model}` — must match how pricing_history was written

### Pricing History (Auto-Written)
- Written automatically when an invoice status transitions to `approved` or `rejected` for the first time
- Only written once per invoice (guarded by checking if previous status was unresolved)
- Written from `InvoiceModal.handleSave()` in AdminDashboard.jsx

### AI Estimate (get-ai-estimate Edge Function)
- Triggered by "AI Estimate" button in the invoice builder
- Calls Claude Haiku via Anthropic API server-side
- Returns: labor_hours, parts_cost, diagnostic_fee, parts_description, labor_description
- Requires `ANTHROPIC_API_KEY` secret set on the Supabase project
- Deploy: `supabase.exe functions deploy get-ai-estimate --project-ref kiayjlepwmdacojhpisq --no-verify-jwt`
- Set secret: `supabase.exe secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref kiayjlepwmdacojhpisq`

### Pricing Intelligence Algorithm
- **Floor price:** `MAX(approved amounts)` for the bucket, clamped to minimum $185
- **Ceiling price:** `MIN(rejected amounts)` for the bucket (null if never rejected)
- **Suggested price:** `(floor + ceiling) / 2` (binary search midpoint); falls back to `MAX(approved, 220)` if no rejections
- **Confidence thresholds:** Low = <4 pts, Medium = 4–9, High = 10–19, Very High = 20+

## Mechanic Dashboard (MechanicDashboard.jsx)
- Login verified against `mechanics` table — non-mechanics rejected
- Teal accent color (vs amber for admin/client)
- Table of ALL service requests with Date, Last Updated, SR#, Company, Vehicle, VIN, Service, Urgency, Status, **Invoice** (billing status badge), Updated By columns
- Click any row to open update modal: change status, add notes; shows Updated At timestamp and read-only Invoice billing status badge
- Mechanics can create new service requests via "New Request" button (request attributed to mechanic)
- Updates are attributed with mechanic's display_name (or name fallback) + email
- "Updated By" column shows who last touched each request
- Mechanics can SELECT invoices (RLS policy: `mechanic_select_invoices`) but the UI only queries `service_request_id, status` — no financial data is exposed

## Account Manager Portal (AccountManagerDashboard.jsx)
- Login verified against `account_managers` table — non-AMs rejected
- Purple accent (`--accent: #8b5cf6`) — same palette as the BillingPortal
- Three tabs: **Billing** (default), **Companies**, and **Vehicle Registry** — no access to Service Requests or User Management
- **Billing tab:** Read-only invoice table identical to admin's, plus SR Status badge column and InvoiceModal with linked SR status. AMs cannot create or edit invoices (no builder, no save path)
- **Companies tab (`AMCompanies`):** RLS auto-scopes to assigned companies — no admin-side filtering needed. Features: view company details, inline edit (name, email, phone, address), add/remove company users via `create-user` edge function, edit user display_names inline. No "Create Company" button — only admins create companies.
- Account managers are created by admins from User Management tab → Account Managers section (calls `create-account-manager-user` edge function)
- Company assignments are managed by admins from Companies tab (expanded card → Account Managers subsection) OR User Management tab (AM edit modal → company assignment panel)

### vehicles
| Column       | Type        | Notes                                                                 |
|--------------|-------------|-----------------------------------------------------------------------|
| id           | uuid        | Primary key, auto-generated                                           |
| company_id   | uuid        | References companies(id) ON DELETE CASCADE                            |
| vehicle_id   | text        | Unit number / fleet ID                                                |
| vin          | text        | Optional                                                              |
| vehicle_make | text        | Optional                                                              |
| vehicle_model| text        | Optional                                                              |
| vehicle_year | text        | Optional                                                              |
| license_plate| text        | Optional                                                              |
| notes        | text        | Optional                                                              |
| status       | text        | Active / Retired / Not Road Worthy; defaults Active; check constraint enforced |
| created_at   | timestamptz | Auto-set                                                              |
| updated_at   | timestamptz | Auto-updated via trigger                                              |
| UNIQUE       |             | (company_id, vehicle_id) — enforced at DB level                      |

### account_managers table
| Column       | Type        | Notes                                  |
|--------------|-------------|----------------------------------------|
| id           | uuid        | References auth.users(id)              |
| email        | text        |                                        |
| display_name | text        | Optional; shown in place of email      |
| created_at   | timestamptz | Auto-set                               |

### account_manager_companies table (junction)
| Column             | Type        | Notes                                      |
|--------------------|-------------|--------------------------------------------|
| account_manager_id | uuid        | References account_managers(id) ON DELETE CASCADE |
| company_id         | uuid        | References companies(id) ON DELETE CASCADE |
| created_at         | timestamptz | Auto-set                                   |
| PRIMARY KEY        |             | (account_manager_id, company_id)           |

## Vehicle Registry

### vehicles table
See schema above. Unique constraint: `(company_id, vehicle_id)` — two different companies can have the same vehicle ID without conflict.

### Admin Dashboard — Vehicle Registry tab
- `VehicleRegistry` function component in `AdminDashboard.jsx`
- Nav item: `{ id:"vehicles", label:"Vehicle Registry", icon:<IcoCar /> }` — positioned between Billing and User Management
- Editing a vehicle only updates the `vehicles` table — does NOT retroactively change historical service request snapshots
- SR history in detail modal queries `service_requests WHERE vehicle_registry_id = v.id`

### New Request form integration (Admin + Mechanic)
- After selecting Company, mechanic types a Vehicle ID and clicks "Look up" (or presses Enter)
- Queries `vehicles WHERE company_id = ? AND vehicle_id = ? AND active = true` via `.maybeSingle()`
- **Match:** green banner shown; VIN/Year/Make/Model/License Plate render as read-only locked display values; `vehicle_registry_id` written to SR on submit
- **No match:** muted banner shown; all vehicle fields remain editable; "Save to registry after submit" checkbox available
- Changing company or vehicle ID resets registry state (`registryVehicle = null`)
- Mileage is always a manual entry field regardless of registry state
- `vehicle_registry_id` is nullable — SRs created before the registry or without a lookup have null
- Editing registry data after an SR is created does NOT affect the SR's stored snapshot — snapshot integrity is preserved by design

## Cross-Status Linking (Billing ↔ Service Requests)
Invoice billing status is displayed on service request views; SR status is displayed on invoice views. All displays are read-only badges — no status is settable from the wrong portal.

### Where each badge appears
| Badge | Component | Location |
|---|---|---|
| `InvoiceBillingBadge` (invoice status) | AdminDashboard SR table | "Invoice" column |
| `InvoiceBillingBadge` | AdminDashboard RequestModal | detail grid row |
| `InvoiceBillingBadge` | MechanicDashboard SR table | "Invoice" column |
| `InvoiceBillingBadge` | MechanicDashboard UpdateModal | detail grid row |
| `SRStatusBadge` (SR status) | AdminDashboard Billing table | "SR Status" column |
| `SRStatusBadge` | AdminDashboard InvoiceModal | header subtitle |
| `SRStatusBadge` | AccountManagerDashboard Billing table | "SR Status" column |
| `SRStatusBadge` | AccountManagerDashboard InvoiceModal | header subtitle |

### Data fetching pattern
- SR tabs (Admin + Mechanic): fetch `invoices(service_request_id, status)` in parallel with SRs → build `invoiceStatusMap[sr_id] = invoice_status`
- Billing tabs (Admin + AM): SR query includes `status` column → build `requestsStatusMap[sr_id] = sr_status`
- `InvoiceBillingBadge` with no/unknown status renders "Not Invoiced" in muted text (no colored badge)
- `SRStatusBadge` with no linked SR renders "—"

## Key Design Decisions
- No external UI library — all styles are in a `const css` string injected via `<style>`
- Design tokens use CSS variables defined in `:root`
- Supabase client uses `@supabase/supabase-js` official SDK
- Each portal is a separate file at a separate route
- Dashboard `useEffect` depends on `company?.id` — CRITICAL, do not change to `[]`
- Max content width is 1400px with 32px padding
- Status flow: pending → in_progress → completed (or cancelled)
- Attribution columns on service_requests are denormalized (name+email stored directly) — no join needed

## Known Gotchas
- Always use `@supabase/supabase-js` client — never raw fetch for Supabase calls
- The `useEffect` in Dashboard MUST depend on `company?.id` — removing this causes infinite loading
- RLS silent failures are almost always a missing policy — check Supabase policies first
- Service role key must never be used in the browser — use the Edge Function instead
- When adding new tables, always enable RLS and add appropriate policies
- The `supabase.exe` CLI is in the project root (not in PATH) — always call it as `supabase.exe`
- company_users RLS has separate policies for users vs admins — both must exist
- `updated_by_id` is nullable — admins write null since they are not in the mechanics table
- `invoices.labor_total`, `invoices.subtotal`, `invoices.total` are GENERATED ALWAYS columns — never include them in INSERT/UPDATE payloads
- Pricing history is only written once per invoice (first time outcome is resolved); re-saves after approval/rejection do NOT add duplicate records
- The `pricing_intelligence` view is a plain SQL view — Supabase RLS does not apply to views directly; access is controlled by the underlying `pricing_history` table's RLS
- `vehicleType` in pricing_history = `vehicle_make + " " + vehicle_model` — must be consistent between writes (InvoiceModal) and reads (PriceIntelPanel query). Falls back to `vehicle_id` if make/model are blank
- `request_number` is a bigint sequence starting at 1000 — always at least 4 digits, displayed as `SR-{request_number}`; used to link invoices to service requests
- `scan-vin-image` edge function has `verify_jwt: false` — no Authorization header needed when calling from MechanicDashboard
- Sidebar navigation is collapsible on all portals (admin + mechanic) on both mobile and desktop via hamburger button; `sidebarOpen` state defaults to `true`
- Service request tables have `overflow-x:auto` for horizontal scroll on mobile (all portals)
- "New Request" in AdminDashboard and MechanicDashboard uses `scan-vin-image` edge function + NHTSA VIN decoder API for auto-fill; shows confirmation step before applying decoded vehicle data
- `company_users` table stores `user_id` UUID + optional `display_name`; auth.users is not client-accessible. User Management tab shows `display_name` if set, otherwise falls back to UUID
- `display_name` is nullable on mechanics, admins, and company_users — always fall back (`display_name || name`, `display_name || email`, `display_name || user_id`)
- `adminDisplayName` is fetched from `admins.display_name` at login and stored in `AdminApp` state — it is NOT re-fetched during the session; changes take effect on next login
- `updated_by_name` written to service_requests stores the display_name at the time of save (denormalized) — changing display_name later does not retroactively update old records
- Admin tab navigation is tab-state-based (not React Router sub-routes); adding new sections means adding to `navItems`, `pageTitle`, and the tab render block in `AdminApp`
- Logo bug fix (2026-03-23): `.auth-logo` and `.topbar-brand` use `display:flex` — bare text nodes become separate flex items causing extra gaps around `<em>MOB</em>`. Fix is wrapping brand text in a `<span>` so the whole word is one flex item
- `RequestModal` is a module-level function and cannot access `AdminApp` state directly — `companiesMap` (and any other state it needs) must be passed as explicit props; missing props cause a white-screen crash on modal open
- Edge functions must be explicitly deployed before use — `create-account-manager-user` was not deployed on initial setup; always deploy with `.\supabase.exe functions deploy <name> --project-ref kiayjlepwmdacojhpisq --no-verify-jwt` from the project root (use `.\` prefix in PowerShell)
- Fetch calls to edge functions must be wrapped in try/catch — if the fetch throws (network error, non-JSON response, function not deployed), `setSaving(false)` is never reached and the button spins forever
- `InvoiceBillingBadge` and `SRStatusBadge` are defined as standalone functions in each portal file that uses them (AdminDashboard, MechanicDashboard, AccountManagerDashboard) — they are NOT shared across files
- Mechanics have SELECT on `invoices` table (RLS policy `mechanic_select_invoices`) but the MechanicDashboard only queries `service_request_id, status` — billing amounts are never fetched or shown
- `account_manager_companies` uses a composite primary key `(account_manager_id, company_id)` — duplicate inserts will error; the UI filters already-assigned AMs from the dropdown
- AM portal RLS is enforced server-side: `AMCompanies` queries `companies` with no filter — Supabase returns only rows matching the AM's `account_manager_companies` assignments
- `vehicles` unique constraint is `(company_id, vehicle_id)` — insert errors with code `23505` on duplicate; the UI catches this and shows a user-friendly message
- `vehicles.status` has three values: `Active` (no restrictions), `Retired` (blocked from new SR lookup — red banner + form submission blocked), `Not Road Worthy` (allowed in new SR lookup — amber warning banner + mechanic UpdateModal badge). Registry lookup queries all statuses and branches on result — no `.eq("active", true)` filter anymore
- `vehicle_status_logs` records each status change with `vehicle_id`, `old_status`, `new_status`, `changed_by_id`, `changed_by_name`, `changed_at`. Visible in admin detail modal.
- Company is locked (non-editable) when editing a vehicle in the registry — changing company_id on edit would silently break the uniqueness guarantees; to move a vehicle, deactivate the old record and create a new one
- `vehicle_registry_id` on service_requests is set to `ON DELETE SET NULL` — deleting a vehicle from the DB (not just deactivating) will null out the reference on all linked SRs without breaking them
- The "Save to registry" path in NewRequestModal inserts to `vehicles` first, then uses the new id for the SR insert; if the insert fails with `23505` (race condition duplicate), the SR still saves with `vehicle_registry_id = null` rather than blocking the user
