// JMIT ERP - Sales & Order-to-Cash (O2C) Full-Page Flow View Module
import { store } from "../store";

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

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Sales Orders Register Ledger</h3>
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
                <td style="font-weight: 700;">$${so.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
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
  let itemOptions = items.map(i => `<option value="${i.id}">${i.name} ($${i.price})</option>`).join("");

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

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color); text-align: right;">
          <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 4px;">
            Subtotal: <strong id="so-subtotal">$0.00</strong>
          </div>
          <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 4px;">
            VAT (12%): <strong id="so-tax">$0.00</strong>
          </div>
          <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 4px;">
            Withholding Tax (2%): <strong id="so-wht">$0.00</strong>
          </div>
          <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">
            Net Order Total: <strong id="so-total" class="text-success">$0.00</strong>
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

    const tax = parseFloat((subtotal * 0.12).toFixed(2));
    const wht = parseFloat((subtotal * 0.02).toFixed(2));
    const total = parseFloat((subtotal + tax - wht).toFixed(2));

    container.querySelector("#so-subtotal").textContent = `$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    container.querySelector("#so-tax").textContent = `$${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    container.querySelector("#so-wht").textContent = `$${wht.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    container.querySelector("#so-total").textContent = `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
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
        (priceInp as HTMLInputElement).value = `$${item.price.toFixed(2)}`;
      }
      updateTotals();
    });

    qtyInp.addEventListener("input", updateTotals);
    removeBtn.addEventListener("click", () => { tr.remove(); updateTotals(); });

    updateTotals();
  };

  addLineBtn.addEventListener("click", addLine);
  addLine(); // add first line

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
      const soData = {
        companyId: (form.querySelector("#so-company") as HTMLSelectElement).value,
        customerId: customerSelect.value,
        date: form.querySelector("#so-date").value,
        items: lines,
        currency: currencySelect.value,
        rate: Number(rateInput.value)
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
          <button onclick="window.location.hash='#o2c/sales-orders'" class="btn btn-outline btn-sm">Back</button>
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
                <td>$${item.price.toFixed(2)}</td>
                <td style="font-weight: 700;">$${(item.qty * item.price).toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div style="max-width: 300px; margin-left: auto; text-align: right; display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem;">
        <div style="display: flex; justify-content: space-between;">
          <span class="text-secondary">Subtotal:</span>
          <span>$${so.subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-secondary">VAT Tax (12%):</span>
          <span>$${so.tax.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-secondary">Withholding (2%):</span>
          <span class="text-danger">-$${so.withholding.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 8px; font-size: 1.1rem; font-weight: 700;">
          <span>Net Total:</span>
          <span class="text-success">$${so.total.toFixed(2)}</span>
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

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Delivery Notes Register Ledger</h3>
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

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Sales Invoices Book</h3>
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
                <td style="font-weight: 700;">$${si.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
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
                    <td>$${price.toFixed(2)}</td>
                    <td style="font-weight:700;">$${(li.qty * price).toFixed(2)}</td>
                  </tr>
                `;
              }).join("") : so.items.map(item => `
                  <tr>
                    <td style="font-family:monospace;">${item.sku}</td>
                    <td>${item.name}</td>
                    <td>${item.qty} ${item.uom}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td style="font-weight:700;">$${(item.qty * item.price).toFixed(2)}</td>
                  </tr>
              `)}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 20px; border: 1px solid var(--border-color); padding: 14px; border-radius: var(--radius-sm); background-color: rgba(255,255,255,0.01);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Sales Revenue Subtotal:</span>
            <strong>$${so.subtotal.toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>VAT Output Tax (12%):</span>
            <strong>$${so.tax.toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Withholding Tax Withheld (2%):</span>
            <strong class="text-danger">-$${so.withholding.toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 8px; font-size: 1.1rem; font-weight: 700;">
            <span>Total Accounts Receivable Due:</span>
            <span class="text-success">$${so.total.toFixed(2)}</span>
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

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Customer Sales Returns Ledger</h3>
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
                <td style="font-weight: 700;">$${sr.totalReturn.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
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

  let invoiceOptions = invoices.map(i => `<option value="${i.id}">${i.id} - ${i.customerName} ($${i.total})</option>`).join("");

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
              <td>$${item.price.toFixed(2)}</td>
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
          <button onclick="window.location.hash='#o2c/deliveries'" class="btn btn-outline btn-sm">Back</button>
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
          <button onclick="window.location.hash='#o2c/invoices'" class="btn btn-outline btn-sm">Back</button>
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
                <td>$${item.price.toFixed(2)}</td>
                <td style="font-weight: 700;">$${(item.qty * item.price).toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div style="max-width: 300px; margin-left: auto; text-align: right; display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem;">
        <div style="display: flex; justify-content: space-between;">
          <span class="text-secondary">Subtotal:</span>
          <span>$${si.subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-secondary">VAT Tax (12%):</span>
          <span>$${si.tax.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-secondary">Withholding (2%):</span>
          <span class="text-danger">-$${si.withholding.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 8px; font-size: 1.1rem; font-weight: 700;">
          <span>Net Total:</span>
          <span class="text-success">$${si.total.toFixed(2)}</span>
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
