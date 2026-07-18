// JMIT ERP - Inventory, Warehouses & Stock Entries Module View (Phase 2)
import { store } from "../store.js";
import { formatMoney } from "../utils.js";
export function renderInventory(container, pathParts) {
    const subPage = pathParts[1] || "items";
    const action = pathParts[2];
    const html = `
    <div class="inventory-container animate-fade-in">
      <!-- Sub Tab Navigation -->
      <div class="settings-tab-nav">
        <button class="settings-tab-btn ${subPage === 'items' ? 'active' : ''}" onclick="window.location.hash='#inventory/items'">
          📦 Product Catalog
        </button>
        <button class="settings-tab-btn ${subPage === 'warehouses' ? 'active' : ''}" onclick="window.location.hash='#inventory/warehouses'">
          🏢 Warehouse registries
        </button>
        <button class="settings-tab-btn ${subPage === 'stock-entries' ? 'active' : ''}" onclick="window.location.hash='#inventory/stock-entries'">
          🔄 Stock Entries & Movements
        </button>
        <button class="settings-tab-btn ${subPage === 'uom' ? 'active' : ''}" onclick="window.location.hash='#inventory/uom'">
          📐 UOM & Conversions
        </button>
        <button class="settings-tab-btn ${subPage === 'categories' ? 'active' : ''}" onclick="window.location.hash='#inventory/categories'">
          🏷️ Categories
        </button>
      </div>

      <div id="inventory-content-viewport"></div>
    </div>
  `;
    container.innerHTML = html;
    const viewport = container.querySelector("#inventory-content-viewport");
    if (subPage === "items") {
        renderItemsCatalog(viewport);
    }
    else if (subPage === "warehouses") {
        renderWarehousesList(viewport);
    }
    else if (subPage === "stock-entries") {
        if (action === "new") {
            renderStockEntryForm(viewport);
        }
        else {
            renderStockEntriesList(viewport);
        }
    }
    else if (subPage === "uom") {
        renderUOMConversions(viewport);
    }
    else if (subPage === "categories") {
        renderCategories(viewport);
    }
}
// --- Shared item form (create + edit) ---
function showItemForm(modalMount, container, existingItem) {
    const warehouses = store.getWarehouses();
    const isEdit = existingItem !== null;
    const whOptions = warehouses.map(w => `<option value="${w.id}" ${isEdit && existingItem.stocks[w.id] ? 'selected' : ''}>${w.name}</option>`).join("");
    const catOptions = store.getProductCategories().map(c => `<option value="${c}" ${isEdit && existingItem.category === c ? 'selected' : ''}>${c}</option>`).join("");
    const nameVal = isEdit ? existingItem.name : "";
    const costVal = isEdit ? existingItem.cost : 100;
    const priceVal = isEdit ? existingItem.price : 180;
    const reorderVal = isEdit ? existingItem.reorder : 5;
    const title = isEdit ? `Edit Product: ${existingItem.name}` : "Register Product Catalog Item";
    const submitLabel = isEdit ? "Update Item" : "Register Item";
    const formId = isEdit ? "edit-item-form" : "new-item-form";
    modalMount.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <form id="${formId}">
          <div class="modal-body">
            ${!isEdit ? `
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">SKU Generation</label>
                <select id="item-sku-type" class="form-control">
                  <option value="auto">Auto-Generated SKU</option>
                  <option value="manual">Manual Entry SKU</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Manual SKU Code</label>
                <input type="text" id="item-sku-manual" class="form-control" placeholder="HW-MON-5K" disabled />
              </div>
            </div>
            ` : ''}

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Category</label>
                <select id="item-category" class="form-control">${catOptions}</select>
              </div>
              <div class="form-group">
                <label class="form-label">UOM (Unit of Measure)</label>
                <select id="item-uom" class="form-control">
                  <option value="pcs" ${isEdit && existingItem.uom === 'pcs' ? 'selected' : ''}>pcs (Single)</option>
                  <option value="pack_of_5" ${isEdit && existingItem.uom === 'pack_of_5' ? 'selected' : ''}>pack of 5</option>
                  <option value="box_of_10" ${isEdit && existingItem.uom === 'box_of_10' ? 'selected' : ''}>box of 10</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Product Name Description</label>
              <input type="text" id="item-name" class="form-control" placeholder="Dual Core Server Core" value="${nameVal}" required />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Cost Price ($)</label>
                <input type="number" id="item-cost" class="form-control" min="0" step="0.01" value="${costVal}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Sales Price ($)</label>
                <input type="number" id="item-price" class="form-control" min="0" step="0.01" value="${priceVal}" required />
              </div>
            </div>

            ${!isEdit ? `
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Initial Storage Warehouse</label>
                <select id="item-init-wh" class="form-control">${whOptions}</select>
              </div>
              <div class="form-group">
                <label class="form-label">Initial Stock Load Qty</label>
                <input type="number" id="item-init-qty" class="form-control" min="0" value="0" />
              </div>
            </div>
            ` : ''}

            <div class="form-group">
              <label class="form-label">Safety Reorder Limit</label>
              <input type="number" id="item-reorder" class="form-control" min="0" value="${reorderVal}" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline modal-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary" style="background-color: var(--color-inventory);">${submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  `;
    const close = () => { modalMount.innerHTML = ""; };
    modalMount.querySelector(".modal-close").addEventListener("click", close);
    modalMount.querySelector(".modal-cancel").addEventListener("click", close);
    // SKU type toggle (create-only)
    if (!isEdit) {
        const skuTypeSelect = modalMount.querySelector("#item-sku-type");
        const skuManualInput = modalMount.querySelector("#item-sku-manual");
        skuTypeSelect.addEventListener("change", () => {
            if (skuTypeSelect.value === "manual") {
                skuManualInput.disabled = false;
                skuManualInput.required = true;
            }
            else {
                skuManualInput.disabled = true;
                skuManualInput.required = false;
                skuManualInput.value = "";
            }
        });
    }
    modalMount.querySelector(`#${formId}`).addEventListener("submit", (ev) => {
        ev.preventDefault();
        if (isEdit) {
            // UPDATE
            store.updateItem(existingItem.id, {
                name: ev.target.querySelector("#item-name").value,
                category: ev.target.querySelector("#item-category").value,
                uom: ev.target.querySelector("#item-uom").value,
                cost: Number(ev.target.querySelector("#item-cost").value),
                price: Number(ev.target.querySelector("#item-price").value),
                reorder: Number(ev.target.querySelector("#item-reorder").value)
            });
            window.showToast(`Product "${existingItem.name}" updated.`, "success");
        }
        else {
            // CREATE
            const itemData = {
                autoSku: ev.target.querySelector("#item-sku-type").value === "auto",
                sku: ev.target.querySelector("#item-sku-manual").value,
                name: ev.target.querySelector("#item-name").value,
                category: ev.target.querySelector("#item-category").value,
                uom: ev.target.querySelector("#item-uom").value,
                cost: Number(ev.target.querySelector("#item-cost").value),
                price: Number(ev.target.querySelector("#item-price").value),
                initialWarehouseId: ev.target.querySelector("#item-init-wh").value,
                initialStock: Number(ev.target.querySelector("#item-init-qty").value),
                reorder: Number(ev.target.querySelector("#item-reorder").value)
            };
            store.addItem(itemData);
            // Post capitalization GL posting if initial load is made
            if (itemData.initialStock > 0) {
                const val = itemData.initialStock * itemData.cost;
                store.addManualJournalEntry(`Initial stock capitalization load SKU: ${itemData.name}`, [
                    { code: store.getSettings().glMappings.inventoryAccount, debit: val, credit: 0 },
                    { code: store.getSettings().glMappings.opexAccount, debit: 0, credit: val }
                ]);
            }
            window.showToast(`Product registered successfully under item catalog registry.`, "success");
        }
        close();
        renderItemsCatalog(container);
    });
}
// --- 1. PRODUCT CATALOGUE RENDERER ---
function renderItemsCatalog(container) {
    const items = store.getItems();
    const warehouses = store.getWarehouses();
    const canCreateItem = store.checkPermission("inventory", "create");
    const canUpdateItem = store.checkPermission("inventory", "update");
    const canDeleteItem = store.checkPermission("inventory", "delete");
    const showActions = canUpdateItem || canDeleteItem;
    container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Stock Catalog Records</h3>
        ${canCreateItem ? `<button id="add-item-btn" class="btn btn-primary btn-sm" style="background-color: var(--color-inventory);">+ Register New Item</button>` : ''}
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>UOM</th>
              <th>Cost Price</th>
              <th>Retail Price</th>
              ${warehouses.map(w => `<th>${w.name}</th>`).join("")}
              <th>Total Stock</th>
              <th>Safety Limit</th>
              ${showActions ? '<th style="width:120px;">Actions</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
        const totalStock = warehouses.reduce((sum, w) => sum + (item.stocks[w.id] || 0), 0);
        const isLow = totalStock <= item.reorder;
        return `
                <tr>
                  <td style="font-family: monospace; font-weight: 700; color: var(--color-inventory);">${item.sku}</td>
                  <td><strong>${item.name}</strong></td>
                  <td>${item.category}</td>
                  <td><span class="badge badge-draft">${item.uom}</span></td>
                  <td>${formatMoney(item.cost)}</td>
                  <td>${formatMoney(item.price)}</td>
                  ${warehouses.map(w => `
                    <td style="font-weight: 600; color: var(--text-primary);">${item.stocks[w.id] || 0}</td>
                  `).join("")}
                  <td style="font-weight: 700; ${isLow ? 'color: var(--color-danger);' : 'color: var(--color-o2c);'}">${totalStock}</td>
                  <td>${item.reorder}</td>
                  ${showActions ? `
                    <td>
                      <div style="display:flex;gap:4px;">
                        ${canUpdateItem ? `<button class="btn btn-outline btn-sm edit-item-btn" data-item-id="${item.id}" title="Edit">✏️</button>` : ''}
                        ${canDeleteItem ? `<button class="btn btn-outline btn-sm delete-item-btn" data-item-id="${item.id}" title="Delete" style="color:var(--color-danger);border-color:var(--color-danger);">🗑️</button>` : ''}
                      </div>
                    </td>
                  ` : ''}
                </tr>
              `;
    }).join("")}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Inner modal -->
    <div id="catalog-modal"></div>
  `;
    const modalMount = container.querySelector("#catalog-modal");
    // --- Bind "Register New Item" ---
    const addItemBtn = container.querySelector("#add-item-btn");
    if (addItemBtn) {
        addItemBtn.addEventListener("click", () => showItemForm(modalMount, container, null));
    }
    // --- Bind Edit buttons ---
    container.querySelectorAll(".edit-item-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const itemId = btn.getAttribute("data-item-id");
            const item = store.getItem(itemId);
            if (item)
                showItemForm(modalMount, container, item);
        });
    });
    // --- Bind Delete buttons ---
    container.querySelectorAll(".delete-item-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const itemId = btn.getAttribute("data-item-id");
            const item = store.getItem(itemId);
            if (item && confirm(`Delete product "${item.name}" (${item.sku})? This cannot be undone.`)) {
                try {
                    store.deleteItem(itemId);
                    window.showToast(`Product "${item.name}" deleted.`, "success");
                    renderItemsCatalog(container);
                }
                catch (err) {
                    window.showToast(err.message, "danger");
                }
            }
        });
    });
}
// --- 2. WAREHOUSE REGISTRY RENDERER ---
function renderWarehousesList(container) {
    const warehouses = store.getWarehouses();
    const canCreateWh = store.checkPermission("inventory", "create");
    container.innerHTML = `
    <div class="grid-main-side animate-fade-in">
      <!-- List Card -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Registered Warehouses</h3>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name / Facility</th>
                <th>Storage Address</th>
              </tr>
            </thead>
            <tbody>
              ${warehouses.map(w => `
                <tr>
                  <td style="font-family: monospace; font-weight: 700; color: var(--color-inventory);">${w.id}</td>
                  <td><strong>${w.name}</strong></td>
                  <td>${w.address}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      ${canCreateWh ? `
      <!-- Creation Card -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">New Warehouse</h3>
        </div>
        <form id="new-wh-form">
          <div class="form-group">
            <label class="form-label">Warehouse Name</label>
            <input type="text" id="wh-name" class="form-control" placeholder="Cebu East Warehouse" required />
          </div>
          <div class="form-group">
            <label class="form-label">Facility Address</label>
            <input type="text" id="wh-address" class="form-control" placeholder="Building 4, Reclamation, Cebu" required />
          </div>
          <button type="submit" class="btn btn-primary btn-sm btn-block" style="background-color: var(--color-inventory);">Save Facility</button>
        </form>
      </div>
      ` : ''}
    </div>
  `;
    const newWhForm = container.querySelector("#new-wh-form");
    if (newWhForm) {
        newWhForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const wh = {
                name: e.target.querySelector("#wh-name").value,
                address: e.target.querySelector("#wh-address").value
            };
            store.addWarehouse(wh);
            window.showToast(`Warehouse facility "${wh.name}" created successfully.`, "success");
            renderWarehousesList(container);
        });
    }
}
// --- 3. STOCK ENTRIES RENDERERS ---
function renderStockEntriesList(container) {
    const stockEntries = [...store.getStockEntries()].reverse();
    const canCreateSe = store.checkPermission("inventory", "create");
    container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Stock Ledger Movements</h3>
        ${canCreateSe ? `<button onclick="window.location.hash='#inventory/stock-entries/new'" class="btn btn-primary btn-sm" style="background-color: var(--color-inventory);">+ New Stock Entry</button>` : ''}
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Entry ID</th>
              <th>Movement Type</th>
              <th>Posting Date</th>
              <th>Source Facility</th>
              <th>Target Facility</th>
              <th>Items Adjusted</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            ${stockEntries.map(se => `
              <tr>
                <td style="font-family: monospace; font-weight: 700; color: var(--color-inventory);">${se.id}</td>
                <td>
                  <span class="badge ${se.type === 'Receipt' ? 'badge-success' : se.type === 'Issue' ? 'badge-danger' : 'badge-pending'}">${se.type}</span>
                </td>
                <td>${se.date}</td>
                <td>${se.sourceWarehouseId ? store.getWarehouse(se.sourceWarehouseId).name : '-'}</td>
                <td>${se.targetWarehouseId ? store.getWarehouse(se.targetWarehouseId).name : '-'}</td>
                <td>
                  ${se.items.map(i => {
        const item = store.getItem(i.itemId);
        const name = item ? item.name : "Item";
        if (se.type === "Receipt") {
            return `${name} (Accepted: ${i.acceptedQty}, Rejected: ${i.rejectedQty})`;
        }
        else {
            return `${name} (${i.qty} units)`;
        }
    }).join(", ")}
                </td>
                <td><em class="text-secondary">${se.reason}</em></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
function renderStockEntryForm(container) {
    const warehouses = store.getWarehouses();
    const items = store.getItems();
    let whOptions = warehouses.map(w => `<option value="${w.id}">${w.name}</option>`).join("");
    let itemOptions = items.map(i => `<option value="${i.id}">${i.name}</option>`).join("");
    container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Warehouse Stock Adjustment Entry</h3>
        <button onclick="window.location.hash='#inventory/stock-entries'" class="btn btn-outline btn-sm">Cancel</button>
      </div>

      <form id="stock-entry-form">
        <div class="grid-3">
          <div class="form-group">
            <label class="form-label">Entry Type</label>
            <select id="se-type" class="form-control" required>
              <option value="Receipt" selected>Receipt (Inward)</option>
              <option value="Issue">Issue (Outward)</option>
              <option value="Transfer">Transfer (Internal Movement)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Source Warehouse</label>
            <select id="se-source" class="form-control" disabled>
              <option value="" disabled selected>N/A</option>
              ${whOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Target Warehouse</label>
            <select id="se-target" class="form-control">
              ${whOptions}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Adjustment Reason Details</label>
          <input type="text" id="se-reason" class="form-control" placeholder="Cycle count variance / damaged scrap write-off" required />
        </div>

        <div style="margin-top: 20px;">
          <h4 style="font-size: 0.85rem; text-transform: uppercase; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 10px;">Itemized Stock Lines</h4>
          <table class="order-items-table">
            <thead>
              <tr id="se-table-headers">
                <!-- Swapped dynamic columns -->
              </tr>
            </thead>
            <tbody id="se-lines-body">
            </tbody>
          </table>
          <button type="button" id="se-add-line" class="btn btn-outline btn-sm">+ Add Line Item</button>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <button type="submit" class="btn btn-primary" style="background-color: var(--color-inventory);">Post Stock Adjustment</button>
        </div>
      </form>
    </div>
  `;
    const form = container.querySelector("#stock-entry-form");
    const typeSelect = form.querySelector("#se-type");
    const sourceSelect = form.querySelector("#se-source");
    const targetSelect = form.querySelector("#se-target");
    const tableHeaders = form.querySelector("#se-table-headers");
    const linesBody = form.querySelector("#se-lines-body");
    const addLineBtn = form.querySelector("#se-add-line");
    // Sync Form elements on selection type changes
    const syncFormType = () => {
        const type = typeSelect.value;
        linesBody.innerHTML = ""; // reset lines
        if (type === "Receipt") {
            sourceSelect.disabled = true;
            sourceSelect.value = "";
            targetSelect.disabled = false;
            tableHeaders.innerHTML = `
        <th style="width: 45%;">Item Description</th>
        <th style="width: 25%;">Accepted Qty</th>
        <th style="width: 25%;">Rejected Qty</th>
        <th style="width: 5%;"></th>
      `;
        }
        else if (type === "Issue") {
            sourceSelect.disabled = false;
            targetSelect.disabled = true;
            targetSelect.value = "";
            tableHeaders.innerHTML = `
        <th style="width: 65%;">Item Description</th>
        <th style="width: 30%;">Disburse Qty</th>
        <th style="width: 5%;"></th>
      `;
        }
        else {
            // Transfer
            sourceSelect.disabled = false;
            targetSelect.disabled = false;
            tableHeaders.innerHTML = `
        <th style="width: 65%;">Item Description</th>
        <th style="width: 30%;">Movement Transfer Qty</th>
        <th style="width: 5%;"></th>
      `;
        }
        addLine(); // add first line
    };
    const addLine = () => {
        const type = typeSelect.value;
        const tr = document.createElement("tr");
        tr.className = "se-line-row";
        if (type === "Receipt") {
            tr.innerHTML = `
        <td>
          <select class="form-control line-item" required>${itemOptions}</select>
        </td>
        <td>
          <input type="number" class="form-control line-accepted" min="0" value="1" required />
        </td>
        <td>
          <input type="number" class="form-control line-rejected" min="0" value="0" required />
        </td>
        <td>
          <button type="button" class="btn btn-outline btn-sm remove-line" style="color:var(--color-danger); border-color:transparent;">&times;</button>
        </td>
      `;
        }
        else {
            tr.innerHTML = `
        <td>
          <select class="form-control line-item" required>${itemOptions}</select>
        </td>
        <td>
          <input type="number" class="form-control line-qty" min="1" value="1" required />
        </td>
        <td>
          <button type="button" class="btn btn-outline btn-sm remove-line" style="color:var(--color-danger); border-color:transparent;">&times;</button>
        </td>
      `;
        }
        linesBody.appendChild(tr);
        tr.querySelector(".remove-line").addEventListener("click", () => tr.remove());
    };
    typeSelect.addEventListener("change", syncFormType);
    addLineBtn.addEventListener("click", addLine);
    // Init
    syncFormType();
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const type = typeSelect.value;
        const sourceWh = sourceSelect.value;
        const targetWh = targetSelect.value;
        const reason = form.querySelector("#se-reason").value;
        if (type === "Transfer" && sourceWh === targetWh) {
            window.showToast("Source and Target warehouse facilities cannot be the same.", "warning");
            return;
        }
        const lines = [];
        form.querySelectorAll(".se-line-row").forEach(row => {
            const itemId = row.querySelector(".line-item").value;
            if (type === "Receipt") {
                const acceptedQty = Number(row.querySelector(".line-accepted").value);
                const rejectedQty = Number(row.querySelector(".line-rejected").value);
                lines.push({ itemId, acceptedQty, rejectedQty });
            }
            else {
                const qty = Number(row.querySelector(".line-qty").value);
                lines.push({ itemId, qty });
            }
        });
        try {
            store.createStockEntry({
                type,
                sourceWarehouseId: sourceWh,
                targetWarehouseId: targetWh,
                reason,
                items: lines,
                date: new Date().toISOString().split("T")[0]
            });
            window.showToast("Warehouse Stock Entry adjustment processed successfully.", "success");
            window.location.hash = "#inventory/stock-entries";
        }
        catch (err) {
            window.showToast(err.message, "danger");
        }
    });
}
// ─── UOM & CONVERSIONS ───
function renderUOMConversions(container) {
    const conversions = store.getUOMConversions();
    const refresh = () => renderUOMConversions(container);
    container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
        <h3 class="card-title">Unit of Measure & Conversion Rates</h3>
        <button class="btn btn-primary btn-sm" id="add-uom-btn">+ Add UOM</button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>From Unit</th>
              <th>To Unit</th>
              <th>Conversion Rate</th>
              <th style="text-align:center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${conversions.map(c => `
              <tr>
                <td><strong>${c.from}</strong></td>
                <td>${c.to}</td>
                <td>1 ${c.from} = <strong>${c.rate}</strong> ${c.to}</td>
                <td style="text-align:center;">
                  <button class="btn btn-outline btn-xs edit-uom-btn" data-from="${c.from}">Edit</button>
                  <button class="btn btn-outline btn-xs delete-uom-btn" data-from="${c.from}" style="color:var(--color-danger);margin-left:4px;">Delete</button>
                </td>
              </tr>
            `).join("")}
            ${conversions.length === 0 ? '<tr><td colspan="4" style="text-align:center;padding:24px;">No UOM conversions defined.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>

    <!-- UOM Modal -->
    <div id="uom-modal-overlay" class="modal-overlay" style="display:none;"></div>
  `;
    container.querySelector("#add-uom-btn").addEventListener("click", () => openUOMModal(null, refresh));
    container.querySelectorAll(".edit-uom-btn").forEach(b => b.addEventListener("click", () => openUOMModal(b.dataset.from, refresh)));
    container.querySelectorAll(".delete-uom-btn").forEach(b => b.addEventListener("click", () => {
        if (confirm("Delete this UOM conversion?")) {
            try {
                store.deleteUOMConversion(b.dataset.from);
                window.showToast("Deleted", "success");
                refresh();
            }
            catch (e) {
                window.showToast(e.message, "danger");
            }
        }
    }));
}
function openUOMModal(fromUnit, onClose) {
    const convs = store.getUOMConversions();
    const existing = fromUnit ? convs.find(c => c.from === fromUnit) : null;
    const modal = document.getElementById("uom-modal-overlay");
    if (!modal)
        return;
    modal.innerHTML = `
    <div class="modal-content" style="max-width:420px;">
      <div class="modal-header">
        <h3>${existing ? 'Edit UOM' : 'Add UOM Conversion'}</h3>
        <button class="modal-close-btn" id="uom-modal-close">&times;</button>
      </div>
      <form id="uom-form">
        <div class="form-group">
          <label class="form-label">From Unit</label>
          <input type="text" class="form-control" id="uom-from" value="${existing ? existing.from : ''}" placeholder="e.g. box_of_10" ${existing ? 'readonly' : ''} required />
        </div>
        <div class="form-group">
          <label class="form-label">To Unit</label>
          <input type="text" class="form-control" id="uom-to" value="${existing ? existing.to : 'pcs'}" placeholder="e.g. pcs" required />
        </div>
        <div class="form-group">
          <label class="form-label">Conversion Rate</label>
          <input type="number" class="form-control" id="uom-rate" value="${existing ? existing.rate : 1}" step="0.01" min="0.01" required />
        </div>
        <button type="submit" class="btn btn-primary btn-block" style="margin-top:12px;">${existing ? 'Save' : 'Add'}</button>
      </form>
    </div>
  `;
    modal.style.display = "flex";
    modal.querySelector("#uom-modal-close").addEventListener("click", () => { modal.style.display = "none"; });
    modal.addEventListener("click", (e) => { if (e.target === modal)
        modal.style.display = "none"; });
    modal.querySelector("#uom-form").addEventListener("submit", (ev) => {
        ev.preventDefault();
        const from = modal.querySelector("#uom-from").value.trim();
        const to = modal.querySelector("#uom-to").value.trim();
        const rate = parseFloat(modal.querySelector("#uom-rate").value);
        if (!from || !to || isNaN(rate)) {
            window.showToast("All fields required", "warning");
            return;
        }
        try {
            if (existing) {
                store.updateUOMConversion(fromUnit, { to, rate });
                window.showToast("Updated", "success");
            }
            else {
                store.addUOMConversion({ from, to, rate });
                window.showToast("Added", "success");
            }
            modal.style.display = "none";
            onClose();
        }
        catch (e) {
            window.showToast(e.message, "danger");
        }
    });
}
// ─── PRODUCT CATEGORIES ───
function renderCategories(container) {
    const categories = store.getProductCategories();
    const refresh = () => renderCategories(container);
    container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
        <h3 class="card-title">Product Categories</h3>
        <button class="btn btn-primary btn-sm" id="add-cat-btn">+ Add Category</button>
      </div>
      <div class="table-container">
        <table>
          <thead><tr><th>Category Name</th><th style="text-align:center;">Actions</th></tr></thead>
          <tbody>
            ${categories.map(c => `
              <tr>
                <td><strong>${c}</strong></td>
                <td style="text-align:center;">
                  <button class="btn btn-outline btn-xs edit-cat-btn" data-name="${c}">Edit</button>
                  <button class="btn btn-outline btn-xs delete-cat-btn" data-name="${c}" style="color:var(--color-danger);margin-left:4px;">Delete</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
    <div id="cat-modal-overlay" class="modal-overlay" style="display:none;"></div>
  `;
    const catModal = container.querySelector("#cat-modal-overlay");
    container.querySelector("#add-cat-btn").addEventListener("click", () => {
        catModal.innerHTML = `<div class="modal-content" style="max-width:380px;">
      <div class="modal-header"><h3>Add Category</h3><button class="modal-close-btn" id="cat-close">&times;</button></div>
      <form id="cat-form"><div class="form-group"><label class="form-label">Category Name</label>
      <input type="text" class="form-control" id="cat-name" placeholder="e.g. Electronics" required /></div>
      <button type="submit" class="btn btn-primary btn-block" style="margin-top:12px;">Add</button></form></div>`;
        catModal.style.display = "flex";
        catModal.querySelector("#cat-close").addEventListener("click", () => catModal.style.display = "none");
        catModal.querySelector("#cat-form").addEventListener("submit", (ev) => {
            ev.preventDefault();
            const name = catModal.querySelector("#cat-name").value.trim();
            try {
                store.addCategory(name);
                catModal.style.display = "none";
                window.showToast("Added", "success");
                refresh();
            }
            catch (e) {
                window.showToast(e.message, "danger");
            }
        });
    });
    container.querySelectorAll(".edit-cat-btn").forEach(b => {
        const oldName = b.dataset.name;
        b.addEventListener("click", () => {
            catModal.innerHTML = `<div class="modal-content" style="max-width:380px;">
        <div class="modal-header"><h3>Edit Category</h3><button class="modal-close-btn" id="cat-close">&times;</button></div>
        <form id="cat-form"><div class="form-group"><label class="form-label">Category Name</label>
        <input type="text" class="form-control" id="cat-name" value="${oldName}" required /></div>
        <button type="submit" class="btn btn-primary btn-block" style="margin-top:12px;">Save</button></form></div>`;
            catModal.style.display = "flex";
            catModal.querySelector("#cat-close").addEventListener("click", () => catModal.style.display = "none");
            catModal.querySelector("#cat-form").addEventListener("submit", (ev) => {
                ev.preventDefault();
                const newName = catModal.querySelector("#cat-name").value.trim();
                try {
                    store.updateCategory(oldName, newName);
                    catModal.style.display = "none";
                    window.showToast("Updated", "success");
                    refresh();
                }
                catch (e) {
                    window.showToast(e.message, "danger");
                }
            });
        });
    });
    container.querySelectorAll(".delete-cat-btn").forEach(b => b.addEventListener("click", () => {
        if (confirm("Delete this category?")) {
            try {
                store.deleteCategory(b.dataset.name);
                window.showToast("Deleted", "success");
                refresh();
            }
            catch (e) {
                window.showToast(e.message, "danger");
            }
        }
    }));
}
//# sourceMappingURL=inventory.js.map