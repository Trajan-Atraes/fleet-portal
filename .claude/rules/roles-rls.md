## Roles & User Management

### Admin Role
- Stored in `admins` table; verified on login to `/admin` — non-admins rejected
- `adminDisplayName` fetched at login, stored in `AdminApp` state — not re-fetched mid-session
- To add: `insert into admins (id, email) select id, email from auth.users where email = 'user@example.com';`
- When admin saves SR: `updated_by_id = null`, `updated_by_name = adminDisplayName || "Admin"`, `updated_by_email = session email`

### Mechanic Role
- Stored in `mechanics` table (id, email, name, display_name); verified on login to `/mechanic`
- Created from Admin Dashboard → Mechanics tab OR User Management tab (both call `create-mechanic`)
- When saving SR: writes `updated_by_id`, `updated_by_name` (`display_name || name`), `updated_by_email`

### Account Manager Role
- Stored in `account_managers` table; verified on login to `/account-manager`
- Created by admins from User Management → Account Managers section (`create-account-manager-user`)
- Company assignments managed from Companies tab (expanded card) OR User Management (AM edit modal)
- SR updates: `updated_by_id = null`, `updated_by_name = amDisplayName || amEmail`, `updated_by_email = amEmail`

### User Creation Flow
- Client users: Admin → Companies tab OR User Management tab → `create-user` Edge Function
- Mechanics: Admin → Mechanics tab OR User Management tab → `create-mechanic` Edge Function
- Account Managers: Admin → User Management → Account Managers section → `create-account-manager-user` Edge Function
- All edge functions use the service role key (server-side only) and auto-confirm email

### display_name Rules
- Nullable on mechanics, admins, company_users, account_managers
- Always fall back: `display_name || name` (mechanics), `display_name || email` (admins/AMs), `display_name || user_id` (company_users)
- `updated_by_name` is denormalized at save time — changing display_name later does NOT retroactively update old SR records

## RLS Policies

| Table                       | Policy Summary |
|-----------------------------|----------------|
| service_requests            | Users: SELECT/INSERT own company; Mechanics: SELECT/UPDATE all; AMs: SELECT/UPDATE assigned companies; Admins: INSERT/UPDATE/DELETE all |
| companies                   | Users: SELECT own; Admins: full; AMs: SELECT/UPDATE assigned |
| company_users               | Users: SELECT own row; Admins: full; AMs: full for assigned companies |
| admins                      | Admins: SELECT/UPDATE own row only (`auth.uid() = id`) |
| mechanics                   | Mechanics: SELECT own row; Admins: SELECT/UPDATE/DELETE all |
| invoices                    | Admins: full; Mechanics: SELECT all (UI only queries `service_request_id, status`); AMs: SELECT all; Clients: SELECT own company, non-incognito only (`invoices_client_select`) |
| pricing_history             | Admins: full; AMs: SELECT all |
| pricing_intelligence (view) | No RLS — inherits from pricing_history |
| account_managers            | AMs: SELECT own row; Admins: SELECT/UPDATE/DELETE all |
| account_manager_companies   | AMs: SELECT own; Admins: SELECT/INSERT/DELETE all |
| vehicles                    | Admins: full (`vehicles_admin_all`); Mechanics: SELECT only; AMs: SELECT/INSERT/UPDATE for assigned companies |
| vehicle_groups              | Admins: full; AMs: full for assigned companies; Clients: SELECT own company |
| audit_logs                  | Super admins: SELECT only (`is_super = true`); writes via triggers only |
| audit_alerts                | Super admins: SELECT/UPDATE only (`is_super = true`) |
| notifications               | Admins: SELECT where `target_role IN ('admin','all')`; Mechanics: SELECT where `target_role IN ('mechanic','all')`; AMs: SELECT where `target_role IN ('account_manager','all')`; Super admins: INSERT/DELETE |
| notification_reads          | All users: SELECT/INSERT/DELETE own rows only (`auth.uid() = user_id`) |

**RLS silent failures** are almost always a missing policy — check Supabase policies first.
`company_users` RLS has separate policies for users vs admins — both must exist.
