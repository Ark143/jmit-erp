// JMIT ERP - Settings & Business Partners Module View (Phase 2)
import { store } from "../store.js";
export function renderSettings(container, pathParts) {
    const subRoute = pathParts[1] || "config";
    const html = `
    <div class="settings-container animate-fade-in">
      <!-- Settings Tab Nav -->
      <div class="settings-tab-nav">
        <button class="settings-tab-btn ${subRoute === 'config' ? 'active' : ''}" onclick="window.location.hash='#settings/config'">
          ⚙️ Global System Configuration
        </button>
        <button class="settings-tab-btn ${subRoute === 'partners' ? 'active' : ''}" onclick="window.location.hash='#settings/partners'">
          👥 Business Partners Registry
        </button>
        <button class="settings-tab-btn ${subRoute === 'users' ? 'active' : ''}" onclick="window.location.hash='#settings/users'">
          👤 Users & Access
        </button>
        <button class="settings-tab-btn ${subRoute === 'workflows' ? 'active' : ''}" onclick="window.location.hash='#settings/workflows'">
          🛡️ Workflows & Roles Clearance
        </button>
      </div>

      <div id="settings-content-viewport"></div>
    </div>
  `;
    container.innerHTML = html;
    const contentViewport = container.querySelector("#settings-content-viewport");
    if (subRoute === "config") {
        renderConfig(contentViewport);
    }
    else if (subRoute === "partners") {
        renderPartners(contentViewport);
    }
    else if (subRoute === "users") {
        renderUsers(contentViewport);
    }
    else if (subRoute === "workflows") {
        renderWorkflowsAndRoles(contentViewport);
    }
}
// Render Global Configuration Sub-Tab
function renderConfig(container) {
    const settings = store.getSettings();
    const companies = store.getCompanies();
    const periods = store.getPeriods();
    const accounts = store.getAccounts().filter(a => a.parentCode !== null); // leaf nodes only for mapping
    const maps = settings.glMappings;
    // Options for Account Tagging Dropdowns
    const accountOptions = (selected) => {
        return accounts.map(a => `<option value="${a.code}" ${a.code === selected ? 'selected' : ''}>${a.code} - ${a.name}</option>`).join("");
    };
    const html = `
    <div class="grid-2">
      <!-- Left Column: Company & Period Configs -->
      <div>
        <!-- Active Company Selection -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Active Org Context</h3>
          </div>
          <div class="form-group">
            <label class="form-label">Selected Active Operating Company</label>
            <select id="active-company-select" class="form-control">
              ${companies.map(c => `<option value="${c.id}" ${c.id === settings.activeCompany ? 'selected' : ''}>${c.name} (${c.currency})</option>`).join("")}
            </select>
          </div>
        </div>

        <!-- Multi-Company List & Creation -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Registered Corporations</h3>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
            ${companies.map(c => `
              <div style="border: 1px solid var(--border-color); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.85rem; background-color: rgba(255,255,255,0.015); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>${c.name}</strong>
                  <div class="text-muted" style="font-size: 0.75rem; margin-top: 2px;">
                    TIN: ${c.taxId} | Base Currency: ${c.currency} | Address: ${c.address}
                  </div>
                </div>
                <div style="display: flex; gap: 4px;">
                  <button class="btn btn-outline btn-sm edit-company-btn" data-company-id="${c.id}" style="font-size: 0.7rem; padding: 2px 8px;">Edit</button>
                  <button class="btn btn-outline btn-sm delete-company-btn" data-company-id="${c.id}" style="font-size: 0.7rem; padding: 2px 8px; color: var(--color-danger); border-color: var(--color-danger);">Delete</button>
                </div>
              </div>
            `).join("")}
          </div>
          <button id="add-company-btn" class="btn btn-outline btn-sm">Add Company Entity</button>
        </div>

        <!-- SKU Code rules -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">SKU Autogen Rules</h3>
          </div>
          <form id="sku-rule-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">SKU Prefix</label>
                <input type="text" id="sku-prefix" class="form-control" value="${settings.skuRule.prefix}" />
              </div>
              <div class="form-group">
                <label class="form-label">Sequence Start</label>
                <input type="number" id="sku-seq" class="form-control" value="${settings.skuRule.sequence}" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">SKU Suffix</label>
              <input type="text" id="sku-suffix" class="form-control" value="${settings.skuRule.suffix}" />
            </div>
            <button type="submit" class="btn btn-primary btn-sm">Save Rules</button>
          </form>
        </div>
      </div>

      <!-- Right Column: Currency rates, periods, GL Tagging -->
      <div>
        <!-- Fiscal Periods and Locking -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Fiscal Periods & Locking</h3>
          </div>
          <div class="table-container" style="max-height: 150px; overflow-y: auto; margin-bottom: 12px;">
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Locked</th>
                  <th>Toggle</th>
                </tr>
              </thead>
              <tbody>
                ${periods.map(p => `
                  <tr>
                    <td><strong>${p.name}</strong> (${p.start} - ${p.end})</td>
                    <td>${p.closed ? '<span class="badge badge-danger">Locked</span>' : '<span class="badge badge-success">Open</span>'}</td>
                    <td>
                      <button class="btn btn-outline btn-sm toggle-period-btn" data-name="${p.name}">
                        ${p.closed ? "Unlock" : "Lock / Close"}
                      </button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          <button id="add-period-btn" class="btn btn-outline btn-sm">Create New Period</button>
        </div>

        <!-- Default Currency & Exchange Rates -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Default Currency & Exchange Rates</h3>
          </div>
          <form id="currency-form">
            <div class="form-group">
              <label class="form-label">System Default Currency</label>
              <select id="active-currency-select" class="form-control">
                <option value="USD" ${settings.activeCurrency === 'USD' ? 'selected' : ''}>USD ($) - US Dollar</option>
                <option value="PHP" ${settings.activeCurrency === 'PHP' ? 'selected' : ''}>PHP (₱) - Philippine Peso</option>
                <option value="EUR" ${settings.activeCurrency === 'EUR' ? 'selected' : ''}>EUR (€) - Euro</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Exchange Rates (relative to 1 USD)</label>
              <div id="rates-list" style="display:flex;flex-direction:column;gap:6px;">
                ${Object.entries(settings.exchangeRates).map(([code, rate]) => `
                  <div class="rate-row" style="display:flex;gap:6px;align-items:center;">
                    <input type="text" class="form-control rate-code" value="${code}" style="width:80px;" placeholder="Code" readonly />
                    <input type="number" class="form-control rate-value" value="${rate}" step="0.0001" style="width:120px;" />
                    <button type="button" class="btn btn-outline btn-sm delete-rate-btn" style="color:var(--color-danger);flex-shrink:0;">×</button>
                  </div>
                `).join("")}
              </div>
              <button type="button" id="add-rate-btn" class="btn btn-outline btn-sm" style="margin-top:8px;">+ Add Rate</button>
            </div>
            <button type="submit" class="btn btn-primary btn-sm">Save Currency Settings</button>
          </form>
        </div>

        <!-- GL Account Mappings tagging -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Global Account Tagging Mappings</h3>
          </div>
          <form id="gl-mapping-form" style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 6px;">
              <strong>Accounting Event / Default</strong>
              <strong>Target General Ledger GL / Value</strong>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 10px;">
              <span style="font-size: 0.8rem; color: var(--text-secondary);">Default Cash</span>
              <select name="cashAccount" class="form-control">${accountOptions(maps.cashAccount)}</select>
              
              <span style="font-size: 0.8rem; color: var(--text-secondary);">Accounts Receivable (AR)</span>
              <select name="arAccount" class="form-control">${accountOptions(maps.arAccount)}</select>

              <span style="font-size: 0.8rem; color: var(--text-secondary);">Accounts Payable (AP)</span>
              <select name="apAccount" class="form-control">${accountOptions(maps.apAccount)}</select>

              <span style="font-size: 0.8rem; color: var(--text-secondary);">Inventory Asset</span>
              <select name="inventoryAccount" class="form-control">${accountOptions(maps.inventoryAccount)}</select>

              <span style="font-size: 0.8rem; color: var(--text-secondary);">Sales Revenue</span>
              <select name="salesAccount" class="form-control">${accountOptions(maps.salesAccount)}</select>

              <span style="font-size: 0.8rem; color: var(--text-secondary);">Cost of Goods Sold</span>
              <select name="cogsAccount" class="form-control">${accountOptions(maps.cogsAccount)}</select>

              <span style="font-size: 0.8rem; color: var(--text-secondary);">VAT Payable (Output Tax)</span>
              <select name="taxAccount" class="form-control">${accountOptions(maps.taxAccount)}</select>

              <span style="font-size: 0.8rem; color: var(--text-secondary);">WHT Receivable (Asset)</span>
              <select name="whtAssetAccount" class="form-control">${accountOptions(maps.whtAssetAccount)}</select>

              <span style="font-size: 0.8rem; color: var(--text-secondary);">WHT Payable (Liability)</span>
              <select name="whtLiabilityAccount" class="form-control">${accountOptions(maps.whtLiabilityAccount)}</select>

              <span style="font-size: 0.8rem; color: var(--text-secondary);">Depreciation Expense</span>
              <select name="deprExpenseAccount" class="form-control">${accountOptions(maps.deprExpenseAccount)}</select>

              <span style="font-size: 0.8rem; color: var(--text-secondary);">Default Other Charges Account</span>
              <select name="defaultOtherChargesAccount" class="form-control">${accountOptions(maps.defaultOtherChargesAccount)}</select>
            </div>

            <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 8px;">
              <span style="font-size: 0.75rem; color: var(--text-secondary);">VAT and WHT are entered manually per transaction. Configure GL accounts above.</span>
            </div>

            <button type="submit" class="btn btn-primary btn-sm" style="margin-top: 10px;">Save Mappings</button>
          </form>
        </div>
      </div>
    </div>

    <!-- Inner Config Modals Mount -->
    <div id="inner-config-modal"></div>
  `;
    container.innerHTML = html;
    // Bind Actions for Config views
    const modalMount = container.querySelector("#inner-config-modal");
    // Company Select Change
    container.querySelector("#active-company-select").addEventListener("change", (e) => {
        store.state.settings.activeCompany = e.target.value;
        const activeC = store.getActiveCompany();
        store.state.settings.activeCurrency = activeC ? activeC.currency : "USD";
        store.saveState();
        window.showToast(`Switched active corporate entity to: ${activeC.name}. Header values synchronized.`, "info");
    });
    // Toggle Period Locks
    container.querySelectorAll(".toggle-period-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const name = btn.getAttribute("data-name");
            store.togglePeriod(name);
            const period = store.getPeriods().find(p => p.name === name);
            window.showToast(`Fiscal Period ${name} is now ${period.closed ? 'LOCKED (Closed)' : 'OPEN'}.`, "warning");
            renderConfig(container);
        });
    });
    // SKU settings Save
    container.querySelector("#sku-rule-form").addEventListener("submit", (e) => {
        e.preventDefault();
        store.state.settings.skuRule.prefix = e.target.querySelector("#sku-prefix").value;
        store.state.settings.skuRule.sequence = Number(e.target.querySelector("#sku-seq").value);
        store.state.settings.skuRule.suffix = e.target.querySelector("#sku-suffix").value;
        store.saveState();
        window.showToast("SKU Autogeneration sequence rules updated.", "success");
    });
    // GL tagging Save
    container.querySelector("#gl-mapping-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const selectElements = e.target.querySelectorAll("select");
        selectElements.forEach(sel => {
            store.state.settings.glMappings[sel.name] = sel.value;
        });
        store.saveState();
        window.showToast("Default GL mapping definitions saved successfully.", "success");
    });
    // Currency & Exchange Rates
    container.querySelector("#currency-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const currency = container.querySelector("#active-currency-select").value;
        const rates = {};
        container.querySelectorAll(".rate-row").forEach((row) => {
            const code = row.querySelector(".rate-code").value.trim();
            const val = parseFloat(row.querySelector(".rate-value").value);
            if (code && !isNaN(val))
                rates[code] = val;
        });
        store.updateSettings({ activeCurrency: currency, exchangeRates: rates });
        window.showToast("Currency settings saved.", "success");
    });
    container.querySelector("#add-rate-btn").addEventListener("click", () => {
        const list = container.querySelector("#rates-list");
        const row = document.createElement("div");
        row.className = "rate-row";
        row.style.cssText = "display:flex;gap:6px;align-items:center;";
        row.innerHTML = `
      <input type="text" class="form-control rate-code" placeholder="Code" style="width:80px;" />
      <input type="number" class="form-control rate-value" step="0.0001" value="1.0" style="width:120px;" />
      <button type="button" class="btn btn-outline btn-sm delete-rate-btn" style="color:var(--color-danger);flex-shrink:0;">×</button>
    `;
        list.appendChild(row);
        row.querySelector(".delete-rate-btn").addEventListener("click", () => row.remove());
    });
    container.querySelectorAll(".delete-rate-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.target.closest(".rate-row")?.remove();
        });
    });
    // Add Company Wizard
    const addBtn = container.querySelector("#add-company-btn");
    if (!store.checkPermission("settings", "create")) {
        addBtn.style.display = "none";
    }
    addBtn.addEventListener("click", () => {
        modalMount.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Register Corporate Entity</h3>
            <button class="modal-close">&times;</button>
          </div>
          <form id="new-company-form">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Corporate Name</label>
                <input type="text" id="comp-name" class="form-control" placeholder="JMIT Holdings Inc." required />
              </div>
              <div class="form-group">
                <label class="form-label">Company Address</label>
                <input type="text" id="comp-address" class="form-control" placeholder="Ayala Ave, Makati, PH" required />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Tax ID (TIN / RFC)</label>
                  <input type="text" id="comp-taxid" class="form-control" placeholder="222-333-444" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Base Currency</label>
                  <select id="comp-currency" class="form-control">
                    <option value="USD">USD ($)</option>
                    <option value="PHP">PHP (₱)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Company</button>
            </div>
          </form>
        </div>
      </div>
    `;
        const close = () => modalMount.innerHTML = "";
        modalMount.querySelector(".modal-close").addEventListener("click", close);
        modalMount.querySelector(".modal-cancel").addEventListener("click", close);
        modalMount.querySelector("#new-company-form").addEventListener("submit", (ev) => {
            ev.preventDefault();
            const comp = {
                name: ev.target.querySelector("#comp-name").value,
                address: ev.target.querySelector("#comp-address").value,
                taxId: ev.target.targetId || ev.target.querySelector("#comp-taxid").value,
                currency: ev.target.querySelector("#comp-currency").value
            };
            store.addCompany(comp);
            window.showToast(`Company "${comp.name}" successfully registered.`, "success");
            close();
            renderConfig(container);
        });
    });
    // Edit Company
    container.querySelectorAll(".edit-company-btn").forEach(btn => {
        if (!store.checkPermission("settings", "update")) {
            btn.style.display = "none";
            return;
        }
        btn.addEventListener("click", () => {
            const companyId = btn.getAttribute("data-company-id");
            const company = store.getCompanies().find(c => c.id === companyId);
            if (!company)
                return;
            modalMount.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">Edit Corporate Entity</h3>
              <button class="modal-close">&times;</button>
            </div>
            <form id="edit-company-form">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Corporate Name</label>
                  <input type="text" id="comp-name" class="form-control" value="${company.name}" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Company Address</label>
                  <input type="text" id="comp-address" class="form-control" value="${company.address}" required />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Tax ID (TIN / RFC)</label>
                    <input type="text" id="comp-taxid" class="form-control" value="${company.taxId}" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Base Currency</label>
                    <select id="comp-currency" class="form-control">
                      <option value="USD" ${company.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                      <option value="PHP" ${company.currency === 'PHP' ? 'selected' : ''}>PHP (₱)</option>
                      <option value="EUR" ${company.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline modal-cancel">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      `;
            const close = () => modalMount.innerHTML = "";
            modalMount.querySelector(".modal-close").addEventListener("click", close);
            modalMount.querySelector(".modal-cancel").addEventListener("click", close);
            modalMount.querySelector("#edit-company-form").addEventListener("submit", (ev) => {
                ev.preventDefault();
                const updated = {
                    name: ev.target.querySelector("#comp-name").value,
                    address: ev.target.querySelector("#comp-address").value,
                    taxId: ev.target.querySelector("#comp-taxid").value,
                    currency: ev.target.querySelector("#comp-currency").value
                };
                try {
                    store.editCompany(companyId, updated);
                    window.showToast(`Company "${updated.name}" updated successfully.`, "success");
                    close();
                    renderConfig(container);
                }
                catch (err) {
                    window.showToast(err.message, "danger");
                }
            });
        });
    });
    // Delete Company
    container.querySelectorAll(".delete-company-btn").forEach(btn => {
        if (!store.checkPermission("settings", "delete")) {
            btn.style.display = "none";
            return;
        }
        btn.addEventListener("click", () => {
            const companyId = btn.getAttribute("data-company-id");
            const company = store.getCompanies().find(c => c.id === companyId);
            if (!company)
                return;
            if (confirm(`Permanently delete company "${company.name}"? This action cannot be undone.`)) {
                try {
                    store.deleteCompany(companyId);
                    window.showToast(`Company "${company.name}" deleted.`, "warning");
                    renderConfig(container);
                }
                catch (err) {
                    window.showToast(err.message, "danger");
                }
            }
        });
    });
    // Open New Period Wizard
    container.querySelector("#add-period-btn").addEventListener("click", () => {
        modalMount.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Open Fiscal Period</h3>
            <button class="modal-close">&times;</button>
          </div>
          <form id="new-period-form">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Period Name (YYYY-MM)</label>
                <input type="text" id="per-name" class="form-control" placeholder="2026-08" required />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Start Date</label>
                  <input type="date" id="per-start" class="form-control" required />
                </div>
                <div class="form-group">
                  <label class="form-label">End Date</label>
                  <input type="date" id="per-end" class="form-control" required />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-primary">Open Period</button>
            </div>
          </form>
        </div>
      </div>
    `;
        const close = () => modalMount.innerHTML = "";
        modalMount.querySelector(".modal-close").addEventListener("click", close);
        modalMount.querySelector(".modal-cancel").addEventListener("click", close);
        modalMount.querySelector("#new-period-form").addEventListener("submit", (ev) => {
            ev.preventDefault();
            const per = {
                name: ev.target.querySelector("#per-name").value,
                start: ev.target.querySelector("#per-start").value,
                end: ev.target.querySelector("#per-end").value
            };
            store.addPeriod(per);
            window.showToast(`Opened fiscal period: ${per.name}`, "success");
            close();
            renderConfig(container);
        });
    });
}
// Render Business Partners Sub-Tab
function renderPartners(container) {
    const partners = store.getPartners();
    const html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="font-size: 1.15rem;">Business Contacts Directory</h3>
      <button id="add-partner-btn" class="btn btn-primary">
        + Create Business Partner
      </button>
    </div>

    <!-- Tabs inside partners view -->
    <div class="grid-3">
      <!-- Customers Column -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title text-success">Customers</h3>
        </div>
        <div class="partner-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 420px; overflow-y: auto;">
          ${partners.customers.map(c => `
            <div style="border: 1px solid var(--border-color); padding: 10px; border-radius: var(--radius-sm); background-color: rgba(255,255,255,0.015);">
              <strong>${c.name}</strong> <span style="font-family: monospace; font-size:0.75rem; color: var(--color-o2c); float: right;">${c.id}</span>
              <div class="text-muted" style="font-size: 0.75rem; margin-top: 4px;">
                TIN: ${c.taxId} | VAT: ${(c.taxRate * 100)}% | WHT: ${(c.whtRate * 100)}%
                <div style="margin-top: 2px;">Email: ${c.email}</div>
                <div>Address: ${c.address}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Vendors Column -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title text-warning">Suppliers / Vendors</h3>
        </div>
        <div class="partner-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 420px; overflow-y: auto;">
          ${partners.vendors.map(v => `
            <div style="border: 1px solid var(--border-color); padding: 10px; border-radius: var(--radius-sm); background-color: rgba(255,255,255,0.015);">
              <strong>${v.name}</strong> <span style="font-family: monospace; font-size:0.75rem; color: var(--color-p2p); float: right;">${v.id}</span>
              <div class="text-muted" style="font-size: 0.75rem; margin-top: 4px;">
                TIN: ${v.taxId} | Term: ${v.defaultTerms}
                <div style="margin-top: 2px;">Email: ${v.email}</div>
                <div>Address: ${v.address}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Leads Column -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title text-info">Prospect Leads</h3>
        </div>
        <div class="partner-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 420px; overflow-y: auto;">
          ${partners.leads.map(l => `
            <div style="border: 1px solid var(--border-color); padding: 10px; border-radius: var(--radius-sm); background-color: rgba(255,255,255,0.015);">
              <strong>${l.name}</strong> <span style="font-family: monospace; font-size:0.75rem; color: var(--color-secondary); float: right;">${l.id}</span>
              <div class="text-muted" style="font-size: 0.75rem; margin-top: 4px;">
                Status: <span class="badge badge-pending">${l.status}</span>
                <div style="margin-top: 2px;">Contact: ${l.contact} | ${l.phone}</div>
                <div>Email: ${l.email}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>

    <!-- Modals Mount -->
    <div id="partner-modal-mount"></div>
  `;
    container.innerHTML = html;
    const modalMount = container.querySelector("#partner-modal-mount");
    // Add Partner Click
    container.querySelector("#add-partner-btn").addEventListener("click", () => {
        modalMount.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width: 550px;">
          <div class="modal-header">
            <h3 class="modal-title">Create Business Partner</h3>
            <button class="modal-close">&times;</button>
          </div>
          <form id="new-partner-form">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Partner Type</label>
                  <select id="part-type" class="form-control" required>
                    <option value="Customer">Customer</option>
                    <option value="Vendor">Supplier / Vendor</option>
                    <option value="Lead">Prospect Lead</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Tax ID (TIN / RFC)</label>
                  <input type="text" id="part-taxid" class="form-control" placeholder="123-456-789" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Company / Contact Name</label>
                <input type="text" id="part-name" class="form-control" placeholder="Makati Retailers" required />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Contact Person</label>
                  <input type="text" id="part-contact" class="form-control" placeholder="Jose Rizal" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <input type="text" id="part-phone" class="form-control" placeholder="+63 900 123 4567" required />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" id="part-email" class="form-control" placeholder="info@partner.com" required />
              </div>
              <div class="form-group">
                <label class="form-label">Office Address</label>
                <input type="text" id="part-address" class="form-control" placeholder="100 Paseo De Roxas, Makati" required />
              </div>

              <!-- Customer specific taxation inputs -->
              <div id="customer-tax-config" class="form-row" style="display: flex;">
                <div class="form-group" style="flex: 1;">
                  <label class="form-label">VAT Rate (%)</label>
                  <input type="number" id="part-vat" class="form-control" min="0" max="0.30" step="0.01" value="0.12" />
                </div>
                <div class="form-group" style="flex: 1;">
                  <label class="form-label">Withholding Rate (%)</label>
                  <input type="number" id="part-wht" class="form-control" min="0" max="0.15" step="0.01" value="0.02" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Partner</button>
            </div>
          </form>
        </div>
      </div>
    `;
        const close = () => modalMount.innerHTML = "";
        modalMount.querySelector(".modal-close").addEventListener("click", close);
        modalMount.querySelector(".modal-cancel").addEventListener("click", close);
        const typeSelect = modalMount.querySelector("#part-type");
        const taxRow = modalMount.querySelector("#customer-tax-config");
        typeSelect.addEventListener("change", () => {
            if (typeSelect.value === "Customer") {
                taxRow.style.display = "flex";
            }
            else {
                taxRow.style.display = "none";
            }
        });
        modalMount.querySelector("#new-partner-form").addEventListener("submit", (ev) => {
            ev.preventDefault();
            const type = typeSelect.value;
            const partner = {
                name: ev.target.querySelector("#part-name").value,
                contact: ev.target.querySelector("#part-contact").value,
                email: ev.target.querySelector("#part-email").value,
                phone: ev.target.querySelector("#part-phone").value,
                address: ev.target.querySelector("#part-address").value,
                taxId: ev.target.querySelector("#part-taxid").value || "N/A"
            };
            if (type === "Customer") {
                partner.taxRate = Number(ev.target.querySelector("#part-vat").value);
                partner.whtRate = Number(ev.target.querySelector("#part-wht").value);
            }
            store.addPartner(type, partner);
            window.showToast(`Business Partner "${partner.name}" saved as ${type}.`, "success");
            close();
            renderPartners(container);
        });
    });
}
// ─── Users & Access Management ───
function renderUsers(container) {
    const users = store.getUsers();
    const roles = store.getRoles();
    const currentUserId = store.state.currentUser;
    const refresh = () => renderUsers(container);
    container.innerHTML = `
    <div class="animate-fade-in">
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h3 class="card-title">User Accounts & Role Assignment</h3>
          <button class="btn btn-primary btn-sm" id="add-user-btn">+ Add User</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Assigned Role</th>
                <th>Companies</th>
                <th style="text-align:center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => {
        const role = roles.find(r => r.id === u.roleId);
        const isCurrent = u.id === currentUserId;
        const companies = store.getCompanies();
        const userCompanies = (u.companyIds || []).map(cid => companies.find(c => c.id === cid)).filter(Boolean);
        return `
                  <tr>
                    <td><strong>${u.name}</strong>${isCurrent ? ' <span style="color:var(--color-primary);font-size:0.75rem;">(you)</span>' : ''}</td>
                    <td>${u.username}</td>
                    <td><span class="badge badge-purple">${role ? role.name : 'No Role'}</span></td>
                    <td>${userCompanies.length > 0 ? userCompanies.map(c => `<span class="badge badge-blue" style="font-size:0.65rem;margin-right:2px;">${c.name}</span>`).join("") : '<span style="color:var(--color-muted);">—</span>'}</td>
                    <td style="text-align:center;">
                      <button class="btn btn-outline btn-xs edit-user-btn" data-userid="${u.id}">Edit</button>
                      ${!isCurrent ? `<button class="btn btn-outline btn-xs delete-user-btn" data-userid="${u.id}" style="color:var(--color-danger);margin-left:4px;">Delete</button>` : ''}
                    </td>
                  </tr>
                `;
    }).join("")}
              ${users.length === 0 ? `<tr><td colspan="5" style="text-align:center;padding:24px;">No users configured.</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Roles Summary -->
      <div class="card" style="margin-top:16px;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h3 class="card-title">Role Profiles</h3>
          <button class="btn btn-primary btn-sm" id="add-role-btn">+ Add Role</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Role Name</th>
                <th>Modules Assigned</th>
                <th>Users</th>
                <th style="text-align:center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${roles.map((r, ri) => {
        const activeModules = Object.entries(r.permissions)
            .filter(([_, p]) => p.read || p.create || p.update || p.delete || p.approve)
            .map(([mod]) => mod.toUpperCase());
        const roleUsers = users.filter(u => u.roleId === r.id);
        const modulesList = [
            { key: "o2c", name: "Sales & O2C" },
            { key: "p2p", name: "Procurement & P2P" },
            { key: "inventory", name: "Inventory & Stock" },
            { key: "accounting", name: "Finance & GL" },
            { key: "finance", name: "Treasury & Assets" },
            { key: "settings", name: "Setup & System" }
        ];
        const actions = ["read", "create", "update", "delete", "approve"];
        const actionLabels = { read: "R", create: "C", update: "U", delete: "D", approve: "A" };
        const modCheckboxes = modulesList.map(m => {
            const cbs = actions.map(a => {
                const checked = r.permissions[m.key] ? r.permissions[m.key][a] : false;
                return `<label style="cursor:pointer;font-size:0.7rem;white-space:nowrap;display:inline-flex;align-items:center;gap:1px;margin-right:4px;"><input type="checkbox" class="perm-cb-inline" data-roleid="${r.id}" data-mod="${m.key}" data-action="${a}" ${checked ? 'checked' : ''} />${actionLabels[a]}</label>`;
            }).join("");
            return `<div style="display:flex;align-items:center;padding:2px 0;"><span style="width:130px;font-size:0.75rem;flex-shrink:0;">${m.name}</span>${cbs}</div>`;
        }).join("");
        return `
                  <tr>
                    <td><strong>${r.name}</strong></td>
                    <td>${activeModules.length > 0 ? activeModules.map(m => `<span class="badge badge-blue" style="margin-right:4px;font-size:0.7rem;">${m}</span>`).join("") : '<span style="color:var(--color-muted)">None</span>'}</td>
                    <td>${roleUsers.length > 0 ? roleUsers.map(u => u.name).join(", ") : '<span style="color:var(--color-muted)">—</span>'}</td>
                    <td style="text-align:center;">
                      <button class="btn btn-outline btn-xs toggle-perms-btn" data-roleid="${r.id}">Permissions</button>
                      ${roleUsers.length === 0 ? `<button class="btn btn-outline btn-xs delete-role-btn" data-roleid="${r.id}" style="color:var(--color-danger);margin-left:4px;">Delete</button>` : ''}
                    </td>
                  </tr>
                  <tr class="perms-row-${r.id}" style="display:none;">
                    <td colspan="4" style="padding:8px 16px;background:rgba(99,102,241,0.04);">
                      <div style="font-size:0.75rem;font-weight:600;margin-bottom:6px;color:var(--color-muted);">Module Permissions — check to grant:</div>
                      ${modCheckboxes}
                      <button class="btn btn-primary btn-xs save-perms-inline-btn" data-roleid="${r.id}" style="margin-top:8px;">Save Permissions</button>
                      <span class="perms-saved-msg-${r.id}" style="margin-left:8px;font-size:0.75rem;color:var(--color-success);display:none;">Saved!</span>
                    </td>
                  </tr>
                `;
    }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- User Modal -->
    <div id="user-modal-overlay" class="modal-overlay" style="display:none;"></div>
    <!-- Role Modal -->
    <div id="role-modal-overlay" class="modal-overlay" style="display:none;"></div>
  `;
    // User Modal openers
    container.querySelector("#add-user-btn").addEventListener("click", () => openUserModal(null, refresh));
    container.querySelectorAll(".edit-user-btn").forEach(btn => {
        btn.addEventListener("click", () => openUserModal(btn.dataset.userid, refresh));
    });
    container.querySelectorAll(".delete-user-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (confirm("Delete this user?")) {
                try {
                    store.deleteUser(btn.dataset.userid);
                    window.showToast("User deleted", "success");
                    refresh();
                }
                catch (e) {
                    window.showToast(e.message, "danger");
                }
            }
        });
    });
    // Role toggle — expand/collapse inline permissions
    container.querySelector("#add-role-btn").addEventListener("click", () => openRoleModal(null, refresh));
    container.querySelectorAll(".toggle-perms-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const row = container.querySelector(`.perms-row-${btn.dataset.roleid}`);
            if (row) {
                const isOpen = row.style.display !== "none";
                row.style.display = isOpen ? "none" : "table-row";
                btn.textContent = isOpen ? "Permissions" : "Hide";
            }
        });
    });
    // Inline save permissions
    container.querySelectorAll(".save-perms-inline-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const roleId = btn.dataset.roleid;
            const newPerms = { o2c: {}, p2p: {}, inventory: {}, accounting: {}, finance: {}, settings: {} };
            const actions = ["read", "create", "update", "delete", "approve"];
            ["o2c", "p2p", "inventory", "accounting", "finance", "settings"].forEach(mod => {
                actions.forEach(a => { newPerms[mod][a] = false; });
            });
            container.querySelectorAll(`.perm-cb-inline[data-roleid="${roleId}"]`).forEach((cb) => {
                if (cb.checked)
                    newPerms[cb.dataset.mod][cb.dataset.action] = true;
            });
            try {
                store.updateRole(roleId, { permissions: newPerms });
                const msg = container.querySelector(`.perms-saved-msg-${roleId}`);
                if (msg) {
                    msg.style.display = "inline";
                    setTimeout(() => { msg.style.display = "none"; }, 1500);
                }
            }
            catch (e) {
                window.showToast(e.message, "danger");
            }
        });
    });
    container.querySelectorAll(".delete-role-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (confirm("Delete this role?")) {
                try {
                    store.deleteRole(btn.dataset.roleid);
                    window.showToast("Role deleted", "success");
                    refresh();
                }
                catch (e) {
                    window.showToast(e.message, "danger");
                }
            }
        });
    });
}
function openUserModal(userId, onClose) {
    const users = store.getUsers();
    const roles = store.getRoles();
    const companies = store.getCompanies();
    const existing = userId ? users.find(u => u.id === userId) : null;
    const userCompanyIds = existing ? (existing.companyIds || []) : [];
    const modal = document.getElementById("user-modal-overlay");
    if (!modal)
        return;
    const companyCheckboxes = companies.map(c => {
        const checked = userCompanyIds.includes(c.id);
        return `<label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;margin-right:12px;font-size:0.8rem;">
      <input type="checkbox" class="user-company-cb" value="${c.id}" ${checked ? 'checked' : ''} /> ${c.name}
    </label>`;
    }).join("");
    modal.innerHTML = `
    <div class="modal-content" style="max-width:480px;">
      <div class="modal-header">
        <h3>${existing ? 'Edit User' : 'Add User'}</h3>
        <button class="modal-close-btn" id="user-modal-close">&times;</button>
      </div>
      <form id="user-form">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" class="form-control" id="user-name" value="${existing ? existing.name : ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Username</label>
          <input type="text" class="form-control" id="user-username" value="${existing ? existing.username : ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" id="user-password" value="${existing ? existing.password : ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Assigned Role</label>
          <select class="form-control" id="user-role" required>
            <option value="">— Select Role —</option>
            ${roles.map(r => `<option value="${r.id}" ${existing && existing.roleId === r.id ? 'selected' : ''}>${r.name}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Tag to Companies</label>
          <div style="display:flex;flex-wrap:wrap;gap:4px;padding:8px;border:1px solid var(--border-color);border-radius:var(--radius-sm);">
            ${companyCheckboxes || '<span style="color:var(--color-muted);font-size:0.8rem;">No companies configured</span>'}
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-block" style="margin-top:12px;">
          ${existing ? 'Save Changes' : 'Create User'}
        </button>
      </form>
    </div>
  `;
    modal.style.display = "flex";
    modal.querySelector("#user-modal-close").addEventListener("click", () => { modal.style.display = "none"; });
    modal.addEventListener("click", (e) => { if (e.target === modal)
        modal.style.display = "none"; });
    modal.querySelector("#user-form").addEventListener("submit", (ev) => {
        ev.preventDefault();
        const name = modal.querySelector("#user-name").value.trim();
        const username = modal.querySelector("#user-username").value.trim();
        const password = modal.querySelector("#user-password").value.trim();
        const roleId = modal.querySelector("#user-role").value;
        if (!name || !username || !password || !roleId) {
            window.showToast("All fields required", "warning");
            return;
        }
        const companyIds = [];
        modal.querySelectorAll(".user-company-cb").forEach((cb) => {
            if (cb.checked)
                companyIds.push(cb.value);
        });
        try {
            if (existing) {
                store.updateUser(userId, { name, username, password, roleId, companyIds });
                window.showToast("User updated", "success");
            }
            else {
                store.addUser({ id: "usr_" + Date.now(), username, password, name, roleId, companyIds });
                window.showToast("User created", "success");
            }
            modal.style.display = "none";
            onClose();
        }
        catch (e) {
            window.showToast(e.message, "danger");
        }
    });
}
function openRoleModal(roleId, onClose) {
    const roles = store.getRoles();
    const existing = roleId ? roles.find(r => r.id === roleId) : null;
    const modal = document.getElementById("role-modal-overlay");
    if (!modal)
        return;
    const perms = existing ? existing.permissions : {
        o2c: { create: false, read: false, update: false, delete: false, approve: false },
        p2p: { create: false, read: false, update: false, delete: false, approve: false },
        inventory: { create: false, read: false, update: false, delete: false, approve: false },
        accounting: { create: false, read: false, update: false, delete: false, approve: false },
        finance: { create: false, read: false, update: false, delete: false, approve: false },
        settings: { create: false, read: false, update: false, delete: false, approve: false }
    };
    const modulesList = [
        { key: "o2c", name: "Sales & O2C" },
        { key: "p2p", name: "Procurement & P2P" },
        { key: "inventory", name: "Inventory & Stock" },
        { key: "accounting", name: "Finance & GL" },
        { key: "finance", name: "Treasury & Assets" },
        { key: "settings", name: "Setup & System" }
    ];
    const checkboxRow = (modKey, action, label) => {
        const checked = perms[modKey] ? (perms[modKey][action] || false) : false;
        return `<label style="display:inline-flex;align-items:center;gap:3px;font-size:0.75rem;cursor:pointer;">
      <input type="checkbox" data-mod="${modKey}" data-action="${action}" ${checked ? 'checked' : ''} /> ${label}
    </label>`;
    };
    modal.innerHTML = `
    <div class="modal-content" style="max-width:680px;">
      <div class="modal-header">
        <h3>${existing ? 'Edit Role: ' + existing.name : 'Create New Role'}</h3>
        <button class="modal-close-btn" id="role-modal-close">&times;</button>
      </div>
      <form id="role-form">
        <div class="form-group">
          <label class="form-label">Role Name</label>
          <input type="text" class="form-control" id="role-name" value="${existing ? existing.name : ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Module Permissions</label>
          <div class="table-container">
            <table style="font-size:0.8rem;">
              <thead>
                <tr>
                  <th>Module</th>
                  <th style="text-align:center;">Read</th>
                  <th style="text-align:center;">Create</th>
                  <th style="text-align:center;">Update</th>
                  <th style="text-align:center;">Delete</th>
                  <th style="text-align:center;">Approve</th>
                </tr>
              </thead>
              <tbody>
                ${modulesList.map(m => `
                  <tr>
                    <td>${m.name}</td>
                    <td style="text-align:center;">${checkboxRow(m.key, 'read', 'R')}</td>
                    <td style="text-align:center;">${checkboxRow(m.key, 'create', 'C')}</td>
                    <td style="text-align:center;">${checkboxRow(m.key, 'update', 'U')}</td>
                    <td style="text-align:center;">${checkboxRow(m.key, 'delete', 'D')}</td>
                    <td style="text-align:center;">${checkboxRow(m.key, 'approve', 'A')}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-block" style="margin-top:12px;">
          ${existing ? 'Save Role' : 'Create Role'}
        </button>
      </form>
    </div>
  `;
    modal.style.display = "flex";
    modal.querySelector("#role-modal-close").addEventListener("click", () => { modal.style.display = "none"; });
    modal.addEventListener("click", (e) => { if (e.target === modal)
        modal.style.display = "none"; });
    modal.querySelector("#role-form").addEventListener("submit", (ev) => {
        ev.preventDefault();
        const name = modal.querySelector("#role-name").value.trim();
        if (!name) {
            window.showToast("Role name required", "warning");
            return;
        }
        const newPerms = {};
        modulesList.forEach(m => { newPerms[m.key] = { create: false, read: false, update: false, delete: false, approve: false }; });
        modal.querySelectorAll("input[type=checkbox]").forEach((cb) => {
            if (cb.checked) {
                const mod = cb.dataset.mod;
                const action = cb.dataset.action;
                if (newPerms[mod])
                    newPerms[mod][action] = true;
            }
        });
        try {
            if (existing) {
                store.updateRole(roleId, { name, permissions: newPerms });
                window.showToast("Role updated", "success");
            }
            else {
                store.addRole({ id: "role_" + Date.now(), name, permissions: newPerms });
                window.showToast("Role created", "success");
            }
            modal.style.display = "none";
            onClose();
        }
        catch (e) {
            window.showToast(e.message, "danger");
        }
    });
}
function renderWorkflowsAndRoles(container) {
    const settings = store.getSettings();
    const reqs = settings.workflowRequirements || {};
    const roles = store.getRoles();
    container.innerHTML = `
    <div class="grid-main-side animate-fade-in">
      <!-- Workflow Configurations Switches -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Document Approval Workflow Rules</h3>
        </div>
        <form id="workflow-reqs-form">
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div class="form-group-checkbox" style="display:flex; align-items:center; gap: 10px;">
              <input type="checkbox" id="wf-soApproval" ${reqs.soApproval ? 'checked' : ''} />
              <label class="form-label" style="margin: 0; cursor: pointer; font-size:0.85rem;" for="wf-soApproval">Require Sales Order Approval (Draft ➔ Approved)</label>
            </div>
            <div class="form-group-checkbox" style="display:flex; align-items:center; gap: 10px;">
              <input type="checkbox" id="wf-dnSubmission" ${reqs.dnSubmission ? 'checked' : ''} />
              <label class="form-label" style="margin: 0; cursor: pointer; font-size:0.85rem;" for="wf-dnSubmission">Require Delivery Note Submission (Only submitted DNs deduct stock)</label>
            </div>
            <div class="form-group-checkbox" style="display:flex; align-items:center; gap: 10px;">
              <input type="checkbox" id="wf-siSubmission" ${reqs.siSubmission ? 'checked' : ''} />
              <label class="form-label" style="margin: 0; cursor: pointer; font-size:0.85rem;" for="wf-siSubmission">Require Sales Invoice Submission (Only submitted SIs post GL entries)</label>
            </div>
            <div class="form-group-checkbox" style="display:flex; align-items:center; gap: 10px;">
              <input type="checkbox" id="wf-poApproval" ${reqs.poApproval ? 'checked' : ''} />
              <label class="form-label" style="margin: 0; cursor: pointer; font-size:0.85rem;" for="wf-poApproval">Require Purchase Order Approval (Draft ➔ Approved)</label>
            </div>
            <div class="form-group-checkbox" style="display:flex; align-items:center; gap: 10px;">
              <input type="checkbox" id="wf-grnSubmission" ${reqs.grnSubmission ? 'checked' : ''} />
              <label class="form-label" style="margin: 0; cursor: pointer; font-size:0.85rem;" for="wf-grnSubmission">Require Goods Receipt Note Submission (Only submitted GRNs add stock)</label>
            </div>
            <div class="form-group-checkbox" style="display:flex; align-items:center; gap: 10px;">
              <input type="checkbox" id="wf-piSubmission" ${reqs.piSubmission ? 'checked' : ''} />
              <label class="form-label" style="margin: 0; cursor: pointer; font-size:0.85rem;" for="wf-piSubmission">Require Purchase Invoice Submission (Only submitted PIs post GL entries)</label>
            </div>
            <div class="form-group-checkbox" style="display:flex; align-items:center; gap: 10px;">
              <input type="checkbox" id="wf-paymentSubmission" ${reqs.paymentSubmission ? 'checked' : ''} />
              <label class="form-label" style="margin: 0; cursor: pointer; font-size:0.85rem;" for="wf-paymentSubmission">Require Treasury Payment Posting (Only posted payments change cash balances)</label>
            </div>
            <div class="form-group-checkbox" style="display:flex; align-items:center; gap: 10px;">
              <input type="checkbox" id="wf-journalSubmission" ${reqs.journalSubmission ? 'checked' : ''} />
              <label class="form-label" style="margin: 0; cursor: pointer; font-size:0.85rem;" for="wf-journalSubmission">Require Manual Journal Posting (Only posted journals mutate ledger)</label>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-sm" style="margin-top: 20px;">Save Workflow Rules</button>
        </form>
      </div>

      <!-- Role Profile Permissions Configurator -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Role Permissions Configuration Matrix</h3>
        </div>
        
        <div class="form-group">
          <label class="form-label">Select Role to Customize</label>
          <select id="role-select" class="form-control">
            ${roles.map(r => `<option value="${r.id}">${r.name}</option>`).join("")}
          </select>
        </div>

        <form id="role-permissions-form" style="margin-top: 20px;">
          <div class="table-container" style="margin-bottom: 20px;">
            <table>
              <thead>
                <tr>
                  <th>Module</th>
                  <th style="text-align:center;">Read</th>
                  <th style="text-align:center;">Create</th>
                  <th style="text-align:center;">Update</th>
                  <th style="text-align:center;">Delete</th>
                  <th style="text-align:center;">Approve</th>
                </tr>
              </thead>
              <tbody id="permissions-matrix-body">
                <!-- Dynamically loaded inputs -->
              </tbody>
            </table>
          </div>
          <button type="submit" class="btn btn-primary btn-sm btn-block">Save Role Permissions Matrix</button>
        </form>
      </div>
    </div>
  `;
    const roleSelect = container.querySelector("#role-select");
    const matrixBody = container.querySelector("#permissions-matrix-body");
    const modulesList = [
        { key: "o2c", name: "Sales & O2C Operations" },
        { key: "p2p", name: "Procurement & P2P Engine" },
        { key: "inventory", name: "Inventory & Stock" },
        { key: "accounting", name: "Finance & GL" },
        { key: "finance", name: "Treasury Payments / Fixed Assets" },
        { key: "settings", name: "Setup & System Configuration" }
    ];
    const loadRolePermissions = (roleId) => {
        const role = roles.find(r => r.id === roleId);
        if (!role)
            return;
        matrixBody.innerHTML = modulesList.map(m => {
            const p = role.permissions[m.key] || { read: false, create: false, update: false, delete: false, approve: false };
            return `
        <tr>
          <td><strong>${m.name}</strong></td>
          <td style="text-align:center;"><input type="checkbox" class="perm-chk" data-mod="${m.key}" data-act="read" ${p.read ? 'checked' : ''} /></td>
          <td style="text-align:center;"><input type="checkbox" class="perm-chk" data-mod="${m.key}" data-act="create" ${p.create ? 'checked' : ''} /></td>
          <td style="text-align:center;"><input type="checkbox" class="perm-chk" data-mod="${m.key}" data-act="update" ${p.update ? 'checked' : ''} /></td>
          <td style="text-align:center;"><input type="checkbox" class="perm-chk" data-mod="${m.key}" data-act="delete" ${p.delete ? 'checked' : ''} /></td>
          <td style="text-align:center;"><input type="checkbox" class="perm-chk" data-mod="${m.key}" data-act="approve" ${p.approve ? 'checked' : ''} /></td>
        </tr>
      `;
        }).join("");
    };
    roleSelect.addEventListener("change", (e) => loadRolePermissions(e.target.value));
    // Init
    loadRolePermissions(roleSelect.value);
    // Bind Workflow requirements submit
    container.querySelector("#workflow-reqs-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const reqsObj = {
            soApproval: e.target.querySelector("#wf-soApproval").checked,
            dnSubmission: e.target.querySelector("#wf-dnSubmission").checked,
            siSubmission: e.target.querySelector("#wf-siSubmission").checked,
            poApproval: e.target.querySelector("#wf-poApproval").checked,
            grnSubmission: e.target.querySelector("#wf-grnSubmission").checked,
            piSubmission: e.target.querySelector("#wf-piSubmission").checked,
            paymentSubmission: e.target.querySelector("#wf-paymentSubmission").checked,
            journalSubmission: e.target.querySelector("#wf-journalSubmission").checked
        };
        try {
            store.updateWorkflowRequirements(reqsObj);
            window.showToast("Global document workflow approval rules updated successfully.", "success");
        }
        catch (err) {
            window.showToast(err.message, "danger");
        }
    });
    // Bind Permissions Matrix submit
    container.querySelector("#role-permissions-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const roleId = roleSelect.value;
        const permissions = {};
        modulesList.forEach(m => {
            permissions[m.key] = {
                read: false,
                create: false,
                update: false,
                delete: false,
                approve: false
            };
        });
        e.target.querySelectorAll(".perm-chk").forEach(chk => {
            const mod = chk.getAttribute("data-mod");
            const act = chk.getAttribute("data-act");
            permissions[mod][act] = chk.checked;
        });
        try {
            store.updateRolePermissions(roleId, permissions);
            window.showToast(`Permissions matrix for "${roles.find(r => r.id === roleId).name}" updated successfully.`, "success");
            // Update sidebar Mega Menu in case active role permissions changed
            window.dispatchEvent(new CustomEvent("erp-state-updated"));
        }
        catch (err) {
            window.showToast(err.message, "danger");
        }
    });
}
//# sourceMappingURL=settings.js.map