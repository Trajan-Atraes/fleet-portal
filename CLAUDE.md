# FleetDesk — Client, Admin & Mechanic Portal

## Project Overview
Fleet maintenance portal built with React + Vite + Supabase. Clients submit service requests and track their status. Admins manage requests, companies, users, and billing. Mechanics view and update requests. Account Managers oversee assigned companies.

## Tech Stack
- **Frontend:** React 18, Vite
- **Routing:** react-router-dom
- **Backend/Auth/DB:** Supabase (PostgreSQL + RLS + Auth + Edge Functions)
- **Styling:** Plain CSS-in-JS (`const css` string injected via `<style>`, CSS variables in `:root`)
- **Fonts:** Barlow + Barlow Condensed (Google Fonts)

## Project Structure
```
fleet-portal/
├── src/
│   ├── App.jsx                        # Client portal
│   ├── AdminDashboard.jsx             # Admin portal (incl. Billing + Vehicle Registry tabs)
│   ├── MechanicDashboard.jsx          # Mechanic portal
│   ├── BillingPortal.jsx              # Standalone billing portal (amber accent; blue role badge)
│   ├── AccountManagerDashboard.jsx    # Account Manager portal (amber accent; purple role badge)
│   └── main.jsx                       # React Router setup
├── supabase/functions/
│   ├── create-user/                   # Create client user + link to company
│   ├── create-mechanic/               # Create mechanic user + link to mechanics table
│   ├── create-account-manager-user/   # Create AM user + link to account_managers
│   ├── get-ai-estimate/               # AI labor/parts estimate via Claude Haiku
│   ├── scan-vin-image/                # Claude Haiku vision → extract VIN from photo
│   └── generate-invoice-pdf/          # PDF invoice generation (admins only, pdf-lib)
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
#                 get-ai-estimate, scan-vin-image, generate-invoice-pdf

# Set Anthropic API key (required for AI estimate + VIN scan)
supabase.exe secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref kiayjlepwmdacojhpisq
```

## Supabase Config
- **Project URL:** https://kiayjlepwmdacojhpisq.supabase.co
- Credentials at top of `App.jsx`, `AdminDashboard.jsx`, `MechanicDashboard.jsx`
- To add a new admin: `insert into admins (id, email) select id, email from auth.users where email = 'user@example.com';`

@.claude/rules/schema.md
@.claude/rules/roles-rls.md
@.claude/rules/portals.md
@.claude/rules/billing.md
@.claude/rules/vehicle-registry.md
@.claude/rules/design.md
@.claude/rules/gotchas.md
