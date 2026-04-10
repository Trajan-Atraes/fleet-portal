import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts, PageSizes } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Brand profiles ─────────────────────────────────────────────
const BRANDS: Record<string, { name: string; tagline: string; phone: string; email: string; address?: string }> = {
  wheels: {
    name:    "JURMOBY",
    tagline: "Commercial Fleet Maintenance",
    phone:   "(830) 245-0120",
    email:   "billing@jurmoby.com",
  },
  element: {
    name:    "Oversquare Mobile",
    tagline: "Commercial Fleet Maintenance",
    phone:   "+1 (775) 340-5411",
    email:   "oversquaremobile@gmail.com",
    address: "1249 Magnum, New Braunfels, TX 78132",
  },
};
// ────────────────────────────────────────────────────────────────

const HARD_FLOOR   = 185;
const DEFAULT_RATE = 220;




function fmt(n: number): string {
  return `$${Number(n || 0).toFixed(2)}`;
}

function trunc(str: string, maxW: number, font: { widthOfTextAtSize: (s: string, n: number) => number }, size: number): string {
  if (!str) return "";
  if (font.widthOfTextAtSize(str, size) <= maxW) return str;
  let s = str;
  while (s.length > 0 && font.widthOfTextAtSize(s + "…", size) > maxW) s = s.slice(0, -1);
  return s + "…";
}

interface Part    { description: string; quantity: number; rate: number }
interface Service { name: string; labor_hours: number; labor_rate: number; parts: Part[] }
interface FlatLineItem { service: string; description: string; qty: number; rate: number; taxable: boolean }

function parseFlatLineItems(li: unknown): FlatLineItem[] | null {
  if (!li || Array.isArray(li)) return null;
  const obj = li as any;
  if (!obj.lineItems) return null;
  return (obj.lineItems as any[]).map((item: any) => ({
    service:     item.service     || "",
    description: item.description || "",
    qty:         parseFloat(item.qty)  || 0,
    rate:        parseFloat(item.rate) || 0,
    taxable:     !!item.taxable,
  }));
}

function parseLineItems(li: unknown): Service[] {
  if (!li) return [];
  const obj = li as any;
  // Skip new lineItems format — handled separately
  if (!Array.isArray(obj) && obj.lineItems) return [];
  const mapPart = (p: any): Part => ({
    description: p.description || "",
    quantity:    parseFloat(p.quantity)  || 1,
    rate:        parseFloat(p.rate != null ? p.rate : (p.amount || 0)) || 0,
  });
  const mapSvc = (s: any): Service => ({
    name:        s.name        || "",
    labor_hours: parseFloat(s.labor_hours) || 0,
    labor_rate:  parseFloat(s.labor_rate)  || DEFAULT_RATE,
    parts:       (s.parts || []).map(mapPart),
  });
  if (!Array.isArray(obj) && obj.services) return obj.services.map(mapSvc);
  if (Array.isArray(obj) && obj.length > 0 && obj[0].parts !== undefined) return obj.map(mapSvc);
  return [];
}

function getSettings(li: unknown) {
  if (!li || Array.isArray(li)) return { taxType: "flat", taxValue: 0, discountType: "none", discountValue: 0 };
  const s = (li as any).settings || {};
  return {
    taxType:       s.taxType       || "flat",
    taxValue:      parseFloat(s.taxValue)      || 0,
    discountType:  s.discountType  || "none",
    discountValue: parseFloat(s.discountValue) || 0,
  };
}

// ── Drawing context wraps the current page so we can add pages cleanly ──
function makeCtx(pdfDoc: PDFDocument, pageW: number, pageH: number, fontReg: any, fontBold: any) {
  const MARGIN = 50;
  const ctx = {
    page: pdfDoc.addPage(PageSizes.Letter as [number, number]),
    y:    pageH - MARGIN,
    MARGIN,
    contentW: pageW - MARGIN * 2,
    pageH,

    newPage() {
      ctx.page = pdfDoc.addPage(PageSizes.Letter as [number, number]);
      ctx.y = pageH - MARGIN;
    },

    ensureSpace(needed: number) {
      if (ctx.y - needed < MARGIN + 60) ctx.newPage();
    },

    t(text: string, x: number, yp: number, font = fontReg, size = 10, color = dark) {
      ctx.page.drawText(String(text || ""), { x, y: yp, font, size, color });
    },
    line(x1: number, y1: number, x2: number, y2: number, color = borderC, thickness = 0.5) {
      ctx.page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color, thickness });
    },
    rect(x: number, yp: number, w: number, h: number, color: ReturnType<typeof rgb>) {
      ctx.page.drawRectangle({ x, y: yp, width: w, height: h, color });
    },
  };
  return ctx;
}

// Colors
const dark    = rgb(0.10,  0.10,  0.10);
const mid     = rgb(0.45,  0.45,  0.45);
const light   = rgb(0.65,  0.65,  0.65);
const borderC = rgb(0.82,  0.82,  0.82);
const rowAlt  = rgb(0.965, 0.965, 0.965);
const tblHead = rgb(0.13,  0.13,  0.13);
const white   = rgb(1, 1, 1);
const amber   = rgb(0.961, 0.620, 0.043);
const green   = rgb(0.063, 0.725, 0.506);
const red     = rgb(0.937, 0.267, 0.267);
const blue    = rgb(0.231, 0.510, 0.965);




Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const jsonErr = (msg: string, status = 400) =>
    new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // ── Auth ───────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return jsonErr("Unauthorized", 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller identity
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return jsonErr("Unauthorized", 401);

    const { data: adminRow } = await userClient.from("admins").select("id").maybeSingle();
    const isAdmin = !!adminRow;

    const { invoice_id, brand: brandKey } = await req.json();
    if (!invoice_id) return jsonErr("invoice_id is required");
    const BUSINESS = BRANDS[brandKey || "wheels"] || BRANDS.wheels;

    // ── Fetch data ─────────────────────────────────────────────
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: invoice, error: invErr } = await admin
      .from("invoices").select("*").eq("id", invoice_id).single();
    if (invErr || !invoice) return jsonErr("Invoice not found", 404);

    // Incognito invoices: admin-only
    if (!isAdmin && invoice.is_incognito)
      return jsonErr("Forbidden", 403);

    // Client access: must belong to same company + status gate
    if (!isAdmin) {
      const { data: companyLink } = await admin
        .from("company_users").select("company_id").eq("user_id", user.id).maybeSingle();
      if (!companyLink || companyLink.company_id !== invoice.company_id)
        return jsonErr("Forbidden", 403);
      if (invoice.status !== "approved" && invoice.status !== "client_billed" && invoice.status !== "paid")
        return jsonErr("Invoice not available for download", 403);
      // Paid/billed invoices always downloadable; approved requires line_items + completion
      if (invoice.status === "approved") {
        if (!invoice.line_items || (Array.isArray(invoice.line_items) && invoice.line_items.length === 0))
          return jsonErr("Invoice not available for download", 403);
        if (invoice.service_line_id) {
          const { data: line } = await admin
            .from("service_lines").select("is_completed").eq("id", invoice.service_line_id).maybeSingle();
          if (!line?.is_completed)
            return jsonErr("Invoice not available for download", 403);
        }
      }
    }

    const [{ data: company }, { data: serviceRequest }, { data: vehicle }, { data: serviceLine }] = await Promise.all([
      invoice.company_id
        ? admin.from("companies").select("name,address,phone,email").eq("id", invoice.company_id).maybeSingle()
        : Promise.resolve({ data: null }),
      invoice.service_request_id
        ? admin.from("service_requests").select("request_number").eq("id", invoice.service_request_id).maybeSingle()
        : Promise.resolve({ data: null }),
      invoice.vehicle_registry_id
        ? admin.from("vehicles").select("license_plate").eq("id", invoice.vehicle_registry_id).maybeSingle()
        : Promise.resolve({ data: null }),
      invoice.service_line_id
        ? admin.from("service_lines").select("line_letter").eq("id", invoice.service_line_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    // ── Compute totals from line_items ─────────────────────────
    const flatItems = parseFlatLineItems(invoice.line_items);
    const services = parseLineItems(invoice.line_items);
    const settings = getSettings(invoice.line_items);
    const hasFlat = flatItems && flatItems.length > 0;

    let itemsTotal: number;
    if (hasFlat) {
      itemsTotal = flatItems.reduce((s, li) => s + li.qty * li.rate, 0);
    } else {
      itemsTotal = services.reduce((sum, svc) => {
        const lr    = Math.max(svc.labor_rate || DEFAULT_RATE, HARD_FLOOR);
        const labor = lr * svc.labor_hours;
        const parts = svc.parts.reduce((s, p) => s + p.quantity * p.rate, 0);
        return sum + labor + parts;
      }, 0);
    }

    const discountAmt  = settings.discountType === "flat"  ? settings.discountValue
                       : settings.discountType === "pct"   ? itemsTotal * settings.discountValue / 100
                       : 0;
    const afterDiscount = Math.max(itemsTotal - discountAmt, 0);
    const taxableTotal = hasFlat
      ? flatItems.filter(li => li.taxable).reduce((s, li) => s + li.qty * li.rate, 0)
      : itemsTotal; // old format: all taxable
    const taxableAfterDiscount = itemsTotal > 0 ? afterDiscount * (taxableTotal / itemsTotal) : 0;
    const taxAmt        = settings.taxType === "pct"
                        ? taxableAfterDiscount * settings.taxValue / 100
                        : settings.taxValue;
    const grandTotal    = afterDiscount + taxAmt;
    // Fallback to DB total if line_items produced nothing (very old format invoices)
    const hasItems = hasFlat || services.length > 0;
    const displayTotal  = hasItems ? grandTotal : (Number(invoice.total) || 0);

    // ── Build PDF ──────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();
    const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const PAGE_W = 612, PAGE_H = 792;
    const ctx = makeCtx(pdfDoc, PAGE_W, PAGE_H, fontReg, fontBold);
    const { MARGIN, contentW } = ctx;

    const invoiceRef = serviceRequest?.request_number
      ? `${serviceRequest.request_number}${serviceLine?.line_letter ? `-${serviceLine.line_letter}` : ""}`
      : "INV-" + invoice_id.replace(/-/g, "").slice(-8).toUpperCase();
    const billedDate = invoice.billed_at || invoice.updated_at || invoice.created_at;
    const invDateStr = new Date(billedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const dueDate    = new Date(billedDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    // ── SECTION: Header ────────────────────────────────────────
    // Left: business identity
    ctx.t(BUSINESS.name,        MARGIN, ctx.y,      fontBold, 22, amber);
    ctx.t(BUSINESS.tagline,     MARGIN, ctx.y - 17, fontReg,   9, mid);
    let headerInfoY = ctx.y - 29;
    if (BUSINESS.address) { ctx.t(BUSINESS.address, MARGIN, headerInfoY, fontReg, 9, mid); headerInfoY -= 12; }
    ctx.t(`${BUSINESS.phone}  ·  ${BUSINESS.email}`, MARGIN, headerInfoY, fontReg, 9, mid);

    // Right: INVOICE title + metadata
    const titleW   = fontBold.widthOfTextAtSize("INVOICE", 26);
    const rightX   = PAGE_W - MARGIN - titleW;
    ctx.t("INVOICE", rightX, ctx.y, fontBold, 26, dark);

    const metaX    = PAGE_W - MARGIN - 200;
    const metaRows = [
      { label: "Invoice #:",    value: invoiceRef },
      { label: "Invoice Date:", value: invDateStr },
      { label: "Due Date:",     value: `${dueDateStr} (Net 30)` },
    ];
    let metaY = ctx.y - 20;
    for (const row of metaRows) {
      const lw = fontBold.widthOfTextAtSize(row.label, 9);
      ctx.t(row.label, metaX, metaY, fontBold, 9, mid);
      ctx.t(row.value, metaX + lw + 4, metaY, fontReg, 9, dark);
      metaY -= 13;
    }
    ctx.y -= 70;

    // Amber divider
    ctx.line(MARGIN, ctx.y, PAGE_W - MARGIN, ctx.y, amber, 1.5);
    ctx.y -= 20;

    // ── SECTION: Bill To + Vehicle & Service (two columns) ────
    const col1X = MARGIN;
    const col2X = MARGIN + contentW / 2 + 10;
    const sectionTopY = ctx.y;

    // Left column: Bill To
    ctx.t("BILL TO", col1X, ctx.y, fontBold, 8, mid);
    let leftY = ctx.y - 14;
    ctx.t(company?.name || "—", col1X, leftY, fontBold, 11, dark);
    leftY -= 14;
    if (company?.address) { ctx.t(company.address, col1X, leftY, fontReg, 9, mid); leftY -= 12; }
    if (company?.phone)   { ctx.t(company.phone,   col1X, leftY, fontReg, 9, mid); leftY -= 12; }
    if (company?.email)   { ctx.t(company.email,   col1X, leftY, fontReg, 9, mid); leftY -= 12; }

    // Right column: Vehicle & Service
    ctx.t("VEHICLE", col2X, sectionTopY, fontBold, 8, mid);
    let rightY = sectionTopY - 14;
    const vRows: [string, string][] = [];
    if (invoice.vehicle_id) vRows.push(["Unit #", invoice.vehicle_id]);
    const vLine = [invoice.vehicle_year, invoice.vehicle_make, invoice.vehicle_model].filter(Boolean).join(" ");
    if (vLine) vRows.push(["Vehicle", vLine]);
    if (invoice.vin) vRows.push(["VIN", invoice.vin]);
    if (vehicle?.license_plate) vRows.push(["License Plate", vehicle.license_plate]);

    for (const [label, value] of vRows) {
      const lw = fontBold.widthOfTextAtSize(`${label}: `, 9);
      ctx.t(`${label}: `, col2X, rightY, fontBold, 9, mid);
      ctx.t(trunc(value, contentW / 2 - lw - 10, fontReg, 9), col2X + lw, rightY, fontReg, 9, dark);
      rightY -= 12;
    }

    // Advance y past whichever column was taller
    ctx.y = Math.min(leftY, rightY) - 14;

    // ── SECTION: Line Items Table ─────────────────────────────
    ctx.ensureSpace(80);
    ctx.line(MARGIN, ctx.y, PAGE_W - MARGIN, ctx.y, borderC, 0.5);
    ctx.y -= 14;

    ctx.t("LINE ITEMS", MARGIN, ctx.y, fontBold, 8, mid);
    ctx.y -= 10;

    // Column definitions: Service, Description, Qty, Rate, Amount
    const COLS = [
      { x: MARGIN,                   w: contentW * 0.22, label: "Service",      align: "left"  },
      { x: MARGIN + contentW * 0.22, w: contentW * 0.34, label: "Description",  align: "left"  },
      { x: MARGIN + contentW * 0.56, w: contentW * 0.12, label: "Qty",          align: "right" },
      { x: MARGIN + contentW * 0.68, w: contentW * 0.16, label: "Rate",         align: "right" },
      { x: MARGIN + contentW * 0.84, w: contentW * 0.16, label: "Amount",       align: "right" },
    ];
    const ROW_H = 20;
    const TEXT_SIZE = 9;
    const HEAD_SIZE = 8;

    // Table header
    ctx.rect(MARGIN, ctx.y - ROW_H, contentW, ROW_H, tblHead);
    const headTextY = ctx.y - ROW_H / 2 - HEAD_SIZE / 2;
    for (const col of COLS) {
      const tx = col.align === "right"
        ? col.x + col.w - fontBold.widthOfTextAtSize(col.label, HEAD_SIZE) - 6
        : col.x + 6;
      ctx.t(col.label, tx, headTextY, fontBold, HEAD_SIZE, white);
    }
    ctx.y -= ROW_H;

    let rowIdx = 0;

    const drawRow = (service: string, desc: string, qty: string, rate: string, total: string) => {
      ctx.ensureSpace(ROW_H + 10);
      if (rowIdx % 2 === 1) ctx.rect(MARGIN, ctx.y - ROW_H, contentW, ROW_H, rowAlt);

      const textY = ctx.y - ROW_H / 2 - TEXT_SIZE / 2;
      ctx.t(trunc(service, COLS[0].w - 12, fontBold, TEXT_SIZE), COLS[0].x + 6, textY, fontBold, TEXT_SIZE, dark);
      ctx.t(trunc(desc,    COLS[1].w - 12, fontReg,  TEXT_SIZE), COLS[1].x + 6, textY, fontReg,  TEXT_SIZE, mid);

      const qw = fontReg.widthOfTextAtSize(qty,   TEXT_SIZE);
      const rw = fontReg.widthOfTextAtSize(rate,   TEXT_SIZE);
      const tw = fontBold.widthOfTextAtSize(total, TEXT_SIZE);
      ctx.t(qty,   COLS[2].x + COLS[2].w - qw - 6, textY, fontReg,  TEXT_SIZE, dark);
      ctx.t(rate,  COLS[3].x + COLS[3].w - rw - 6, textY, fontReg,  TEXT_SIZE, dark);
      ctx.t(total, COLS[4].x + COLS[4].w - tw - 6, textY, fontBold, TEXT_SIZE, dark);

      ctx.y -= ROW_H;
      rowIdx++;
    };

    if (hasFlat) {
      for (const item of flatItems) {
        if (!item.service && !item.description && !item.rate) continue;
        drawRow(
          item.service || "",
          item.description || "",
          String(item.qty),
          fmt(item.rate),
          fmt(item.qty * item.rate),
        );
      }
    } else {
      // Legacy services format
      for (const svc of services) {
        const lr         = Math.max(svc.labor_rate || DEFAULT_RATE, HARD_FLOOR);
        const laborTotal = lr * svc.labor_hours;

        if (svc.labor_hours > 0) {
          drawRow(
            svc.name || "Labor",
            "Labor",
            `${svc.labor_hours} hrs`,
            `${fmt(lr)}/hr`,
            fmt(laborTotal),
          );
        }

        for (const part of svc.parts) {
          if (!part.description && !part.rate) continue;
          drawRow(
            svc.name || "",
            part.description || "Part",
            String(part.quantity),
            fmt(part.rate),
            fmt(part.quantity * part.rate),
          );
        }
      }
    }

    // Fallback row for very old invoices with no parseable line_items
    if (rowIdx === 0) {
      drawRow("Services rendered", "", "1", fmt(displayTotal), fmt(displayTotal));
    }

    // Table bottom border
    ctx.line(MARGIN, ctx.y, PAGE_W - MARGIN, ctx.y, borderC, 0.5);
    ctx.y -= 14;

    // ── SECTION: Totals ────────────────────────────────────────
    ctx.ensureSpace(120);
    const totX      = MARGIN + contentW * 0.58;
    const totLabelX = totX;
    const totValueX = PAGE_W - MARGIN;
    const TROW_H    = 15;

    const drawTotal = (label: string, value: string, bold = false, size = 9, color = dark) => {
      const vw = (bold ? fontBold : fontReg).widthOfTextAtSize(value, size);
      ctx.t(label, totLabelX, ctx.y, bold ? fontBold : fontReg, size, mid);
      ctx.t(value, totValueX - vw, ctx.y, bold ? fontBold : fontReg, size, color);
      ctx.y -= bold ? size + 10 : TROW_H;
    };

    if (hasItems) {
      drawTotal("Subtotal", fmt(itemsTotal));
      if (discountAmt > 0) {
        drawTotal(
          `Discount${settings.discountType === "pct" ? ` (${settings.discountValue}%)` : ""}`,
          `-${fmt(discountAmt)}`,
        );
        drawTotal("After discount", fmt(afterDiscount));
      }
      drawTotal(
        `Tax${settings.taxType === "pct" ? ` (${settings.taxValue}%)` : ""}`,
        fmt(taxAmt),
      );
    }

    ctx.line(totX, ctx.y + TROW_H - 2, PAGE_W - MARGIN, ctx.y + TROW_H - 2, borderC, 0.5);
    drawTotal("TOTAL", fmt(displayTotal), true, 14, dark);

    // "PAID" stamp for paid invoices
    if (invoice.status === "paid") {
      ctx.y -= 4;
      const paidColor = rgb(0.2, 0.72, 0.36);
      const paidW = fontBold.widthOfTextAtSize("PAID", 18);
      ctx.t("PAID", PAGE_W - MARGIN - paidW, ctx.y, fontBold, 18, paidColor);
      ctx.y -= 10;
    }

    ctx.y -= 6;

    // ── SECTION: Notes ─────────────────────────────────────────
    if (invoice.notes?.trim()) {
      ctx.ensureSpace(40);
      ctx.line(MARGIN, ctx.y, PAGE_W - MARGIN, ctx.y, borderC, 0.5);
      ctx.y -= 14;
      ctx.t("NOTES", MARGIN, ctx.y, fontBold, 8, mid);
      ctx.y -= 12;

      // Wrap text
      const maxNoteW = contentW;
      const words = invoice.notes.trim().split(/\s+/);
      let noteLine = "";
      for (const word of words) {
        const test = noteLine ? `${noteLine} ${word}` : word;
        if (fontReg.widthOfTextAtSize(test, 9) > maxNoteW) {
          if (noteLine) { ctx.t(noteLine, MARGIN, ctx.y, fontReg, 9, mid); ctx.y -= 12; }
          noteLine = word;
        } else {
          noteLine = test;
        }
      }
      if (noteLine) { ctx.t(noteLine, MARGIN, ctx.y, fontReg, 9, mid); ctx.y -= 12; }
    }

    // ── FOOTER (pinned to bottom of last page) ─────────────────
    const footerY   = MARGIN;
    const footerStr = `${BUSINESS.name}  ·  ${BUSINESS.phone}  ·  ${BUSINESS.email}`;
    const footerW   = fontReg.widthOfTextAtSize(footerStr, 8);
    ctx.line(MARGIN, footerY + 18, PAGE_W - MARGIN, footerY + 18, borderC, 0.5);
    ctx.t(footerStr, (PAGE_W - footerW) / 2, footerY + 6, fontReg, 8, light);

    // ── Serialize & return ─────────────────────────────────────
    const pdfBytes   = await pdfDoc.save();
    const companySlug = (company?.name || "Unknown").replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").slice(0, 30);
    const filename   = `Invoice-${invoiceRef}-${companySlug}.pdf`;

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "PDF generation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
