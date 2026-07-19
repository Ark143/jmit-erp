// JMIT ERP - Stock Ledger view (per-item movement history with running balance)
import { store } from "../store.js";
export function renderInventoryLedger(container) {
    const items = store.getItems();
    const movements = store.getStockMovements() || [];
    const warehouses = store.getWarehouses();
    let filterItem = "";
    let filterWarehouse = "";
    let filterDoc = "";
    let dateFrom = "";
    let dateTo = "";
    function refresh() {
        let filtered = movements.slice();
        if (filterItem)
            filtered = filtered.filter((m) => m.itemId === filterItem);
        if (filterWarehouse)
            filtered = filtered.filter((m) => m.warehouseId === filterWarehouse);
        if (filterDoc)
            filtered = filtered.filter((m) => m.document === filterDoc);
        if (dateFrom)
            filtered = filtered.filter((m) => m.date >= dateFrom);
        if (dateTo)
            filtered = filtered.filter((m) => m.date <= dateTo);
        filtered.sort((a, b) => b.id.localeCompare(a.id) || b.date.localeCompare(a.date));
        const itemLookup = {};
        items.forEach(i => { itemLookup[i.id] = i; });
        const whLookup = {};
        warehouses.forEach(w => { whLookup[w.id] = w; });
        let rows = "";
        filtered.forEach((m) => {
            const item = itemLookup[m.itemId];
            const wh = whLookup[m.warehouseId];
            const style = m.type === "IN" ? "color:var(--color-o2c);" : "color:var(--color-danger);";
            const sign = m.type === "IN" ? "+" : "−";
            rows += `<tr>
        <td style="font-family:monospace;font-size:0.78rem;">${m.date}</td>
        <td><strong>${item ? item.name : "?"}</strong><br><span class="text-muted" style="font-size:0.72rem;">${item ? item.sku : "?"}</span></td>
        <td style="${style} font-weight:700;">${sign}${m.qty}</td>
        <td style="font-family:monospace;">${m.balanceAfter}</td>
        <td>${wh ? wh.name : m.warehouseId}</td>
        <td style="font-family:monospace;font-size:0.78rem;"><a href="#${m.document === 'GRN' ? 'p2p/goods-receipts/view/' : 'o2c/deliveries/view/'}${m.reference}" style="color:var(--color-primary);">${m.reference}</a></td>
        <td><span class="badge ${m.document === 'GRN' ? 'badge-success' : 'badge-danger'}">${m.document}</span></td>
      </tr>`;
        });
        content.innerHTML = filtered.length === 0
            ? `<div class="card" style="text-align:center;padding:40px;"><p class="text-muted">No stock movements yet. Create a Goods Receipt or Delivery Note to populate the ledger.</p></div>`
            : `<div class="card"><div class="table-container"><table>
        <thead><tr><th>Date</th><th>Item / SKU</th><th>Qty</th><th>Balance</th><th>Warehouse</th><th>Reference</th><th>Doc</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div></div>`;
    }
    const itemOptions = items.map(i => `<option value="${i.id}">${i.name} (${i.sku})</option>`).join("");
    const whOptions = warehouses.map(w => `<option value="${w.id}">${w.name}</option>`).join("");
    container.innerHTML = `<div class="animate-fade-in">
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3 class="card-title">📒 Stock Movement Ledger</h3>
          <div class="no-print" style="display:flex;gap:8px;"><button id="ledger-report-btn" class="btn btn-primary btn-sm">📄 Generate Report</button> <button id="ledger-csv-btn" class="btn btn-outline btn-sm">🔽 Export CSV</button> <button onclick="window.print()" class="btn btn-outline btn-sm">🖨️ Print</button></div></div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:end;">
        <div class="form-group" style="flex:1;min-width:180px;">
          <label class="form-label">Item</label>
          <select id="ledger-item" class="form-control"><option value="">All Items</option>${itemOptions}</select>
        </div>
        <div class="form-group" style="flex:1;min-width:140px;">
          <label class="form-label">Warehouse</label>
          <select id="ledger-wh" class="form-control"><option value="">All Warehouses</option>${whOptions}</select>
        </div>
        <div class="form-group" style="flex:1;min-width:120px;">
          <label class="form-label">Document</label>
          <select id="ledger-doc" class="form-control"><option value="">All</option><option value="GRN">GRN (IN)</option><option value="DN">DN (OUT)</option></select>
        </div>
        <div class="form-group" style="flex:1;min-width:130px;">
          <label class="form-label">From</label>
          <input id="ledger-from" type="date" class="form-control">
        </div>
        <div class="form-group" style="flex:1;min-width:130px;">
          <label class="form-label">To</label>
          <input id="ledger-to" type="date" class="form-control">
        </div>
      </div>
    </div>
    <div id="ledger-content"></div>
  </div>`;
    const content = container.querySelector("#ledger-content");
    refresh();
    container.querySelector("#ledger-item").addEventListener("change", () => {
        filterItem = container.querySelector("#ledger-item").value;
        refresh();
    });
    container.querySelector("#ledger-wh").addEventListener("change", () => {
        filterWarehouse = container.querySelector("#ledger-wh").value;
        refresh();
    });
    container.querySelector("#ledger-doc").addEventListener("change", () => {
        filterDoc = container.querySelector("#ledger-doc").value;
        refresh();
    });
    container.querySelector("#ledger-from").addEventListener("change", () => {
        dateFrom = container.querySelector("#ledger-from").value;
        refresh();
    });
    container.querySelector("#ledger-to").addEventListener("change", () => {
        dateTo = container.querySelector("#ledger-to").value;
        refresh();
    });
    // ─── Generate Report ───
    const whLookup = {};
    warehouses.forEach(w => { whLookup[w.id] = w; });
    const itemLookup = {};
    items.forEach(i => { itemLookup[i.id] = i; });
    container.querySelector("#ledger-report-btn").addEventListener("click", () => {
        let filtered = movements.slice();
        if (filterItem)
            filtered = filtered.filter((m) => m.itemId === filterItem);
        if (filterWarehouse)
            filtered = filtered.filter((m) => m.warehouseId === filterWarehouse);
        if (filterDoc)
            filtered = filtered.filter((m) => m.document === filterDoc);
        if (dateFrom)
            filtered = filtered.filter((m) => m.date >= dateFrom);
        if (dateTo)
            filtered = filtered.filter((m) => m.date <= dateTo);
        filtered.sort((a, b) => b.id.localeCompare(a.id) || b.date.localeCompare(a.date));
        let totalIn = 0, totalOut = 0;
        let rows = "";
        filtered.forEach((m) => {
            const item = itemLookup[m.itemId];
            const wh = whLookup[m.warehouseId];
            const sign = m.type === "IN" ? "+" : "\u2212";
            if (m.type === "IN")
                totalIn += m.qty;
            else
                totalOut += m.qty;
            rows += `<tr>
        <td style="font-family:monospace;font-size:0.78rem;">${m.date}</td>
        <td><strong>${item ? item.name : "?"}</strong><br><span style="color:#666;font-size:0.72rem;">${item ? item.sku : "?"}</span></td>
        <td style="font-weight:700;${m.type === 'IN' ? 'color:#10b981;' : 'color:#f43f5e;'}">${sign}${m.qty}</td>
        <td style="font-family:monospace;">${m.balanceAfter}</td>
        <td>${wh ? wh.name : m.warehouseId}</td>
        <td style="font-family:monospace;font-size:0.78rem;">${m.reference}</td>
        <td><span style="display:inline-flex;padding:3px 8px;border-radius:999px;font-size:0.7rem;font-weight:600;${m.document === 'GRN' ? 'background:rgba(16,185,129,0.1);color:#10b981;' : 'background:rgba(244,63,94,0.1);color:#f43f5e;'}">${m.document}</span></td>
      </tr>`;
        });
        const period = [dateFrom || "Start", dateTo || "Today"].join(" \u2013 ");
        const filterDesc = [filterDoc || "All", filterWarehouse ? whLookup[filterWarehouse]?.name : "All WH", filterItem ? itemLookup[filterItem]?.name : "All Items"].filter(Boolean).join(" | ");
        const reportHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Stock Ledger Report</title>
<style>body{font-family:Arial,sans-serif;margin:24px;color:#111;}h1{font-size:1.3rem;margin-bottom:4px;}h2{font-size:0.85rem;color:#555;margin-bottom:16px;font-weight:400;}
.summary{display:flex;gap:24px;margin-bottom:16px;}.sum-item{padding:10px 16px;border-radius:6px;background:#f5f5f5;}
.sum-item b{display:block;font-size:0.7rem;text-transform:uppercase;color:#888;margin-bottom:2px;}
.close-btn{position:fixed;top:12px;right:12px;background:#eee;border:none;border-radius:6px;padding:6px 14px;font-size:1rem;cursor:pointer;z-index:9999;}
table{width:100%;border-collapse:collapse;margin-top:12px;}th{background:#eee;padding:8px;text-align:left;font-size:0.75rem;border-bottom:2px solid #999;}
td{padding:7px;border-bottom:1px solid #ddd;font-size:0.82rem;}@media print{.close-btn{display:none}body{margin:12mm;}}
</style></head><body>
<button class="close-btn" onclick="document.getElementById('rpt-overlay').remove()">\u2715 Close</button>
<h1>\u{1F4D2} Stock Movement Ledger Report</h1>
<h2>${period} &middot; ${filterDesc} &middot; ${filtered.length} movements</h2>
<div class="summary">
  <div class="sum-item"><b>IN</b><span style="color:#10b981;font-weight:700;font-size:1.1rem;">+${totalIn}</span></div>
  <div class="sum-item"><b>OUT</b><span style="color:#f43f5e;font-weight:700;font-size:1.1rem;">\u2212${totalOut}</span></div>
  <div class="sum-item"><b>Net</b><span style="font-weight:700;font-size:1.1rem;color:${totalIn - totalOut >= 0 ? '#10b981' : '#f43f5e'};">${totalIn - totalOut >= 0 ? '+' : ''}${totalIn - totalOut}</span></div>
</div>
<table><thead><tr><th>Date</th><th>Item / SKU</th><th>Qty</th><th>Balance</th><th>WH</th><th>Ref</th><th>Doc</th></tr></thead>
<tbody>${rows || '<tr><td colspan="7" style="text-align:center;padding:24px;">No matching movements</td></tr>'}</tbody>
</table>
<button class="close-btn" style="top:12px;right:80px;" onclick="window.print()">\u{1F5A8} Print</button>
</body></html>`;
        const overlay = document.createElement("div");
        overlay.id = "rpt-overlay";
        overlay.style.cssText = "position:fixed;inset:0;z-index:800;background:white;overflow-y:auto;";
        overlay.innerHTML = reportHTML;
        document.body.appendChild(overlay);
    });
}
//# sourceMappingURL=stock-ledger.js.map