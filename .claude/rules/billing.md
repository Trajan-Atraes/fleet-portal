## Billing System (Admin Dashboard → Billing Tab)

### Invoice Status Flow
```
draft → submitted → approved  → client_billed → paid
                 → rejected
                 → client_billed (direct, for client-pay invoices)
```

### Invoice Builder
- Optional link to existing SR (auto-fills vehicle/service fields)
- Line items: labor (hours × rate), parts cost, diagnostic fee, tax
- Labor rate: hard floor **$185/hr** (enforced in UI + DB check constraint); default **$220/hr**
- `labor_total`, `subtotal`, `total` are GENERATED columns — **never write them in INSERT/UPDATE**
- `line_items` JSONB has 3 historical formats — PDF edge function and InvoiceModal both handle all three; do not simplify without migrating existing data

### Bill To Contacts
- Global table `bill_to_contacts` (not company-scoped) — admins CRUD, AMs SELECT only
- Each vehicle can have a `default_bill_to_id` set in the Vehicle Registry edit modal
- When an SR is inserted and linked to a registry vehicle, the trigger copies `default_bill_to_id` → `invoices.bill_to_id` automatically
- Invoice Builder and InvoiceModal both have a "Bill To" selector; selecting a contact auto-shows address/email/phone
- AMs can change the Bill To on invoices but cannot create/delete contacts
- **Admin "Bill To Contacts" button** in Billing tab top-right (next to New Invoice) — opens management modal
- On save: `bill_to_id` is the FK; `submission_target` is set to the contact's name (for pricing intel backward compat)
- Legacy invoices keep their old `submission_target` text value (auto_integrate/wheel/client) for display; `bill_to_id` = null
- Table column: **"Bill To"** (not "Target") — `getBillToLabel()` resolves contact name or falls back to legacy label

### Pricing Intelligence Panel
- Shown in invoice builder once service_type + vehicle (make+model) + Bill To contact are set
- Queries `pricing_intelligence` view by `submission_target` (contact name for new invoices) → floor / ceiling / suggested / confidence
- "Apply Suggested Total" redistributes suggested total into labor hours (parts/diag/tax stay fixed)
- `vehicleType` key = `{vehicle_make} {vehicle_model}` — must match between writes (InvoiceModal) and reads (PriceIntelPanel). Falls back to `vehicle_id` if make/model blank.

### Pricing History (Auto-Written)
- Written on first `approved` or `rejected` transition only (guarded — re-saves don't add duplicates)
- Written from `InvoiceModal.handleSave()` in AdminDashboard.jsx

### Pricing Intelligence Algorithm
- **Floor:** `MAX(approved)` clamped to $185 min
- **Ceiling:** `MIN(rejected)`; null if never rejected
- **Suggested:** `(floor + ceiling) / 2`; fallback `MAX(approved, 220)` if no rejections
- **Confidence:** Low <4 pts / Medium 4–9 / High 10–19 / Very High 20+

### AI Estimate (`get-ai-estimate` Edge Function)
- "AI Estimate" button in invoice builder → calls Claude Haiku server-side
- Returns: `labor_hours`, `parts_cost`, `diagnostic_fee`, `parts_description`, `labor_description`
- Requires `ANTHROPIC_API_KEY` secret: `supabase.exe secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref kiayjlepwmdacojhpisq`

### PDF Invoice (`generate-invoice-pdf` Edge Function)
- "Download PDF" in `InvoiceModal` — **admin-only** (not in AM or other portals)
- Called with `{ invoice_id }` + caller's session JWT in `Authorization: Bearer`
- Edge function verifies admin via RLS (`admins` table check) — do not remove
- Uses `npm:pdf-lib@1.17.1` (no Puppeteer; no new frontend deps)
- Fetches: invoice, company, SR (`request_number`), vehicle registry (`license_plate`), service_lines via `service_line_id`
- Invoice reference: `SR-{request_number}-{line_letter}` (e.g. SR-1042-A); fallback `INV-[last 8 UUID chars]` if no linked SR
- Due date: `created_at + 30 days` (Net 30) — no `due_date` column on invoices
- Filename: `Invoice-SR-XXXX-A-CompanyName.pdf`
- **`BUSINESS` constant** at top of `index.ts` — must be updated with real values and redeployed before sending PDFs to clients

### Invoice Builder (Admin Billing tab)
- Optional SR link → optional Line selector (populated from SR's service_lines after SR is chosen)
- Selecting a Line stores `service_line_id` on the new invoice
- `service_line_id` is nullable — standalone invoices (no SR link) have it null

### Reference Numbers
Each invoice is now tied to a specific service line. Reference format: `SR-{request_number}-{line_letter}`.
- Operational SR context: `SR-XXXX`
- Per-line invoice context: `SR-XXXX-A`, `SR-XXXX-B`, etc.
- Billing table "Invoice #" column shows `SR-XXXX-A` format
- `invoices` has no `invoice_number` or `due_date` columns — add via migration if needed
