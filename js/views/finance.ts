// JMIT ERP - Treasury Payments & Fixed Assets View Module (Phase 2)
import { store } from "../store";
import { formatMoney } from "../utils";

export function renderFinance(container, pathParts) {
  const subRoute = pathParts[1] || "payments";
  const action = pathParts[2];

  const html = `
    <div class="finance-container animate-fade-in">
      <!-- Sub Tab Nav -->
      <div class="settings-tab-nav">
        <button class="settings-tab-btn ${subRoute === 'payments' ? 'active' : ''}" onclick="window.location.hash='#accounting/payments'">
          💳 Payments Entry Ledger
        </button>
        <button class="settings-tab-btn ${subRoute === 'fixed-assets' ? 'active' : ''}" onclick="window.location.hash='#accounting/fixed-assets'">
          🏢 Fixed Assets Control
        </button>
      </div>

      <div id="finance-content-viewport"></div>
    </div>
  `;

  container.innerHTML = html;
  const viewport = container.querySelector("#finance-content-viewport");

  if (subRoute === "payments") {
    if (action === "new") {
      renderPaymentForm(viewport);
    } else {
      renderPaymentsList(viewport);
    }
  } else if (subRoute === "fixed-assets") {
    renderFixedAssets(viewport);
  }
}

// --- 1. PAYMENTS ENTRIES RENDERERS ---

function renderPaymentsList(container) {
  const payments = [...store.getPayments()].reverse();
  const canCreatePay = store.checkPermission("finance", "create");

  (window as any).__csvDataPay = store.getPayments().map((p)=>[p.id,p.partnerName,p.date,p.type,String(p.amount),p.status]);
  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Treasury Receipts & Payments Ledger</h3>
        <button id="pay-csv-btn" class="btn btn-outline btn-sm no-print" onclick="var d=window.__csvDataPay;if(d)window.__exportCSV('payments.csv',["ID","Partner","Date","Type","Amount","Status"],d)">📥 Export CSV</button>
        
        ${canCreatePay ? `<div style="display: flex; gap: 8px;">
          <button onclick="window.location.hash='#accounting/payments/new?type=Receive'" class="btn btn-success btn-sm">
            + Customer Receipt
          </button>
          <button onclick="window.location.hash='#accounting/payments/new?type=Pay'" class="btn btn-danger btn-sm">
            + Supplier Payment
          </button>
        </div>` : ''}
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Type</th>
              <th>Date</th>
              <th>Business Partner</th>
              <th>Reference Details</th>
              <th>Amount ($)</th>
              <th>Currency</th>
            </tr>
          </thead>
          <tbody>
            ${payments.map(p => `
              <tr>
                <td style="font-family: monospace; font-weight: 700; color: var(--color-primary);">${p.id}</td>
                <td>
                  <span class="badge ${p.type === 'Receive' ? 'badge-success' : 'badge-danger'}">${p.type}</span>
                </td>
                <td>${p.date}</td>
                <td><strong>${p.partnerName}</strong></td>
                <td>${p.reference}</td>
                <td style="font-weight: 700;">${formatMoney(p.amount)}</td>
                <td><span class="badge badge-draft">${p.currency}</span> (Rate: ${p.rate})</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPaymentForm(container) {
  const url = window.location.hash;
  const matchType = url.match(/type=([^&]+)/);
  const type = matchType ? matchType[1] : "Receive"; // Receive or Pay

  // Prefill reference bills if coming from click
  const matchBill = url.match(/bill=([^&]+)/);
  const prefillBillId = matchBill ? matchBill[1] : "";

  const partners = type === "Receive" ? store.getPartners().customers : store.getPartners().vendors;
  const invoices = type === "Receive" ? store.getSalesInvoices() : store.getPurchaseInvoices();
  const exchangeRates = store.getExchangeRates();
  const activeCompany = store.getActiveCompany();

  let partnerOptions = partners.map(p => `<option value="${p.id}">${p.name} (TIN: ${p.taxId})</option>`).join("");
  let invoiceOptions = invoices.map(i => `<option value="${i.id}">${i.id} - ${i.customerName || i.vendorName} (Due: ${formatMoney(i.total)})</option>`).join("");

  container.innerHTML = `
    <div class="card animate-fade-in" style="max-width: 600px; margin: 0 auto;">
      <div class="card-header">
        <h3 class="card-title">${type === 'Receive' ? 'Customer Cash Receipt' : 'Supplier Cash Payment'} Form</h3>
        <button onclick="window.location.hash='#accounting/payments'" class="btn btn-outline btn-sm">Cancel</button>
      </div>

      <form id="payment-entry-form">
        <div class="form-group">
          <label class="form-label">${type === 'Receive' ? 'Customer' : 'Vendor Supplier'}</label>
          <select id="pay-partner" class="form-control" required>
            <option value="" disabled selected>Select partner...</option>
            ${partnerOptions}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Reference Invoice / Bill (Optional)</label>
          <select id="pay-invoice" class="form-control">
            <option value="">No Invoice Reference (Direct Account Deposit)</option>
            ${invoiceOptions}
          </select>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Payment Mode (Cash GL Account)</label>
            <select class="form-control" readonly>
              <option value="1010">1010 - Cash & Bank Liquidity</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" id="pay-date" class="form-control" value="${new Date().toISOString().split("T")[0]}" required />
          </div>
        </div>

        <div class="grid-3">
          <div class="form-group">
            <label class="form-label">Currency</label>
            <select id="pay-currency" class="form-control">
              <option value="USD" ${activeCompany.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
              <option value="PHP" ${activeCompany.currency === 'PHP' ? 'selected' : ''}>PHP (₱)</option>
              <option value="EUR" ${activeCompany.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Exchange Rate</label>
            <input type="number" id="pay-rate" class="form-control" step="0.0001" value="1.0" required />
          </div>
          <div class="form-group">
            <label class="form-label">Amount</label>
            <input type="number" id="pay-amount" class="form-control" min="0.01" step="0.01" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Memo / Description Details</label>
          <input type="text" id="pay-reference" class="form-control" placeholder="Check #10031 deposit / Bank wire reference" required />
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" onclick="window.location.hash='#accounting/payments'" class="btn btn-outline">Cancel</button>
          <button type="submit" class="btn ${type === 'Receive' ? 'btn-success' : 'btn-danger'}">Post Payment Entry</button>
        </div>
      </form>
    </div>
  `;

  const form = container.querySelector("#payment-entry-form");
  const partnerSelect = form.querySelector("#pay-partner");
  const invoiceSelect = form.querySelector("#pay-invoice");
  const amountInput = form.querySelector("#pay-amount");
  const currencySelect = form.querySelector("#pay-currency");
  const rateInput = form.querySelector("#pay-rate");

  currencySelect.addEventListener("change", (e) => {
    rateInput.value = exchangeRates[e.target.value] || 1.0;
  });

  // Pre-fill invoice values on change
  invoiceSelect.addEventListener("change", () => {
    const inv = invoices.find(i => i.id === invoiceSelect.value);
    if (inv) {
      amountInput.value = inv.total;
      
      // Auto pre-fill partner matching the invoice
      if (type === "Receive") {
        partnerSelect.value = inv.customerId;
      } else {
        partnerSelect.value = inv.vendorId;
      }
    }
  });

  // Auto-select bill if coming from invoice creation flow
  if (prefillBillId) {
    invoiceSelect.value = prefillBillId;
    invoiceSelect.dispatchEvent(new Event("change"));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const payData = {
      type,
      partnerId: partnerSelect.value,
      referenceInvoiceId: invoiceSelect.value || "",
      amount: Number(amountInput.value),
      currency: currencySelect.value,
      rate: Number(rateInput.value),
      reference: form.querySelector("#pay-reference").value,
      date: form.querySelector("#pay-date").value
    };

    try {
      store.createPaymentEntry(payData);
      window.showToast("Payment entry successfully saved. Treasury liquidity updated.", "success");
      window.location.hash = "#accounting/payments";
    } catch (err) {
      window.showToast(err.message, "danger");
    }
  });
}

// --- 2. FIXED ASSETS & DEPRECIATION RENDERERS ---

function renderFixedAssets(container) {
  const assets = store.getFixedAssets();
  const accounts = store.getAccounts().filter(a => a.parentCode !== null);
  const canDepreciate = store.checkPermission("finance", "approve");
  const canCreateAsset = store.checkPermission("finance", "create");

  const html = `
    <div class="grid-main-side animate-fade-in">
      <!-- Fixed Assets Registry List -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Fixed Assets Register</h3>
          ${canDepreciate ? `<button id="run-depr-btn" class="btn btn-danger btn-sm">Run Monthly Depreciation</button>` : ''}
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Asset Name</th>
                <th>Capital Date</th>
                <th>Acquire Cost ($)</th>
                <th>Useful Life (Yr)</th>
                <th>Monthly Depr ($)</th>
                <th>Accum Depr ($)</th>
                <th>Net Book Value ($)</th>
                <th>Status</th>
                <th>Schedule</th>
              </tr>
            </thead>
            <tbody>
              ${assets.map(a => {
                const netBookValue = a.cost - a.accumDepreciation;
                const deprBase = a.cost - a.salvageValue;
                const monthlyDepr = a.usefulLife > 0 ? parseFloat(((deprBase / a.usefulLife) / 12).toFixed(2)) : 0;
                return `
                  <tr>
                    <td style="font-family: monospace; font-weight: 700; color: var(--color-primary);">${a.id}</td>
                    <td><strong>${a.name}</strong></td>
                    <td>${a.purchaseDate}</td>
                    <td>${formatMoney(a.cost)}</td>
                    <td>${a.usefulLife} years</td>
                    <td style="font-weight:600; color:var(--color-p2p);">${formatMoney(monthlyDepr)}</td>
                    <td class="text-danger">-${formatMoney(a.accumDepreciation)}</td>
                    <td style="font-weight: 700; color: var(--color-o2c);">${formatMoney(netBookValue)}</td>
                    <td>
                      ${a.active ? '<span class="badge badge-success">Capitalized</span>' : '<span class="badge badge-danger">Retired</span>'}
                    </td>
                    <td>
                      <button class="btn btn-outline btn-sm view-schedule-btn" data-asset-id="${a.id}" style="font-size:0.7rem; padding:2px 6px;">Schedule</button>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Fixed Asset Wizard -->
      ${canCreateAsset ? `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Acquire Fixed Asset</h3>
        </div>
        <form id="new-asset-form">
          <div class="form-group">
            <label class="form-label">Asset Description</label>
            <input type="text" id="ast-name" class="form-control" placeholder="Server Rack Switch Cabinets" required />
          </div>
          <div class="form-group">
            <label class="form-label">Purchase Date</label>
            <input type="date" id="ast-date" class="form-control" value="${new Date().toISOString().split("T")[0]}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Asset Cost ($)</label>
              <input type="number" id="ast-cost" class="form-control" min="1" placeholder="5000" required />
            </div>
            <div class="form-group">
              <label class="form-label">Useful Life (Years)</label>
              <input type="number" id="ast-life" class="form-control" min="1" value="5" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Salvage Value ($)</label>
              <input type="number" id="ast-salvage" class="form-control" min="0" value="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Asset GL Account</label>
              <select id="ast-account" class="form-control">
                <option value="1800">1800 - Fixed Property & Equipment</option>
              </select>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-sm btn-block">Acquire & Capitalize</button>
        </form>
      </div>
      ` : ''}
    </div>

    <!-- Inner modal overlay -->
    <div id="depr-modal-mount"></div>
  `;

  container.innerHTML = html;

  const modalMount = container.querySelector("#depr-modal-mount");

  // Run Depreciation Action Click
  const runDeprBtn = container.querySelector("#run-depr-btn");
  if (runDeprBtn) {
    runDeprBtn.addEventListener("click", () => {
    modalMount.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Run Monthly Depreciation</h3>
            <button class="modal-close">&times;</button>
          </div>
          <form id="depreciate-runner-form">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Posting Date (End of Month)</label>
                <input type="date" id="depr-date" class="form-control" value="${new Date().toISOString().split("T")[0]}" required />
              </div>
              <p style="font-size:0.8rem; margin-top:10px;" class="text-secondary">
                Running this action evaluates all Capitalized assets, calculates their straight-line monthly depreciation, and posts the corresponding debit/credit adjusting entries to the general ledger.
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-danger">Execute Depreciation</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const close = () => modalMount.innerHTML = "";
    modalMount.querySelector(".modal-close").addEventListener("click", close);
    modalMount.querySelector(".modal-cancel").addEventListener("click", close);

    modalMount.querySelector("#depreciate-runner-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const date = ev.target.querySelector("#depr-date").value;

      try {
        const totalDepr = store.runDepreciation(date);
        if (totalDepr > 0) {
          window.showToast(`Depreciation execution complete! Total posting: ${formatMoney(totalDepr)}. Adjustments ledger saved.`, "success");
        } else {
          window.showToast("All active assets are already fully depreciated.", "warning");
        }
        close();
        renderFixedAssets(container);
      } catch (err) {
        window.showToast(err.message, "danger");
      }
    });
  });
  } // end if (runDeprBtn)

  // Create Fixed Asset
  const newAssetForm = container.querySelector("#new-asset-form");
  if (newAssetForm) {
    newAssetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const asset = {
      name: e.target.querySelector("#ast-name").value,
      purchaseDate: e.target.querySelector("#ast-date").value,
      cost: Number(e.target.querySelector("#ast-cost").value),
      usefulLife: Number(e.target.querySelector("#ast-life").value),
      salvageValue: Number(e.target.querySelector("#ast-salvage").value),
      assetAccount: e.target.querySelector("#ast-account").value
    };

    try {
      store.addFixedAsset(asset);
      window.showToast(`Asset "${asset.name}" capitalized at cost ${formatMoney(asset.cost)}. GL capitalized entry posted.`, "success");
      renderFixedAssets(container);
    } catch (err) {
      window.showToast(err.message, "danger");
    }
  });
  } // end if (newAssetForm)

  // View Depreciation Schedule
  container.querySelectorAll(".view-schedule-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const assetId = btn.getAttribute("data-asset-id");
      const asset = assets.find(a => a.id === assetId);
      if (!asset) return;

      const schedule = store.getDepreciationSchedule(assetId);
      const deprBase = asset.cost - asset.salvageValue;
      const monthlyDepr = asset.usefulLife > 0 ? parseFloat(((deprBase / asset.usefulLife) / 12).toFixed(2)) : 0;

      const scheduleRows = schedule.length > 0 ? schedule.map(s => `
        <tr>
          <td>${s.period}</td>
          <td style="font-family:monospace; font-size:0.8rem;">${s.yearMonth}</td>
          <td style="font-weight:600; color:var(--color-p2p);">${formatMoney(s.deprAmount)}</td>
          <td class="text-danger">${formatMoney(s.accumDepreciation)}</td>
          <td style="font-weight:700; color:var(--color-o2c);">${formatMoney(s.netBookValue)}</td>
        </tr>
      `).join("") : `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px;">Asset fully depreciated or retired — no remaining schedule.</td></tr>`;

      modalMount.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">Depreciation Schedule — ${asset.name}</h3>
                <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">
                  Cost: ${formatMoney(asset.cost)} | Salvage: ${formatMoney(asset.salvageValue)} | 
                  Life: ${asset.usefulLife} yrs | Monthly: <strong>${formatMoney(monthlyDepr)}</strong> | 
                  Accumulated: <strong class="text-danger">${formatMoney(asset.accumDepreciation)}</strong>
                </div>
              </div>
              <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body" style="max-height:55vh; overflow-y:auto;">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Period</th>
                    <th>Depr Amount ($)</th>
                    <th>Accum Depr ($)</th>
                    <th>Net Book Value ($)</th>
                  </tr>
                </thead>
                <tbody>${scheduleRows}</tbody>
              </table>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline modal-cancel">Close</button>
            </div>
          </div>
        </div>
      `;

      const close = () => modalMount.innerHTML = "";
      modalMount.querySelector(".modal-close").addEventListener("click", close);
      modalMount.querySelector(".modal-cancel").addEventListener("click", close);
    });
  });
}
