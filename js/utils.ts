// JMIT ERP — Shared UI Utilities (DRY, SOLID — Single Responsibility)
import { store } from "./store";

/** Format a number with the active company's currency symbol */
export function formatMoney(amount: number, decimals = 2): string {
  const settings = store.getSettings();
  const company = store.getActiveCompany();
  const symbol = (company && company.currency === 'PHP') ? '\u20B1' : '$';
  return symbol + amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function showModal(
  container: HTMLElement,
  options: {
    title: string;
    body: string;
    submitLabel?: string;
    onSubmit: (modalEl: HTMLElement) => void | Promise<void>;
    width?: string;
  }
): () => void {
  const id = "modal-" + Math.random().toString(36).slice(2, 8);
  const submitLabel = options.submitLabel ?? "Save";
  const width = options.width ?? "420px";
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = id;
  overlay.style.display = "flex";
  overlay.innerHTML = `<div class="modal-content" style="max-width:${width};">
      <div class="modal-header">
        <h3>${options.title}</h3>
        <button class="modal-close-btn" data-close="${id}">&times;</button>
      </div>
      <form id="${id}-form" style="padding: 1px 0;">
        ${options.body}
        <button type="submit" class="btn btn-primary btn-block" style="margin-top:12px;">${submitLabel}</button>
      </form>
    </div>`;
  container.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector(`[data-close="${id}"]`)!.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
  });
  overlay.querySelector(`#${id}-form`)!.addEventListener("submit", (ev) => {
    ev.preventDefault();
    options.onSubmit(overlay);
  });
  return close;
}

export function createCard(options: {
  title: string;
  body: string;
  headerRight?: string;
  className?: string;
}): string {
  return `<div class="card ${options.className ?? "animate-fade-in"}">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
        <h3 class="card-title">${options.title}</h3>
        ${options.headerRight ?? ""}
      </div>
      ${options.body}
    </div>`;
}

export function createTable(options: {
  headers: string[];
  rows: string[];
  emptyMessage?: string;
}): string {
  return `<div class="table-container">
      <table>
        <thead>
          <tr>${options.headers.map(h => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${options.rows.length > 0
            ? options.rows.join("")
            : `<tr><td colspan="${options.headers.length}" style="text-align:center;padding:24px;">
                ${options.emptyMessage ?? "No records found."}
              </td></tr>`
          }
        </tbody>
      </table>
    </div>`;
}

export function createTabs(tabs: { label: string; hash: string; active: boolean }[]): string {
  return `<div class="settings-tab-nav">
      ${tabs.map(t => `<button class="settings-tab-btn ${t.active ? "active" : ""}" onclick="window.location.hash='${t.hash}'">${t.label}</button>`).join("")}
    </div>`;
}

export function safeCall(
  fn: () => void,
  successMsg: string,
  errorFn?: (err: any) => string
): boolean {
  try {
    fn();
    (window as any).showToast(successMsg, "success");
    return true;
  } catch (err: any) {
    const msg = errorFn ? errorFn(err) : err.message;
    (window as any).showToast(msg, "danger");
    return false;
  }
}

export function confirmThen(
  message: string,
  fn: () => void,
  successMsg: string
): boolean {
  if (!confirm(message)) return false;
  return safeCall(fn, successMsg);
}

// ─── Export helpers ───

/** Trigger a CSV download from header+data arrays. */
export function exportCSV(filename: string, headers: string[], rows: string[][]): void {
  const BOM = "\uFEFF";
  const esc = (v: string): string => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = BOM + headers.map(esc).join(",") + "\n" +
    rows.map(r => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Open the browser/WebView native print dialog. */
export function printDocument(): void {
  window.print();
}

// Expose for inline onclick handlers (views don't import utils directly)
if (typeof window !== "undefined") {
  (window as any).__exportCSV = exportCSV;
  (window as any).__print = printDocument;
  (window as any).__getPrintHeaderHtml = getPrintHeaderHtml;
  (window as any).__getPrintFooterHtml = getPrintFooterHtml;
  (window as any).__renderAuditTrailSection = renderAuditTrailSection;
  (window as any).__renderStockJournalPreview = renderStockJournalPreview;
}

/** Build a JE preview table showing what will post. */
export function renderJEPreview(lines: { code: string; debit: number; credit: number }[]): string {
  if (!lines || lines.length === 0) return "";
  const accts = store.getAccounts();
  const lookup: Record<string, string> = {};
  accts.forEach(a => { lookup[a.code] = a.name; });
  let totalDr = 0, totalCr = 0;
  let rows = "";
  lines.forEach(l => {
    totalDr += l.debit;
    totalCr += l.credit;
    rows += `<tr>
      <td style="font-family:monospace;">${l.code}</td>
      <td>${lookup[l.code] || "—"}</td>
      <td style="text-align:right;color:var(--color-o2c);">${l.debit > 0 ? formatMoney(l.debit) : ""}</td>
      <td style="text-align:right;color:var(--color-danger);">${l.credit > 0 ? formatMoney(l.credit) : ""}</td>
    </tr>`;
  });
  return `<details class="card" style="margin-top:16px;padding:12px;cursor:pointer;">
    <summary style="font-weight:700;font-size:0.9rem;">📋 Journal Entry Preview (DR: ${formatMoney(totalDr)} = CR: ${formatMoney(totalCr)}${Math.abs(totalDr - totalCr) > 0.01 ? ' ⚠️ UNBALANCED' : ' ✓'})</summary>
    <div class="table-container" style="margin-top:8px;"><table>
      <thead><tr><th>Code</th><th>Account</th><th style="text-align:right;">Debit</th><th style="text-align:right;">Credit</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </details>`;
}

/** Get active company print header HTML */
export function getPrintHeaderHtml(): string {
  const company = store.getActiveCompany();
  if (company && company.printHeaderHtml) {
    return `<div class="print-header" style="margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">${company.printHeaderHtml}</div>`;
  }
  return "";
}

/** Get active company print footer HTML */
export function getPrintFooterHtml(): string {
  const company = store.getActiveCompany();
  if (company && company.printFooterHtml) {
    return `<div class="print-footer" style="margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 12px; font-size: 0.8rem; text-align: center;">${company.printFooterHtml}</div>`;
  }
  return "";
}

/** Render audit trail history log */
export function renderAuditTrailSection(doc: any): string {
  const trail = doc.auditTrail || [];
  if (trail.length === 0) return "";
  let rows = "";
  trail.forEach((t: any) => {
    rows += `<tr>
      <td><span class="badge badge-draft" style="text-transform: capitalize; padding: 2px 6px;">${t.action}</span></td>
      <td><strong>${t.user}</strong></td>
      <td class="text-muted" style="font-family:monospace; font-size:0.75rem;">${t.timestamp}</td>
    </tr>`;
  });
  return `
    <div class="no-print" style="margin-top: 30px; border-top: 1px dashed var(--border-color); padding-top: 20px;">
      <h4 style="font-size: 0.85rem; text-transform: uppercase; margin-bottom: 12px; color: var(--color-primary); display:flex; align-items:center; gap:6px;">
        📜 Transaction Audit Trail History
      </h4>
      <div class="table-container" style="max-height: 150px; overflow-y: auto;">
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Triggered By</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/** Render stock journal movement preview */
export function renderStockJournalPreview(items: any[], srcWhName: string, destWhName: string, direction: string): string {
  let rows = "";
  items.forEach(i => {
    const item = store.getItem(i.itemId);
    const sku = item ? item.sku : "?";
    const name = item ? item.name : "Unknown";
    const qty = i.qty !== undefined ? i.qty : (i.acceptedQty !== undefined ? i.acceptedQty : 0);
    const flowColor = direction === 'IN' ? 'color:var(--color-o2c);' : direction === 'OUT' ? 'color:var(--color-danger);' : 'color:var(--color-primary);';
    rows += `<tr>
      <td style="font-family:monospace;">${sku}</td>
      <td><strong>${name}</strong></td>
      <td>${srcWhName}</td>
      <td>${destWhName}</td>
      <td style="text-align:right; font-weight:700; ${flowColor}">${qty}</td>
      <td><span class="badge ${direction === 'IN' ? 'badge-success' : direction === 'OUT' ? 'badge-danger' : 'badge-pending'}">${direction}</span></td>
    </tr>`;
  });
  return `
    <div style="margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 16px;">
      <h4 style="font-size: 0.85rem; text-transform: uppercase; margin-bottom: 8px; color: var(--color-inventory);">📦 Stock Movement Journal Preview</h4>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Description</th>
              <th>Source Facility</th>
              <th>Target Facility</th>
              <th style="text-align:right;">Qty</th>
              <th>Direction</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
