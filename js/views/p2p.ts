// JMIT ERP - Procurement & Procure-to-Pay (P2P) Full-Page Flow View Module
import { store } from "../store";

export function renderP2P(container, pathParts) {
  const subPage = pathParts[1] || "purchase-orders";
  const action = pathParts[2];
  const paramId = pathParts[3];

  if (subPage === "purchase-orders") {
    if (action === "new") {
      renderPurchaseOrderForm(container);
    } else if (action === "view" && paramId) {
      renderPurchaseOrderDetails(container, paramId);
    } else {
      renderPurchaseOrdersList(container);
    }
  } else if (subPage === "goods-receipts") {
    if (action === "new") {
      renderGoodsReceiptForm(container);
    } else if (action === "view" && paramId) {
      renderGoodsReceiptDetails(container, paramId);
    } else {
      renderGoodsReceiptsList(container);
    }
  } else if (subPage === "invoices") {
    if (action === "new") {
      renderPurchaseInvoiceForm(container);
    } else if (action === "view" && paramId) {
      renderPurchaseInvoiceDetails(container, paramId);
    } else {
      renderPurchaseInvoicesList(container);
    }
  } else if (subPage === "returns") {
    if (action === "new") {
      renderPurchaseReturnForm(container);
    } else {
      renderPurchaseReturnsList(container);
    }
  }
}

// --- 1. PURCHASE ORDERS VIEW RENDERERS ---

function renderPurchaseOrdersList(container) {
  const purchaseOrders = [...store.getPurchaseOrders()].reverse();

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Purchase Orders Register Ledger</h3>
        <button onclick="window.location.hash='#p2p/purchase-orders/new'" class="btn btn-warning btn-sm">
          + Create Purchase Order
        </button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Supplier Vendor</th>
              <th>Date</th>
              <th>Currency</th>
              <th>Total Cost</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${purchaseOrders.map(po => {
              return `
                <tr>
                  <td style="font-family: monospace; font-weight: 700; color: var(--color-primary);">${po.id}</td>
                  <td><strong>${po.vendorName}</strong></td>
                  <td>${po.date}</td>
                  <td><span class="badge badge-draft">${po.currency}</span> (Rate: ${po.rate})</td>
                  <td style="font-weight: 700;">$${po.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span class="badge ${po.status === 'Paid' ? 'badge-success' : po.status === 'Approved' || po.status === 'Received' || po.status === 'Billed' ? 'badge-pending' : po.status === 'Draft' ? 'badge-draft' : 'badge-danger'}">${po.status}</span>
                  </td>
                  <td>
                    <a href="#p2p/purchase-orders/view/${po.id}" class="btn btn-outline btn-sm">View Details</a>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPurchaseOrderForm(container) {
  const vendors = store.getPartners().vendors;
  const items = store.getItems();
  const rates = store.getExchangeRates();
  const activeCompany = store.getActiveCompany();

  let vendorOptions = vendors.map(v => `<option value="${v.id}">${v.name} (TIN: ${v.taxId})</option>`).join("");
  let itemOptions = items.map(i => `<option value="${i.id}">${i.name} ($${i.cost})</option>`).join("");

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">New Purchase Order Wizard</h3>
        <button onclick="window.location.hash='#p2p/purchase-orders'" class="btn btn-outline btn-sm">Back to Ledger</button>
      </div>

      <form id="purchase-order-form">
        <div class="grid-2">
          <div>
            <div class="form-group">
              <label class="form-label">Supplier Vendor</label>
              <select id="po-vendor" class="form-control" required>
                <option value="" disabled selected>Select supplier...</option>
                ${vendorOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Supplier Address</label>
              <input type="text" id="po-address" class="form-control" placeholder="Office Address" readonly />
            </div>
          </div>

          <div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Purchase Currency</label>
                <select id="po-currency" class="form-control">
                  <option value="USD" ${activeCompany.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                  <option value="PHP" ${activeCompany.currency === 'PHP' ? 'selected' : ''}>PHP (₱)</option>
                  <option value="EUR" ${activeCompany.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Exchange Rate</label>
                <input type="number" id="po-rate" class="form-control" step="0.0001" value="1.0" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Posting Date</label>
              <input type="date" id="po-date" class="form-control" value="${new Date().toISOString().split("T")[0]}" required />
            </div>
          </div>
        </div>

        <div style="margin-top: 20px;">
          <h4 style="font-size: 0.9rem; text-transform: uppercase; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 12px;">Order Items Cost List</h4>
          <table class="order-items-table">
            <thead>
              <tr>
                <th style="width: 45%;">Item Description</th>
                <th style="width: 20%;">UOM Code</th>
                <th style="width: 15%;">Quantity</th>
                <th style="width: 15%;">Unit Cost ($)</th>
                <th style="width: 5%;"></th>
              </tr>
            </thead>
            <tbody id="po-lines-body">
              <!-- Dynamically populated lines -->
            </tbody>
          </table>
          <button type="button" id="po-add-line" class="btn btn-outline btn-sm">+ Add Line Item</button>
        </div>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color); text-align: right;">
          <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">
            Estimated Total Purchases: <strong id="po-total" class="text-warning">$0.00</strong>
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" onclick="window.location.hash='#p2p/purchase-orders'" class="btn btn-outline">Cancel</button>
          <button type="submit" class="btn btn-warning">Save & Authorize Purchase Order</button>
        </div>
      </form>
    </div>
  `;

  const form = container.querySelector("#purchase-order-form");
  const linesBody = container.querySelector("#po-lines-body");
  const addLineBtn = container.querySelector("#po-add-line");
  const vendorSelect = container.querySelector("#po-vendor");
  const addressInput = container.querySelector("#po-address");
  const currencySelect = container.querySelector("#po-currency");
  const rateInput = container.querySelector("#po-rate");

  currencySelect.addEventListener("change", (e) => {
    rateInput.value = rates[e.target.value] || 1.0;
    updateTotals();
  });

  vendorSelect.addEventListener("change", (e) => {
    const v = store.getPartner(e.target.value);
    if (v) {
      addressInput.value = v.address;
    }
  });

  const updateTotals = () => {
    let total = 0;
    linesBody.querySelectorAll(".po-line-row").forEach(row => {
      const itemId = row.querySelector(".line-item").value;
      const qty = Number(row.querySelector(".line-qty").value) || 0;
      
      if (itemId) {
        const item = store.getItem(itemId);
        if (item) {
          total += item.cost * qty;
        }
      }
    });

    container.querySelector("#po-total").textContent = `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const addLine = () => {
    const tr = document.createElement("tr");
    tr.className = "po-line-row";
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
        <input type="text" class="form-control line-cost" readonly value="0.00" />
      </td>
      <td>
        <button type="button" class="btn btn-outline btn-sm remove-line" style="color: var(--color-danger); border-color: transparent;">&times;</button>
      </td>
    `;

    linesBody.appendChild(tr);

    const itemSel = tr.querySelector(".line-item");
    const qtyInp = tr.querySelector(".line-qty");
    const costInp = tr.querySelector(".line-cost");
    const removeBtn = tr.querySelector(".remove-line");

    itemSel.addEventListener("change", () => {
      const item = store.getItem(itemSel.value);
      if (item) {
        costInp.value = `$${item.cost.toFixed(2)}`;
      }
      updateTotals();
    });

    qtyInp.addEventListener("input", updateTotals);
    removeBtn.addEventListener("click", () => { tr.remove(); updateTotals(); });

    updateTotals();
  };

  addLineBtn.addEventListener("click", addLine);
  addLine();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const lines = [];
    linesBody.querySelectorAll(".po-line-row").forEach(row => {
      const itemId = row.querySelector(".line-item").value;
      const qty = Number(row.querySelector(".line-qty").value);
      const uom = row.querySelector(".line-uom").value;
      lines.push({ itemId, qty, uom });
    });

    try {
      const poData = {
        vendorId: vendorSelect.value,
        date: form.querySelector("#po-date").value,
        items: lines,
        currency: currencySelect.value,
        rate: Number(rateInput.value)
      };

      store.createPurchaseOrder(poData);
      window.showToast("Purchase Order successfully created and saved in Ordered status.", "success");
      window.location.hash = "#p2p/purchase-orders";
    } catch (err) {
      window.showToast(err.message, "danger");
    }
  });
}


// --- 2. GOODS RECEIPTS RENDERERS ---

function renderGoodsReceiptsList(container) {
  const goodsReceipts = [...store.getGoodsReceipts()].reverse();

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Goods Receipt Notes (GRN) Ledger</h3>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Receipt ID</th>
              <th>PO Reference</th>
              <th>Supplier Vendor</th>
              <th>Warehouse Facility</th>
              <th>Date</th>
              <th>Check-in Impact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${goodsReceipts.map(grn => `
              <tr>
                <td style="font-family: monospace; font-weight: 700; color: var(--color-inventory);">${grn.id}</td>
                <td style="font-family: monospace;">${grn.purchaseOrderId}</td>
                <td><strong>${grn.vendorName}</strong></td>
                <td>${store.getWarehouse(grn.warehouseId).name}</td>
                <td>${grn.date}</td>
                <td>
                  ${grn.items.map(i => {
                    const itemObj = store.getItem(i.itemId);
                    const name = itemObj ? itemObj.name : "Item";
                    return `<span class="badge badge-success" style="margin-right: 4px;">Ok: ${i.acceptedQty} ${name}</span>
                            ${i.rejectedQty > 0 ? `<span class="badge badge-danger">Rej: ${i.rejectedQty}</span>` : ''}`;
                  }).join(" ")}
                </td>
                <td><span class="badge ${grn.status === 'Submitted' ? 'badge-success' : 'badge-draft'}">${grn.status}</span></td>
                <td>
                  <a href="#p2p/goods-receipts/view/${grn.id}" class="btn btn-outline btn-sm">View Details</a>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderGoodsReceiptForm(container) {
  const url = window.location.hash;
  const match = url.match(/po=([^&]+)/);
  const poId = match ? match[1] : "";
  const po = store.getPurchaseOrders().find(p => p.id === poId);

  if (!po) {
    container.innerHTML = `
      <div class="card">
        <p class="text-danger">A valid Purchase Order ID must be referenced to accept goods receipts.</p>
        <button onclick="window.location.hash='#p2p/purchase-orders'" class="btn btn-outline btn-sm" style="margin-top: 10px;">Select Purchase Order</button>
      </div>
    `;
    return;
  }

  const warehouses = store.getWarehouses();

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Warehouse Check-in: Goods Receipt Note (GRN)</h3>
        <button onclick="window.location.hash='#p2p/purchase-orders'" class="btn btn-outline btn-sm">Cancel</button>
      </div>

      <form id="goods-receipt-form">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Reference Purchase Order</label>
            <input type="text" class="form-control" value="${po.id} (${po.vendorName})" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Target Storage Warehouse</label>
            <select id="grn-warehouse" class="form-control" required>
              ${warehouses.map(w => `<option value="${w.id}">${w.name}</option>`).join("")}
            </select>
          </div>
        </div>

        <div style="margin-top: 20px;">
          <h4 style="font-size: 0.85rem; text-transform: uppercase; margin-bottom: 10px;">Warehouse Quality Inspections Check-in</h4>
          <table>
            <thead>
              <tr>
                <th>Item Code (SKU)</th>
                <th>Description</th>
                <th>Ordered Qty</th>
                <th>Accepted Qty (Stocked)</th>
                <th>Rejected Qty (Written-off)</th>
              </tr>
            </thead>
            <tbody>
              ${po.items.map(item => `
                <tr class="grn-line" data-item-id="${item.itemId}" data-uom="${item.uom}">
                  <td style="font-family: monospace;">${item.sku}</td>
                  <td><strong>${item.name}</strong></td>
                  <td>${item.qty} ${item.uom}</td>
                  <td>
                    <input type="number" class="form-control line-accepted-qty" min="0" max="${item.qty}" value="${item.qty}" style="max-width: 120px;" required />
                  </td>
                  <td>
                    <input type="number" class="form-control line-rejected-qty" min="0" max="${item.qty}" value="0" style="max-width: 120px;" required />
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <button type="submit" class="btn btn-primary">Process Goods Check-in Receipt</button>
        </div>
      </form>
    </div>
  `;

  // Dynamic validation ensuring Accepted + Rejected <= Ordered
  const form = container.querySelector("#goods-receipt-form");
  form.querySelectorAll(".grn-line").forEach(row => {
    const accInput = row.querySelector(".line-accepted-qty");
    const rejInput = row.querySelector(".line-rejected-qty");
    const maxQty = Number(accInput.getAttribute("max"));

    accInput.addEventListener("input", () => {
      rejInput.value = Math.max(0, maxQty - Number(accInput.value));
    });
    rejInput.addEventListener("input", () => {
      accInput.value = Math.max(0, maxQty - Number(rejInput.value));
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const warehouseId = form.querySelector("#grn-warehouse").value;
    const lines = [];

    form.querySelectorAll(".grn-line").forEach(tr => {
      const itemId = tr.getAttribute("data-item-id");
      const uom = tr.getAttribute("data-uom");
      const accepted = Number(tr.querySelector(".line-accepted-qty").value);
      const rejected = Number(tr.querySelector(".line-rejected-qty").value);

      // Convert quantities
      const conv = store.getUOMConversions().find(c => c.from === uom);
      const rate = conv ? conv.rate : 1;
      
      lines.push({
        itemId,
        acceptedQty: accepted * rate,
        rejectedQty: rejected * rate,
        uom
      });
    });

    try {
      store.createGoodsReceipt({
        purchaseOrderId: po.id,
        warehouseId,
        items: lines,
        date: new Date().toISOString().split("T")[0]
      });

      window.showToast(`Goods Receipt Note successfully compiled. Accepted stock added to warehouse inventory.`, "success");
      window.location.hash = `#p2p/purchase-orders`;
    } catch (err) {
      window.showToast(err.message, "danger");
    }
  });
}


// --- 3. SUPPLIER INVOICES RENDERERS ---

function renderPurchaseInvoicesList(container) {
  const invoices = [...store.getPurchaseInvoices()].reverse();

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Supplier Purchase Bills Ledger</h3>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Bill ID</th>
              <th>PO Reference</th>
              <th>Supplier Vendor</th>
              <th>Posting Date</th>
              <th>Invoice Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.map(pi => `
              <tr>
                <td style="font-family: monospace; font-weight: 700; color: var(--color-primary);">${pi.id}</td>
                <td style="font-family: monospace;">${pi.purchaseOrderId}</td>
                <td><strong>${pi.vendorName}</strong></td>
                <td>${pi.date}</td>
                <td style="font-weight: 700;">$${pi.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td>
                  <span class="badge ${pi.status === 'Paid' ? 'badge-success' : pi.status === 'Unpaid' ? 'badge-pending' : 'badge-draft'}">${pi.status}</span>
                </td>
                <td>
                  <a href="#p2p/invoices/view/${pi.id}" class="btn btn-outline btn-sm">View Details</a>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
}

function renderPurchaseInvoiceForm(container) {
  const url = window.location.hash;
  const match = url.match(/po=([^&]+)/);
  const poId = match ? match[1] : "";
  const po = store.getPurchaseOrders().find(p => p.id === poId);

  if (!po) {
    container.innerHTML = `
      <div class="card">
        <p class="text-danger">A valid Purchase Order ID must be referenced to register supplier bills.</p>
        <button onclick="window.location.hash='#p2p/purchase-orders'" class="btn btn-outline btn-sm" style="margin-top: 10px;">Select Purchase Order</button>
      </div>
    `;
    return;
  }

  const grn = store.getGoodsReceipts().find(g => g.purchaseOrderId === po.id);

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Supplier Invoice Booking (Purchase Invoice)</h3>
        <button onclick="window.location.hash='#p2p/purchase-orders'" class="btn btn-outline btn-sm">Cancel</button>
      </div>
      <form id="purchase-invoice-form">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Supplier Vendor Company</label>
            <input type="text" class="form-control" value="${po.vendorName}" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Linked Goods Receipt Note (GRN)</label>
            <input type="text" class="form-control" value="${grn ? grn.id : 'N/A'}" readonly />
          </div>
        </div>

        <div style="margin-top: 20px; border: 1px solid var(--border-color); padding: 14px; border-radius: var(--radius-sm); background-color: rgba(255,255,255,0.01);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Gross billed items:</span>
            <strong>$${po.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 8px; font-size: 1.1rem; font-weight: 700;">
            <span>Total Accounts Payable Booked:</span>
            <span class="text-warning">$${po.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <button type="submit" class="btn btn-warning">Issue Bill & Post Accounts Payable</button>
        </div>
      </form>
    </div>
  `;

  container.querySelector("#purchase-invoice-form").addEventListener("submit", (e) => {
    e.preventDefault();

    try {
      store.createPurchaseInvoice({
        purchaseOrderId: po.id,
        date: new Date().toISOString().split("T")[0]
      });

      window.showToast("Supplier Invoice (Purchase Bill) registered and accounts payable posted to ledger.", "success");
      window.location.hash = "#p2p/invoices";
    } catch (err) {
      window.showToast(err.message, "danger");
    }
  });
}


// --- 4. PURCHASE RETURNS RENDERERS ---

function renderPurchaseReturnsList(container) {
  const returns = [...store.getPurchaseReturns()].reverse();

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Supplier Purchase Returns Ledger</h3>
        <button id="new-p-return-btn" class="btn btn-danger btn-sm">Process Purchase Return</button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Return ID</th>
              <th>Bill ID</th>
              <th>Supplier</th>
              <th>Posting Date</th>
              <th>Return Credit Refund</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${returns.map(pr => `
              <tr>
                <td style="font-family: monospace; font-weight: 700; color: var(--color-danger);">${pr.id}</td>
                <td style="font-family: monospace;">${pr.purchaseInvoiceId}</td>
                <td><strong>${pr.vendorName}</strong></td>
                <td>${pr.date}</td>
                <td style="font-weight: 700;">$${pr.totalReturn.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td><span class="badge badge-success">${pr.status}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.querySelector("#new-p-return-btn").addEventListener("click", () => {
    window.location.hash = "#p2p/returns/new";
  });
}

function renderPurchaseReturnForm(container) {
  const invoices = store.getPurchaseInvoices();
  const warehouses = store.getWarehouses();

  let invoiceOptions = invoices.map(i => `<option value="${i.id}">${i.id} - ${i.vendorName} ($${i.total})</option>`).join("");

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Process Purchase Return</h3>
        <button onclick="window.location.hash='#p2p/returns'" class="btn btn-outline btn-sm">Cancel</button>
      </div>
      
      <form id="purchase-return-form">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Reference Purchase Invoice</label>
            <select id="pr-invoice" class="form-control" required>
              <option value="" disabled selected>Select bill invoice...</option>
              ${invoiceOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Source Storage Warehouse</label>
            <select id="pr-warehouse" class="form-control" required>
              ${warehouses.map(w => `<option value="${w.id}">${w.name}</option>`).join("")}
            </select>
          </div>
        </div>

        <div id="pr-items-area" style="margin-top: 20px;">
          <!-- Items to return injected here -->
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <button type="submit" class="btn btn-danger">Confirm Purchase Return & Deduct Stock</button>
        </div>
      </form>
    </div>
  `;

  const invoiceSelect = container.querySelector("#pr-invoice");
  const itemsArea = container.querySelector("#pr-items-area");
  const form = container.querySelector("#purchase-return-form");

  invoiceSelect.addEventListener("change", () => {
    const pi = invoices.find(i => i.id === invoiceSelect.value);
    if (!pi) return;

    itemsArea.innerHTML = `
      <h4 style="font-size: 0.85rem; text-transform: uppercase; margin-bottom: 10px;">Select Items to Return to Vendor</h4>
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Billed Qty</th>
            <th>Unit Cost</th>
            <th>Return Qty</th>
          </tr>
        </thead>
        <tbody>
          ${pi.items.map(item => `
            <tr class="pr-line" data-item-id="${item.itemId}" data-cost="${item.cost}" data-uom="${item.uom}">
              <td style="font-family: monospace;">${item.sku}</td>
              <td><strong>${item.name}</strong></td>
              <td>${item.qty} ${item.uom}</td>
              <td>$${item.cost.toFixed(2)}</td>
              <td>
                <input type="number" class="form-control pr-qty" min="0" max="${item.qty}" value="0" style="max-width: 100px;" />
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
    const warehouseId = form.querySelector("#pr-warehouse").value;
    const pi = invoices.find(i => i.id === invoiceId);

    const returnLines = [];
    let refundTotal = 0;

    form.querySelectorAll(".pr-line").forEach(tr => {
      const itemId = tr.getAttribute("data-item-id");
      const cost = Number(tr.getAttribute("data-cost"));
      const uom = tr.getAttribute("data-uom");
      const qty = Number(tr.querySelector(".pr-qty").value);

      if (qty > 0) {
        returnLines.push({ itemId, qty, uom });
        refundTotal += cost * qty;
      }
    });

    if (returnLines.length === 0) {
      window.showToast("Please select at least one item and quantity to return.", "warning");
      return;
    }

    try {
      store.createPurchaseReturn({
        purchaseInvoiceId: invoiceId,
        warehouseId,
        items: returnLines,
        totalReturn: refundTotal,
        date: new Date().toISOString().split("T")[0]
      });

      window.showToast(`Purchase return successfully processed. Stock deducted from warehouse and AP liability offset posted.`, "success");
      window.location.hash = "#p2p/returns";
    } catch (err) {
      window.showToast(err.message, "danger");
    }
  });
}

function renderPurchaseOrderDetails(container, orderId) {
  const po = store.getPurchaseOrders().find(p => p.id === orderId);
  if (!po) {
    container.innerHTML = `<div class="card"><p class="text-danger">Order not found.</p></div>`;
    return;
  }

  const isDraft = po.status === "Draft";
  const canApprove = store.checkPermission("p2p", "approve");
  const canDelete = store.checkPermission("p2p", "delete");

  const hasWritePermission = store.checkPermission("p2p", "create");
  const showReceiveBtn = po.status === "Approved" && hasWritePermission;
  const showBillBtn = po.status === "Received" && hasWritePermission;

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <span style="font-size: 0.8rem; color: var(--color-primary); font-family: monospace; font-weight: 700;">${po.id}</span>
          <h3 class="card-title" style="margin-top: 4px;">Purchase Order details</h3>
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="window.location.hash='#p2p/purchase-orders'" class="btn btn-outline btn-sm">Back</button>
          ${isDraft && canApprove ? `<button id="approve-po-btn" class="btn btn-primary btn-sm">Approve Purchase Order</button>` : ''}
          ${isDraft && canDelete ? `<button id="delete-po-btn" class="btn btn-danger btn-sm">Cancel & Delete</button>` : ''}
          ${showReceiveBtn ? `<button id="proceed-receive-btn" class="btn btn-primary btn-sm" style="background-color: var(--color-inventory);">Receive Goods</button>` : ''}
          ${showBillBtn ? `<button id="proceed-bill-btn" class="btn btn-success btn-sm">Record Supplier Bill</button>` : ''}
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 24px;">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Vendor Supplier</div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-top: 4px;">${po.vendorName}</div>
          <div class="text-muted" style="font-size: 0.8rem; margin-top: 2px;">Company TIN: ${store.getPartner(po.vendorId).taxId}</div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="text-secondary">Posting Date:</span>
            <strong>${po.date}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="text-secondary">Currency Rate:</span>
            <strong>${po.currency} @ ${po.rate}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span class="text-secondary">Status:</span>
            <span class="badge ${po.status === 'Paid' ? 'badge-success' : po.status === 'Approved' || po.status === 'Received' || po.status === 'Billed' ? 'badge-pending' : po.status === 'Draft' ? 'badge-draft' : 'badge-danger'}">${po.status}</span>
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
              <th>Unit Cost</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${po.items.map(item => `
              <tr>
                <td style="font-family: monospace; font-weight: 600;">${item.sku}</td>
                <td><strong>${item.name}</strong></td>
                <td>${item.uom}</td>
                <td>${item.qty}</td>
                <td>$${item.cost.toFixed(2)}</td>
                <td style="font-weight: 700;">$${(item.qty * item.cost).toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div style="max-width: 300px; margin-left: auto; text-align: right; display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem;">
        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 8px; font-size: 1.1rem; font-weight: 700;">
          <span>Net Total Cost:</span>
          <span class="text-success">$${po.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;

  if (isDraft && canApprove) {
    container.querySelector("#approve-po-btn").addEventListener("click", () => {
      try {
        store.approvePurchaseOrder(po.id);
        window.showToast(`Purchase Order ${po.id} approved successfully.`, "success");
        renderPurchaseOrderDetails(container, orderId);
      } catch (err) {
        window.showToast(err.message, "danger");
      }
    });
  }
  if (isDraft && canDelete) {
    container.querySelector("#delete-po-btn").addEventListener("click", () => {
      if (confirm("Permanently delete this draft Purchase Order?")) {
        try {
          store.deleteDocument("p2p", "purchaseOrders", po.id);
          window.showToast("Draft Purchase Order deleted.", "warning");
          window.location.hash = "#p2p/purchase-orders";
        } catch (err) {
          window.showToast(err.message, "danger");
        }
      }
    });
  }
  if (showReceiveBtn) {
    container.querySelector("#proceed-receive-btn").addEventListener("click", () => {
      window.location.hash = `#p2p/goods-receipts/new?po=${po.id}`;
    });
  }
  if (showBillBtn) {
    container.querySelector("#proceed-bill-btn").addEventListener("click", () => {
      window.location.hash = `#p2p/invoices/new?po=${po.id}`;
    });
  }
}

function renderGoodsReceiptDetails(container, grnId) {
  const grn = store.getGoodsReceipts().find(g => g.id === grnId);
  if (!grn) {
    container.innerHTML = `<div class="card"><p class="text-danger">Goods Receipt Note not found.</p></div>`;
    return;
  }

  const isDraft = grn.status === "Draft";
  const canApprove = store.checkPermission("p2p", "approve");
  const canDelete = store.checkPermission("p2p", "delete");

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <span style="font-size: 0.8rem; color: var(--color-inventory); font-family: monospace; font-weight: 700;">${grn.id}</span>
          <h3 class="card-title" style="margin-top: 4px;">Goods Receipt Note details</h3>
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="window.location.hash='#p2p/goods-receipts'" class="btn btn-outline btn-sm">Back</button>
          ${isDraft && canApprove ? `<button id="submit-grn-btn" class="btn btn-primary btn-sm" style="background-color:var(--color-inventory);">Submit Goods Receipt</button>` : ''}
          ${isDraft && canDelete ? `<button id="delete-grn-btn" class="btn btn-danger btn-sm">Cancel & Delete</button>` : ''}
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 24px;">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Vendor Supplier</div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-top: 4px;">${grn.vendorName}</div>
          <div class="text-muted" style="font-size: 0.8rem; margin-top: 2px;">Company TIN: ${store.getPartner(grn.vendorId).taxId}</div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="text-secondary">Purchase Order ID:</span>
            <strong style="font-family:monospace;">${grn.purchaseOrderId}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="text-secondary">Target Storage Warehouse:</span>
            <strong>${store.getWarehouse(grn.warehouseId).name}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="text-secondary">Posting Date:</span>
            <strong>${grn.date}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span class="text-secondary">Status:</span>
            <span class="badge ${grn.status === 'Submitted' ? 'badge-success' : 'badge-draft'}">${grn.status}</span>
          </div>
        </div>
      </div>

      <h4 style="font-size: 0.85rem; text-transform: uppercase; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 10px;">Items Inspected & Stocked</h4>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Description</th>
              <th>UOM</th>
              <th>Accepted Qty</th>
              <th>Rejected Qty</th>
            </tr>
          </thead>
          <tbody>
            ${grn.items.map(item => `
              <tr>
                <td style="font-family: monospace; font-weight: 600;">${store.getItem(item.itemId)?.sku || 'Product'}</td>
                <td><strong>${store.getItem(item.itemId)?.name || 'Product'}</strong></td>
                <td>${item.uom || 'pcs'}</td>
                <td style="font-weight: 700; color:var(--color-success);">${item.acceptedQty}</td>
                <td style="font-weight: 700; color:var(--color-danger);">${item.rejectedQty}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (isDraft && canApprove) {
    container.querySelector("#submit-grn-btn").addEventListener("click", () => {
      try {
        store.submitGoodsReceipt(grn.id);
        window.showToast(`Goods Receipt ${grn.id} submitted. Stock levels updated.`, "success");
        renderGoodsReceiptDetails(container, grnId);
      } catch (err) {
        window.showToast(err.message, "danger");
      }
    });
  }
  if (isDraft && canDelete) {
    container.querySelector("#delete-grn-btn").addEventListener("click", () => {
      if (confirm("Delete this draft Goods Receipt?")) {
        try {
          store.deleteDocument("p2p", "goodsReceipts", grn.id);
          window.showToast("Draft Goods Receipt deleted.", "warning");
          window.location.hash = "#p2p/goods-receipts";
        } catch (err) {
          window.showToast(err.message, "danger");
        }
      }
    });
  }
}

function renderPurchaseInvoiceDetails(container, invoiceId) {
  const pi = store.getPurchaseInvoices().find(p => p.id === invoiceId);
  if (!pi) {
    container.innerHTML = `<div class="card"><p class="text-danger">Purchase Bill not found.</p></div>`;
    return;
  }

  const isDraft = pi.status === "Draft";
  const canApprove = store.checkPermission("p2p", "approve");
  const canDelete = store.checkPermission("p2p", "delete");
  
  const showPayBtn = pi.status === "Unpaid" && store.checkPermission("finance", "create");

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <span style="font-size: 0.8rem; color: var(--color-primary); font-family: monospace; font-weight: 700;">${pi.id}</span>
          <h3 class="card-title" style="margin-top: 4px;">Supplier Purchase Bill details</h3>
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="window.location.hash='#p2p/invoices'" class="btn btn-outline btn-sm">Back</button>
          ${isDraft && canApprove ? `<button id="submit-pi-btn" class="btn btn-primary btn-sm">Submit Bill (Post GL)</button>` : ''}
          ${isDraft && canDelete ? `<button id="delete-pi-btn" class="btn btn-danger btn-sm">Cancel & Delete</button>` : ''}
          ${showPayBtn ? `<button id="proceed-payment-btn" class="btn btn-warning btn-sm">Pay Supplier Bill</button>` : ''}
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 24px;">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Vendor Supplier</div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-top: 4px;">${pi.vendorName}</div>
          <div class="text-muted" style="font-size: 0.8rem; margin-top: 2px;">Company TIN: ${store.getPartner(pi.vendorId).taxId}</div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="text-secondary">Purchase Order ID:</span>
            <strong style="font-family:monospace;">${pi.purchaseOrderId}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="text-secondary">Goods Receipt Note ID:</span>
            <strong style="font-family:monospace;">${pi.goodsReceiptId || 'N/A'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span class="text-secondary">Posting Date:</span>
            <strong>${pi.date}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span class="text-secondary">Status:</span>
            <span class="badge ${pi.status === 'Paid' ? 'badge-success' : pi.status === 'Unpaid' ? 'badge-pending' : 'badge-draft'}">${pi.status}</span>
          </div>
        </div>
      </div>

      <h4 style="font-size: 0.85rem; text-transform: uppercase; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 10px;">Items Billed</h4>
      <div class="table-container" style="margin-bottom: 24px;">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Description</th>
              <th>UOM</th>
              <th>Billed Qty</th>
              <th>Unit Cost</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${pi.items.map(item => `
              <tr>
                <td style="font-family: monospace; font-weight: 600;">${item.sku}</td>
                <td><strong>${item.name}</strong></td>
                <td>${item.uom}</td>
                <td>${item.qty}</td>
                <td>$${item.cost.toFixed(2)}</td>
                <td style="font-weight: 700;">$${(item.qty * item.cost).toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div style="max-width: 300px; margin-left: auto; text-align: right; display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem;">
        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 8px; font-size: 1.1rem; font-weight: 700;">
          <span>Net Total Cost:</span>
          <span class="text-success">$${pi.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;

  if (isDraft && canApprove) {
    container.querySelector("#submit-pi-btn").addEventListener("click", () => {
      try {
        store.submitPurchaseInvoice(pi.id);
        window.showToast(`Purchase Bill ${pi.id} submitted and posted to Accounts Payable.`, "success");
        renderPurchaseInvoiceDetails(container, invoiceId);
      } catch (err) {
        window.showToast(err.message, "danger");
      }
    });
  }
  if (isDraft && canDelete) {
    container.querySelector("#delete-pi-btn").addEventListener("click", () => {
      if (confirm("Delete this draft Purchase Bill?")) {
        try {
          store.deleteDocument("p2p", "purchaseInvoices", pi.id);
          window.showToast("Draft Purchase Bill deleted.", "warning");
          window.location.hash = "#p2p/invoices";
        } catch (err) {
          window.showToast(err.message, "danger");
        }
      }
    });
  }
  if (showPayBtn) {
    container.querySelector("#proceed-payment-btn").addEventListener("click", () => {
      window.location.hash = `#accounting/payments/new?type=Pay&bill=${pi.id}`;
    });
  }
}
