// JMIT ERP - Application Orchestrator & Multi-Page Router (Phase 2)
import { store } from "./store.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderO2C } from "./views/o2c.js";
import { renderP2P } from "./views/p2p.js";
import { renderInventory } from "./views/inventory.js";
import { renderAccounting } from "./views/accounting.js";
import { renderFinance } from "./views/finance.js";
import { renderReports } from "./views/reports.js";
import { renderSettings } from "./views/settings.js";

// Global Module View Mappings
const MODULES = {
  dashboard: renderDashboard,
  o2c: renderO2C,
  p2p: renderP2P,
  inventory: renderInventory,
  accounting: renderAccounting,
  finance: renderFinance,
  reports: renderReports,
  settings: renderSettings
};

// Global DOM Elements
const appViewport = document.getElementById("app-viewport");
const pageTitleEl = document.getElementById("current-page-title");
const headerCompanyEl = document.getElementById("header-company-name");
const headerCashEl = document.getElementById("header-cash-value");
const headerStockEl = document.getElementById("header-stock-value");
const toastContainer = document.getElementById("toast-container");
const resetDbBtn = document.getElementById("reset-db-btn");
const sidebarNav = document.querySelector(".sidebar-nav");

// Accordion toggle logic for Mega Menu
function initMegaMenuUI() {
  const accordions = document.querySelectorAll(".accordion");
  
  accordions.forEach(acc => {
    const trigger = acc.querySelector(".accordion-trigger");
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = acc.classList.contains("open");
      
      // Close other accordions
      accordions.forEach(other => other.classList.remove("open"));
      
      if (!isOpen) {
        acc.classList.add("open");
      }
    });
  });
}

// Update Active Menu state based on hash route
function syncMegaMenuSelection(hash) {
  // Reset all active classes
  const allLinks = sidebarNav.querySelectorAll("a");
  allLinks.forEach(link => link.classList.remove("active"));

  // Check if it's a single item (like Dashboard)
  const singleItem = sidebarNav.querySelector(`.nav-item[data-tab="${hash}"]`);
  if (singleItem) {
    singleItem.classList.add("active");
    // Close all accordions
    document.querySelectorAll(".accordion").forEach(acc => acc.classList.remove("open"));
    return;
  }

  // Find matching sub-item by sub-route matching
  const matchingSubItem = sidebarNav.querySelector(`.sub-item[data-route="${hash}"]`);
  if (matchingSubItem) {
    matchingSubItem.classList.add("active");
    // Open parent accordion container
    const parentAccordion = matchingSubItem.closest(".accordion");
    if (parentAccordion) {
      parentAccordion.classList.add("open");
    }
    return;
  }

  // Fallback: match by prefix (e.g. o2c/sales-orders/new should highlight o2c/sales-orders)
  const segments = hash.split("/");
  if (segments.length >= 2) {
    const fallbackRoute = `${segments[0]}/${segments[1]}`;
    const fallbackSubItem = sidebarNav.querySelector(`.sub-item[data-route="${fallbackRoute}"]`);
    if (fallbackSubItem) {
      fallbackSubItem.classList.add("active");
      const parentAccordion = fallbackSubItem.closest(".accordion");
      if (parentAccordion) {
        parentAccordion.classList.add("open");
      }
    }
  }
}

// Routing engine parsing nested path arrays: [module, page, action, id]
function router() {
  const hash = window.location.hash.replace("#", "") || "dashboard";
  const pathParts = hash.split("/");
  const primaryModule = pathParts[0];

  syncMegaMenuSelection(hash);

  if (MODULES[primaryModule]) {
    try {
      // Set title context
      let title = primaryModule.toUpperCase();
      if (primaryModule === "o2c") title = "Sales (O2C) Management";
      else if (primaryModule === "p2p") title = "Purchasing (P2P) Management";
      else if (primaryModule === "inventory") title = "Warehouse & Inventory";
      else if (primaryModule === "accounting") title = "Finance & General Ledger";
      else if (primaryModule === "reports") title = "Financial Reporting Center";
      else if (primaryModule === "settings") title = "ERP Configuration Panel";
      else if (primaryModule === "dashboard") title = "Executive ERP Dashboard";
      
      pageTitleEl.textContent = title;

      // Render view, passing the parsed nested path variables
      MODULES[primaryModule](appViewport, pathParts);
    } catch (err) {
      appViewport.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--color-danger);">
          <h3>Failed to Load Route View</h3>
          <p>${err.message}</p>
          <button onclick="window.location.hash='#dashboard'" class="btn btn-outline" style="margin-top: 14px;">Return Home</button>
        </div>
      `;
    }
  } else {
    window.location.hash = "#dashboard";
  }
}

// Header metrics sync
function updateHeaderKPIs() {
  const activeCompany = store.getActiveCompany();
  headerCompanyEl.textContent = activeCompany ? activeCompany.name : "No Company";

  const cashAcct = store.getAccount(store.getSettings().glMappings.cashAccount);
  const cashVal = cashAcct ? cashAcct.balance : 0;
  
  // Dynamic header currency display
  const currencySymbol = activeCompany && activeCompany.currency === "PHP" ? "₱" : "$";
  const displayCash = activeCompany && activeCompany.currency === "PHP" 
    ? (cashVal * store.getSettings().exchangeRates.PHP) 
    : cashVal;

  headerCashEl.textContent = `${currencySymbol}${displayCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const totalStock = store.getItems().reduce((sum, item) => {
    const warehouseStocks = Object.values(item.stocks || {});
    return sum + warehouseStocks.reduce((s, qty) => s + qty, 0);
  }, 0);
  headerStockEl.textContent = `${totalStock.toLocaleString('en-US')} units`;
}

// Global alert popup toast
window.showToast = function(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let iconSvg = "";
  if (type === "success") {
    iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
  } else if (type === "warning") {
    iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else if (type === "danger") {
    iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <div style="flex-grow: 1;">${message}</div>
  `;
  
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1) reverse";
    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 4000);
};

// Database Reset Event
resetDbBtn.addEventListener("click", () => {
  if (confirm("Reset the ERP database to initial values? All transactions, warehouses, companies, and settings will be restored to defaults.")) {
    store.resetDatabase();
    window.showToast("Database restored to default seeds.", "info");
    setTimeout(() => {
      window.location.reload();
    }, 600);
  }
});

// React to global state update events
window.addEventListener("erp-state-updated", () => {
  updateHeaderKPIs();
  // Safe routing updates if no overlay modals are active
  const activeOverlay = document.querySelector(".modal-overlay");
  if (!activeOverlay) {
    router();
  }
});

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  initMegaMenuUI();
  updateHeaderKPIs();
  
  // Start router
  window.addEventListener("hashchange", router);
  router();
  
  setTimeout(() => {
    window.showToast("JMIT ERP system initialized. Mega Menu & full-page document chains ready.", "success");
  }, 3000); // Wait after app loads
});
export { router };
