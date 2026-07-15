// JMIT ERP - Application Orchestrator, Multi-Page Router & Security Guard (Mega Menu Edition)
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
const megaNav = document.getElementById("mega-nav");
// =================================================================
// MEGA MENU LOGIC
// =================================================================
let openPanel = null;
// Toggle a mega menu dropdown panel
function toggleMegaPanel(panel) {
    const item = panel.closest(".mega-item");
    if (!item)
        return;
    const isOpen = item.classList.contains("open");
    // Close any currently open panel
    if (openPanel && openPanel !== item) {
        openPanel.classList.remove("open");
    }
    if (isOpen) {
        item.classList.remove("open");
        openPanel = null;
    }
    else {
        item.classList.add("open");
        openPanel = item;
    }
}
// Close all mega panels
function closeAllMegaPanels() {
    megaNav.querySelectorAll(".mega-item.open").forEach(item => item.classList.remove("open"));
    openPanel = null;
}
// Init mega menu event listeners
function initMegaMenuUI() {
    // Trigger clicks on mega-trigger buttons
    megaNav.querySelectorAll(".mega-trigger").forEach((trigger) => {
        trigger.addEventListener("click", (e) => {
            const item = trigger.closest(".mega-item");
            const panel = item?.querySelector(".mega-panel");
            // If it's a dashboard link (no panel), just navigate
            if (!panel) {
                closeAllMegaPanels();
                return; // regular <a> href handles navigation
            }
            // If the item is locked by RBAC, do nothing
            if (item.style.pointerEvents === "none")
                return;
            e.preventDefault();
            toggleMegaPanel(panel);
        });
    });
    // Close panels when clicking outside
    document.addEventListener("click", (e) => {
        const target = e.target;
        if (!target.closest(".mega-nav")) {
            closeAllMegaPanels();
        }
    });
    // Close panels on Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape")
            closeAllMegaPanels();
    });
    // Close panels when clicking a mega-link (navigate + close)
    megaNav.querySelectorAll(".mega-link").forEach((link) => {
        link.addEventListener("click", () => {
            // Let the hash change propagate, then close
            setTimeout(closeAllMegaPanels, 50);
        });
    });
}
// RBAC: Dim/lock unauthorized menu items
function filterSidebarMenuItems() {
    // Mega triggers and their parent items
    megaNav.querySelectorAll(".mega-item").forEach((item) => {
        // Determine module from data-panel attribute on the trigger
        const trigger = item.querySelector(".mega-trigger");
        if (!trigger)
            return;
        const panelName = trigger.getAttribute("data-panel");
        const href = trigger.getAttribute("href")?.replace("#", "");
        let module = "";
        if (panelName) {
            if (panelName === "o2c")
                module = "o2c";
            else if (panelName === "p2p")
                module = "p2p";
            else if (panelName === "inventory")
                module = "inventory";
            else if (panelName === "finance")
                module = "accounting";
            else if (panelName === "settings")
                module = "settings";
        }
        if (module && !store.checkPermission(module, "read")) {
            item.style.opacity = "0.35";
            item.style.pointerEvents = "none";
            item.style.cursor = "not-allowed";
            item.classList.remove("open");
        }
        else {
            item.style.opacity = "";
            item.style.pointerEvents = "";
            item.style.cursor = "";
        }
    });
}
// Sync active/highlight state based on current hash
function syncMegaMenuSelection(hash) {
    // Clear all active states
    megaNav.querySelectorAll(".mega-trigger.active, .mega-link.active").forEach(el => el.classList.remove("active"));
    // Check top-level triggers (dashboard is a direct link)
    const dashTrigger = megaNav.querySelector(`.mega-trigger[data-route="dashboard"]`);
    if (hash === "dashboard" && dashTrigger) {
        dashTrigger.classList.add("active");
        return;
    }
    // Check mega links for exact match
    const matchingLink = megaNav.querySelector(`.mega-link[data-route="${hash}"]`);
    if (matchingLink) {
        matchingLink.classList.add("active");
        // Also highlight the parent trigger
        const parentItem = matchingLink.closest(".mega-item");
        if (parentItem) {
            const trigger = parentItem.querySelector(".mega-trigger");
            if (trigger)
                trigger.classList.add("active");
        }
        return;
    }
    // Fallback: match on first segment (e.g., "o2c/sales-orders" -> highlight o2c panel trigger)
    const segments = hash.split("/");
    if (segments.length >= 1) {
        const panelTrigger = megaNav.querySelector(`.mega-trigger[data-panel="${segments[0]}"]`);
        if (panelTrigger)
            panelTrigger.classList.add("active");
    }
}
// =================================================================
// LOGIN / LOGOUT
// =================================================================
function showLogin() {
    const overlay = document.getElementById("login-overlay");
    overlay.style.display = "flex";
    const app = document.querySelector(".app-container");
    if (app)
        app.style.display = "none";
}
function initLogin() {
    const form = document.getElementById("login-form");
    if (!form)
        return;
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("login-username").value.trim();
        const password = document.getElementById("login-password").value;
        const errEl = document.getElementById("login-error");
        try {
            store.login(username, password);
            errEl.style.display = "none";
            window.location.hash = "#dashboard";
            router();
        }
        catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = "block";
        }
    });
    document.getElementById("login-password").addEventListener("keydown", (e) => {
        if (e.key === "Enter")
            form.dispatchEvent(new Event("submit"));
    });
}
// Logout button (already in header HTML, just wire it)
function initLogoutButton() {
    const btn = document.getElementById("logout-btn");
    if (!btn)
        return;
    btn.addEventListener("click", () => {
        if (confirm("Are you sure you want to logout?")) {
            store.logout();
            window.location.hash = "";
            showLogin();
        }
    });
}
// =================================================================
// ROUTING ENGINE
// =================================================================
function router() {
    // Login gate
    if (!store.isLoggedIn()) {
        showLogin();
        return;
    }
    document.getElementById("login-overlay").style.display = "none";
    document.querySelector(".app-container").style.display = "flex";
    const hash = window.location.hash.replace("#", "") || "dashboard";
    const pathParts = hash.split("/").map(p => p.split("?")[0]);
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
// =================================================================
// HEADER KPIs
// =================================================================
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
// =================================================================
// USER ROLE SWITCHER
// =================================================================
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
        filterSidebarMenuItems();
        router();
        updateHeaderKPIs();
    });
}
// =================================================================
// TOAST NOTIFICATIONS
// =================================================================
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
// =================================================================
// DATABASE RESET
// =================================================================
if (resetDbBtn) {
    resetDbBtn.addEventListener("click", () => {
        if (confirm("Reset the ERP database to initial values? All transactions, warehouses, companies, and settings will be restored to defaults.")) {
            store.resetDatabase();
            window.showToast("Database restored to default seeds.", "info");
            setTimeout(() => {
                window.location.reload();
            }, 600);
        }
    });
}
// =================================================================
// STATE UPDATE LISTENER
// =================================================================
window.addEventListener("erp-state-updated", () => {
    updateHeaderKPIs();
    filterSidebarMenuItems();
    const activeOverlay = document.querySelector(".modal-overlay");
    if (!activeOverlay) {
        router();
    }
});
// =================================================================
// INITIALIZATION
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
    initLogin();
    initLogoutButton();
    // Auto-login for testing: add ?autologin=1 to URL
    if (window.location.search.includes("autologin=1")) {
        try {
            store.login("admin", "jmit2026");
        }
        catch (e) { /* ignore */ }
    }
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