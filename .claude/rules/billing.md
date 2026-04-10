## Billing System (Admin Dashboard → Billing Tab)

### Invoice Status Flow
```
draft → submitted → approved → client_billed → paid
                 → rejected (admin can change back to draft/submitted to re-enter workflow)
                 → client_billed (direct, for client-pay invoices)
```

Statuses: `draft`, `submitted`, `approved`, `rejected`, `revise`, `client_billed`, `paid`
- **Removed statuses** (2026-04-09): `revision_requested`, `resubmitted`, `awaiting_payment_details`, `ready_to_process`
- **Revise** (added 2026-04-09): purely visual flag; admin clicks "Request Revision" on a rejected invoice → status becomes `revise`; signals that the invoice needs rework before resubmission
- Rejected invoices re-enter the workflow by changing status back to `draft` or `submitted`
- **Approved Revenue** stat only counts `approved` + `paid` (not `client_billed`)

### Incognito Invoices
- `invoices.is_incognito` boolean NOT NULL DEFAULT false
- Admin-only: hidden from AMs, mechanics, and clients via `.eq("is_incognito", false)` on all non-admin invoice queries
- InvoiceBuilder: "Incognito" checkbox in header; sets `is_incognito` on insert
- InvoiceTable: grey invoice number (`var(--dim)`) for incognito vs amber for regular
- InvoiceModal: "INCOGNITO" badge in header
- Filter bar: "Incognito" button spans both active + completed sections
- PDF: non-admin access blocked for incognito invoices in `generate-invoice-pdf`

### InvoiceModal Save Buttons
- **"Save & Stay"** — saves and keeps modal open (reloads data in background)
- **"Save & Close"** — saves and closes modal (original behavior)
- `handleSave(closeAfter)` param controls which callback fires: `onSaveAndStay` or `onSaveAndClose`
- Reverse-paid action always closes after completing

### InvoiceModal Auto-Save
- All form changes (fields, line items, tax, discount, status, RO#, invoice notes) auto-save with a 1.5s debounce
- Uses `autoSaveRef` + `autoSavingRef` + `initialRender` refs — skips first render, prevents overlaps
- Manual save button and approval/rejection → pricing history still work
- Submit confirmation removed — "submitted" is now just a visual status indicator, no confirmation modal or un-submit flow

### Invoice Notes
- `invoiceNotes` state saves to `invoices.notes` column
- Textarea labeled "Invoice Notes — appears on PDF" in InvoiceModal, above SR NotesLog
- Auto-saves via `notesRef` alongside other fields
- Rendered in PDF Notes section at bottom

### RO# (Repair Order Number)
- `invoices.ro_number` column (text, nullable)
- Manual entry field in InvoiceModal between totals section and status dropdown
- Auto-saves with the rest of the form

### Line Items Editor (`LineItemsEditor` component)
- Shared component used by both InvoiceBuilder and InvoiceModal
- Flat table with columns: `#`, `Service`, `Description`, `Qty`, `Rate`, `Amount` (computed), `Tax` (checkbox), Delete
- **Column layout**: fixed px for #/Qty/Rate/Amount/Tax/Delete; `2fr` for Service, `3fr` for Description — columns flex to fill container
- **Drag-to-reorder** via native HTML5 drag (six-dot grip handle on each row)
- **No resizable columns** — removed; fr-based layout auto-adapts to container width
- **Service presets autocomplete** — typing in Service column shows filtered dropdown from `service_presets` table
- Admins see "+ Save as preset" option when typing a name not in presets; free text always accepted
- "Add service" button adds blank row; "Clear all lines" resets to single empty row
- Empty ghost row at bottom for quick-add (click to add)
- Per-line `taxable` checkbox — tax only applies to checked lines (proportional after discount)
- New lines default to `taxable: false`
- **Tax defaults**: new invoices default to `taxType: "pct"`, `taxValue: "8.25"` (both InvoiceBuilder and InvoiceModal)

### Service Presets (`service_presets` table)
- `id` (uuid PK), `name` (text UNIQUE), `default_rate` (numeric nullable), `default_description` (text nullable), `created_by` (uuid), `created_at`
- RLS: admins full CRUD, everyone else SELECT only
- Selecting a preset auto-fills Rate and Description on that line (if defaults exist); all fields remain editable
- Presets are loaded once on component mount via `supabase.from("service_presets").select("*").order("name")`
- **"Manage Presets" button** (admin only): opens `ManagePresetsModal` — search, inline edit (name/description/rate/taxable), delete with two-step confirm

### line_items JSONB Format
**Current format (v4 — lineItems):**
```json
{ "lineItems": [{ "service": "Diagnostic", "description": "...", "qty": 1, "rate": 175, "taxable": false }], "settings": { "taxType": "pct", "taxValue": "8.25", "discountType": "none", "discountValue": "0" } }
```

**Legacy formats still supported on read (backward compat):**
- v3: `{ services: [{ name, labor_hours, labor_rate, parts: [{ description, quantity, rate, taxable }] }], settings }` — flattened to lineItems on load
- v2: `[{ name, labor_hours, labor_rate, parts: [...] }]` — same flattening
- v1: `[{ description, quantity, rate }]` — mapped directly

`servicestolineItems()` in `LineItemsEditor.jsx` handles all conversions. PDF edge function's `parseFlatLineItems()` handles the new format; `parseLineItems()` handles legacy.

### Invoice Builder
- Optional link to existing SR (auto-fills vehicle fields) → optional Line selector
- **No service_type dropdown** — service type is auto-derived from `lineItems[0].service` (first line item)
- When an SR is linked, line items auto-populate from the SR's service line names
- `labor_total`, `subtotal`, `total` are GENERATED columns — **never write them in INSERT/UPDATE**
- AI Estimate button **hidden** (kept in codebase but removed from UI until fully integrated)

### Bill To Contacts
- Global table `bill_to_contacts` (not company-scoped) — admins CRUD, AMs SELECT only
- Each vehicle can have a `default_bill_to_id` set in the Vehicle Registry edit modal
- When an SR is inserted and linked to a registry vehicle, the trigger copies `default_bill_to_id` → `invoices.bill_to_id` automatically
- Invoice Builder and InvoiceModal both have a "Bill To" dropdown selector (address/email/phone details removed from UI; data still stored)
- AMs can change the Bill To on invoices but cannot create/delete contacts
- **Admin "Bill To Contacts" button** in Billing tab top-right (next to New Invoice) — opens management modal
- On save: `bill_to_id` is the FK; `submission_target` is set to the contact's name (for pricing intel backward compat)
- Legacy invoices keep their old `submission_target` text value (auto_integrate/wheel/client) for display; `bill_to_id` = null
- Table column: **"Bill To"** (not "Target") — `getBillToLabel()` resolves contact name or falls back to legacy label

### Billing "Service Status" Column
- Shows per-line completion from `service_lines.is_completed`, NOT the SR's overall status
- `is_completed === true` → green "Complete" badge
- `is_completed === false` → amber "In Progress" badge
- No linked service line → "—"
- Same behavior in Admin and AM billing tables + InvoiceModal headers

### Pricing Intelligence Panel
- Shown in invoice builder once service name (from lineItems[0].service) + vehicle (make+model) + Bill To contact are set
- Queries `pricing_intelligence` view by `submission_target` (contact name for new invoices) → floor / ceiling / suggested / confidence
- "Apply Suggested Total" button **removed** (was tied to old labor hours model)
- `vehicleType` key = `{vehicle_make} {vehicle_model}` — must match between writes (InvoiceModal) and reads (PriceIntelPanel). Falls back to `vehicle_id` if make/model blank.

### Pricing History (Auto-Written)
- Written on first `approved` or `rejected` transition only (guarded — re-saves don't add duplicates)
- Written from `InvoiceModal.handleSave()` in AdminBilling.jsx

### Pricing Intelligence Algorithm
- **Floor:** `MAX(approved)` clamped to $185 min
- **Ceiling:** `MIN(rejected)`; null if never rejected
- **Suggested:** `(floor + ceiling) / 2`; fallback `MAX(approved, 220)` if no rejections
- **Confidence:** Low <4 pts / Medium 4–9 / High 10–19 / Very High 20+

### AI Estimate (`get-ai-estimate` Edge Function)
- **Hidden from UI** — edge function still deployed but button removed from InvoiceBuilder and InvoiceModal
- Will be re-integrated when adapted to populate flat lineItems format

### PDF Invoice (`generate-invoice-pdf` Edge Function)
- Two PDF buttons in `InvoiceModal`: **"Wheels PDF"** (JURMOBY) and **"Element PDF"** (Oversquare Mobile) — admin access
- Client access: same company + status must be `approved`, `client_billed`, or `paid`
  - **Paid/client_billed**: always downloadable (no extra checks)
  - **Approved**: requires line_items + service line is_completed
- Called with `{ invoice_id, brand }` + caller's session JWT in `Authorization: Bearer`
- `brand` param: `"wheels"` (default) or `"element"` — selects from `BRANDS` constant
- Uses `npm:pdf-lib@1.17.1` (no Puppeteer; no new frontend deps)
- **5-column line items table**: Service (bold) | Description | Qty | Rate | Amount
- Handles both new `lineItems` format (via `parseFlatLineItems()`) and legacy `services` format (via `parseLineItems()`)
- **PAID stamp**: green "PAID" text right-aligned below total for `status === "paid"`
- Invoice notes (`invoices.notes`) rendered in Notes section at bottom of PDF
- Invoice reference: `{request_number}-{line_letter}` (e.g. 1042-A); fallback `INV-[last 8 UUID chars]` if no linked SR
- **Invoice date** uses `billed_at` → `updated_at` → `created_at` (priority order)
- Due date: invoice date + 30 days (Net 30) — no `due_date` column on invoices
- Filename: `Invoice-XXXX-A-CompanyName.pdf`
- **Brand profiles**: Wheels = JURMOBY (no address); Element = Oversquare Mobile, 1249 Magnum, New Braunfels TX 78132

### Invoice Editor — Vehicle Fields
- Vehicle ID, VIN, Model are **read-only** in both InvoiceBuilder and InvoiceModal (auto-filled from linked SR)
- **Mileage** shown as read-only field when invoice is linked to an SR (via `requestsMileageMap`)
- Make and Year fields are **hidden** from the invoice editor (data still stored on invoice row; Model field includes make info)

### Linked Service Line Info Box
- Shown in both InvoiceBuilder (when a line is selected) and InvoiceModal (when `service_line_id` is set)
- Displays between the Bill To dropdown and the Line Items section
- Static read-only box showing: line letter, completion status, service name, notes, parts, last editor
- InvoiceBuilder uses `srLines` state (fetched with full fields); InvoiceModal fetches on mount via `service_line_id`

### Invoice Builder (Admin Billing tab)
- Optional SR link → optional Line selector (populated from SR's service_lines after SR is chosen)
- Selecting a Line stores `service_line_id` on the new invoice
- `service_line_id` is nullable — standalone invoices (no SR link) have it null
- When an SR is linked, line items auto-populate from the SR's service line names (via `useEffect` on `srLines`); deselecting the SR resets back to single empty line

### Reference Numbers
Each invoice is now tied to a specific service line. Reference format: `{request_number}-{line_letter}`.
- Operational SR context: `XXXX`
- Per-line invoice context: `XXXX-A`, `XXXX-B`, etc.
- Billing table "Invoice #" column shows `XXXX-A` format
- `invoices` has no `invoice_number` or `due_date` columns — add via migration if needed
- Merged invoices have `service_line_id = NULL` → display as `XXXX` (no line letter suffix)

### Invoice Merge
- **Checkbox column** on active invoices table — select 2+ invoices to enable "Merge Invoices" button
- **Restrictions**: same `company_id` required; cannot merge `paid` or `client_billed` invoices; different vehicles/SRs allowed
- **MergeModal**: pick primary invoice (keeps vehicle info, bill-to, tax settings); two-step confirm
- **Merge logic**: concatenates all `lineItems` arrays; primary's `settings` kept; `service_line_id` set to NULL; status reset to `draft`; notes concatenated with source invoice # prefixes; RO# falls back to first non-null
- **Cleanup**: secondary invoices deleted directly; SRs and service_lines unchanged — admin closes/cancels secondary SRs manually
- **Cross-SR merge**: handles invoices from different SRs (e.g. mechanic created duplicate SRs for same issue); primary's `service_request_id` kept
- Component: `MergeModal` in AdminBilling.jsx; helper `parsePrimaryLineItems()` extracts lineItems+settings from any format
