// JMIT ERP - Chart of Accounts Tree & Journal Ledger View Module (Phase 2)
import { store } from "../store";
import { renderFinance } from "./finance";

export function renderAccounting(container, pathParts) {
  const subRoute = pathParts[1] || "coa";
  const action = pathParts[2];

  if (subRoute === "payments" || subRoute === "fixed-assets") {
    renderFinance(container, pathParts);
    return;
  }

  const html = `
    <div class="accounting-container animate-fade-in">
      <!-- Sub Tab Nav -->
      <div class="settings-tab-nav">
        <button class="settings-tab-btn ${subRoute === 'coa' ? 'active' : ''}" onclick="window.location.hash='#accounting/coa'">
          🌳 Chart of Accounts Tree
        </button>
        <button class="settings-tab-btn ${subRoute === 'journal' ? 'active' : ''}" onclick="window.location.hash='#accounting/journal'">
          📖 General Journals Book
        </button>
        <button class="settings-tab-btn ${subRoute === 'payments' ? 'active' : ''}" onclick="window.location.hash='#accounting/payments'">
          💳 Payments Entry
        </button>
        <button class="settings-tab-btn ${subRoute === 'fixed-assets' ? 'active' : ''}" onclick="window.location.hash='#accounting/fixed-assets'">
          🏢 Fixed Assets
        </button>
      </div>

      <div id="accounting-content-viewport"></div>
    </div>
  `;

  container.innerHTML = html;
  const viewport = container.querySelector("#accounting-content-viewport");

  if (subRoute === "coa") {
    renderCOATree(viewport);
  } else if (subRoute === "journal") {
    if (action === "new") {
      renderJournalEntryForm(viewport);
    } else {
      renderJournalEntriesList(viewport);
    }
  }
}

// --- 1. CHART OF ACCOUNTS RECURSIVE TREE VIEW ---

function renderCOATree(container) {
  const accounts = store.getAccounts();

  // Recursive account tree compiler
  const buildTreeHtml = (parentCode) => {
    const children = accounts.filter(a => a.parentCode === parentCode);
    if (children.length === 0) return "";

    return `
      <div class="tree-children">
        ${children.map(acct => {
          const hasChildren = accounts.some(a => a.parentCode === acct.code);
          const expander = hasChildren ? `<span class="tree-node-expander">▼</span>` : `<span style="display:inline-block; width:16px;"></span>`;
          
          let typeColor = "";
          if (acct.type === "Asset") typeColor = "var(--color-secondary)";
          else if (acct.type === "Liability") typeColor = "var(--color-p2p)";
          else if (acct.type === "Equity") typeColor = "var(--color-primary)";
          else if (acct.type === "Revenue") typeColor = "var(--color-o2c)";
          else typeColor = "var(--color-danger)";

          return `
            <div class="tree-node" data-code="${acct.code}">
              <div class="tree-node-content ${hasChildren ? 'parent' : ''}">
                <div>
                  ${expander}
                  <span style="font-family: monospace; font-size: 0.8rem; font-weight: 700; color: ${typeColor}; background-color: rgba(255,255,255,0.02); padding: 1px 5px; border-radius: 3px; margin-right: 6px;">${acct.code}</span>
                  <strong style="font-size:0.85rem; color:var(--text-primary);">${acct.name}</strong>
                  <span style="font-size:0.7rem; color:var(--text-muted); margin-left: 10px;">(${acct.type})</span>
                </div>
                <div style="font-weight: 700; font-size: 0.9rem;">
                  $${acct.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              ${buildTreeHtml(acct.code)}
            </div>
          `;
        }).join("")}
      </div>
    `;
  };

  // Render Root level nodes (parentCode is null)
  const canCreateAcct = store.checkPermission("accounting", "create");

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">Corporate Accounts Directory Tree</h3>
        ${canCreateAcct ? `<button id="add-gl-btn" class="btn btn-primary btn-sm">+ Add GL Account</button>` : ''}
      </div>

      <div class="coa-tree-wrapper" style="max-height: 580px; overflow-y: auto; padding: 10px 0;">
        ${buildTreeHtml(null)}
      </div>
    </div>

    <!-- Create GL account Modal mount -->
    <div id="coa-modal-mount"></div>
  `;

  // Collapsible toggle nodes listeners
  container.querySelectorAll(".tree-node-content.parent").forEach(nodeContent => {
    nodeContent.addEventListener("click", (e) => {
      // Ignore click on actions button if added later
      if (e.target.closest("button")) return;
      const node = nodeContent.closest(".tree-node");
      node.classList.toggle("tree-node-collapsed");
    });
  });

  // Add GL Account Wizard
  const modalMount = container.querySelector("#coa-modal-mount");
  const addGlBtn = container.querySelector("#add-gl-btn");
  if (addGlBtn) {
    addGlBtn.addEventListener("click", () => {
    // Parent Account list (any account can potentially act as a parent)
    let parentOptions = accounts.map(a => `<option value="${a.code}">${a.code} - ${a.name} (${a.type})</option>`).join("");

    modalMount.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Create General Ledger (GL) Account</h3>
            <button class="modal-close">&times;</button>
          </div>
          <form id="new-gl-form">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">New Account Code</label>
                  <input type="text" id="gl-code" class="form-control" placeholder="1020" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Account Type</label>
                  <select id="gl-type" class="form-control" required>
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Account Name Description</label>
                <input type="text" id="gl-name" class="form-control" placeholder="Savings Account Bank" required />
              </div>
              <div class="form-group">
                <label class="form-label">Parent Account Node (Optional)</label>
                <select id="gl-parent" class="form-control">
                  <option value="">No Parent (Root Category)</option>
                  ${parentOptions}
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Account</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const close = () => modalMount.innerHTML = "";
    modalMount.querySelector(".modal-close").addEventListener("click", close);
    modalMount.querySelector(".modal-cancel").addEventListener("click", close);

    modalMount.querySelector("#new-gl-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const code = ev.target.querySelector("#gl-code").value;
      const name = ev.target.querySelector("#gl-name").value;
      const type = ev.target.querySelector("#gl-type").value;
      const parentCode = ev.target.querySelector("#gl-parent").value || null;

      try {
        store.addGLAccount({ code, name, type, parentCode });
        window.showToast(`Account ${code} successfully registered in Chart of Accounts Tree.`, "success");
        close();
        renderCOATree(container);
      } catch (err) {
        window.showToast(err.message, "danger");
      }
    });
  });
  } // end if (addGlBtn)
}

// --- 2. GENERAL JOURNAL ENTRIES REGISTER ---

function renderJournalEntriesList(container) {
  const journalEntries = [...store.getJournalEntries()].reverse();
  const canCreateJe = store.checkPermission("accounting", "create");

  container.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h3 class="card-title">General Journal Book</h3>
        ${canCreateJe ? `<button onclick="window.location.hash='#accounting/journal/new'" class="btn btn-primary btn-sm" style="background-color: var(--color-primary);">+ Manual Journal Entry</button>` : ''}
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Entry ID</th>
              <th>Date</th>
              <th>Reference Details</th>
              <th>Debits Sum</th>
              <th>Credits Sum</th>
              <th>Account Splits Breakdown</th>
            </tr>
          </thead>
          <tbody>
            ${journalEntries.map(je => {
              const totalDebits = je.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
              
              const splitsHtml = je.lines.map(l => {
                const acct = store.getAccount(l.code);
                const name = acct ? acct.name : l.code;
                if (l.debit > 0) {
                  return `<div style="padding: 2px 0;">Dr. ${name} (${l.code}): <strong>$${l.debit.toFixed(2)}</strong></div>`;
                } else {
                  return `<div style="padding: 2px 0; padding-left: 20px;">Cr. ${name} (${l.code}): <strong>$${l.credit.toFixed(2)}</strong></div>`;
                }
              }).join("");

              return `
                <tr>
                  <td style="font-family: monospace; font-weight: 700; color: var(--color-primary); vertical-align: top;">${je.id}</td>
                  <td style="vertical-align: top;">${je.date}</td>
                  <td style="vertical-align: top;">
                    <strong style="color: var(--text-primary);">${je.reference}</strong>
                  </td>
                  <td style="font-weight: 600; color: var(--text-primary); vertical-align: top;">$${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style="font-weight: 600; color: var(--text-primary); vertical-align: top;">$${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <div style="font-size: 0.8rem; background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); color: var(--text-secondary); max-width: 380px; white-space: normal;">
                      ${splitsHtml}
                    </div>
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

function renderJournalEntryForm(container) {
  const accounts = store.getAccounts().filter(a => a.parentCode !== null);
  const accountOptions = accounts.map(a => `<option value="${a.code}">${a.code} - ${a.name} (${a.type})</option>`).join("");

  container.innerHTML = `
    <div class="card animate-fade-in" style="max-width: 750px; margin: 0 auto;">
      <div class="card-header">
        <h3 class="card-title">New General Journal Entry</h3>
        <button onclick="window.location.hash='#accounting/journal'" class="btn btn-outline btn-sm">Cancel</button>
      </div>

      <form id="new-journal-form">
        <div class="form-group">
          <label class="form-label">Journal Description / Reference</label>
          <input type="text" id="je-reference" class="form-control" placeholder="Adjustment entry description" required />
        </div>

        <div style="margin-top: 20px;">
          <h4 style="font-size: 0.85rem; text-transform: uppercase; margin-bottom: 10px;">Itemized Double-Entry Splits</h4>
          <table class="order-items-table">
            <thead>
              <tr>
                <th style="width: 50%;">General Ledger Account</th>
                <th style="width: 22%;">Debit ($)</th>
                <th style="width: 22%;">Credit ($)</th>
                <th style="width: 6%;"></th>
              </tr>
            </thead>
            <tbody id="je-lines-body">
              <!-- Dynamically populated splits -->
            </tbody>
          </table>
          <button type="button" id="je-add-line" class="btn btn-outline btn-sm">+ Add Split Line</button>
        </div>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div id="je-balance-warning" class="text-danger" style="font-size: 0.85rem; font-weight: 600;">
            Unbalanced: Difference $0.00
          </div>
          <div style="text-align: right; font-size: 0.9rem; color: var(--text-secondary);">
            <div>Debits Sum: <strong id="je-total-debit">$0.00</strong></div>
            <div>Credits Sum: <strong id="je-total-credit">$0.00</strong></div>
          </div>
        </div>

        <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" onclick="window.location.hash='#accounting/journal'" class="btn btn-outline">Cancel</button>
          <button type="submit" id="je-submit-btn" class="btn btn-primary" disabled>Post Journal Entry</button>
        </div>
      </form>
    </div>
  `;

  const form = container.querySelector("#new-journal-form");
  const linesBody = container.querySelector("#je-lines-body");
  const addLineBtn = container.querySelector("#je-add-line");
  const warningLabel = container.querySelector("#je-balance-warning");
  const submitBtn = container.querySelector("#je-submit-btn");

  const updateBalances = () => {
    let totalDebits = 0;
    let totalCredits = 0;

    linesBody.querySelectorAll(".je-line-row").forEach(row => {
      const debitVal = parseFloat(row.querySelector(".je-debit").value) || 0;
      const creditVal = parseFloat(row.querySelector(".je-credit").value) || 0;
      totalDebits += debitVal;
      totalCredits += creditVal;
    });

    container.querySelector("#je-total-debit").textContent = `$${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    container.querySelector("#je-total-credit").textContent = `$${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    const diff = Math.abs(totalDebits - totalCredits);
    if (diff < 0.01 && totalDebits > 0) {
      warningLabel.className = "text-success";
      warningLabel.textContent = "Journal entry balanced. Ready to post.";
      submitBtn.disabled = false;
    } else {
      warningLabel.className = "text-danger";
      warningLabel.textContent = `Unbalanced: Difference $${diff.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      submitBtn.disabled = true;
    }
  };

  const addLine = () => {
    const tr = document.createElement("tr");
    tr.className = "je-line-row";
    tr.innerHTML = `
      <td>
        <select class="form-control je-code" required>
          <option value="" disabled selected>Select account...</option>
          ${accountOptions}
        </select>
      </td>
      <td>
        <input type="number" class="form-control je-debit" min="0" step="0.01" placeholder="0.00" />
      </td>
      <td>
        <input type="number" class="form-control je-credit" min="0" step="0.01" placeholder="0.00" />
      </td>
      <td>
        <button type="button" class="btn btn-outline btn-sm je-remove" style="color: var(--color-danger); border-color: transparent;">&times;</button>
      </td>
    `;

    linesBody.appendChild(tr);

    const debitInp = tr.querySelector(".je-debit");
    const creditInp = tr.querySelector(".je-credit");
    const removeBtn = tr.querySelector(".je-remove");
    const codeSel = tr.querySelector(".je-code");

    debitInp.addEventListener("input", () => {
      if (parseFloat(debitInp.value) > 0) creditInp.value = "";
      updateBalances();
    });
    creditInp.addEventListener("input", () => {
      if (parseFloat(creditInp.value) > 0) debitInp.value = "";
      updateBalances();
    });
    codeSel.addEventListener("change", updateBalances);
    removeBtn.addEventListener("click", () => { tr.remove(); updateBalances(); });

    updateBalances();
  };

  addLineBtn.addEventListener("click", addLine);
  
  // Seed initial 2 lines
  addLine();
  addLine();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const lines = [];
    form.querySelectorAll(".je-line-row").forEach(row => {
      const code = row.querySelector(".je-code").value;
      const debit = parseFloat(row.querySelector(".je-debit").value) || 0;
      const credit = parseFloat(row.querySelector(".je-credit").value) || 0;
      if (code && (debit > 0 || credit > 0)) {
        lines.push({ code, debit, credit });
      }
    });

    if (lines.length < 2) {
      window.showToast("At least two accounts splits are required to save journal entries.", "warning");
      return;
    }

    try {
      const reference = form.querySelector("#je-reference").value;
      store.addManualJournalEntry(reference, lines);
      window.showToast("Journal entry successfully saved and posted to Chart of Accounts balances.", "success");
      window.location.hash = "#accounting/journal";
    } catch (err) {
      window.showToast(err.message, "danger");
    }
  });
}
