// JMIT ERP - Dashboard View Module (Phase 2 Master)
import { store } from "../store.js";

export function renderDashboard(container) {
  const items = store.getItems();
  const salesOrders = store.getSalesOrders();
  const purchaseOrders = store.getPurchaseOrders();
  const journalEntries = store.getJournalEntries();
  const mapping = store.getSettings().glMappings;

  // Calculate quick metrics from ledger accounts
  const cashBalance = store.getAccount(mapping.cashAccount).balance;
  const revenueBalance = store.getAccount(mapping.salesAccount).balance;
  const cogsBalance = store.getAccount(mapping.cogsAccount).balance;
  const opexBalance = store.getAccount(mapping.opexAccount).balance;
  const deprBalance = store.getAccount(mapping.deprExpenseAccount).balance;

  const inventoryValue = items.reduce((sum, item) => {
    const totalQty = Object.values(item.stocks || {}).reduce((s, q) => s + q, 0);
    return sum + (totalQty * item.cost);
  }, 0);

  const netIncome = revenueBalance - cogsBalance - opexBalance - deprBalance;

  // Identify low stock items (calculating total across all warehouses)
  const lowStockItems = items.filter(item => {
    const totalQty = Object.values(item.stocks || {}).reduce((s, q) => s + q, 0);
    return totalQty <= item.reorder;
  });

  // SVG Chart Calculation (Simulated trend based on Sales vs Purchases)
  const salesTotal = salesOrders.reduce((sum, so) => sum + so.total, 0);
  const purchaseTotal = purchaseOrders.reduce((sum, po) => sum + po.total, 0);

  // Recent 4 journal logs
  const recentJournals = [...journalEntries].reverse().slice(0, 4);

  const html = `
    <div class="dashboard-container animate-fade-in">
      <!-- Top Grid KPIs -->
      <div class="dashboard-grid">
        <!-- Cash KPI -->
        <div class="card kpi-card">
          <div class="kpi-icon" style="background-color: rgba(6, 182, 212, 0.15); color: var(--color-secondary);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Cash & Treasury</span>
            <span class="kpi-value text-info">$${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <!-- Revenue KPI -->
        <div class="card kpi-card">
          <div class="kpi-icon" style="background-color: rgba(16, 185, 129, 0.15); color: var(--color-o2c);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Sales Revenue</span>
            <span class="kpi-value text-success">$${revenueBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <!-- Inventory KPI -->
        <div class="card kpi-card">
          <div class="kpi-icon" style="background-color: rgba(139, 92, 246, 0.15); color: var(--color-inventory);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Inventory Valuation</span>
            <span class="kpi-value text-purple">$${inventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <!-- Net Income KPI -->
        <div class="card kpi-card">
          <div class="kpi-icon" style="background-color: rgba(99, 102, 241, 0.15); color: var(--color-primary);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Net Profit</span>
            <span class="kpi-value ${netIncome >= 0 ? 'text-success' : 'text-danger'}">$${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <!-- Main Visuals & Logs Grid -->
      <div class="grid-main-side">
        <!-- Trend Chart Card -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              Sales vs. Purchases Trend
            </h3>
          </div>
          
          <div class="chart-container">
            <svg viewBox="0 0 500 180" class="chart-svg">
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#10b981" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
                </linearGradient>
                <linearGradient id="purchaseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
                </linearGradient>
              </defs>
              
              <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
              
              <path d="M 0 150 Q 125 110, 250 80 T 500 40 L 500 150 L 0 150 Z" fill="url(#salesGrad)" />
              <path d="M 0 150 Q 125 110, 250 80 T 500 40" fill="none" stroke="#10b981" stroke-width="3" />
              
              <path d="M 0 150 Q 125 140, 250 120 T 500 100 L 500 150 L 0 150 Z" fill="url(#purchaseGrad)" />
              <path d="M 0 150 Q 125 140, 250 120 T 500 100" fill="none" stroke="#f59e0b" stroke-width="3" stroke-dasharray="4,4" />
              
              <circle cx="250" cy="80" r="4" fill="#10b981" />
              <circle cx="500" cy="40" r="4" fill="#10b981" />
              <circle cx="250" cy="120" r="4" fill="#f59e0b" />
              <circle cx="500" cy="100" r="4" fill="#f59e0b" />
            </svg>
          </div>

          <div style="display: flex; gap: 20px; font-size: 0.8rem; margin-top: 10px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background-color: var(--color-o2c); display: inline-block;"></span>
              <span class="text-secondary">Sales Revenue: $${salesTotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background-color: var(--color-p2p); display: inline-block;"></span>
              <span class="text-secondary">Purchases: $${purchaseTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Right Side: Alerts and Info -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title text-warning">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Critical Stock Alerts
            </h3>
          </div>
          
          <div class="alerts-list" style="display: flex; flex-direction: column; gap: 12px; max-height: 200px; overflow-y: auto;">
            ${lowStockItems.length === 0 ? `
              <div class="text-muted" style="text-align: center; padding: 24px 0;">
                All items well stocked. No low-stock thresholds reached.
              </div>
            ` : lowStockItems.map(item => {
              const totalQty = Object.values(item.stocks || {}).reduce((s, q) => s + q, 0);
              return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background-color: rgba(245, 158, 11, 0.04); border: 1px solid rgba(245, 158, 11, 0.15); border-radius: var(--radius-sm);">
                  <div>
                    <div style="font-weight: 600; font-size: 0.85rem;">${item.name}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">SKU: ${item.sku}</div>
                  </div>
                  <div style="text-align: right;">
                    <span class="badge badge-danger" style="margin-bottom: 2px;">Stock: ${totalQty}</span>
                    <div class="text-muted" style="font-size: 0.75rem;">Min Threshold: ${item.reorder}</div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>

      <!-- General Ledger Entries Log (Full width) -->
      <div class="card" style="margin-top: 20px;">
        <div class="card-header">
          <h3 class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Recent Ledger Posting Logs
          </h3>
          <a href="#accounting/journal" class="btn btn-outline btn-sm">View Ledger Book</a>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Journal ID</th>
                <th>Posting Date</th>
                <th>Reference/Source Transaction</th>
                <th>Impact Summary (Accounts Deployed)</th>
              </tr>
            </thead>
            <tbody>
              ${recentJournals.map(je => {
                const accountsUsed = je.lines.map(l => {
                  const acct = store.getAccount(l.code);
                  const dir = l.debit > 0 ? "Dr" : "Cr";
                  const amt = l.debit > 0 ? l.debit : l.credit;
                  return `<span style="font-size: 0.75rem; padding: 2px 6px; background-color: rgba(255,255,255,0.03); border-radius: 4px; margin-right: 4px;">${acct ? acct.name : l.code} (${dir} $${amt.toFixed(2)})</span>`;
                }).join(" ");
                
                return `
                  <tr>
                    <td style="font-family: monospace; font-weight: 700; color: var(--color-primary);">${je.id}</td>
                    <td>${je.date}</td>
                    <td><strong style="color: var(--text-primary);">${je.reference}</strong></td>
                    <td style="white-space: normal;">${accountsUsed}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}
