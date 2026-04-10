// Session-persisted filter state — survives tab switches and realtime refreshes
export function ssGet(key, fallback = "") { try { return sessionStorage.getItem(key) ?? fallback; } catch { return fallback; } }
export function ssSet(key, val) { try { sessionStorage.setItem(key, val); } catch {} }

export const STATUS_OPTIONS = ["pending", "in_progress", "completed", "cancelled"];
export const STATUS_LABELS  = { pending:"Pending", in_progress:"In Progress", completed:"Completed", cancelled:"Cancelled" };

export const SUBMISSION_TARGETS = ["auto_integrate", "wheel", "client"];
export const TARGET_LABELS = { auto_integrate: "Auto Integrate", wheel: "Wheel", client: "Client" };
export const INVOICE_STATUSES = ["draft", "submitted", "approved", "rejected", "revise", "client_billed", "paid"];
export const INVOICE_STATUS_LABELS = {
  draft: "Draft", submitted: "Submitted", approved: "Approved",
  rejected: "Rejected", revise: "Revise", client_billed: "Client Billed", paid: "Paid",
};
export const HARD_FLOOR  = 185;   // minimum labor rate $/hr
export const DEFAULT_RATE = 235;  // default starting labor rate $/hr
export const SERVICE_TYPES = [
  "Oil Change", "Tire Rotation", "Brake Service", "Engine Repair",
  "Transmission Service", "AC/Heat Repair", "Electrical Diagnosis",
  "Suspension / Steering", "Alignment", "Exhaust", "Fluid Service",
  "Preventive Maintenance", "DOT Inspection", "Other",
];
