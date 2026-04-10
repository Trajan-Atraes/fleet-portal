# FleetDesk — Client, Admin & Mechanic Portal

## Project Overview
Fleet maintenance portal built with React + Vite + Supabase. Clients submit service requests and track their status. Admins manage requests, companies, users, and billing. Mechanics view and update requests. Account Managers oversee assigned companies.

## Tech Stack
- **Frontend:** React 18, Vite
- **Routing:** react-router-dom
- **Backend/Auth/DB:** Supabase (PostgreSQL + RLS + Auth + Edge Functions)
- **Styling:** Shared CSS (`src/styles/shared.css` imported in main.jsx) + portal-specific overrides in `const css` per file
- **Fonts:** Barlow + Barlow Condensed (Google Fonts)

## Project Structure
```
fleet-portal/
├── src/
│   ├── App.jsx                        # Client portal
│   ├── AdminDashboard.jsx             # Admin portal shell (tabs loaded as components)
│   ├── MechanicDashboard.jsx          # Mechanic portal
│   ├── BillingPortal.jsx              # Standalone billing portal (amber accent; blue role badge)
│   ├── AccountManagerDashboard.jsx    # Account Manager portal (amber accent; purple role badge)
│   ├── main.jsx                       # React Router setup (lazy-loaded portals) + OfflineBanner
│   ├── styles/
│   │   └── shared.css                 # Shared design tokens, layout, components (all portals inherit)
│   ├── components/
│   │   ├── Icons.jsx                  # Shared SVG icon components (all portals/tabs import from here)
│   │   ├── BarcodeScanner.jsx         # Camera barcode scanner (@ericblade/quagga2, fullscreen)
│   │   ├── LineItemsEditor.jsx        # Invoice line items editor (flat table, drag-reorder, resizable cols, service presets)
│   │   ├── NotesLog.jsx               # SR notes with file attachments
│   │   ├── ServiceLinesEditor.jsx     # Service lines editor with auto-save
│   │   ├── StatusBadge.jsx            # StatusBadge, InvoiceBillingBadge, LineInvoiceBadges, SvcPreviewCell
│   │   ├── UserTypeBadge.jsx          # User role badge
│   │   └── VehicleStatusBadge.jsx     # Vehicle status badge
│   ├── lib/
│   │   ├── supabase.js                # Shared Supabase client (single instance — all files import from here)
│   │   ├── constants.js               # Status options/labels, invoice statuses, rates, ssGet/ssSet helpers
│   │   └── square.js                  # Square SDK config
│   └── tabs/
│       ├── AdminBilling.jsx           # Billing tab
│       ├── AdminCompanies.jsx         # DSPs tab
│       ├── AdminInventory.jsx         # Inventory tab (items, POs, suppliers)
│       ├── AdminMechanics.jsx         # (file kept; tab removed from nav)
│       ├── AdminReceivables.jsx       # (file kept; tab hidden from nav — restore when ready)
│       ├── AdminServiceRequests.jsx   # Service Requests tab
│       ├── AdminUserManagement.jsx    # User Management tab
│       └── AdminVehicleRegistry.jsx   # Vehicle Registry tab
├── supabase/functions/
│   ├── create-user/                   # Create client user + link to company
│   ├── create-mechanic/               # Create mechanic user + link to mechanics table
│   ├── create-account-manager-user/   # Create AM user + link to account_managers
│   ├── create-admin-user/             # Create admin user + link to admins table
│   ├── get-ai-estimate/               # AI labor/parts estimate via Claude Haiku
│   ├── scan-vin-image/                # Claude Haiku vision → extract VIN from photo
│   ├── generate-invoice-pdf/          # PDF invoice generation (admin + client access, pdf-lib, PAID stamp)
│   ├── process-square-payment/        # Charge card (new or on-file), mark invoice paid
│   ├── reverse-payment/               # Admin-only refund via Square, reset to client_billed
│   ├── save-card/                     # Save card on file (Square CreateCustomer + CreateCard)
│   └── remove-card/                   # Remove saved card (Square DisableCard + DB delete)
├── supabase.exe                       # Supabase CLI (Windows, in project root — not in PATH)
└── vite.config.js
```

## Routes
| Path             | Component                   |
|------------------|-----------------------------|
| /                | App.jsx (Client portal)     |
| /admin           | AdminDashboard.jsx          |
| /mechanic        | MechanicDashboard.jsx       |
| /account-manager | AccountManagerDashboard.jsx |

## Commands
```bash
npm run dev      # http://localhost:5173
npm run build
npm run preview

# Deploy edge functions (from project root)
# Use .\supabase.exe in PowerShell; supabase.exe in bash
supabase.exe functions deploy <name> --project-ref kiayjlepwmdacojhpisq --no-verify-jwt
# Function names: create-user, create-mechanic, create-account-manager-user,
#                 create-admin-user, get-ai-estimate, scan-vin-image, generate-invoice-pdf,
#                 process-square-payment, reverse-payment, save-card, remove-card

# Set Anthropic API key (required for AI estimate + VIN scan)
supabase.exe secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref kiayjlepwmdacojhpisq
```

## Supabase Config
- **Project URL:** https://kiayjlepwmdacojhpisq.supabase.co
- Credentials in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) — also set as Vercel env vars for production. Never hardcode in source.
- `src/lib/supabase.js` reads from `import.meta.env` (single shared client — all files import from here)
- To add a new admin: call the `create-admin-user` edge function with `{ email, password }` — do NOT manually insert into `auth.users` (GoTrue requires admin API for proper user creation)
- Edge functions validate: email format, password ≥ 7 chars, required fields — before creating users
- Legacy method (existing auth user only): `insert into admins (id, email) select id, email from auth.users where email = 'user@example.com';`

@.claude/rules/schema.md
@.claude/rules/roles-rls.md
@.claude/rules/portals.md
@.claude/rules/billing.md
@.claude/rules/vehicle-registry.md
@.claude/rules/design.md
@.claude/rules/gotchas.md
