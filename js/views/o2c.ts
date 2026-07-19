// JMIT ERP - Sales & Order-to-Cash (O2C) Full-Page Flow View Module
import { store } from "../store";
import { formatMoney } from "../utils";

export function renderO2C(container, pathParts) {
  const subPage = pathParts[1] || "sales-orders";
  const action = pathParts[2];
  const paramId = pathParts[3];

  if (subPage === "sales-orders") {
    if (action === "new") {
      renderSalesOrderForm(container);
    } else if (action === "view" && paramId) {
      renderSalesOrderDetails(container, paramId);
    } else {
      renderSalesOrdersList(container);
    }
  } else if (subPage === "deliveries") {
    if (action === "new") {
      renderDeliveryForm(container);
    } else if (action === "view" && paramId) {
      renderDeliveryDetails(container, paramId);
    } else {
      renderDeliveriesList(container);
    }
  } else if (subPage === "invoices") {
    if (action === "new") {
      renderInvoiceForm(container);
    } else if (action === "view" && paramId) {
      renderInvoiceDetails(container, paramId);
    } else {
      renderInvoicesList(container);
    }
  } else if (subPage === "returns") {
    if (action === "new") {
      renderReturnForm(container);
    } else {
      renderReturnsList(container);
    }
  }
}

// --- 1. SALES ORDERS VIEW RENDERERS ---

function renderSalesOrdersList(container) {
  const salesOrders = [...store.getSalesOrders()].reverse();

  (window as any).__csvDataSo = store.getSalesOrders().map((o) => [o.id, o.customerName, o.date, o.currency, String(o.total), o.status]);
  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Sales Orders Register Ledger</h3>
        <button id="csvDataSo" class="btn btn-outline btn-sm no-print" onclick="var d=window.__csvDataSo;if(d)window.__exportCSV('sales-orders.csv',["SO#","Customer","Date","Currency","Total","Status"],d)">🔽 Export CSV</button>
        <button onclick="window.location.hash='#o2c/sales-orders/new'" class="btn btn-success btn-sm">
          + Create Sales Order
        </button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Currency</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${salesOrders.map(so => `
              <tr>
                <td style="font-family: monospace; font-weight: 700; color: var(--color-primary);">${so.id}</td>
                <td><strong>${so.customerName}</strong></td>
                <td>${so.date}</td>
                <td><span class="badge badge-draft">${so.currency}</span> (Rate: ${so.rate})</td>
                <td style="font-weight: 700;">${formatMoney(so.total)}</td>
                <td>
                  <span class="badge ${so.status === 'Closed' ? 'badge-success' : 'badge-pending'}">${so.status}</span>
                </td>
                <td>
                  <a href="#o2c/sales-orders/view/${so.id}" class="btn btn-outline btn-sm">View Details</a>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSalesOrderForm(container) {
  const customers = store.getPartners().customers;
  const items = store.getItems();
  const rates = store.getExchangeRates();
  const activeCompany = store.getActiveCompany();

  let customerOptions = customers.map(c => `<option value="${c.id}">${c.name} (TIN: ${c.taxId})</option>`).join("");
  let itemOptions = items.map(i => `<option value="${i.id}">${i.name} (${formatMoney(i.price)})</option>`).join("");

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">New Sales Order Form</h3>
        <button onclick="window.location.hash='#o2c/sales-orders'" class="btn btn-outline btn-sm">Back to Ledger</button>
      </div>
      <form id="sales-order-form">
        <div class="form-group" style="margin-bottom:16px;">
          <label class="form-label">Transaction Type</label>
          <select id="so-transtype" class="form-control" style="max-width:250px;">
            <option value="Goods">Goods (Inventory Items)</option>
            <option value="Services">Services (Non-Inventory)</option>
          </select>
        </div>
        <div class="grid-2">
          <div>
            <div class="form-group">
              <label class="form-label">Company</label>
              <select id="so-company" class="form-control" required>
                ${store.getCompanies().map(c => `<option value="${c.id}" ${c.id === activeCompany.id ? 'selected' : ''}>${c.name}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Customer Company</label>
              <select id="so-customer" class="form-control" required>
                <option value="" disabled selected>Select customer...</option>
                ${customerOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Shipping / Delivery Address</label>
              <input type="text" id="so-address" class="form-control" placeholder="100 Ayala Avenue, Makati City" required />
            </div>
          </div>
              <div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Billing Currency</label>
                <select id="so-currency" class="form-control">
                  <option value="USD" ${activeCompany.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                  <option value="PHP" ${activeCompany.currency === 'PHP' ? 'selected' : ''}>PHP (₱)</option>
                  <option value="EUR" ${activeCompany.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Exchange Rate</label>
                <input type="number" id="so-rate" class="form-control" step="0.0001" value="1.0" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Posting Date</label>
              <input type="date" id="so-date" class="form-control" value="${new Date().toISOString().split("T")[0]}" required />
            </div>
          </div>
        </div>

        <div style="margin-top: 20px;">
          <h4 style="font-size: 0.9rem; text-transform: uppercase; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 12px;">Order Items List</h4>
          <table class="order-items-table">
            <thead>
              <tr>
                <th style="width: 45%;">Item Description</th>
                <th style="width: 20%;">UOM Code</th>
                <th style="width: 15%;">Quantity</th>
                <th style="width: 15%;">Unit Price</th>
                <th style="width: 5%;"></th>
              </tr>
            </thead>
            <tbody id="so-lines-body">
              <!-- Dynamically populated lines -->
            </tbody>
          </table>
          <button type="button" id="so-add-line" class="btn btn-outline btn-sm">+ Add Line Item</button>
        </div>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color);">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px;">
            <div class="form-group">
              <label class="form-label">VAT Amount (₱)</label>
              <input type="number" id="so-vat-amt" class="form-control" value="0" step="0.01" min="0" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label class="form-label">WHT Amount (₱)</label>
              <input type="number" id="so-wht-amt" class="form-control" value="0" step="0.01" min="0" placeholder="0.00" />
            </div>
            <div style="border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; background: rgba(255,255,255,0.02); display:flex; align-items:center;">
              <span style="font-size: 0.75rem; color: var(--text-secondary);">Sales GL: <strong id="so-salesacct-disp" style="font-family:monospace;">${store.getSettings().glMappings.salesAccount}</strong></span>
            </div>
          </div>
              <!-- Other Charges -->
          <div style="margin-bottom: 12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
              <label class="form-label" style="margin:0;">Other Charges</label>
              <button type="button" id="so-add-charge" class="btn btn-outline btn-xs">+ Add Charge</button>
            </div>
            <table id="so-charges-table" style="width:100%; font-size:0.8rem;">
              <thead><tr>
                <th style="width:160px;">GL Account</th>
                <th style="width:80px;">Rate%</th>
                <th style="width:120px;">Amount</th>
                <th style="width:70px;">Base</th>
                <th style="width:35px;" title="VAT">V</th>
                <th style="width:35px;" title="WHT">W</th>
                <th style="width:120px;">Total</th>
                <th style="width:30px;"></th>
              </tr></thead>
              <tbody id="so-charges-body"></tbody>
            </table>
          </div>
              <div style="text-align: right; padding-top: 12px; border-top: 1px solid var(--border-color);">
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 4px;">
              Subtotal: <strong id="so-subtotal">$0.00</strong>
            </div>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 4px;">
              VAT from Charges: <strong id="so-vat-charges" style="display:none;">$0.00</strong>
            </div>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 4px;">
              WHT from Charges: <strong id="so-wht-charges" style="display:none;">$0.00</strong>
            </div>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 4px;">
              VAT Amount (manual): <strong id="so-tax">$0.00</strong>
            </div>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 4px;">
              WHT Amount (manual): <strong id="so-wht">$0.00</strong>
            </div>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 4px;">
              Other Charges: <strong id="so-other-total">$0.00</strong>
            </div>
            <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-top: 4px;">
              Net Order Total: <strong id="so-total" class="text-success">$0.00</strong>
            </div>
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" onclick="window.location.hash='#o2c/sales-orders'" class="btn btn-outline">Cancel</button>
          <button type="submit" class="btn btn-success">Save & Approve Sales Order</button>
        </div>
      </form>
    </div>
      
  `;

  const form = container.querySelector("#sales-order-form");
  const linesBody = container.querySelector("#so-lines-body");
  const addLineBtn = container.querySelector("#so-add-line");
  const customerSelect = container.querySelector("#so-customer");
  const addressInput = container.querySelector("#so-address");
  const currencySelect = container.querySelector("#so-currency");
  const rateInput = container.querySelector("#so-rate");

  // Sync exchange rate on currency change
  currencySelect.addEventListener("change", (e) => {
    rateInput.value = rates[e.target.value] || 1.0;
    updateTotals();
  });

  customerSelect.addEventListener("change", (e) => {
    const c = store.getPartner(e.target.value);
    if (c) {
      addressInput.value = c.address;
    }
  });

  const updateTotals = () => {
    let subtotal = 0;
    linesBody.querySelectorAll(".so-line-row").forEach(row => {
      const itemId = ((row.querySelector(".line-item") as HTMLSelectElement) as HTMLSelectElement).value;
      const qty = Number(((row.querySelector(".line-qty") as HTMLInputElement) as HTMLInputElement).value) || 0;
      if (itemId) {
        const item = store.getItem(itemId);
        if (item) {
          subtotal += item.price * qty;
        }
      }
    });

    const maps = store.getSettings().glMappings;
    
    // Compute charges and auto-fill VAT/WHT from tagged GL accounts
    let otherTotal = 0;
    let autoVat = 0;
    let autoWht = 0;
    
    container.querySelectorAll(".so-charge-row").forEach(row => {
      const amt = Number((row.querySelector(".charge-amt") as HTMLInputElement).value) || 0;
      const chargeVatPct = Number((row.querySelector(".charge-vat") as HTMLInputElement).value) || 0;
      const acctCode = (row.querySelector(".charge-acct") as HTMLSelectElement).value;
      const baseOn = (row.querySelector(".charge-base") as HTMLSelectElement).value;
      const baseAmt = baseOn === 'gross' ? amt / (1 + chargeVatPct / 100) : amt;
      const chargeVat = parseFloat((baseAmt * (chargeVatPct / 100)).toFixed(2));
      const chargeTotal = parseFloat((baseAmt + chargeVat).toFixed(2));
      (row.querySelector(".charge-total") as HTMLElement).textContent = formatMoney(chargeTotal);
      // Checkbox routing: VAT/WHT/Other
      const isVat = (row.querySelector(".charge-isvat") as HTMLInputElement).checked;
      const isWht = (row.querySelector(".charge-iswht") as HTMLInputElement).checked;
      if (isVat) {
        autoVat += chargeTotal;
      } else if (isWht) {
        autoWht += chargeTotal;
      } else {
        otherTotal += chargeTotal;
      }
    });
    
    // Auto-fill main VAT/WHT fields from tagged charges
    if (autoVat > 0) {
      const vatInp = container.querySelector("#so-vat-amt") as HTMLInputElement;
      vatInp.value = String(autoVat.toFixed(2));
    }
    if (autoWht > 0) {
      const whtInp = container.querySelector("#so-wht-amt") as HTMLInputElement;
      whtInp.value = String(autoWht.toFixed(2));
    }
    
    const tax = Number((container.querySelector("#so-vat-amt") as HTMLInputElement).value) || 0;
    const wht = Number((container.querySelector("#so-wht-amt") as HTMLInputElement).value) || 0;

    const total = parseFloat((subtotal + tax - wht + otherTotal).toFixed(2));

    container.querySelector("#so-subtotal").textContent = `${formatMoney(subtotal)}`;
    
    // Show VAT/WHT from charges subtotals
    const vatChargesEl = container.querySelector("#so-vat-charges") as HTMLElement;
    if (autoVat > 0) {
      vatChargesEl.style.display = '';
      vatChargesEl.textContent = `${formatMoney(autoVat)}`;
    } else {
      vatChargesEl.style.display = 'none';
    }
    const whtChargesEl = container.querySelector("#so-wht-charges") as HTMLElement;
    if (autoWht > 0) {
      whtChargesEl.style.display = '';
      whtChargesEl.textContent = `${formatMoney(autoWht)}`;
    } else {
      whtChargesEl.style.display = 'none';
    }
    
    container.querySelector("#so-tax").textContent = `${formatMoney(tax)}`;
    container.querySelector("#so-wht").textContent = `${formatMoney(wht)}`;
    container.querySelector("#so-other-total").textContent = `${formatMoney(otherTotal)}`;
    container.querySelector("#so-total").textContent = `${formatMoney(total)}`;
  };

  const addLine = () => {
    const tr = document.createElement("tr");
    tr.className = "so-line-row";
    tr.innerHTML = `
      <td>
        <select class="form-control line-item" required>
          <option value="" disabled selected>Select item...</option>
          ${itemOptions}
        </select>
      </td>
      <td>
        <select class="form-control line-uom">
          <option value="pcs">pcs (Single)</option>
          <option value="pack_of_5">pack of 5</option>
          <option value="box_of_10">box of 10</option>
        </select>
      </td>
      <td>
        <input type="number" class="form-control line-qty" min="1" value="1" required />
      </td>
      <td>
        <input type="text" class="form-control line-price" readonly value="0.00" />
      </td>
      <td>
        <button type="button" class="btn btn-outline btn-sm remove-line" style="color: var(--color-danger); border-color: transparent;">&times;</button>
      </td>
    `;

    linesBody.appendChild(tr);

    const itemSel = tr.querySelector(".line-item");
    const qtyInp = tr.querySelector(".line-qty");
    const priceInp = tr.querySelector(".line-price");
    const removeBtn = tr.querySelector(".remove-line");

    itemSel.addEventListener("change", () => {
      const item = store.getItem((itemSel as HTMLSelectElement).value);
      if (item) {
        (priceInp as HTMLInputElement).value = item.price.toFixed(2);
      }
      updateTotals();
    });

    qtyInp.addEventListener("input", updateTotals);
    removeBtn.addEventListener("click", () => { tr.remove(); updateTotals(); });

    updateTotals();
  };

  addLineBtn.addEventListener("click", addLine);
  addLine(); // add first line

  // VAT/WHT manual amount listeners
  const vatAmtInp = container.querySelector("#so-vat-amt") as HTMLInputElement;
  const whtAmtInp = container.querySelector("#so-wht-amt") as HTMLInputElement;
  vatAmtInp.addEventListener("input", updateTotals);
  whtAmtInp.addEventListener("input", updateTotals);

  // Other charges
  const chargesBody = container.querySelector("#so-charges-body") as HTMLElement;
  const acctOptions = store.getAccounts().map(a => `<option value="${a.code}">${a.code} — ${a.name}</option>`).join("");
  
  const addCharge = () => {
    const tr = document.createElement("tr");
    tr.className = "so-charge-row";
    tr.innerHTML = `
      <td><select class="form-control charge-acct" style="width:100%">${acctOptions}</select></td>
      <td><input type="number" class="form-control charge-vat" style="width:100%" value="0" step="0.01" min="0" max="100" placeholder="12" /></td>
      <td><input type="number" class="form-control charge-amt" style="width:100%" value="0" step="0.01" min="0" placeholder="0.00" /></td>
      <td><select class="form-control charge-base" style="width:100%"><option value="net">Net</option><option value="gross">Gross</option></select></td>
      <td style="text-align:center;"><input type="checkbox" class="charge-isvat" style="width:16px;height:16px;cursor:pointer;" title="Tick if this is VAT" /></td>
      <td style="text-align:center;"><input type="checkbox" class="charge-iswht" style="width:16px;height:16px;cursor:pointer;" title="Tick if this is WHT" /></td>
      <td class="charge-total" style="font-weight:700;color:var(--color-o2c);">${formatMoney(0)}</td>
      <td><button type="button" class="btn btn-outline btn-sm remove-charge" style="color:var(--color-danger);border-color:transparent;">&times;</button></td>
    `;
    chargesBody.appendChild(tr);
    
    // Listeners
    tr.querySelector(".charge-amt").addEventListener("input", updateTotals);
    tr.querySelector(".charge-vat").addEventListener("input", updateTotals);
    tr.querySelector(".charge-base").addEventListener("change", updateTotals);
    tr.querySelector(".charge-isvat").addEventListener("change", updateTotals);
    tr.querySelector(".charge-iswht").addEventListener("change", updateTotals);
    tr.querySelector(".remove-charge").addEventListener("click", () => { tr.remove(); updateTotals(); });
    updateTotals();
  };
  
  container.querySelector("#so-add-charge").addEventListener("click", addCharge);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const lines = [];
    linesBody.querySelectorAll(".so-line-row").forEach(row => {
      const itemId = ((row.querySelector(".line-item") as HTMLSelectElement) as HTMLSelectElement).value;
      const qty = Number(((row.querySelector(".line-qty") as HTMLInputElement) as HTMLInputElement).value);
      const uom = row.querySelector(".line-uom").value;
      lines.push({ itemId, qty, uom });
    });

    try {
      const otherCharges: any[] = [];
      chargesBody.querySelectorAll(".so-charge-row").forEach(row => {
        const acct = (row.querySelector(".charge-acct") as HTMLSelectElement).value;
        const amt = Number((row.querySelector(".charge-amt") as HTMLInputElement).value) || 0;
        const vatPct = Number((row.querySelector(".charge-vat") as HTMLInputElement).value) || 0;
        const baseOn = (row.querySelector(".charge-base") as HTMLSelectElement).value;
        const isVat = (row.querySelector(".charge-isvat") as HTMLInputElement).checked;
        const isWht = (row.querySelector(".charge-iswht") as HTMLInputElement).checked;
        if (amt > 0) otherCharges.push({ accountCode: acct, amount: amt, vatRate: vatPct, baseOn, isVat, isWht });
      });

      const maps = store.getSettings().glMappings;
      const soData = {
        companyId: (form.querySelector("#so-company") as HTMLSelectElement).value,
        customerId: customerSelect.value,
        date: form.querySelector("#so-date").value,
        items: lines,
        currency: currencySelect.value,
        rate: Number(rateInput.value),
        taxAmount: Number(vatAmtInp.value) || 0,
        whtAmount: Number(whtAmtInp.value) || 0,
        salesAccountCode: maps.salesAccount,
        otherCharges
      };

      store.createSalesOrder(soData);
      window.showToast("Sales Order successfully generated and approved.", "success");
      window.location.hash = "#o2c/sales-orders";
    } catch (err) {
      window.showToast(err.message, "danger");
    }
  });
}

function renderSalesOrderDetails(container, orderId) {
  const so = store.getSalesOrders().find(s => s.id === orderId);
  if (!so) {
    const maps = store.getSettings().glMappings;
    const sub = so.subtotal || 0;
    const tax = so.tax || 0;
    const wht = so.withholding || 0;
    const cogs = so.items.reduce((s,i)=>s+(store.getItem(i.itemId)?.cost||0)*i.qty,0);
    const lines = [
      {code:maps.arAccount,debit:so.total,credit:0},
      {code:maps.whtAssetAccount,debit:wht,credit:0},
      {code:so.salesAccountCode||maps.salesAccount,debit:0,credit:sub},
      {code:maps.taxAccount,debit:0,credit:tax}
    ];
    (so.otherCharges||[]).forEach(ch=>{
      if(ch.isVat||ch.isWht)return;
      lines.push({code:ch.accountCode||"",debit:0,credit:ch.total||0});
    });
    lines.push({code:maps.cogsAccount,debit:cogs,credit:0});
    lines.push({code:maps.inventoryAccount,debit:0,credit:cogs});
  container.innerHTML = `<div class="card"><p class="text-danger">Order not found.</p></div>`;
    return;
  }

  const isDraft = so.status === "Draft";
  const canApprove = store.checkPermission("o2c", "approve");
  const canDelete = store.checkPermission("o2c", "delete");

  // Show Delivery and Invoice triggers only if user has write/create permission
  const hasWritePermission = store.checkPermission("o2c", "create");
  const showDeliveryBtn = so.status === "Approved" && hasWritePermission;
  const showInvoiceBtn = so.status === "Delivered" && hasWritePermission;

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <span style="font-size: 0.8rem; color: var(--color-primary); font-family: monospace; font-weight: 700;">${so.id}</span>
          <h3 class="card-title" style="margin-top: 4px;">Sales Order details</h3>
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="window.location.hash='#o2c/sales-orders'" class="btn btn-outline btn-sm">Back</button> <button onclick="window.print()" class="btn btn-outline btn-sm no-print">🖨️ Print</button>
          ${isDraft && canApprove ? `<button id="approve-so-btn" class="btn btn-primary btn-sm">Approve Sales Order</button>` : ''}
          ${isDraft && canDelete ? `<button id="delete-so-btn" class="btn btn-danger btn-sm">Cancel & Delete</button>` : ''}
          ${showDeliveryBtn ? `<button id="proceed-delivery-btn" class="btn btn-primary btn-sm">Ship Stock (Delivery Note)</button>` : ''}
          ${showInvoiceBtn ? `<button id="proceed-invoice-btn" class="btn btn-success btn-sm">Generate Sales Invoice</button>` : ''}
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 24px;">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Customer</div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-top: 4px;">${so.customerName}</div>
          <div class="text-muted" style="font-size: 0.8rem; margin-top: 2px;">Company TIN: ${store.getPartner(so.customerId).taxId}</div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="text-secondary">Posting Date:</span>
            <strong>${so.date}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="text-secondary">Currency Rate:</span>
            <strong>${so.currency} @ ${so.rate}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span class="text-secondary">Status:</span>
            <span class="badge ${so.status === 'Closed' ? 'badge-success' : so.status === 'Approved' ? 'badge-pending' : so.status === 'Draft' ? 'badge-draft' : 'badge-danger'}">${so.status}</span>
          </div>
        </div>
      </div>

      <h4 style="font-size: 0.85rem; text-transform: uppercase; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 10px;">Items Ordered</h4>
      <div class="table-container" style="margin-bottom: 24px;">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Description</th>
              <th>UOM</th>
              <th>Ordered Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${so.items.map(item => `
              <tr>
                <td style="font-family: monospace; font-weight: 600;">${item.sku}</td>
                <td><strong>${item.name}</strong></td>
                <td>${item.uom}</td>
                <td>${item.qty}</td>
                <td>${formatMoney(item.price)}</td>
                <td style="font-weight: 700;">${formatMoney(item.qty * item.price)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div style="max-width: 340px; margin-left: auto; text-align: right; display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem;">
        <div style="display: flex; justify-content: space-between;">
          <span class="text-secondary">Subtotal:</span>
          <span>${formatMoney(so.subtotal)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-secondary">VAT Tax:</span>
          <span>${formatMoney(so.tax)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-secondary">Withholding Tax:</span>
          <span class="text-danger">-${formatMoney(so.withholding)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-secondary">Sales GL Account:</span>
          <span style="font-family:monospace;">${so.salesAccountCode || '4100'}</span>
        </div>
        ${(so.otherCharges || []).length > 0 ? '<div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:2px;">Other Charges:</div>' + (so.otherCharges || []).map((ch: any) => {
        const a = Number(ch.amount) || 0;
        const v = Number(ch.vatRate) || 0;
        const b = ch.baseOn || 'net';
        const base = b === 'gross' ? a / (1 + v / 100) : a;
        const total = parseFloat((base + (base * v / 100)).toFixed(2));
        const tag = ch.isVat ? ' [VAT]' : ch.isWht ? ' [WHT]' : '';
        return `
        <div style="display: flex; justify-content: space-between; font-size:0.8rem;">
          <span class="text-secondary">${ch.accountCode}${tag}${ch.vatRate ? ' ' + ch.vatRate + '%' : ''} ${ch.baseOn || 'net'}:</span>
          <span>${formatMoney(total)}</span>
        </div>`;
        }).join("") : ''}
        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 8px; font-size: 1.1rem; font-weight: 700;">
          <span>Net Total:</span>
          <span class="text-success">${formatMoney(so.total)}</span>
        </div>
      </div>
    </div>
  `;

  // Action listeners
  if (isDraft && canApprove) {
    container.querySelector("#approve-so-btn").addEventListener("click", () => {
      try {
        store.approveSalesOrder(so.id);
        window.showToast(`Sales Order ${so.id} approved successfully.`, "success");
        renderSalesOrderDetails(container, orderId);
      } catch (err) {
        window.showToast(err.message, "danger");
      }
    });
  }
  if (isDraft && canDelete) {
    container.querySelector("#delete-so-btn").addEventListener("click", () => {
      if (confirm("Permanently delete this draft Sales Order?")) {
        try {
          store.deleteDocument("o2c", "salesOrders", so.id);
          window.showToast("Draft Sales Order deleted.", "warning");
          window.location.hash = "#o2c/sales-orders";
        } catch (err) {
          window.showToast(err.message, "danger");
        }
      }
    });
  }
  if (showDeliveryBtn) {
    container.querySelector("#proceed-delivery-btn").addEventListener("click", () => {
      window.location.hash = `#o2c/deliveries/new?so=${so.id}`;
    });
  }
  if (showInvoiceBtn) {
    container.querySelector("#proceed-invoice-btn").addEventListener("click", () => {
      window.location.hash = `#o2c/invoices/new?so=${so.id}`;
    });
  }
}


// --- 2. DELIVERIES RENDERERS ---

function renderDeliveriesList(container) {
  const deliveries = [...store.getDeliveries()].reverse();

  (window as any).__csvDataDn = store.getDeliveries().map((d)=>[d.id,d.customerName,d.date,d.salesOrderId,d.status]);
  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Delivery Notes Register Ledger</h3>
        <button id="dn-csv-btn" class="btn btn-outline btn-sm no-print" onclick="var d=window.__csvDataDn;if(d)window.__exportCSV('delivery-notes.csv',["DN#","Customer","Date","SO#","Status"],d)">📥 Export CSV</button>
        </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Delivery ID</th>
              <th>Sales Order ID</th>
              <th>Customer</th>
              <th>Warehouse Facility</th>
              <th>Date</th>
              <th>Items Shipped</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${deliveries.map(dn => `
              <tr>
                <td style="font-family: monospace; font-weight: 700; color: var(--color-inventory);">${dn.id}</td>
                <td style="font-family: monospace;">${dn.salesOrderId}</td>
                <td><strong>${dn.customerName}</strong></td>
                <td>${store.getWarehouse(dn.warehouseId).name}</td>
                <td>${dn.date}</td>
                <td>${dn.items.map(i => `${i.qty} x ${i.sku}`).join(", ")}</td>
                <td><span class="badge ${dn.status === 'Submitted' ? 'badge-success' : 'badge-draft'}">${dn.status}</span></td>
                <td>
                  <a href="#o2c/deliveries/view/${dn.id}" class="btn btn-outline btn-sm">View Details</a>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderDeliveryForm(container) {
  // Extract SO reference from URL parameter
  const url = window.location.hash;
  const match = url.match(/so=([^&]+)/);
  const soId = match ? match[1] : "";
  const so = store.getSalesOrders().find(s => s.id === soId);

  if (!so) {
    container.innerHTML = `
      <div class="card">
        <p class="text-danger">A valid Sales Order ID must be selected to issue warehouse deliveries.</p>
        <button onclick="window.location.hash='#o2c/sales-orders'" class="btn btn-outline btn-sm" style="margin-top: 10px;">Select Sales Order</button>
      </div>
    `;
    return;
  }

  const warehouses = store.getWarehouses();

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Warehouse Ship Out: Delivery Note</h3>
        <button onclick="window.location.hash='#o2c/sales-orders/view/${so.id}'" class="btn btn-outline btn-sm">Cancel</button>
      </div>

      <form id="delivery-note-form">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Reference Sales Order</label>
            <input type="text" class="form-control" value="${so.id} (${so.customerName})" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Source Ship Warehouse</label>
            <select id="dn-warehouse" class="form-control" required>
              ${warehouses.map(w => `<option value="${w.id}">${w.name}</option>`).join("")}
            </select>
          </div>
        </div>

        <div style="margin-top: 20px;">
          <h4 style="font-size: 0.85rem; text-transform: uppercase; margin-bottom: 10px;">Items to Dispatch</h4>
          <table>
            <thead>
              <tr>
                <th>Item Code (SKU)</th>
                <th>Description</th>
                <th>Ordered Qty</th>
                <th>Dispatch Shipping Qty</th>
              </tr>
            </thead>
            <tbody>
              ${so.items.map(item => `
                <tr class="dn-line" data-item-id="${item.itemId}" data-uom="${item.uom}">
                  <td style="font-family: monospace;">${item.sku}</td>
                  <td><strong>${item.name}</strong></td>
                  <td>${item.qty} ${item.uom}</td>
                  <td>
                    <input type="number" class="form-control dn-qty" min="1" max="${item.qty}" value="${item.qty}" style="max-width: 120px;" required />
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="submit" class="btn btn-primary">Fulfill & Dispatch Stock</button>
        </div>
      </form>
    </div>
  `;

  container.querySelector("#delivery-note-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const warehouseId = container.querySelector("#dn-warehouse").value;
    const lines = [];

    container.querySelectorAll(".dn-line").forEach(tr => {
      const itemId = tr.getAttribute("data-item-id");
      const uom = tr.getAttribute("data-uom");
      const qty = Number(tr.querySelector(".dn-qty").value);
      // Resolve converted stock qty
      const conv = store.getUOMConversions().find(c => c.from === uom);
      const rate = conv ? conv.rate : 1;
      const baseQty = qty * rate;

      lines.push({ itemId, qty: baseQty, uom });
    });

    try {
      store.createDeliveryNote({
        salesOrderId: so.id,
        warehouseId,
        items: lines,
        date: new Date().toISOString().split("T")[0]
      });

      window.showToast(`Delivery dispatch successfully issued from ${store.getWarehouse(warehouseId).name}`, "success");
      window.location.hash = `#o2c/invoices/new?so=${so.id}`;
    } catch (err) {
      window.showToast(err.message, "danger");
    }
  });
}


// --- 3. SALES INVOICES RENDERERS ---

function renderInvoicesList(container) {
  const invoices = [...store.getSalesInvoices()].reverse();

  (window as any).__csvDataSi = store.getSalesInvoices().map((i)=>[i.id,i.customerName,i.date,i.salesOrderId,String(i.total),i.status]);
  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Sales Invoices Book</h3>
        <button id="si-csv-btn" class="btn btn-outline btn-sm no-print" onclick="var d=window.__csvDataSi;if(d)window.__exportCSV('sales-invoices.csv',["SI#","Customer","Date","SO#","Total","Status"],d)">📥 Export CSV</button>
        </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Tax ID</th>
              <th>Billing Date</th>
              <th>Invoice Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.map(si => `
              <tr>
                <td style="font-family: monospace; font-weight: 700; color: var(--color-primary);">${si.id}</td>
                <td style="font-family: monospace;">${si.salesOrderId}</td>
                <td><strong>${si.customerName}</strong></td>
                <td>${store.getPartner(si.customerId).taxId}</td>
                <td>${si.date}</td>
                <td style="font-weight: 700;">${formatMoney(si.total)}</td>
                <td>
                  <span class="badge ${si.status === 'Paid' ? 'badge-success' : si.status === 'Unpaid' ? 'badge-pending' : 'badge-draft'}">${si.status}</span>
                </td>
                <td>
                  <a href="#o2c/invoices/view/${si.id}" class="btn btn-outline btn-sm">View Details</a>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderInvoiceForm(container) {
  const url = window.location.hash;
  const match = url.match(/so=([^&]+)/);
  const soId = match ? match[1] : "";
  const so = store.getSalesOrders().find(s => s.id === soId);

  if (!so) {
    container.innerHTML = `
      <div class="card">
        <p class="text-danger">A valid Sales Order ID must be referenced to compile invoices.</p>
        <button onclick="window.location.hash='#o2c/sales-orders'" class="btn btn-outline btn-sm" style="margin-top: 10px;">Select Sales Order</button>
      </div>
    `;
    return;
  }

  // Find Delivery reference matching this Sales Order
  const dn = store.getDeliveries().find(d => d.salesOrderId === so.id);

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Billing Sales Invoice</h3>
        <button onclick="window.location.hash='#o2c/sales-orders/view/${so.id}'" class="btn btn-outline btn-sm">Cancel</button>
      </div>
      <form id="sales-invoice-form">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Customer Company Name</label>
            <input type="text" class="form-control" value="${so.customerName}" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Linked Dispatch Delivery Note</label>
            <input type="text" class="form-control" value="${dn ? dn.id : 'N/A (Direct billing)'}" readonly />
          </div>
        </div>

        <div style="margin-top: 20px;">
          <h4 style="font-size: 0.85rem; text-transform: uppercase; margin-bottom: 10px;">Items from Delivery Note</h4>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Description</th>
                <th>Qty Shipped</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${dn ? dn.items.map(li => {
                const item = store.getItem(li.itemId);
                const soItem = so.items.find(si => si.itemId === li.itemId);
                const price = soItem ? soItem.price : (item ? item.price : 0);
                return `
                  <tr>
                    <td style="font-family:monospace;">${li.sku}</td>
                    <td>${item ? item.name : li.itemId}</td>
                    <td>${li.qty} ${li.uom}</td>
                    <td>${formatMoney(price)}</td>
                    <td style="font-weight:700;">${formatMoney(li.qty * price)}</td>
                  </tr>
                `;
              }).join("") : so.items.map(item => `
                  <tr>
                    <td style="font-family:monospace;">${item.sku}</td>
                    <td>${item.name}</td>
                    <td>${item.qty} ${item.uom}</td>
                    <td>${formatMoney(item.price)}</td>
                    <td style="font-weight:700;">${formatMoney(item.qty * item.price)}</td>
                  </tr>
              `)}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 20px; border: 1px solid var(--border-color); padding: 14px; border-radius: var(--radius-sm); background-color: rgba(255,255,255,0.01);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Sales Revenue Subtotal:</span>
            <strong>${formatMoney(so.subtotal)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>VAT Output Tax (12%):</span>
            <strong>${formatMoney(so.tax)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Withholding Tax Withheld (2%):</span>
            <strong class="text-danger">-${formatMoney(so.withholding)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 8px; font-size: 1.1rem; font-weight: 700;">
            <span>Total Accounts Receivable Due:</span>
            <span class="text-success">${formatMoney(so.total)}</span>
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <button type="submit" class="btn btn-success">Issue & Post Accounts Receivable Invoice</button>
        </div>
      </form>
    </div>
  `;

  container.querySelector("#sales-invoice-form").addEventListener("submit", (e) => {
    e.preventDefault();

    try {
      const si = store.createSalesInvoice({
        salesOrderId: so.id,
        deliveryNoteId: dn ? dn.id : "",
        date: new Date().toISOString().split("T")[0]
      });

      window.showToast(`Invoice successfully created and posted to general ledger under Accounts Receivable.`, "success");
      window.location.hash = `#accounting/payments/new?type=Receive&bill=${si.id}`;
    } catch (err) {
      window.showToast(err.message, "danger");
    }
  });
}


// --- 4. SALES RETURNS RENDERERS ---

function renderReturnsList(container) {
  const returns = [...store.getSalesReturns()].reverse();

  (window as any).__csvDataSr = store.getSalesReturns().map((r)=>[r.id,r.customerName,r.date,r.salesOrderId,String(r.total),r.status]);
  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Customer Sales Returns Ledger</h3>
        <button id="sr-csv-btn" class="btn btn-outline btn-sm no-print" onclick="var d=window.__csvDataSr;if(d)window.__exportCSV('sales-returns.csv',["SR#","Customer","Date","SO#","Total","Status"],d)">📥 Export CSV</button>
          <button id="new-return-btn" class="btn btn-danger btn-sm">Record Return Refund</button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Return ID</th>
              <th>Invoice ID</th>
              <th>Customer</th>
              <th>Posting Date</th>
              <th>Refund Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${returns.map(sr => `
              <tr>
                <td style="font-family: monospace; font-weight: 700; color: var(--color-danger);">${sr.id}</td>
                <td style="font-family: monospace;">${sr.salesInvoiceId}</td>
                <td><strong>${sr.customerName}</strong></td>
                <td>${sr.date}</td>
                <td style="font-weight: 700;">${formatMoney(sr.totalReturn)}</td>
                <td><span class="badge badge-success">${sr.status}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.querySelector("#new-return-btn").addEventListener("click", () => {
    window.location.hash = "#o2c/returns/new";
  });
}

function renderReturnForm(container) {
  const invoices = store.getSalesInvoices();
  const warehouses = store.getWarehouses();

  let invoiceOptions = invoices.map(i => `<option value="${i.id}">${i.id} - ${i.customerName} (${formatMoney(i.total)})</option>`).join("");

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Process Sales Return</h3>
        <button onclick="window.location.hash='#o2c/returns'" class="btn btn-outline btn-sm">Cancel</button>
      </div>
      <form id="sales-return-form">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Reference Sales Invoice</label>
            <select id="sr-invoice" class="form-control" required>
              <option value="" disabled selected>Select invoice...</option>
              ${invoiceOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Target Returns Warehouse</label>
            <select id="sr-warehouse" class="form-control" required>
              ${warehouses.map(w => `<option value="${w.id}">${w.name}</option>`).join("")}
            </select>
          </div>
        </div>

        <div id="sr-items-area" style="margin-top: 20px;">
          <!-- Items to return injected here -->
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <button type="submit" class="btn btn-danger">Confirm Sales Return & Issue Credit Note</button>
        </div>
      </form>
    </div>
  `;

  const invoiceSelect = container.querySelector("#sr-invoice");
  const itemsArea = container.querySelector("#sr-items-area");
  const form = container.querySelector("#sales-return-form");

  invoiceSelect.addEventListener("change", () => {
    const si = invoices.find(i => i.id === invoiceSelect.value);
    if (!si) return;

    itemsArea.innerHTML = `
      <h4 style="font-size: 0.85rem; text-transform: uppercase; margin-bottom: 10px;">Select Items to Return</h4>
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Billed Qty</th>
            <th>Unit Price</th>
            <th>Return Qty</th>
          </tr>
        </thead>
        <tbody>
          ${si.items.map(item => `
            <tr class="sr-line" data-item-id="${item.itemId}" data-price="${item.price}" data-uom="${item.uom}">
              <td style="font-family: monospace;">${item.sku}</td>
              <td><strong>${item.name}</strong></td>
              <td>${item.qty} ${item.uom}</td>
              <td>${formatMoney(item.price)}</td>
              <td>
                <input type="number" class="form-control sr-qty" min="0" max="${item.qty}" value="0" style="max-width: 100px;" />
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const invoiceId = invoiceSelect.value;
    const warehouseId = form.querySelector("#sr-warehouse").value;
    const si = invoices.find(i => i.id === invoiceId);

    const returnLines = [];
    let refundSubtotal = 0;

    form.querySelectorAll(".sr-line").forEach(tr => {
      const itemId = tr.getAttribute("data-item-id");
      const price = Number(tr.getAttribute("data-price"));
      const uom = tr.getAttribute("data-uom");
      const qty = Number(tr.querySelector(".sr-qty").value);

      if (qty > 0) {
        returnLines.push({ itemId, qty, uom });
        refundSubtotal += price * qty;
      }
    });

    if (returnLines.length === 0) {
      window.showToast("Please select at least one item and quantity to return.", "warning");
      return;
    }

    // Apply VAT / WHT ratio
    const tax = refundSubtotal * 0.12;
    const wht = refundSubtotal * 0.02;
    const totalReturn = parseFloat((refundSubtotal + tax - wht).toFixed(2));

    try {
      store.createSalesReturn({
        salesInvoiceId: invoiceId,
        warehouseId,
        items: returnLines,
        totalReturn,
        date: new Date().toISOString().split("T")[0]
      });

      window.showToast(`Sales return completed. Stock returned to warehouse and reversing General Ledger entry posted.`, "success");
      window.location.hash = "#o2c/returns";
    } catch (err) {
      window.showToast(err.message, "danger");
    }
  });
}

function renderDeliveryDetails(container, deliveryId) {
  const dn = store.getDeliveries().find(d => d.id === deliveryId);
  if (!dn) {
    container.innerHTML = `<div class="card"><p class="text-danger">Delivery Note not found.</p></div>`;
    return;
  }

  const isDraft = dn.status === "Draft";
  const canApprove = store.checkPermission("o2c", "approve");
  const canDelete = store.checkPermission("o2c", "delete");

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <span style="font-size: 0.8rem; color: var(--color-inventory); font-family: monospace; font-weight: 700;">${dn.id}</span>
          <h3 class="card-title" style="margin-top: 4px;">Delivery Note details</h3>
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="window.location.hash='#o2c/deliveries'" class="btn btn-outline btn-sm">Back</button> <button onclick="window.print()" class="btn btn-outline btn-sm no-print">🖨️ Print</button>
          ${isDraft && canApprove ? `<button id="submit-dn-btn" class="btn btn-primary btn-sm" style="background-color:var(--color-inventory);">Submit Delivery Note</button>` : ''}
          ${isDraft && canDelete ? `<button id="delete-dn-btn" class="btn btn-danger btn-sm">Cancel & Delete</button>` : ''}
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 24px;">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Customer</div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-top: 4px;">${dn.customerName}</div>
          <div class="text-muted" style="font-size: 0.8rem; margin-top: 2px;">Company TIN: ${store.getPartner(dn.customerId).taxId}</div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="text-secondary">Sales Order ID:</span>
            <strong style="font-family:monospace;">${dn.salesOrderId}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="text-secondary">Warehouse Facility:</span>
            <strong>${store.getWarehouse(dn.warehouseId).name}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="text-secondary">Posting Date:</span>
            <strong>${dn.date}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span class="text-secondary">Status:</span>
            <span class="badge ${dn.status === 'Submitted' ? 'badge-success' : 'badge-draft'}">${dn.status}</span>
          </div>
        </div>
      </div>

      <h4 style="font-size: 0.85rem; text-transform: uppercase; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 10px;">Items Dispatched</h4>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Description</th>
              <th>UOM</th>
              <th>Shipped Qty</th>
            </tr>
          </thead>
          <tbody>
            ${dn.items.map(item => `
              <tr>
                <td style="font-family: monospace; font-weight: 600;">${item.sku}</td>
                <td><strong>${store.getItem(item.itemId)?.name || 'Product'}</strong></td>
                <td>${item.uom || 'pcs'}</td>
                <td style="font-weight: 700;">${item.qty}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (isDraft && canApprove) {
    container.querySelector("#submit-dn-btn").addEventListener("click", () => {
      try {
        store.submitDeliveryNote(dn.id);
        window.showToast(`Delivery Note ${dn.id} submitted. Stock levels updated.`, "success");
        renderDeliveryDetails(container, deliveryId);
      } catch (err) {
        window.showToast(err.message, "danger");
      }
    });
  }
  if (isDraft && canDelete) {
    container.querySelector("#delete-dn-btn").addEventListener("click", () => {
      if (confirm("Delete this draft Delivery Note?")) {
        try {
          store.deleteDocument("o2c", "deliveries", dn.id);
          window.showToast("Draft Delivery Note deleted.", "warning");
          window.location.hash = "#o2c/deliveries";
        } catch (err) {
          window.showToast(err.message, "danger");
        }
      }
    });
  }
}

function renderInvoiceDetails(container, invoiceId) {
  const si = store.getSalesInvoices().find(s => s.id === invoiceId);
  if (!si) {
    container.innerHTML = `<div class="card"><p class="text-danger">Invoice not found.</p></div>`;
    return;
  }

  const isDraft = si.status === "Draft";
  const canApprove = store.checkPermission("o2c", "approve");
  const canDelete = store.checkPermission("o2c", "delete");
  
  const showPayBtn = si.status === "Unpaid" && store.checkPermission("finance", "create");

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <span style="font-size: 0.8rem; color: var(--color-primary); font-family: monospace; font-weight: 700;">${si.id}</span>
          <h3 class="card-title" style="margin-top: 4px;">Sales Invoice details</h3>
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="window.location.hash='#o2c/invoices'" class="btn btn-outline btn-sm">Back</button> <button onclick="window.print()" class="btn btn-outline btn-sm no-print">🖨️ Print</button>
          ${isDraft && canApprove ? `<button id="submit-si-btn" class="btn btn-primary btn-sm">Submit Sales Invoice</button>` : ''}
          ${isDraft && canDelete ? `<button id="delete-si-btn" class="btn btn-danger btn-sm">Cancel & Delete</button>` : ''}
          ${showPayBtn ? `<button id="proceed-payment-btn" class="btn btn-success btn-sm">+ Collect Cash Receipt</button>` : ''}
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 24px;">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Customer</div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-top: 4px;">${si.customerName}</div>
          <div class="text-muted" style="font-size: 0.8rem; margin-top: 2px;">Company TIN: ${store.getPartner(si.customerId).taxId}</div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="text-secondary">Sales Order ID:</span>
            <strong style="font-family:monospace;">${si.salesOrderId}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="text-secondary">Delivery Note ID:</span>
            <strong style="font-family:monospace;">${si.deliveryNoteId || 'N/A'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="text-secondary">Posting Date:</span>
            <strong>${si.date}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span class="text-secondary">Status:</span>
            <span class="badge ${si.status === 'Paid' ? 'badge-success' : si.status === 'Unpaid' ? 'badge-pending' : 'badge-draft'}">${si.status}</span>
          </div>
        </div>
      </div>

      <h4 style="font-size: 0.85rem; text-transform: uppercase; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 10px;">Items Invoiced</h4>
      <div class="table-container" style="margin-bottom: 24px;">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Description</th>
              <th>UOM</th>
              <th>Invoiced Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${si.items.map(item => `
              <tr>
                <td style="font-family: monospace; font-weight: 600;">${item.sku}</td>
                <td><strong>${item.name}</strong></td>
                <td>${item.uom}</td>
                <td>${item.qty}</td>
                <td>${formatMoney(item.price)}</td>
                <td style="font-weight: 700;">${formatMoney(item.qty * item.price)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div style="max-width: 340px; margin-left: auto; text-align: right; display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem;">
        <div style="display: flex; justify-content: space-between;">
          <span class="text-secondary">Subtotal:</span>
          <span>${formatMoney(si.subtotal)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-secondary">VAT Tax:</span>
          <span>${formatMoney(si.tax)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-secondary">Withholding Tax:</span>
          <span class="text-danger">-${formatMoney(si.withholding)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-secondary">Sales GL Account:</span>
          <span style="font-family:monospace;">${si.salesAccountCode || '4100'}</span>
        </div>
        ${(si.otherCharges || []).length > 0 ? '<div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:2px;">Other Charges:</div>' + (si.otherCharges || []).map((ch: any) => {
        const a = Number(ch.amount) || 0;
        const v = Number(ch.vatRate) || 0;
        const b = ch.baseOn || 'net';
        const base = b === 'gross' ? a / (1 + v / 100) : a;
        const total = parseFloat((base + (base * v / 100)).toFixed(2));
        const tag = ch.isVat ? ' [VAT]' : ch.isWht ? ' [WHT]' : '';
        return `
        <div style="display: flex; justify-content: space-between; font-size:0.8rem;">
          <span class="text-secondary">${ch.accountCode}${tag}${ch.vatRate ? ' ' + ch.vatRate + '%' : ''} ${ch.baseOn || 'net'}:</span>
          <span>${formatMoney(total)}</span>
        </div>`;
        }).join("") : ''}
        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 8px; font-size: 1.1rem; font-weight: 700;">
          <span>Net Total:</span>
          <span class="text-success">${formatMoney(si.total)}</span>
        </div>
      </div>
    </div>
  `;

  if (isDraft && canApprove) {
    container.querySelector("#submit-si-btn").addEventListener("click", () => {
      try {
        store.submitSalesInvoice(si.id);
        window.showToast(`Sales Invoice ${si.id} submitted and posted to General Ledger accounts.`, "success");
        renderInvoiceDetails(container, invoiceId);
      } catch (err) {
        window.showToast(err.message, "danger");
      }
    });
  }
  if (isDraft && canDelete) {
    container.querySelector("#delete-si-btn").addEventListener("click", () => {
      if (confirm("Delete this draft Sales Invoice?")) {
        try {
          store.deleteDocument("o2c", "salesInvoices", si.id);
          window.showToast("Draft Sales Invoice deleted.", "warning");
          window.location.hash = "#o2c/invoices";
        } catch (err) {
          window.showToast(err.message, "danger");
        }
      }
    });
  }
  if (showPayBtn) {
    container.querySelector("#proceed-payment-btn").addEventListener("click", () => {
      window.location.hash = `#accounting/payments/new?type=Receive&bill=${si.id}`;
    });
  }
}
