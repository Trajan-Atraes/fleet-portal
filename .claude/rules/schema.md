## Database Schema

### service_requests
| Column              | Type        | Notes |
|---------------------|-------------|-------|
| id                  | uuid        | PK, auto-generated |
| client_id           | uuid        | References auth.users(id) |
| company_id          | uuid        | References companies(id) |
| vehicle_id          | text        | Unit number / vehicle identifier |
| vin                 | text        | |
| vehicle_make        | text        | |
| vehicle_model       | text        | |
| vehicle_year        | text        | |
| mileage             | int         | Optional |
| service_type        | text        | Legacy — NOT set on new SRs (forms removed this field); still present on old records |
| urgency             | text        | low / medium / high |
| description         | text        | Client-written; shown read-only to mechanic as "Customer Reported Issue" |
| status              | text        | pending / in_progress / completed / cancelled |
| notes               | text        | Shared (mechanic + admin) |
| updated_by_id       | uuid        | References mechanics(id), nullable |
| updated_by_name     | text        | Denormalized |
| updated_by_email    | text        | Denormalized |
| request_number      | bigint      | Seq from 1000; shown as XXXX; unified invoice reference |
| vehicle_registry_id | uuid        | Nullable FK → vehicles(id) ON DELETE SET NULL |
| created_at          | timestamptz | |
| estimated_completion | date       | Nullable; set by admins/AMs |
| last_note_at        | timestamptz | Nullable; updated by trigger on sr_notes insert; used for unread notes detection |
| archived_at         | timestamptz | Nullable; set when admin archives a completed/cancelled SR; null = active |
| updated_at          | timestamptz | Managed by DB trigger — do NOT set manually |

### audit_logs
Tracks all INSERT/UPDATE/DELETE on 9 tables. Super-admin-only read access via RLS. Immutable (no UPDATE/DELETE except scheduled cleanup).

| Column      | Type        | Notes |
|-------------|-------------|-------|
| id          | uuid        | PK |
| table_name  | text        | NOT NULL |
| record_id   | uuid        | NOT NULL |
| action      | text        | INSERT / UPDATE / DELETE |
| old_data    | jsonb       | Previous row state (UPDATE/DELETE) |
| new_data    | jsonb       | New row state (INSERT/UPDATE) |
| changed_by  | uuid        | FK → auth.users(id) ON DELETE SET NULL |
| changed_at  | timestamptz | NOT NULL DEFAULT now() |
| user_email  | text        | Nullable; denormalized for display |
| category    | text        | NOT NULL DEFAULT 'DATA'; AUTH / DATA / ADMIN / SYSTEM |
| status      | text        | NOT NULL DEFAULT 'success'; success / failure |
| metadata    | jsonb       | DEFAULT '{}'; extra context |

Trigger function `fn_audit_log()` (`SECURITY DEFINER`) attached `AFTER INSERT/UPDATE/DELETE` on: service_requests, invoices, service_lines, vehicles, admins, mechanics, account_managers, company_users, account_manager_companies.

Immutability triggers (`tr_audit_logs_no_update`, `tr_audit_logs_no_delete`) prevent tampering; bypass via `set_config('app.audit_cleanup', 'true')` for scheduled cleanup only.

**30-day retention**: `cleanup_old_audit_logs()` runs daily at 3am UTC via pg_cron; deletes audit_alerts then audit_logs older than 30 days.

### audit_alerts
Auto-generated from `tr_audit_alerts` trigger on audit_logs INSERT. Super-admin-only.

| Column          | Type        | Notes |
|-----------------|-------------|-------|
| id              | uuid        | PK |
| alert_type      | text        | NOT NULL |
| severity        | text        | NOT NULL DEFAULT 'warning'; warning / critical / info |
| message         | text        | NOT NULL |
| audit_log_id    | uuid        | Nullable FK → audit_logs(id) |
| user_id         | uuid        | Nullable |
| acknowledged    | boolean     | NOT NULL DEFAULT false |
| acknowledged_by | uuid        | Nullable |
| acknowledged_at | timestamptz | Nullable |
| created_at      | timestamptz | NOT NULL DEFAULT now() |

### notifications
System-wide notifications with per-user read tracking. Super admins create; role-targeted delivery.

| Column      | Type        | Notes |
|-------------|-------------|-------|
| id          | uuid        | PK |
| title       | text        | NOT NULL |
| message     | text        | NOT NULL |
| type        | text        | NOT NULL DEFAULT 'info'; info / warning / action |
| target_role | text        | NOT NULL DEFAULT 'admin'; admin / mechanic / account_manager / all |
| link_tab    | text        | Nullable; tab to navigate to on click |
| created_by  | uuid        | Nullable FK → auth.users(id) ON DELETE SET NULL |
| created_at  | timestamptz | NOT NULL DEFAULT now() |

### notification_reads
Per-user read tracking for notifications. Each user has independent read state.

| Column          | Type        | Notes |
|-----------------|-------------|-------|
| notification_id | uuid        | FK → notifications(id) ON DELETE CASCADE |
| user_id         | uuid        | FK → auth.users(id) ON DELETE CASCADE |
| read_at         | timestamptz | NOT NULL DEFAULT now() |
| PRIMARY KEY     |             | (notification_id, user_id) |

### service_lines
One row per line of work on a service request. Each line automatically triggers creation of a draft invoice.

| Column          | Type        | Notes |
|-----------------|-------------|-------|
| id              | uuid        | PK |
| sr_id           | uuid        | FK → service_requests(id) ON DELETE CASCADE |
| line_letter     | text        | A, B, C… — sequential; UNIQUE(sr_id, line_letter) |
| service_name    | text        | Mechanic-entered; e.g. "Brake Replacement" |
| notes           | text        | Mechanic work notes / observations |
| parts           | jsonb       | Array of part name strings: `["Brake Pad Set", "Rotor"]` |
| is_completed    | boolean     | Whether this line of work is done |
| parts_ordered   | boolean     | Whether parts have been ordered for this line; admin-only toggle |
| updated_by_name | text        | Denormalized; stamped on each save by ServiceLinesEditor |
| created_at      | timestamptz | |

**Line A** is auto-created when the SR is inserted (trigger). Mechanics add further lines manually. Line letter is never reused.

### companies
| Column     | Type        |
|------------|-------------|
| id         | uuid        |
| name       | text        |
| email      | text        |
| phone      | text        |
| address    | text        |
| created_at | timestamptz |

### company_users
| Column       | Type        | Notes |
|--------------|-------------|-------|
| id              | uuid        | |
| company_id      | uuid        | |
| user_id         | uuid        | References auth.users(id) |
| display_name    | text        | Optional; shown in place of UUID |
| is_billing_user | boolean     | Default false; only billing users see Payments tab in client portal |
| created_at      | timestamptz | |

### admins
| Column       | Type        | Notes |
|--------------|-------------|-------|
| id           | uuid        | References auth.users(id) |
| email        | text        | |
| display_name | text        | Optional; shown in sidebar + Updated By |
| is_super     | boolean     | Default false; super admins can reset passwords and manage other admins |
| created_at   | timestamptz | |

### mechanics
| Column       | Type        | Notes |
|--------------|-------------|-------|
| id           | uuid        | References auth.users(id) |
| email        | text        | |
| name         | text        | Required at creation |
| display_name | text        | Optional; takes precedence over name |
| created_at   | timestamptz | |

### invoices
| Column             | Type        | Notes |
|--------------------|-------------|-------|
| id                 | uuid        | PK |
| service_request_id | uuid        | Optional link to service_requests(id) |
| service_line_id    | uuid        | Nullable FK → service_lines(id) ON DELETE SET NULL; set when invoice belongs to a specific line |
| company_id         | uuid        | |
| vehicle_id         | text        | |
| vehicle_make       | text        | |
| vehicle_model      | text        | |
| vehicle_year       | text        | |
| service_type       | text        | |
| bill_to_id         | uuid        | Nullable FK → bill_to_contacts(id) ON DELETE SET NULL; preferred |
| submission_target  | text        | Legacy field (auto_integrate/wheel/client for old invoices); new invoices set this to the contact's name for pricing intel |
| labor_hours        | numeric     | |
| labor_rate         | numeric     | Hard floor $185, default $220 |
| labor_total        | numeric     | GENERATED: labor_hours × labor_rate |
| parts_cost         | numeric     | |
| diagnostic_fee     | numeric     | |
| subtotal           | numeric     | GENERATED: labor_total + parts_cost + diagnostic_fee |
| tax                | numeric     | |
| total              | numeric     | GENERATED: subtotal + tax |
| status             | text        | draft / submitted / approved / rejected / revise / client_billed / paid |
| rejection_reason   | text        | |
| notes              | text        | |
| ro_number          | text        | Nullable; manual-entry Repair Order number |
| line_items         | jsonb       | 3 historical formats — handle all, do not simplify without migrating |
| is_incognito       | boolean     | NOT NULL DEFAULT false; admin-only invoices hidden from AMs/mechanics/clients |
| billed_at          | timestamptz | Set by trigger when status transitions to client_billed; used as invoice date on PDF |
| created_by         | uuid        | |
| updated_by_name    | text        | Denormalized; stamped on each save by admin/AM |
| created_at         | timestamptz | |
| archived_at        | timestamptz | Nullable; set when admin archives a paid invoice; null = active |
| updated_at         | timestamptz | Managed by DB trigger — do NOT set manually |

**GENERATED columns** — never include `labor_total`, `subtotal`, `total` in INSERT/UPDATE payloads.

### pricing_history
| Column            | Type        | Notes |
|-------------------|-------------|-------|
| id                | uuid        | |
| invoice_id        | uuid        | |
| service_type      | text        | e.g. "Brake Service" |
| vehicle_type      | text        | `{vehicle_make} {vehicle_model}` — must be consistent; falls back to vehicle_id |
| submission_target | text        | auto_integrate / wheel / client |
| submitted_amount  | numeric     | |
| outcome           | text        | approved / rejected |
| created_at        | timestamptz | |

Written once per invoice on first approved/rejected transition. Re-saves do NOT add duplicates.

### pricing_intelligence (VIEW)
Calculated per (service_type, vehicle_type, submission_target). No RLS — inherits from pricing_history.

| Column          | Notes |
|-----------------|-------|
| floor_price     | MAX(approved) clamped to $185 min |
| ceiling_price   | MIN(rejected); null if never rejected |
| suggested_price | (floor + ceiling) / 2; fallback MAX(approved, 220) |
| confidence      | Low <4 / Medium 4–9 / High 10–19 / Very High 20+ |
| total_points    | |
| approved_count  | |
| rejected_count  | |

### service_presets
| Column              | Type        | Notes |
|---------------------|-------------|-------|
| id                  | uuid        | PK |
| name                | text        | NOT NULL, UNIQUE — service name for autocomplete |
| default_rate        | numeric     | Nullable — auto-fills Rate column when preset selected |
| default_description | text        | Nullable — auto-fills Description column when preset selected |
| created_by          | uuid        | Nullable FK → auth.users(id) ON DELETE SET NULL |
| created_at          | timestamptz | |

RLS: admins full CRUD (`service_presets_admin_all`), everyone else SELECT only (`service_presets_read`).

### vehicles
| Column               | Type        | Notes |
|----------------------|-------------|-------|
| id                   | uuid        | PK |
| company_id           | uuid        | ON DELETE CASCADE |
| vehicle_id           | text        | Unit number / fleet ID |
| vin                  | text        | Optional |
| vehicle_make         | text        | Optional |
| vehicle_model        | text        | Optional |
| vehicle_year         | text        | Optional |
| license_plate        | text        | Optional |
| notes                | text        | Optional |
| status               | text        | Road Worthy / Retired / Not Road Worthy (check constraint) |
| default_bill_to_id   | uuid        | Nullable FK → bill_to_contacts(id) ON DELETE SET NULL; auto-copied to invoice on SR insert |
| group_id             | uuid        | Nullable FK → vehicle_groups(id) ON DELETE SET NULL |
| created_at           | timestamptz | |
| updated_at           | timestamptz | DB trigger |
| UNIQUE               |             | (company_id, vehicle_id) |

### vehicle_groups
| Column     | Type        | Notes |
|------------|-------------|-------|
| id         | uuid        | PK |
| company_id | uuid        | FK → companies(id) ON DELETE CASCADE |
| name       | text        | NOT NULL |
| sort_order | int         | NOT NULL DEFAULT 0 |
| created_at | timestamptz | |
| UNIQUE     |             | (company_id, name) |

### bill_to_contacts
| Column     | Type        | Notes |
|------------|-------------|-------|
| id         | uuid        | PK |
| name       | text        | Required |
| address    | text        | Required |
| email      | text        | Optional |
| phone      | text        | Optional |
| notes      | text        | Optional |
| created_at | timestamptz | |

### account_managers
| Column       | Type        | Notes |
|--------------|-------------|-------|
| id           | uuid        | References auth.users(id) |
| email        | text        | |
| display_name | text        | Optional |
| created_at   | timestamptz | |

### account_manager_companies (junction)
| Column             | Type        | Notes |
|--------------------|-------------|-------|
| account_manager_id | uuid        | ON DELETE CASCADE |
| company_id         | uuid        | ON DELETE CASCADE |
| created_at         | timestamptz | |
| PRIMARY KEY        |             | (account_manager_id, company_id) — duplicate inserts error; UI filters assigned AMs from dropdown |

### vehicle_status_logs
Records each status change: `vehicle_id`, `old_status`, `new_status`, `changed_by_id`, `changed_by_name`, `changed_at`. Visible in admin vehicle detail modal.

### inventory_items
| Column            | Type        | Notes |
|-------------------|-------------|-------|
| id                | uuid        | PK |
| name              | text        | NOT NULL |
| description       | text        | Optional |
| category          | text        | NOT NULL; parts / fluids / shop_supplies / tools_equipment |
| sku               | text        | Auto-generated `SKU-XXXXXXXX` on create; read-only on edit |
| part_number       | text        | Billing identifier — groups SKUs across vendors |
| barcode           | text        | UPC/EAN barcode; indexed; NOT unique (multiple SKUs can share) |
| supplier_id       | uuid        | Nullable FK → suppliers(id) ON DELETE SET NULL |
| unit              | text        | NOT NULL DEFAULT 'each' |
| quantity_on_hand  | numeric     | NOT NULL DEFAULT 0 |
| reorder_threshold | numeric     | Nullable; triggers low-stock alert when qty ≤ threshold |
| reorder_quantity  | numeric     | Nullable; suggested reorder qty |
| notes             | text        | Optional |
| created_at        | timestamptz | |
| updated_at        | timestamptz | Trigger-managed |

**SKU vs Part Number:** Each row = one vendor-specific SKU. Multiple rows can share the same `part_number` for billing consolidation. `barcode` is the physical UPC — multiple SKUs (different vendors) can share the same barcode.

### supplier_pricing
| Column      | Type        | Notes |
|-------------|-------------|-------|
| id          | uuid        | PK |
| item_id     | uuid        | FK → inventory_items(id) |
| supplier_id | uuid        | FK → suppliers(id) |
| unit_cost   | numeric     | NOT NULL |
| notes       | text        | Optional |
| last_used_at| timestamptz | Updated when PO line created |
| created_at  | timestamptz | |
| updated_at  | timestamptz | |
| UNIQUE      |             | (item_id, supplier_id) |
