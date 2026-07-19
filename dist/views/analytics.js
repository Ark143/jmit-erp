// JMIT ERP — Analytics Engine (AR/AP Aging, Inventory, Approvals, Fixed Assets, etc.)
import { store } from "../store.js";
import { formatMoney } from "../utils.js";
const TODAY = new Date().toISOString().split("T")[0];
// ─── helpers ───
function daysAgo(dateStr) {
    if (!dateStr)
        return 0;
    const d = new Date(dateStr + "T00:00:00");
    const now = new Date(TODAY + "T00:00:00");
    return Math.floor((now.getTime() - d.getTime()) / 86400000);
}
function agingBucket(days) {
    if (days <= 30)
        return "0-30";
    if (days <= 60)
        return "31-60";
    if (days <= 90)
        return "61-90";
    return "90+";
}
function agingReport(title, items, dateField, amountField, nameField, idField, statusFilter) {
    const aging = {
        "0-30": { count: 0, total: 0, rows: "" },
        "31-60": { count: 0, total: 0, rows: "" },
        "61-90": { count: 0, total: 0, rows: "" },
        "90+": { count: 0, total: 0, rows: "" },
    };
    let grandTotal = 0;
    items.forEach((item) => {
        if (statusFilter && !statusFilter.includes(item.status))
            return;
        const amount = Number(item[amountField]) || 0;
        const days = daysAgo(item[dateField]);
        const bucket = agingBucket(days);
        aging[bucket].count++;
        aging[bucket].total += amount;
        grandTotal += amount;
        aging[bucket].rows += `<tr>
      <td style="font-family:monospace;font-size:0.78rem;">${item[idField]}</td>
      <td><strong>${item[nameField]}</strong></td>
      <td>${item[dateField]}</td>
      <td>${days}</td>
      <td style="font-weight:700;">${formatMoney(amount)}</td>
    </tr>`;
    });
    let html = `<div class="card animate-fade-in"><div class="card-header"><h3 class="card-title">${title}</h3>
    <div class="no-print"><button onclick="window.print()" class="btn btn-outline btn-sm">🖨️ Print</button></div></div>
    <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;">`;
    for (const b of ["0-30", "31-60", "61-90", "90+"]) {
        html += `<div class="badge" style="padding:10px 16px;background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;min-width:120px;">
      <div style="font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);">${b} days</div>
      <div style="font-size:1.2rem;font-weight:800;">${formatMoney(aging[b].total)}</div>
      <div style="font-size:0.7rem;color:var(--text-muted);">${aging[b].count} items</div>
    </div>`;
    }
    html += `<div class="badge" style="padding:10px 16px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:8px;min-width:120px;">
    <div style="font-size:0.65rem;text-transform:uppercase;color:var(--color-primary);">Total</div>
    <div style="font-size:1.2rem;font-weight:800;color:var(--color-primary);">${formatMoney(grandTotal)}</div>
    <div style="font-size:0.7rem;color:var(--text-muted);">${items.length} items</div>
  </div></div>`;
    // Detail table
    html += `<div class="table-container"><table><thead><tr><th>ID</th><th>${title.includes("AR") ? "Customer" : "Vendor"}</th><th>Date</th><th>Days</th><th>Amount</th></tr></thead><tbody>`;
    for (const b of ["0-30", "31-60", "61-90", "90+"]) {
        if (aging[b].rows) {
            html += `<tr style="background:rgba(255,255,255,0.02);"><td colspan="5" style="font-weight:700;color:var(--text-muted);">${b} days — ${formatMoney(aging[b].total)}</td></tr>`;
            html += aging[b].rows;
        }
    }
    html += `</tbody></table></div></div>`;
    return html;
}
// ─── 1. AR AGING ───
export function renderARAging(container, companyId) {
    const invoices = store.getSalesInvoices().filter(si => !companyId || si.companyId === companyId);
    container.innerHTML = agingReport("Accounts Receivable (AR) Aging", invoices, "date", "total", "customerName", "id", ["Unpaid", "Draft", "Overdue"]);
}
// ─── 2. AP AGING ───
export function renderAPAging(container, companyId) {
    const invoices = store.getPurchaseInvoices().filter(pi => !companyId || pi.companyId === companyId);
    container.innerHTML = agingReport("Accounts Payable (AP) Aging", invoices, "date", "total", "vendorName", "id", ["Unpaid", "Draft"]);
}
// ─── 3. PO AGING (unfulfilled purchase orders) ───
export function renderPOAging(container, companyId) {
    const pos = store.getPurchaseOrders().filter(po => !companyId || po.companyId === companyId);
    container.innerHTML = agingReport("Purchase Order Aging (Unfulfilled)", pos, "date", "total", "vendorName", "id", ["Draft", "Approved"]);
}
// ─── 4. DELIVERY / SO AGING ───
export function renderSOAging(container, companyId) {
    const sos = store.getSalesOrders().filter(so => !companyId || so.companyId === companyId);
    container.innerHTML = agingReport("Sales Order Aging (Unfulfilled)", sos, "date", "total", "customerName", "id", ["Draft", "Approved"]);
}
// ─── 5. PAYMENT AGING ───
export function renderPaymentAging(container, companyId) {
    const payments = store.getPayments().filter(p => !companyId || p.companyId === companyId);
    // Sort by date desc
    const sorted = [...payments].sort((a, b) => b.date.localeCompare(a.date));
    let rows = "";
    sorted.forEach((p) => {
        rows += `<tr>
      <td style="font-family:monospace;">${p.id}</td>
      <td><strong>${p.partnerName}</strong></td>
      <td>${p.date}</td>
      <td><span class="badge ${p.type === 'Receive' ? 'badge-success' : 'badge-danger'}">${p.type}</span></td>
      <td style="font-weight:700;">${formatMoney(p.amount)}</td>
      <td>${daysAgo(p.date)}d ago</td>
    </tr>`;
    });
    container.innerHTML = `<div class="card animate-fade-in">
    <div class="card-header"><h3 class="card-title">Payment Ledger</h3>
      <div class="no-print"><button onclick="window.print()" class="btn btn-outline btn-sm">🖨️ Print</button></div></div>
    <div class="table-container"><table>
      <thead><tr><th>ID</th><th>Partner</th><th>Date</th><th>Type</th><th>Amount</th><th>Age</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="padding:24px;text-align:center;">No payments recorded</td></tr>'}</tbody>
    </table></div></div>`;
}
// ─── 6. INVENTORY STOCK ANALYTICS ───
export function renderInventoryAnalytics(container, companyId) {
    const items = store.getItems();
    const wh = store.getWarehouses();
    let rows = "";
    let totalValue = 0;
    items.forEach((item) => {
        const totalQty = (item.stocks ? Object.values(item.stocks) : []).reduce((s, q) => s + Number(q), 0);
        const value = totalQty * (item.cost || 0);
        totalValue += value;
        const whBreakdown = wh.map((w) => `${w.name}: ${item.stocks?.[w.id] || 0}`).join(", ");
        rows += `<tr>
      <td style="font-family:monospace;font-weight:600;">${item.sku}</td>
      <td><strong>${item.name}</strong></td>
      <td>${item.category || "—"}</td>
      <td>${totalQty}</td>
      <td>${formatMoney(item.cost || 0)}</td>
      <td style="font-weight:700;">${formatMoney(value)}</td>
      <td style="font-size:0.72rem;color:var(--text-muted);">${whBreakdown}</td>
    </tr>`;
    });
    container.innerHTML = `<div class="card animate-fade-in">
    <div class="card-header"><h3 class="card-title">Inventory Stock Analytics</h3>
      <div class="no-print"><button onclick="window.print()" class="btn btn-outline btn-sm">🖨️ Print</button></div></div>
    <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;">
      <div class="badge" style="padding:10px 16px;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:8px;">
        <div style="font-size:0.65rem;text-transform:uppercase;color:var(--color-inventory);">Total Items</div>
        <div style="font-size:1.3rem;font-weight:800;">${items.length}</div>
      </div>
      <div class="badge" style="padding:10px 16px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:8px;">
        <div style="font-size:0.65rem;text-transform:uppercase;color:var(--color-o2c);">Total Value</div>
        <div style="font-size:1.3rem;font-weight:800;color:var(--color-o2c);">${formatMoney(totalValue)}</div>
      </div>
    </div>
    <div class="table-container"><table>
      <thead><tr><th>SKU</th><th>Item</th><th>Category</th><th>Qty</th><th>Unit Cost</th><th>Value</th><th>Warehouses</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div></div>`;
}
// ─── 7. PENDING APPROVALS ───
export function renderPendingApprovals(container, companyId) {
    const soPending = store.getSalesOrders().filter((s) => s.status === "Draft" && (!companyId || s.companyId === companyId));
    const poPending = store.getPurchaseOrders().filter((p) => p.status === "Draft" && (!companyId || p.companyId === companyId));
    const dnPending = store.getDeliveries().filter((d) => d.status === "Draft" && (!companyId || d.companyId === companyId));
    const grnPending = store.getGoodsReceipts().filter((g) => g.status === "Draft" && (!companyId || g.companyId === companyId));
    const piPending = store.getPurchaseInvoices().filter((p) => p.status === "Draft" && (!companyId || p.companyId === companyId));
    const siPending = store.getSalesInvoices().filter((s) => s.status === "Draft" && (!companyId || s.companyId === companyId));
    function pendingCard(section, items, routePrefix, idField, nameField) {
        let rows = "";
        items.forEach((x) => {
            rows += `<tr><td style="font-family:monospace;"><a href="#${routePrefix}/view/${x[idField]}" style="color:var(--color-primary);">${x[idField]}</a></td><td>${x[nameField]}</td><td>${x.date}</td><td>${formatMoney(x.total || 0)}</td></tr>`;
        });
        return items.length > 0 ? `<div class="card" style="margin-bottom:12px;">
      <h4 style="margin-bottom:8px;color:var(--color-p2p);">${section} (${items.length} pending)</h4>
      <table><thead><tr><th>ID</th><th>Party</th><th>Date</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table></div>` : "";
    }
    container.innerHTML = `<div class="animate-fade-in">
    <div class="card"><div class="card-header"><h3 class="card-title">Pending Approvals Dashboard</h3></div>
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
        <span class="badge badge-draft">SO: ${soPending.length}</span>
        <span class="badge badge-draft">DN: ${dnPending.length}</span>
        <span class="badge badge-draft">SI: ${siPending.length}</span>
        <span class="badge badge-draft">PO: ${poPending.length}</span>
        <span class="badge badge-draft">GRN: ${grnPending.length}</span>
        <span class="badge badge-draft">PI: ${piPending.length}</span>
      </div>
    </div>
    ${pendingCard("O2C — Sales Orders", soPending, "o2c/sales-orders", "id", "customerName")}
    ${pendingCard("O2C — Delivery Notes", dnPending, "o2c/deliveries", "id", "customerName")}
    ${pendingCard("O2C — Sales Invoices", siPending, "o2c/invoices", "id", "customerName")}
    ${pendingCard("P2P — Purchase Orders", poPending, "p2p/purchase-orders", "id", "vendorName")}
    ${pendingCard("P2P — Goods Receipts", grnPending, "p2p/goods-receipts", "id", "vendorName")}
    ${pendingCard("P2P — Purchase Invoices", piPending, "p2p/invoices", "id", "vendorName")}
    ${(soPending.length + dnPending.length + siPending.length + poPending.length + grnPending.length + piPending.length) === 0 ? '<div class="card" style="text-align:center;padding:40px;"><p class="text-muted">All approvals are current — nothing pending.</p></div>' : ''}
  </div>`;
}
// ─── 8. FIXED ASSET ANALYTICS ───
export function renderFixedAssetAnalytics(container, companyId) {
    const assets = store.getFixedAssets().filter((a) => !companyId || a.companyId === companyId);
    let rows = "";
    let totalNBV = 0;
    let totalCost = 0;
    let totalDepr = 0;
    assets.forEach((a) => {
        const nbv = (a.cost || 0) - (a.accumulatedDepreciation || 0);
        totalNBV += nbv;
        totalCost += (a.cost || 0);
        totalDepr += (a.accumulatedDepreciation || 0);
        rows += `<tr>
      <td style="font-family:monospace;">${a.id}</td>
      <td><strong>${a.name}</strong></td>
      <td>${a.category || "—"}</td>
      <td>${a.acquisitionDate || "—"}</td>
      <td>${formatMoney(a.cost || 0)}</td>
      <td>${formatMoney(a.accumulatedDepreciation || 0)}</td>
      <td style="font-weight:700;">${formatMoney(nbv)}</td>
    </tr>`;
    });
    container.innerHTML = `<div class="card animate-fade-in">
    <div class="card-header"><h3 class="card-title">Fixed Asset Analytics</h3>
      <div class="no-print"><button onclick="window.print()" class="btn btn-outline btn-sm">🖨️ Print</button></div></div>
    <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;">
      <div class="badge" style="padding:10px 16px;background:rgba(99,102,241,0.08);border-radius:8px;"><div style="font-size:0.65rem;text-transform:uppercase;color:var(--color-primary);">Assets</div><div style="font-size:1.3rem;font-weight:800;">${assets.length}</div></div>
      <div class="badge" style="padding:10px 16px;background:rgba(16,185,129,0.08);border-radius:8px;"><div style="font-size:0.65rem;text-transform:uppercase;color:var(--color-o2c);">Total Cost</div><div style="font-size:1.3rem;font-weight:800;color:var(--color-o2c);">${formatMoney(totalCost)}</div></div>
      <div class="badge" style="padding:10px 16px;background:rgba(245,158,11,0.08);border-radius:8px;"><div style="font-size:0.65rem;text-transform:uppercase;color:var(--color-p2p);">Accum. Depr.</div><div style="font-size:1.3rem;font-weight:800;color:var(--color-p2p);">${formatMoney(totalDepr)}</div></div>
      <div class="badge" style="padding:10px 16px;background:rgba(139,92,246,0.08);border-radius:8px;"><div style="font-size:0.65rem;text-transform:uppercase;color:var(--color-inventory);">Net Book Value</div><div style="font-size:1.3rem;font-weight:800;color:var(--color-inventory);">${formatMoney(totalNBV)}</div></div>
    </div>
    <div class="table-container"><table>
      <thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Acquired</th><th>Cost</th><th>Accum Depr</th><th>NBV</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7" style="text-align:center;padding:24px;">No fixed assets</td></tr>'}</tbody>
    </table></div></div>`;
}
// ─── 9. STATEMENT OF ACCOUNT (per-partner summary) ───
export function renderStatementOfAccount(container, companyId) {
    const partners = [...store.getPartners().customers, ...store.getPartners().vendors];
    const invoices = [...store.getSalesInvoices(), ...store.getPurchaseInvoices()];
    const payments = store.getPayments();
    // Filter by company
    const filtInv = invoices.filter((i) => !companyId || i.companyId === companyId);
    const filtPay = payments.filter((p) => !companyId || p.companyId === companyId);
    let rows = "";
    partners.forEach((p) => {
        const custInv = filtInv.filter((i) => i.customerId === p.id || i.vendorId === p.id);
        const custPay = filtPay.filter((pm) => pm.partnerId === p.id);
        const totalBilled = custInv.reduce((s, i) => s + (i.total || 0), 0);
        const totalPaid = custPay.reduce((s, pm) => s + (pm.amount || 0), 0);
        const balance = totalBilled - totalPaid;
        if (totalBilled === 0 && totalPaid === 0)
            return;
        rows += `<tr>
      <td><strong>${p.name}</strong></td>
      <td><span class="badge badge-draft">${p.taxId || "—"}</span></td>
      <td style="font-weight:700;">${formatMoney(totalBilled)}</td>
      <td>${formatMoney(totalPaid)}</td>
      <td style="font-weight:800;color:${balance >= 0 ? 'var(--color-danger)' : 'var(--color-o2c)'};">${formatMoney(balance)}</td>
    </tr>`;
    });
    container.innerHTML = `<div class="card animate-fade-in">
    <div class="card-header"><h3 class="card-title">Statement of Account (per Partner)</h3>
      <div class="no-print"><button onclick="window.print()" class="btn btn-outline btn-sm">🖨️ Print</button></div></div>
    <div class="table-container"><table>
      <thead><tr><th>Partner</th><th>TIN</th><th>Billed</th><th>Paid</th><th>Balance</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:24px;">No partner transactions</td></tr>'}</tbody>
    </table></div></div>`;
}
// ─── 10. AGING SUMMARY DASHBOARD ───
export function renderAgingDashboard(container, companyId) {
    const arInv = store.getSalesInvoices().filter((s) => !companyId || s.companyId === companyId).filter((s) => s.status !== "Paid");
    const apInv = store.getPurchaseInvoices().filter((p) => !companyId || p.companyId === companyId).filter((p) => p.status !== "Paid");
    const poOpen = store.getPurchaseOrders().filter((p) => !companyId || p.companyId === companyId).filter((p) => ["Draft", "Approved"].includes(p.status));
    const soOpen = store.getSalesOrders().filter((s) => !companyId || s.companyId === companyId).filter((s) => ["Draft", "Approved"].includes(s.status));
    function bucketTotal(items, days) {
        return items.filter((i) => daysAgo(i.date) > days).reduce((s, i) => s + (i.total || 0), 0);
    }
    container.innerHTML = `<div class="animate-fade-in">
    <h2 style="margin-bottom:16px;">Aging Summary Dashboard</h2>
    <div class="grid-2" style="margin-bottom:16px;">
      <div class="card">
        <h4 style="color:var(--color-o2c);">AR Aging</h4>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
          <span class="badge badge-success">0-30: ${formatMoney(bucketTotal(arInv, -1))}</span>
          <span class="badge badge-draft">31-60: ${formatMoney(bucketTotal(arInv.filter((i) => daysAgo(i.date) <= 60 && daysAgo(i.date) > 30), -1))}</span>
          <span class="badge badge-pending">61-90: ${formatMoney(bucketTotal(arInv.filter((i) => daysAgo(i.date) <= 90 && daysAgo(i.date) > 60), -1))}</span>
          <span class="badge badge-danger">90+: ${formatMoney(bucketTotal(arInv, 90))}</span>
        </div>
        <p style="margin-top:6px;font-size:0.8rem;">${arInv.length} open invoices</p>
      </div>
      <div class="card">
        <h4 style="color:var(--color-p2p);">AP Aging</h4>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
          <span class="badge badge-success">0-30: ${formatMoney(bucketTotal(apInv, -1))}</span>
          <span class="badge badge-draft">31-60: ${formatMoney(bucketTotal(apInv.filter((i) => daysAgo(i.date) <= 60 && daysAgo(i.date) > 30), -1))}</span>
          <span class="badge badge-pending">61-90: ${formatMoney(bucketTotal(apInv.filter((i) => daysAgo(i.date) <= 90 && daysAgo(i.date) > 60), -1))}</span>
          <span class="badge badge-danger">90+: ${formatMoney(bucketTotal(apInv, 90))}</span>
        </div>
        <p style="margin-top:6px;font-size:0.8rem;">${apInv.length} open bills</p>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <h4 style="color:var(--color-o2c);">SO Aging (Unfulfilled)</h4>
        <p style="font-size:0.8rem;">${soOpen.length} open — ${formatMoney(soOpen.reduce((s, o) => s + (o.total || 0), 0))}</p>
      </div>
      <div class="card">
        <h4 style="color:var(--color-p2p);">PO Aging (Unfulfilled)</h4>
        <p style="font-size:0.8rem;">${poOpen.length} open — ${formatMoney(poOpen.reduce((s, o) => s + (o.total || 0), 0))}</p>
      </div>
    </div>
  </div>`;
}
//# sourceMappingURL=analytics.js.map