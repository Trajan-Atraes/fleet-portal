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
| request_number      | bigint      | Seq from 1000; shown as SR-XXXX; unified invoice reference |
| vehicle_registry_id | uuid        | Nullable FK → vehicles(id) ON DELETE SET NULL |
| created_at          | timestamptz | |
| updated_at          | timestamptz | Managed by DB trigger — do NOT set manually |

### service_lines
One row per line of work on a service request. Each line automatically triggers creation of a draft invoice.

| Column       | Type        | Notes |
|--------------|-------------|-------|
| id           | uuid        | PK |
| sr_id        | uuid        | FK → service_requests(id) ON DELETE CASCADE |
| line_letter  | text        | A, B, C… — sequential; UNIQUE(sr_id, line_letter) |
| service_name | text        | Mechanic-entered; e.g. "Brake Replacement" |
| notes        | text        | Mechanic work notes / observations |
| parts        | jsonb       | Array of part name strings: `["Brake Pad Set", "Rotor"]` |
| is_completed | boolean     | Whether this line of work is done |
| created_at   | timestamptz | |

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
| id           | uuid        | |
| company_id   | uuid        | |
| user_id      | uuid        | References auth.users(id) |
| display_name | text        | Optional; shown in place of UUID |
| created_at   | timestamptz | |

### admins
| Column       | Type        | Notes |
|--------------|-------------|-------|
| id           | uuid        | References auth.users(id) |
| email        | text        | |
| display_name | text        | Optional; shown in sidebar + Updated By |
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
| status             | text        | draft / submitted / approved / rejected / client_billed / paid |
| rejection_reason   | text        | |
| notes              | text        | |
| line_items         | jsonb       | 3 historical formats — handle all, do not simplify without migrating |
| created_by         | uuid        | |
| created_at         | timestamptz | |
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
| status               | text        | Active / Retired / Not Road Worthy (check constraint) |
| default_bill_to_id   | uuid        | Nullable FK → bill_to_contacts(id) ON DELETE SET NULL; auto-copied to invoice on SR insert |
| created_at           | timestamptz | |
| updated_at           | timestamptz | DB trigger |
| UNIQUE               |             | (company_id, vehicle_id) |

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
