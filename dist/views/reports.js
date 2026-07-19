// JMIT ERP - Real-Time Financial Statements & Reports View Module (Phase 2)
import { store } from "../store.js";
import { formatMoney } from "../utils.js";
import { renderARAging, renderAPAging, renderPOAging, renderSOAging, renderPaymentAging, renderInventoryAnalytics, renderPendingApprovals, renderFixedAssetAnalytics, renderStatementOfAccount, renderAgingDashboard } from "./analytics.js";
// Global selected company filter for reports
let selectedCompanyFilter = "";
export function renderReports(container, pathParts) {
    const subReport = pathParts[1] || "pl";
    const companies = store.getCompanies();
    // Set default filter to active company if not set
    if (selectedCompanyFilter === "") {
        selectedCompanyFilter = store.getSettings().activeCompany;
    }
    const html = `
    <div class="reports-container animate-fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <!-- Company Filter Dropdown -->
          <div class="form-group" style="margin: 0; min-width: 220px;">
            <select id="report-company-filter" class="form-control" style="padding: 6px 12px; font-size: 0.8rem;">
              <option value="">All Consolidated Companies</option>
              ${companies.map(c => `<option value="${c.id}" ${c.id === selectedCompanyFilter ? 'selected' : ''}>${c.name}</option>`).join("")}
            </select>
          </div>
        </div>

        <!-- Reports Sub Navigation -->
        <div style="display: flex; gap: 8px; background-color: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 4px; border-radius: var(--radius-md);">
          <button class="btn btn-outline btn-sm sub-report-btn ${subReport === 'pl' ? 'active' : ''}" data-report="pl">Profit & Loss</button>
          <button class="btn btn-outline btn-sm sub-report-btn ${subReport === 'bs' ? 'active' : ''}" data-report="bs">Balance Sheet</button>
          <button class="btn btn-outline btn-sm sub-report-btn ${subReport === 'valuation' ? 'active' : ''}" data-report="valuation">Stock Valuation</button>
          <button class="btn btn-outline btn-sm sub-report-btn ${subReport === 'ar-aging' ? 'active' : ''}" data-report="ar-aging">AR Aging</button>
          <button class="btn btn-outline btn-sm sub-report-btn ${subReport === 'ap-aging' ? 'active' : ''}" data-report="ap-aging">AP Aging</button>
          <button class="btn btn-outline btn-sm sub-report-btn ${subReport === 'po-aging' ? 'active' : ''}" data-report="po-aging">PO Aging</button>
          <button class="btn btn-outline btn-sm sub-report-btn ${subReport === 'payment-aging' ? 'active' : ''}" data-report="payment-aging">Payment Ledger</button>
          <button class="btn btn-outline btn-sm sub-report-btn ${subReport === 'inventory' ? 'active' : ''}" data-report="inventory">Inventory</button>
          <button class="btn btn-outline btn-sm sub-report-btn ${subReport === 'approvals' ? 'active' : ''}" data-report="approvals">Approvals</button>
          <button class="btn btn-outline btn-sm sub-report-btn ${subReport === 'assets' ? 'active' : ''}" data-report="assets">Fixed Assets</button>
          <button class="btn btn-outline btn-sm sub-report-btn ${subReport === 'soa' ? 'active' : ''}" data-report="soa">Stmt of Account</button>
          <button class="btn btn-outline btn-sm sub-report-btn ${subReport === 'dashboard' ? 'active' : ''}" data-report="dashboard">Aging Dashboard</button>
        </div>
      </div>

      <!-- Reporting Sheet Mount Area -->
      <div id="reporting-sheet-viewport"></div>
    </div>
  `;
    container.innerHTML = html;
    const viewport = container.querySelector("#reporting-sheet-viewport");
    // Bind change filter
    container.querySelector("#report-company-filter").addEventListener("change", (e) => {
        selectedCompanyFilter = e.target.value;
        loadReport(subReport, viewport);
    });
    // Bind sub-navigation
    container.querySelectorAll(".sub-report-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const type = btn.getAttribute("data-report");
            window.location.hash = `#reports/${type}`;
        });
    });
    loadReport(subReport, viewport);
}
function loadReport(reportType, viewport) {
    if (reportType === "pl") {
        renderPL(viewport, selectedCompanyFilter);
    }
    else if (reportType === "bs") {
        renderBS(viewport, selectedCompanyFilter);
    }
    else if (reportType === "valuation") {
        renderValuation(viewport, selectedCompanyFilter);
    }
    else if (reportType === "ar-aging") {
        renderARAging(viewport, selectedCompanyFilter);
    }
    else if (reportType === "ap-aging") {
        renderAPAging(viewport, selectedCompanyFilter);
    }
    else if (reportType === "po-aging") {
        renderPOAging(viewport, selectedCompanyFilter);
    }
    else if (reportType === "so-aging") {
        renderSOAging(viewport, selectedCompanyFilter);
    }
    else if (reportType === "payment-aging") {
        renderPaymentAging(viewport, selectedCompanyFilter);
    }
    else if (reportType === "inventory") {
        renderInventoryAnalytics(viewport, selectedCompanyFilter);
    }
    else if (reportType === "approvals") {
        renderPendingApprovals(viewport, selectedCompanyFilter);
    }
    else if (reportType === "assets") {
        renderFixedAssetAnalytics(viewport, selectedCompanyFilter);
    }
    else if (reportType === "soa") {
        renderStatementOfAccount(viewport, selectedCompanyFilter);
    }
    else if (reportType === "dashboard") {
        renderAgingDashboard(viewport, selectedCompanyFilter);
    }
}
// --- RECURSIVE COA BALANCE CALCULATOR BY COMPANY ---
const getCompanyAccountBalance = (accountCode, companyId) => {
    const account = store.getAccount(accountCode);
    if (!account)
        return 0;
    let balance = 0;
    const jes = store.getJournalEntries().filter(je => !companyId || je.companyId === companyId);
    jes.forEach(je => {
        je.lines.forEach(l => {
            if (l.code === accountCode) {
                if (account.type === "Asset" || account.type === "Expense") {
                    balance += (l.debit - l.credit);
                }
                else {
                    balance += (l.credit - l.debit);
                }
            }
        });
    });
    return balance;
};
const getCOABalance = (code, companyId) => {
    const acct = store.getAccount(code);
    if (!acct)
        return 0;
    const children = store.getAccounts().filter(a => a.parentCode === code);
    if (children.length === 0) {
        return getCompanyAccountBalance(code, companyId);
    }
    return children.reduce((sum, child) => sum + getCOABalance(child.code, companyId), 0);
};
// --- STATEMENT RENDERERS ---
function renderPL(viewport, companyId) {
    const sales = getCOABalance("4100", companyId);
    const cogs = getCOABalance("5100", companyId);
    const opex = getCOABalance("6010", companyId);
    const depr = getCOABalance("6100", companyId);
    const grossProfit = sales - cogs;
    const totalExpenses = opex + depr;
    const netIncome = grossProfit - totalExpenses;
    const compObj = store.getCompanies().find(c => c.id === companyId);
    const compName = compObj ? compObj.name : "Consolidated Group Org";
    viewport.innerHTML = `
    <div class="card report-sheet animate-fade-in">
      <div class="report-header">
        <div class="report-org">${compName}</div>
        <h3>Profit & Loss Statement (Income Statement)</h3>
        <div class="report-date">For the period ending July 15, 2026</div>
      </div>

      <div style="max-width: 600px; margin: 0 auto;">
        <div class="report-row level-1">Operating Revenue</div>
        <div class="report-row indent">
          <span>Gross Product Sales Revenue</span>
          <span>${formatMoney(sales)}</span>
        </div>
        <div class="report-row indent" style="border-bottom: 2px solid var(--border-color);">
          <strong style="color:var(--text-primary);">Net Sales Revenue</strong>
          <strong>${formatMoney(sales)}</strong>
        </div>

        <div class="report-row level-1" style="margin-top: 16px;">Cost of Goods Sold (COGS)</div>
        <div class="report-row indent" style="border-bottom: 2px solid var(--border-color);">
          <span>Product Cost Expensed</span>
          <span>${formatMoney(cogs)}</span>
        </div>

        <div class="report-row level-1 text-success" style="margin-top: 16px;">
          <span>Gross Profit Margin</span>
          <span>${formatMoney(grossProfit)}</span>
        </div>

        <div class="report-row level-1" style="margin-top: 20px;">Operating Expenses</div>
        <div class="report-row indent">
          <span>General & Administrative Expenses</span>
          <span>${formatMoney(opex)}</span>
        </div>
        <div class="report-row indent">
          <span>Equipment Depreciation Expenses</span>
          <span>${formatMoney(depr)}</span>
        </div>
        <div class="report-row indent" style="border-bottom: 2px solid var(--border-color);">
          <strong style="color:var(--text-primary);">Total Operating Expenses</strong>
          <strong>${formatMoney(totalExpenses)}</strong>
        </div>

        <div class="report-row level-2 ${netIncome >= 0 ? 'text-success' : 'text-danger'}" style="margin-top: 24px;">
          <span>Net Income / Profit</span>
          <span>${formatMoney(netIncome)}</span>
        </div>
      </div>
    </div>
  `;
}
function renderBS(viewport, companyId) {
    // Current Assets
    const cash = getCOABalance("1010", companyId);
    const ar = getCOABalance("1200", companyId);
    const whtAsset = getCOABalance("1210", companyId);
    const inventory = getCOABalance("1300", companyId);
    const fixed = getCOABalance("1800", companyId);
    const accumDepr = getCOABalance("1810", companyId);
    const totalAssets = cash + ar + whtAsset + inventory + fixed + accumDepr;
    // Liabilities
    const ap = getCOABalance("2010", companyId);
    const tax = getCOABalance("2200", companyId);
    const whtLiab = getCOABalance("2220", companyId);
    const totalLiabilities = ap + tax + whtLiab;
    // Equity
    const capital = getCOABalance("3010", companyId);
    const retained = getCOABalance("3100", companyId);
    const totalEquity = capital + retained;
    const totalLiabilitiesEquity = totalLiabilities + totalEquity;
    const variance = Math.abs(totalAssets - totalLiabilitiesEquity);
    const isBalanced = variance < 0.05;
    const compObj = store.getCompanies().find(c => c.id === companyId);
    const compName = compObj ? compObj.name : "Consolidated Group Org";
    viewport.innerHTML = `
    <div class="card report-sheet animate-fade-in">
      <div class="report-header">
        <div class="report-org">${compName}</div>
        <h3>Corporate Balance Sheet Statement</h3>
        <div class="report-date">As of July 15, 2026</div>
      </div>

      <div style="max-width: 600px; margin: 0 auto;">
        <!-- ASSETS -->
        <div class="report-row level-1">Assets</div>
        <div class="report-row indent">
          <span>Cash & Bank Balances</span>
          <span>${formatMoney(cash)}</span>
        </div>
        <div class="report-row indent">
          <span>Accounts Receivable (AR)</span>
          <span>${formatMoney(ar)}</span>
        </div>
        <div class="report-row indent">
          <span>Withholding Tax Asset</span>
          <span>${formatMoney(whtAsset)}</span>
        </div>
        <div class="report-row indent">
          <span>Inventory Assets (FIFO cost)</span>
          <span>${formatMoney(inventory)}</span>
        </div>
        <div class="report-row indent">
          <span>Fixed Property & Equipment</span>
          <span>${formatMoney(fixed)}</span>
        </div>
        <div class="report-row indent" style="color: var(--color-danger);">
          <span>Less: Accumulated Depreciation</span>
          <span>-${formatMoney(Math.abs(accumDepr))}</span>
        </div>
        <div class="report-row indent level-1" style="border-bottom: 2px solid var(--border-color); color: var(--color-secondary);">
          <span>Total Asset Holdings</span>
          <span>${formatMoney(totalAssets)}</span>
        </div>

        <!-- LIABILITIES -->
        <div class="report-row level-1" style="margin-top: 20px;">Liabilities</div>
        <div class="report-row indent">
          <span>Accounts Payable (AP)</span>
          <span>${formatMoney(ap)}</span>
        </div>
        <div class="report-row indent">
          <span>VAT Output Payable</span>
          <span>${formatMoney(tax)}</span>
        </div>
        <div class="report-row indent">
          <span>Withholding Tax Payable</span>
          <span>${formatMoney(whtLiab)}</span>
        </div>
        <div class="report-row indent level-1" style="border-bottom: 2px solid var(--border-color); color: var(--color-p2p);">
          <span>Total Liabilities Outstanding</span>
          <span>${formatMoney(totalLiabilities)}</span>
        </div>

        <!-- EQUITY -->
        <div class="report-row level-1" style="margin-top: 20px;">Shareholder Equity</div>
        <div class="report-row indent">
          <span>Paid-In Share Capital</span>
          <span>${formatMoney(capital)}</span>
        </div>
        <div class="report-row indent">
          <span>Retained Earnings</span>
          <span>${formatMoney(retained)}</span>
        </div>
        <div class="report-row indent level-1" style="border-bottom: 2px solid var(--border-color); color: var(--color-primary);">
          <span>Total Equity Reserve</span>
          <span>${formatMoney(totalEquity)}</span>
        </div>

        <!-- BALANCE ROW -->
        <div class="report-row level-2" style="border-bottom: 2px double var(--border-color); margin-top: 24px;">
          <span>Total Liabilities & Shareholder Equity</span>
          <span>${formatMoney(totalLiabilitiesEquity)}</span>
        </div>

        ${!isBalanced ? `
          <div class="text-danger" style="text-align: center; margin-top: 14px; font-weight: 700;">
            WARNING: Balance Sheet is out of balance by ${formatMoney(variance)}
          </div>
        ` : `
          <div class="text-success" style="text-align: center; margin-top: 14px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Double-Entry Balanced (Assets = Liabilities + Equity)
          </div>
        `}
      </div>
    </div>
  `;
}
function renderValuation(viewport, companyId) {
    const items = store.getItems();
    const warehouses = store.getWarehouses();
    let totalAssetSum = 0;
    viewport.innerHTML = `
    <div class="card report-sheet animate-fade-in">
      <div class="report-header">
        <div class="report-org">JMIT Enterprises Inc.</div>
        <h3>Inventory Valuation Analysis Report</h3>
        <div class="report-date">FIFO Method at Cost Price Basis - July 15, 2026</div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Item Description Name</th>
              <th>UOM</th>
              <th>Unit Cost ($)</th>
              ${warehouses.map(w => `<th>${w.name} (Qty)</th>`).join("")}
              <th>Total Qty</th>
              <th>Total Asset Value ($)</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
        const totalQty = warehouses.reduce((sum, w) => sum + (item.stocks[w.id] || 0), 0);
        const val = totalQty * item.cost;
        totalAssetSum += val;
        return `
                <tr>
                  <td style="font-family: monospace; font-weight: 700; color: var(--color-inventory);">${item.sku}</td>
                  <td><strong>${item.name}</strong></td>
                  <td>${item.uom}</td>
                  <td>${formatMoney(item.cost)}</td>
                  ${warehouses.map(w => `<td>${item.stocks[w.id] || 0}</td>`).join("")}
                  <td style="font-weight: 600;">${totalQty}</td>
                  <td style="font-weight: 700; color: var(--text-primary);">${formatMoney(val)}</td>
                </tr>
              `;
    }).join("")}
            <tr style="border-top: 2px solid var(--border-color); background-color: rgba(255,255,255,0.015);">
              <td colspan="4"><strong>Consolidated Totals</strong></td>
              ${warehouses.map(w => {
        const whSum = items.reduce((sum, i) => sum + (i.stocks[w.id] || 0), 0);
        return `<td style="font-weight:600;">${whSum}</td>`;
    }).join("")}
              <td style="font-weight: 700;">${items.reduce((sum, i) => sum + Object.values(i.stocks).reduce((a, b) => a + b, 0), 0)}</td>
              <td style="font-weight: 800; color: var(--color-inventory); font-size: 1rem;">${formatMoney(totalAssetSum)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}
//# sourceMappingURL=reports.js.map