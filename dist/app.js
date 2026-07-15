// JMIT ERP - Application Orchestrator, Multi-Page Router & Security Guard (Phase 3)
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
    accordions.forEach((acc) => {
        const trigger = acc.querySelector(".accordion-trigger");
        trigger.addEventListener("click", (e) => {
            e.preventDefault();
            // Only toggle if not disabled by RBAC
            if (acc.style.pointerEvents === "none")
                return;
            const isOpen = acc.classList.contains("open");
            // Close other accordions
            accordions.forEach(other => other.classList.remove("open"));
            if (!isOpen) {
                acc.classList.add("open");
            }
        });
    });
}
// Visually dim and disable unauthorized sidebar options
function filterSidebarMenuItems() {
    const items = document.querySelectorAll(".sidebar-nav a, .sidebar-nav button.accordion-trigger, .sidebar-nav .menu-section");
    items.forEach((el) => {
        let module = "";
        // Determine the target module to evaluate
        const route = el.getAttribute("data-route") || el.getAttribute("href")?.replace("#", "");
        if (route) {
            const parts = route.split("/");
            if (parts[0] === "o2c")
                module = "o2c";
            else if (parts[0] === "p2p")
                module = "p2p";
            else if (parts[0] === "inventory")
                module = "inventory";
            else if (parts[0] === "accounting")
                module = "accounting";
            else if (parts[0] === "finance")
                module = "finance";
            else if (parts[0] === "reports")
                module = "accounting";
            else if (parts[0] === "settings")
                module = "settings";
        }
        else {
            const trigger = el.querySelector(".accordion-trigger");
            const span = el.querySelector("span") || (trigger && trigger.querySelector("span"));
            if (span) {
                const text = span.textContent.toLowerCase();
                if (text.includes("sales") || text.includes("o2c"))
                    module = "o2c";
                else if (text.includes("purch") || text.includes("p2p"))
                    module = "p2p";
                else if (text.includes("invent") || text.includes("stock"))
                    module = "inventory";
                else if (text.includes("finance") || text.includes("gl") || text.includes("accounting"))
                    module = "accounting";
                else if (text.includes("reports") || text.includes("analyt"))
                    module = "accounting";
                else if (text.includes("setup") || text.includes("system") || text.includes("config"))
                    module = "settings";
            }
        }
        if (module && !store.checkPermission(module, "read")) {
            el.style.opacity = "0.35";
            el.style.pointerEvents = "none";
            el.style.cursor = "not-allowed";
            if (el.classList.contains("accordion")) {
                el.classList.remove("open");
            }
        }
        else {
            el.style.opacity = "";
            el.style.pointerEvents = "";
            el.style.cursor = "";
        }
    });
}
// Update Active Menu state based on hash route
function syncMegaMenuSelection(hash) {
    const allLinks = sidebarNav.querySelectorAll("a");
    allLinks.forEach(link => link.classList.remove("active"));
    const singleItem = sidebarNav.querySelector(`.nav-item[data-tab="${hash}"]`);
    if (singleItem) {
        singleItem.classList.add("active");
        document.querySelectorAll(".accordion").forEach(acc => acc.classList.remove("open"));
        return;
    }
    const matchingSubItem = sidebarNav.querySelector(`.sub-item[data-route="${hash}"]`);
    if (matchingSubItem) {
        matchingSubItem.classList.add("active");
        const parentAccordion = matchingSubItem.closest(".accordion");
        if (parentAccordion) {
            parentAccordion.classList.add("open");
        }
        return;
    }
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
// Routing engine parsing nested path arrays: [module, page, action, id] with Security Guards
function router() {
    const hash = window.location.hash.replace("#", "") || "dashboard";
    const pathParts = hash.split("/");
    const primaryModule = pathParts[0];
    syncMegaMenuSelection(hash);
    // Security Clearance Check
    let permissionModule = null;
    if (primaryModule === "o2c")
        permissionModule = "o2c";
    else if (primaryModule === "p2p")
        permissionModule = "p2p";
    else if (primaryModule === "inventory")
        permissionModule = "inventory";
    else if (primaryModule === "accounting")
        permissionModule = "accounting";
    else if (primaryModule === "finance")
        permissionModule = "finance";
    else if (primaryModule === "reports")
        permissionModule = "accounting";
    else if (primaryModule === "settings")
        permissionModule = "settings";
    if (permissionModule && !store.checkPermission(permissionModule, "read")) {
        appViewport.innerHTML = `
      <div style="padding: 60px 40px; text-align: center; max-width: 580px; margin: 40px auto; background-color: var(--card-bg); border-radius: var(--radius-md); border: 1px solid var(--color-danger); box-shadow: var(--shadow-lg);" class="animate-fade-in">
        <div style="font-size: 3rem; margin-bottom: 20px;">🛡️</div>
        <h3 style="color: var(--color-danger); font-size: 1.4rem; margin-bottom: 12px; font-weight:700;">Security Access Restricted</h3>
        <p class="text-secondary" style="font-size: 0.9rem; line-height: 1.5; margin-bottom: 16px;">
          Your current active profile (<strong>${store.getCurrentRole().name}</strong>) does not have read permissions to access the <strong>${primaryModule.toUpperCase()}</strong> module.
        </p>
        <p class="text-muted" style="font-size: 0.8rem; border-top: 1px solid var(--border-color); padding-top:14px;">
          Clearance Level: <strong>READ</strong> required. Switch your user profile in the top nav dropdown switcher to gain access.
        </p>
        <button onclick="window.location.hash='#dashboard'" class="btn btn-outline" style="margin-top: 24px; border-color: var(--color-danger); color: var(--color-danger);">Return to Dashboard</button>
      </div>
    `;
        pageTitleEl.textContent = "Security clearance restricted";
        return;
    }
    if (MODULES[primaryModule]) {
        try {
            let title = primaryModule.toUpperCase();
            if (primaryModule === "o2c")
                title = "Sales & O2C Operations";
            else if (primaryModule === "p2p")
                title = "Procurement & P2P Engine";
            else if (primaryModule === "inventory")
                title = "Inventory & Stock Warehouses";
            else if (primaryModule === "accounting")
                title = "Accounting & Double-Entry Ledger";
            else if (primaryModule === "finance")
                title = "Treasury Cash & Fixed Assets";
            else if (primaryModule === "reports")
                title = "Financial Analysis & Reports";
            else if (primaryModule === "settings")
                title = "ERP Mappings & Role Settings";
            else if (primaryModule === "dashboard")
                title = "Executive ERP Dashboard";
            pageTitleEl.textContent = title;
            MODULES[primaryModule](appViewport, pathParts);
        }
        catch (err) {
            appViewport.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--color-danger);">
          <h3>Failed to load dynamic view</h3>
          <p>${err.message}</p>
          <button onclick="window.location.hash='#dashboard'" class="btn btn-outline" style="margin-top: 14px;">Return Home</button>
        </div>
      `;
        }
    }
    else {
        window.location.hash = "#dashboard";
    }
}
// Header metrics sync
function updateHeaderKPIs() {
    const activeCompany = store.getActiveCompany();
    headerCompanyEl.textContent = activeCompany ? activeCompany.name : "No Company";
    const cashAcct = store.getAccount(store.getSettings().glMappings.cashAccount);
    const cashVal = cashAcct ? cashAcct.balance : 0;
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
// Setup topbar user role switcher
function initUserSwitcher() {
    const switcher = document.getElementById("user-role-switcher");
    const avatar = document.getElementById("topbar-user-avatar");
    if (!switcher)
        return;
    switcher.value = store.state.currentUser;
    const syncAvatar = () => {
        const user = store.getCurrentUser();
        if (avatar) {
            avatar.textContent = user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
        }
    };
    syncAvatar();
    switcher.addEventListener("change", (e) => {
        store.setCurrentUser(e.target.value);
        window.showToast(`User session switched to: ${store.getCurrentUser().name}`, "info");
        syncAvatar();
        // Trigger layout filter & route guard refresh
        filterSidebarMenuItems();
        router();
        updateHeaderKPIs();
    });
}
// Global alert popup toast
window.showToast = function (message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    let iconSvg = "";
    if (type === "success") {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    }
    else if (type === "warning") {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    }
    else if (type === "danger") {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    }
    else {
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
    filterSidebarMenuItems();
    const activeOverlay = document.querySelector(".modal-overlay");
    if (!activeOverlay) {
        router();
    }
});
// Initialization
document.addEventListener("DOMContentLoaded", () => {
    initMegaMenuUI();
    initUserSwitcher();
    filterSidebarMenuItems();
    updateHeaderKPIs();
    window.addEventListener("hashchange", router);
    router();
    setTimeout(() => {
        window.showToast("JMIT ERP system initialized. Permissions guards active.", "success");
    }, 3000);
});
export { router };
//# sourceMappingURL=app.js.map