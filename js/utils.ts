// JMIT ERP — Shared UI Utilities (DRY, SOLID — Single Responsibility)
// Every view module should import these instead of repeating boilerplate.

/**
 * Render a modal dialog into a container element.
 * Closes on backdrop click, Escape key, and close button.
 * @returns cleanup function to remove the modal
 */

// --- Currency formatting ---
import { store } from "./store";

/** Format a number with the active company's currency symbol */
export function formatMoney(amount: number, decimals = 2): string {
  const settings = store.getSettings();
  const company = store.getActiveCompany();
  const symbol = (company && company.currency === 'PHP') ? '₱' : '$';
  return symbol + amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function showModal(
  container: HTMLElement,
  options: {
    title: string;
    body: string;          // raw HTML for the form/content
    submitLabel?: string;  // defaults to "Save"
    onSubmit: (modalEl: HTMLElement) => void | Promise<void>;
    width?: string;        // defaults to "420px"
  }
): () => void {
  const id = "modal-" + Math.random().toString(36).slice(2, 8);
  const submitLabel = options.submitLabel ?? "Save";
  const width = options.width ?? "420px";

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = id;
  overlay.style.display = "flex";
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:${width};">
      <div class="modal-header">
        <h3>${options.title}</h3>
        <button class="modal-close-btn" data-close="${id}">&times;</button>
      </div>
      <form id="${id}-form" style="padding: 1px 0;">
        ${options.body}
        <button type="submit" class="btn btn-primary btn-block" style="margin-top:12px;">
          ${submitLabel}
        </button>
      </form>
    </div>
  `;

  container.appendChild(overlay);

  // Close handlers
  const close = () => overlay.remove();
  overlay.querySelector(`[data-close="${id}"]`)!.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
  });

  // Submit handler
  overlay.querySelector(`#${id}-form`)!.addEventListener("submit", (ev) => {
    ev.preventDefault();
    options.onSubmit(overlay);
  });

  return close;
}

/**
 * Build a standard card with header + body.
 * Returns the card element for further manipulation.
 */
export function createCard(options: {
  title: string;
  body: string;         // inner HTML
  headerRight?: string; // e.g. a button
  className?: string;
}): string {
  return `
    <div class="card ${options.className ?? "animate-fade-in"}">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
        <h3 class="card-title">${options.title}</h3>
        ${options.headerRight ?? ""}
      </div>
      ${options.body}
    </div>
  `;
}

/**
 * Build a standard data table.
 */
export function createTable(options: {
  headers: string[];
  rows: string[];       // each row is a <tr>...</tr> string
  emptyMessage?: string;
}): string {
  return `
    <div class="table-container">
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
    </div>
  `;
}

/**
 * Build a tab navigation bar.
 */
export function createTabs(tabs: { label: string; hash: string; active: boolean }[]): string {
  return `
    <div class="settings-tab-nav">
      ${tabs.map(t => `
        <button class="settings-tab-btn ${t.active ? "active" : ""}"
                onclick="window.location.hash='${t.hash}'">
          ${t.label}
        </button>
      `).join("")}
    </div>
  `;
}

/**
 * Standard try/catch wrapper for store operations that show toast.
 */
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

/**
 * Confirm and execute — returns true if confirmed and executed successfully.
 */
export function confirmThen(
  message: string,
  fn: () => void,
  successMsg: string
): boolean {
  if (!confirm(message)) return false;
  return safeCall(fn, successMsg);
}
