## Vehicle Registry

### Overview
- `vehicles` table with unique constraint `(company_id, vehicle_id)` — different companies can share vehicle IDs
- Three statuses: `Road Worthy`, `Retired`, `Not Road Worthy` (check constraint enforced)
- `VehicleRegistry` component lives in `AdminDashboard.jsx`
- Editing a vehicle updates only the `vehicles` table — does NOT retroactively change SR snapshots
- Company is locked on edit — to move a vehicle, deactivate old and create new

### Status Behavior
| Status          | SR Lookup | Behavior |
|-----------------|-----------|----------|
| Road Worthy     | Allowed   | No restriction |
| Retired         | Blocked   | Red banner; form submission blocked |
| Not Road Worthy | Allowed   | Amber warning banner in lookup; mechanic UpdateModal has toggle buttons to change status |

Registry lookup queries all statuses and branches on result — no `.eq("active", true)` filter.

### New Request Form Integration (Admin + Mechanic)
1. Select Company → type Vehicle ID → click "Look up" (or Enter)
2. Queries `vehicles WHERE company_id = ? AND vehicle_id = ?` via `.maybeSingle()`
3. **Match:** green banner; VIN/Year/Make/Model/License Plate locked as read-only; `vehicle_registry_id` written to SR on submit
4. **No match:** muted banner; all vehicle fields editable; "Save to registry after submit" checkbox available
5. Changing company or vehicle ID resets registry state (`registryVehicle = null`)
6. Mileage is always manual regardless of registry state

### Save-to-Registry Path
- Inserts to `vehicles` first, uses new id for SR insert
- On `23505` duplicate (race condition): SR saves with `vehicle_registry_id = null` — user not blocked

### SR Linkage
- `vehicle_registry_id` is nullable — pre-registry SRs and non-lookup SRs have null
- `ON DELETE SET NULL` — deleting a vehicle nulls the reference on linked SRs without breaking them
- SR history in vehicle detail modal: `service_requests WHERE vehicle_registry_id = v.id`

### Duplicate SR Detection
Runs on first submit attempt across all 3 portals (Admin, Mechanic, Client):
- Checks active (`pending`/`in_progress`) SRs with same VIN + service_type + mileage
- Shows amber warning banner with matching SR numbers; button → "Submit Anyway"
- Second click bypasses check (`duplicateWarning !== null`)
- Editing VIN, service_type, or mileage resets `duplicateWarning` to null
- Skipped if any of the three fields are empty
