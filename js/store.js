// JMIT ERP - Central State Store (Phase 3 CRUD Workflow Approvals & RBAC Master)

const DEFAULT_STATE = {
  // System Configurations
  settings: {
    activeCompany: "CMP001",
    companies: [
      { id: "CMP001", name: "JMIT Enterprises Inc.", taxId: "111-222-333", address: "HQ Manila, Port Area, PH", taxIdType: "TIN", currency: "USD" },
      { id: "CMP002", name: "JMIT Logistics Cebu", taxId: "444-555-666", address: "IT Park Tower 2, Cebu City, PH", taxIdType: "TIN", currency: "PHP" }
    ],
    activeCurrency: "USD",
    exchangeRates: {
      USD: 1.0,
      PHP: 56.0,
      EUR: 0.92
    },
    periods: [
      { name: "2026-07", start: "2026-07-01", end: "2026-07-31", closed: false },
      { name: "2026-06", start: "2026-06-01", end: "2026-06-30", closed: true }
    ],
    skuRule: {
      prefix: "JMIT-",
      sequence: 1005,
      suffix: "-HW"
    },
    glMappings: {
      cashAccount: "1010",
      arAccount: "1200",
      apAccount: "2010",
      whtAssetAccount: "1210",
      inventoryAccount: "1300",
      taxAccount: "2200",
      whtLiabilityAccount: "2220",
      salesAccount: "4100",
      cogsAccount: "5100",
      opexAccount: "6010",
      deprExpenseAccount: "6100",
      accumDeprAccount: "1810"
    },
    workflowRequirements: {
      soApproval: true,
      dnSubmission: true,
      siSubmission: true,
      poApproval: true,
      grnSubmission: true,
      piSubmission: true,
      paymentSubmission: true,
      journalSubmission: true
    }
  },

  // Security Roles & Access Control (CRUD Level Permissions)
  users: [
    { id: "usr_admin", username: "admin", name: "System Administrator", roleId: "role_admin" },
    { id: "usr_sales", username: "sales_mgr", name: "Sales Manager", roleId: "role_sales" },
    { id: "usr_purch", username: "purch_mgr", name: "Purchase Manager", roleId: "role_purch" },
    { id: "usr_inventory", username: "inventory_clerk", name: "Inventory Clerk", roleId: "role_inventory" },
    { id: "usr_accountant", username: "accountant", name: "Chief Accountant", roleId: "role_accounting" }
  ],
  roles: [
    {
      id: "role_admin",
      name: "System Administrator",
      permissions: {
        o2c: { create: true, read: true, update: true, delete: true, approve: true },
        p2p: { create: true, read: true, update: true, delete: true, approve: true },
        inventory: { create: true, read: true, update: true, delete: true, approve: true },
        accounting: { create: true, read: true, update: true, delete: true, approve: true },
        finance: { create: true, read: true, update: true, delete: true, approve: true },
        settings: { create: true, read: true, update: true, delete: true, approve: true }
      }
    },
    {
      id: "role_sales",
      name: "Sales Manager",
      permissions: {
        o2c: { create: true, read: true, update: true, delete: true, approve: true },
        p2p: { create: false, read: false, update: false, delete: false, approve: false },
        inventory: { create: false, read: true, update: false, delete: false, approve: false },
        accounting: { create: false, read: false, update: false, delete: false, approve: false },
        finance: { create: false, read: false, update: false, delete: false, approve: false },
        settings: { create: false, read: false, update: false, delete: false, approve: false }
      }
    },
    {
      id: "role_purch",
      name: "Purchase Manager",
      permissions: {
        o2c: { create: false, read: false, update: false, delete: false, approve: false },
        p2p: { create: true, read: true, update: true, delete: true, approve: true },
        inventory: { create: false, read: true, update: false, delete: false, approve: false },
        accounting: { create: false, read: false, update: false, delete: false, approve: false },
        finance: { create: false, read: false, update: false, delete: false, approve: false },
        settings: { create: false, read: false, update: false, delete: false, approve: false }
      }
    },
    {
      id: "role_inventory",
      name: "Inventory Clerk",
      permissions: {
        o2c: { create: false, read: true, update: false, delete: false, approve: false },
        p2p: { create: false, read: true, update: false, delete: false, approve: false },
        inventory: { create: true, read: true, update: true, delete: true, approve: true },
        accounting: { create: false, read: false, update: false, delete: false, approve: false },
        finance: { create: false, read: false, update: false, delete: false, approve: false },
        settings: { create: false, read: false, update: false, delete: false, approve: false }
      }
    },
    {
      id: "role_accounting",
      name: "Chief Accountant",
      permissions: {
        o2c: { create: false, read: true, update: false, delete: false, approve: false },
        p2p: { create: false, read: true, update: false, delete: false, approve: false },
        inventory: { create: false, read: true, update: false, delete: false, approve: false },
        accounting: { create: true, read: true, update: true, delete: true, approve: true },
        finance: { create: true, read: true, update: true, delete: true, approve: true },
        settings: { create: false, read: false, update: false, delete: false, approve: false }
      }
    }
  ],
  currentUser: "usr_admin",

  // Business Partner Registries
  partners: {
    leads: [
      { id: "LDT001", name: "NexGen Retailers", contact: "Manny Pacquiao", email: "manny@nexgen.com", phone: "+63 917-555-0101", address: "General Santos City, PH", status: "Open" }
    ],
    customers: [
      { id: "CST001", name: "Acme Corporation", contact: "John Doe", email: "contact@acme.com", phone: "+1 555-0199", address: "123 Industrial Rd, Manila", taxId: "999-888-777", taxRate: 0.12, whtRate: 0.02 },
      { id: "CST002", name: "Beta Ventures", contact: "Alice Smith", email: "billing@betaventures.com", phone: "+1 555-0145", address: "456 Commerce St, Cebu", taxId: "666-555-444", taxRate: 0.12, whtRate: 0.02 }
    ],
    vendors: [
      { id: "VND001", name: "Global Tech Distributors", contact: "Robert Lee", email: "sales@globaltech.com", phone: "+1 555-0876", address: "789 Supply Ave, Singapore", taxId: "111-222-333", defaultTerms: "Net 30" },
      { id: "VND002", name: "Premium Furniture Co.", contact: "Sarah Connor", email: "info@premiumfurniture.com", phone: "+1 555-0654", address: "321 Oak St, Cebu City", taxId: "444-555-666", defaultTerms: "Net 15" }
    ]
  },

  // Warehouses Network
  warehouses: [
    { id: "WH001", name: "Main Warehouse Manila", address: "Main Port, Manila, PH" },
    { id: "WH002", name: "Secondary Warehouse Cebu", address: "Mandaue Reclamation, Cebu, PH" }
  ],

  // Stock Items Catalog
  items: [
    { id: "ITM001", sku: "JMIT-1001-HW", name: "Enterprise Laptop Pro", category: "Hardware", uom: "pcs", cost: 800, price: 1200, stocks: { WH001: 25, WH002: 20 }, reorder: 10 },
    { id: "ITM002", sku: "JMIT-1002-HW", name: "Ergonomic Office Chair", category: "Furniture", uom: "pcs", cost: 150, price: 299, stocks: { WH001: 10, WH002: 5 }, reorder: 5 },
    { id: "ITM003", sku: "JMIT-1003-HW", name: "Mechanical Keyboard", category: "Accessories", uom: "pcs", cost: 60, price: 129, stocks: { WH001: 8, WH002: 0 }, reorder: 10 },
    { id: "ITM004", sku: "JMIT-1004-HW", name: "4K UltraWide Monitor", category: "Hardware", uom: "pcs", cost: 350, price: 599, stocks: { WH001: 12, WH002: 10 }, reorder: 5 }
  ],

  // UOM Conversion dictionary (standard ratios relative to default 'pcs')
  uomConversions: [
    { from: "box_of_10", to: "pcs", rate: 10 },
    { from: "pack_of_5", to: "pcs", rate: 5 },
    { from: "pcs", to: "pcs", rate: 1 }
  ],

  // Fixed Asset Registry
  fixedAssets: [
    { id: "AST001", name: "Main HQ Backup Generator", purchaseDate: "2026-01-15", cost: 24000, usefulLife: 5, salvageValue: 4000, accumDepreciation: 2000, assetAccount: "1800", deprAccount: "1810", expenseAccount: "6100", active: true }
  ],

  // Chart of Accounts Tree (Structured with parentCode)
  accounts: [
    // --- Assets (1000) ---
    { code: "1000", name: "Assets", type: "Asset", parentCode: null, balance: 0 },
    { code: "1010", name: "Cash & Cash Equivalents", type: "Asset", parentCode: "1000", balance: 50938.00 },
    { code: "1200", name: "Accounts Receivable", type: "Asset", parentCode: "1000", balance: 0 },
    { code: "1210", name: "Withholding Tax Receivable", type: "Asset", parentCode: "1000", balance: 0 },
    { code: "1300", name: "Inventory Asset", type: "Asset", parentCode: "1000", balance: 46580.00 },
    { code: "1800", name: "Fixed Property & Equipment", type: "Asset", parentCode: "1000", balance: 24000.00 },
    { code: "1810", name: "Accumulated Depreciation", type: "Asset", parentCode: "1000", balance: -2000.00 },

    // --- Liabilities (2000) ---
    { code: "2000", name: "Liabilities", type: "Liability", parentCode: null, balance: 0 },
    { code: "2010", name: "Accounts Payable", type: "Liability", parentCode: "2000", balance: 0 },
    { code: "2200", name: "VAT / Tax Payable", type: "Liability", parentCode: "2000", balance: 288.00 },
    { code: "2220", name: "Withholding Tax Payable", type: "Liability", parentCode: "2000", balance: 0 },

    // --- Equity (3000) ---
    { code: "3000", name: "Equity", type: "Equity", parentCode: null, balance: 0 },
    { code: "3010", name: "Paid-In Capital", type: "Equity", parentCode: "3000", balance: 96430.00 },
    { code: "3100", name: "Retained Earnings", type: "Equity", parentCode: "3000", balance: 800.00 },

    // --- Revenues (4000) ---
    { code: "4000", name: "Revenues", type: "Revenue", parentCode: null, balance: 0 },
    { code: "4100", name: "Sales Revenue", type: "Revenue", parentCode: "4000", balance: 2400.00 },

    // --- Cost of Goods (5000) ---
    { code: "5000", name: "Cost of Sales", type: "Expense", parentCode: null, balance: 0 },
    { code: "5100", name: "Cost of Goods Sold", type: "Expense", parentCode: "5000", balance: 1600.00 },

    // --- Operational Expenses (6000) ---
    { code: "6000", name: "Operating Expenses", type: "Expense", parentCode: null, balance: 0 },
    { code: "6010", name: "Operational Expenses", type: "Expense", parentCode: "6000", balance: 0 },
    { code: "6100", name: "Depreciation Expense", type: "Expense", parentCode: "6000", balance: 0 }
  ],

  // Multi-Step Document Chains
  salesOrders: [
    { id: "SO-2026-001", companyId: "CMP001", customerId: "CST001", customerName: "Acme Corporation", date: "2026-07-09", items: [{ itemId: "ITM001", sku: "JMIT-1001-HW", name: "Enterprise Laptop Pro", qty: 2, price: 1200, uom: "pcs" }], currency: "USD", rate: 1.0, subtotal: 2400, tax: 288, withholding: 48, total: 2640, status: "Closed" }
  ],
  deliveries: [
    { id: "DN-2026-001", salesOrderId: "SO-2026-001", companyId: "CMP001", customerId: "CST001", customerName: "Acme Corporation", date: "2026-07-10", items: [{ itemId: "ITM001", sku: "JMIT-1001-HW", qty: 2, uom: "pcs" }], warehouseId: "WH001", status: "Submitted" }
  ],
  salesInvoices: [
    { id: "SI-2026-001", salesOrderId: "SO-2026-001", deliveryNoteId: "DN-2026-001", companyId: "CMP001", customerId: "CST001", customerName: "Acme Corporation", date: "2026-07-10", items: [{ itemId: "ITM001", sku: "JMIT-1001-HW", qty: 2, price: 1200, uom: "pcs" }], subtotal: 2400, tax: 288, withholding: 48, total: 2640, status: "Paid" }
  ],
  salesReturns: [],

  purchaseOrders: [
    { id: "PO-2026-001", companyId: "CMP001", vendorId: "VND001", vendorName: "Global Tech Distributors", date: "2026-07-07", items: [{ itemId: "ITM004", sku: "JMIT-1004-HW", name: "4K UltraWide Monitor", qty: 5, cost: 350, uom: "pcs" }], currency: "USD", rate: 1.0, total: 1750, status: "Paid" }
  ],
  goodsReceipts: [
    { id: "GRN-2026-001", purchaseOrderId: "PO-2026-001", companyId: "CMP001", vendorId: "VND001", vendorName: "Global Tech Distributors", date: "2026-07-08", items: [{ itemId: "ITM004", sku: "JMIT-1004-HW", acceptedQty: 5, rejectedQty: 0, uom: "pcs" }], warehouseId: "WH001", status: "Submitted" }
  ],
  purchaseInvoices: [
    { id: "PI-2026-001", purchaseOrderId: "PO-2026-001", goodsReceiptId: "GRN-2026-001", companyId: "CMP001", vendorId: "VND001", vendorName: "Global Tech Distributors", date: "2026-07-08", items: [{ itemId: "ITM004", sku: "JMIT-1004-HW", qty: 5, cost: 350, uom: "pcs" }], total: 1750, status: "Paid" }
  ],
  purchaseReturns: [],

  // Treasury Operations (Receive / Pay)
  payments: [
    { id: "PAY-2026-001", type: "Receive", companyId: "CMP001", partnerId: "CST001", partnerName: "Acme Corporation", reference: "Invoice SI-2026-001", date: "2026-07-11", amount: 2640, currency: "USD", rate: 1.0, status: "Posted" },
    { id: "PAY-2026-002", type: "Pay", companyId: "CMP001", partnerId: "VND001", partnerName: "Global Tech Distributors", reference: "Bill PI-2026-001", date: "2026-07-09", amount: 1750, currency: "USD", rate: 1.0, status: "Posted" }
  ],

  // Stock Entry adjustments
  stockEntries: [
    { id: "SE-2026-001", type: "Transfer", date: "2026-07-12", items: [{ itemId: "ITM001", sku: "JMIT-1001-HW", qty: 2 }], sourceWarehouseId: "WH001", targetWarehouseId: "WH002", reason: "Stock replenishment", status: "Submitted" }
  ],

  // General Journal Logs
  journalEntries: [
    {
      id: "JE-2026-0001",
      date: "2026-07-08",
      reference: "GRN GRN-2026-001 Goods Received",
      lines: [
        { code: "1300", debit: 1750, credit: 0 },
        { code: "2010", debit: 0, credit: 1750 }
      ],
      companyId: "CMP001",
      status: "Posted"
    },
    {
      id: "JE-2026-0002",
      date: "2026-07-09",
      reference: "Bill PI-2026-001 Paid to Supplier",
      lines: [
        { code: "2010", debit: 1750, credit: 0 },
        { code: "1010", debit: 0, credit: 1750 }
      ],
      companyId: "CMP001",
      status: "Posted"
    },
    {
      id: "JE-2026-0003",
      date: "2026-07-10",
      reference: "Fulfillment SO-2026-001 (Sales Invoice)",
      lines: [
        { code: "1200", debit: 2640, credit: 0 },
        { code: "1210", debit: 48, credit: 0 },
        { code: "4100", debit: 0, credit: 2400 },
        { code: "2200", debit: 0, credit: 288 },
        { code: "5100", debit: 1600, credit: 0 },
        { code: "1300", debit: 0, credit: 1600 }
      ],
      companyId: "CMP001",
      status: "Posted"
    },
    {
      id: "JE-2026-0004",
      date: "2026-07-11",
      reference: "Payment Recv SO-2026-001 Payment Entry",
      lines: [
        { code: "1010", debit: 2640, credit: 0 },
        { code: "1200", debit: 0, credit: 2640 }
      ],
      companyId: "CMP001",
      status: "Posted"
    }
  ]
};

class Store {
  constructor() {
    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem("jmit_erp_state");
      if (saved) {
        this.state = JSON.parse(saved);
        // Force upgrade to CRUD matrix definition on load
        if (this.state.roles && this.state.roles[0] && !this.state.roles[0].permissions.o2c.create) {
          this.state.users = JSON.parse(JSON.stringify(DEFAULT_STATE.users));
          this.state.roles = JSON.parse(JSON.stringify(DEFAULT_STATE.roles));
          this.state.currentUser = DEFAULT_STATE.currentUser;
          this.saveState();
        }
      } else {
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        this.saveState();
      }
    } catch (e) {
      console.error("Failed loading state:", e);
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  saveState() {
    try {
      localStorage.setItem("jmit_erp_state", JSON.stringify(this.state));
      window.dispatchEvent(new CustomEvent("erp-state-updated"));
    } catch (e) {
      console.error("Failed saving state:", e);
    }
  }

  resetDatabase() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
  }

  // --- GETTERS ---
  getSettings() { return this.state.settings; }
  getCompanies() { return this.state.settings.companies; }
  getActiveCompany() { return this.state.settings.companies.find(c => c.id === this.state.settings.activeCompany); }
  getExchangeRates() { return this.state.settings.exchangeRates; }
  getPeriods() { return this.state.settings.periods; }
  getPartners() { return this.state.partners; }
  getWarehouses() { return this.state.warehouses; }
  getItems() { return this.state.items; }
  getAccounts() { return this.state.accounts; }
  getFixedAssets() { return this.state.fixedAssets; }
  getUOMConversions() { return this.state.uomConversions; }
  
  // Ledger and documents
  getJournalEntries() { return this.state.journalEntries; }
  getSalesOrders() { return this.state.salesOrders; }
  getDeliveries() { return this.state.deliveries; }
  getSalesInvoices() { return this.state.salesInvoices; }
  getSalesReturns() { return this.state.salesReturns; }
  getPurchaseOrders() { return this.state.purchaseOrders; }
  getGoodsReceipts() { return this.state.goodsReceipts; }
  getPurchaseInvoices() { return this.state.purchaseInvoices; }
  getPurchaseReturns() { return this.state.purchaseReturns; }
  getPayments() { return this.state.payments; }
  getStockEntries() { return this.state.stockEntries; }

  // RBAC CRUD Getters
  getUsers() { return this.state.users; }
  getRoles() { return this.state.roles; }
  getCurrentUser() { return this.state.users.find(u => u.id === this.state.currentUser) || this.state.users[0]; }
  
  getCurrentRole() {
    const user = this.getCurrentUser();
    return this.state.roles.find(r => r.id === user.roleId) || this.state.roles[0];
  }

  setCurrentUser(userId) {
    this.state.currentUser = userId;
    this.saveState();
  }

  checkPermission(module, action) {
    const role = this.getCurrentRole();
    if (!role || !role.permissions[module]) return false;
    return !!role.permissions[module][action];
  }

  // --- CRUD GENERIC TRIGGERS ON DRAFTS ---
  deleteDocument(module, listName, docId) {
    if (!this.checkPermission(module, "delete")) {
      throw new Error(`Security Access Denied: Delete privilege for module [${module.toUpperCase()}] is required!`);
    }
    const arr = this.state[listName];
    if (!arr) throw new Error(`Document collection ${listName} does not exist`);

    const idx = arr.findIndex(d => d.id === docId);
    if (idx === -1) throw new Error("Document not found");

    const doc = arr[idx];
    if (doc.status && doc.status !== "Draft") {
      throw new Error("Workflow Constraint: Only Draft items can be deleted from registry");
    }

    arr.splice(idx, 1);
    this.saveState();
  }

  updateDraftDocument(module, listName, docId, updatedFields) {
    if (!this.checkPermission(module, "update")) {
      throw new Error(`Security Access Denied: Update privilege for module [${module.toUpperCase()}] is required!`);
    }
    const arr = this.state[listName];
    if (!arr) throw new Error(`Document collection ${listName} does not exist`);

    const doc = arr.find(d => d.id === docId);
    if (!doc) throw new Error("Document not found");

    if (doc.status && doc.status !== "Draft") {
      throw new Error("Workflow Constraint: Only Draft items can be modified");
    }

    Object.assign(doc, updatedFields);
    this.saveState();
  }

  // Search details
  getItem(id) { return this.state.items.find(i => i.id === id); }
  getAccount(code) { return this.state.accounts.find(a => a.code === code); }
  getPartner(id) {
    return this.state.partners.customers.find(c => c.id === id) ||
           this.state.partners.vendors.find(v => v.id === id) ||
           this.state.partners.leads.find(l => l.id === id);
  }
  getWarehouse(id) { return this.state.warehouses.find(w => w.id === id); }

  // --- PERIOD LOCKING ENGINE ---
  isPeriodClosed(dateStr) {
    const d = new Date(dateStr);
    for (const p of this.state.settings.periods) {
      const start = new Date(p.start);
      const end = new Date(p.end);
      if (d >= start && d <= end && p.closed) {
        return true;
      }
    }
    return false;
  }

  // --- AUTO SKU GENERATOR ---
  generateSKU() {
    const rule = this.state.settings.skuRule;
    const sku = `${rule.prefix}${rule.sequence}${rule.suffix}`;
    rule.sequence += 1;
    this.saveState();
    return sku;
  }

  // --- CURRENCY CONVERTER ---
  convertToBase(amount, currency) {
    const rates = this.state.settings.exchangeRates;
    const rate = rates[currency] || 1.0;
    return parseFloat((amount / rate).toFixed(2));
  }

  // --- CORE MUTATORS & BUSINESS TRANSACTIONS ---

  updateSettings(settingsData) {
    if (!this.checkPermission("settings", "update")) throw new Error("Security Access Denied: Settings update privileges required!");
    Object.assign(this.state.settings, settingsData);
    this.saveState();
  }

  addCompany(company) {
    if (!this.checkPermission("settings", "create")) throw new Error("Security Access Denied: Settings create privileges required!");
    const id = "CMP" + String(this.state.settings.companies.length + 1).padStart(3, "0");
    const newCompany = { id, ...company };
    this.state.settings.companies.push(newCompany);
    this.saveState();
    return newCompany;
  }

  addPeriod(period) {
    if (!this.checkPermission("settings", "create")) throw new Error("Security Access Denied: Settings create privileges required!");
    this.state.settings.periods.unshift({ ...period, closed: false });
    this.saveState();
  }

  togglePeriod(name) {
    if (!this.checkPermission("settings", "update")) throw new Error("Security Access Denied: Settings update privileges required!");
    const period = this.state.settings.periods.find(p => p.name === name);
    if (period) {
      period.closed = !period.closed;
      this.saveState();
    }
  }

  addGLAccount(acct) {
    if (!this.checkPermission("accounting", "create")) throw new Error("Security Access Denied: Accounting create privileges required!");
    const existing = this.getAccount(acct.code);
    if (existing) throw new Error(`Account code ${acct.code} already exists`);
    
    const newAcct = {
      code: acct.code,
      name: acct.name,
      type: acct.type,
      parentCode: acct.parentCode || null,
      balance: 0
    };
    this.state.accounts.push(newAcct);
    this.state.accounts.sort((a,b) => a.code.localeCompare(b.code));
    this.saveState();
    return newAcct;
  }

  addPartner(type, partner) {
    if (!this.checkPermission("settings", "create")) throw new Error("Security Access Denied: Settings create privileges required!");
    const prefix = type === "Customer" ? "CST" : type === "Vendor" ? "VND" : "LDT";
    const collection = type === "Customer" ? this.state.partners.customers 
                     : type === "Vendor" ? this.state.partners.vendors 
                     : this.state.partners.leads;
                     
    const id = prefix + String(collection.length + 1).padStart(3, "0");
    const newPartner = { id, ...partner };
    
    if (type === "Customer") {
      newPartner.taxRate = Number(partner.taxRate) || 0.12;
      newPartner.whtRate = Number(partner.whtRate) || 0.02;
    }

    collection.push(newPartner);
    this.saveState();
    return newPartner;
  }

  addWarehouse(wh) {
    if (!this.checkPermission("inventory", "create")) throw new Error("Security Access Denied: Inventory create privileges required!");
    const id = "WH" + String(this.state.warehouses.length + 1).padStart(3, "0");
    const newWh = { id, ...wh };
    this.state.warehouses.push(newWh);
    
    this.state.items.forEach(item => {
      if (!item.stocks) item.stocks = {};
      item.stocks[id] = 0;
    });
    
    this.saveState();
    return newWh;
  }

  addItem(itemData) {
    if (!this.checkPermission("inventory", "create")) throw new Error("Security Access Denied: Inventory create privileges required!");
    const sku = itemData.autoSku ? this.generateSKU() : itemData.sku.toUpperCase();
    const id = "ITM" + String(this.state.items.length + 1).padStart(3, "0");
    
    const stocks = {};
    this.state.warehouses.forEach(w => {
      stocks[w.id] = 0;
    });
    
    if (itemData.initialWarehouseId && itemData.initialStock) {
      stocks[itemData.initialWarehouseId] = Number(itemData.initialStock) || 0;
    }

    const newItem = {
      id,
      sku,
      name: itemData.name,
      category: itemData.category,
      uom: itemData.uom || "pcs",
      cost: Number(itemData.cost) || 0,
      price: Number(itemData.price) || 0,
      stocks,
      reorder: Number(itemData.reorder) || 5
    };

    this.state.items.push(newItem);
    this.saveState();
    return newItem;
  }

  // ============================================
  // === CRUD WORKFLOW APPROVALS ENGINE ===
  // ============================================

  // --- 1. SALES ORDER WORKFLOW ---
  createSalesOrder(soData) {
    if (!this.checkPermission("o2c", "create")) throw new Error("Security Access Denied: Sales order creation privileges required!");
    const date = soData.date || new Date().toISOString().split("T")[0];
    if (this.isPeriodClosed(date)) throw new Error("Posting date falls within a closed fiscal period!");

    const id = "SO-2026-" + String(this.state.salesOrders.length + 1).padStart(3, "0");
    const cust = this.state.partners.customers.find(c => c.id === soData.customerId);
    
    let subtotal = 0;
    const items = soData.items.map(l => {
      const prod = this.getItem(l.itemId);
      return {
        itemId: l.itemId,
        sku: prod.sku,
        name: prod.name,
        qty: Number(l.qty),
        price: prod.price,
        uom: l.uom || "pcs"
      };
    });

    soData.items.forEach(l => {
      const prod = this.getItem(l.itemId);
      subtotal += prod.price * l.qty;
    });

    const tax = parseFloat((subtotal * (cust ? cust.taxRate : 0.12)).toFixed(2));
    const withholding = parseFloat((subtotal * (cust ? cust.whtRate : 0.02)).toFixed(2));
    const total = parseFloat((subtotal + tax - withholding).toFixed(2));

    const newSo = {
      id,
      companyId: this.state.settings.activeCompany,
      customerId: soData.customerId,
      customerName: cust ? cust.name : "Unknown",
      date,
      items,
      currency: soData.currency || "USD",
      rate: Number(soData.rate) || 1.0,
      subtotal,
      tax,
      withholding,
      total,
      status: "Draft"
    };

    this.state.salesOrders.push(newSo);
    this.saveState();
    return newSo;
  }

  approveSalesOrder(orderId) {
    if (!this.checkPermission("o2c", "approve")) throw new Error("Security Access Denied: Sales order approval privileges required!");
    const so = this.state.salesOrders.find(s => s.id === orderId);
    if (!so) throw new Error("Sales order not found");
    if (so.status !== "Draft") throw new Error("Only Draft sales orders can be approved");
    
    so.status = "Approved";
    this.saveState();
  }

  // --- 2. DELIVERY NOTE WORKFLOW ---
  createDeliveryNote(dnData) {
    if (!this.checkPermission("o2c", "create")) throw new Error("Security Access Denied: Shipment creation privileges required!");
    const date = dnData.date || new Date().toISOString().split("T")[0];
    if (this.isPeriodClosed(date)) throw new Error("Posting date falls within a closed fiscal period!");

    const id = "DN-2026-" + String(this.state.deliveries.length + 1).padStart(3, "0");
    const so = this.state.salesOrders.find(s => s.id === dnData.salesOrderId);
    if (!so) throw new Error("Reference Sales Order not found");
    if (so.status !== "Approved") throw new Error("Sales Order must be Approved before shipping items");

    const newDn = {
      id,
      salesOrderId: dnData.salesOrderId,
      companyId: so.companyId,
      customerId: so.customerId,
      customerName: so.customerName,
      date,
      items: dnData.items.map(l => ({ itemId: l.itemId, sku: this.getItem(l.itemId).sku, qty: Number(l.qty), uom: l.uom })),
      warehouseId: dnData.warehouseId,
      status: "Draft"
    };

    this.state.deliveries.push(newDn);
    this.saveState();
    return newDn;
  }

  submitDeliveryNote(deliveryId) {
    if (!this.checkPermission("o2c", "approve")) throw new Error("Security Access Denied: Shipment submit approval privileges required!");
    const dn = this.state.deliveries.find(d => d.id === deliveryId);
    if (!dn) throw new Error("Delivery Note not found");
    if (dn.status !== "Draft") throw new Error("Delivery Note has already been submitted");

    // Stock deduction checks
    for (const line of dn.items) {
      const item = this.getItem(line.itemId);
      if (!item) throw new Error("Item not found");
      const currentStock = item.stocks[dn.warehouseId] || 0;
      if (currentStock < line.qty) {
        throw new Error(`Insufficient stock in ${this.getWarehouse(dn.warehouseId).name} for ${item.name}. Available: ${currentStock}, Required: ${line.qty}`);
      }
    }

    // Deduct stock
    dn.items.forEach(line => {
      const item = this.getItem(line.itemId);
      item.stocks[dn.warehouseId] -= line.qty;
    });

    dn.status = "Submitted";
    
    // Auto update SO status
    const so = this.state.salesOrders.find(s => s.id === dn.salesOrderId);
    if (so) {
      so.status = "Delivered";
    }

    this.saveState();
  }

  // --- 3. SALES INVOICE WORKFLOW ---
  createSalesInvoice(siData) {
    if (!this.checkPermission("o2c", "create")) throw new Error("Security Access Denied: Invoice creation privileges required!");
    const date = siData.date || new Date().toISOString().split("T")[0];
    if (this.isPeriodClosed(date)) throw new Error("Posting date falls within a closed fiscal period!");

    const id = "SI-2026-" + String(this.state.salesInvoices.length + 1).padStart(3, "0");
    const so = this.state.salesOrders.find(s => s.id === siData.salesOrderId);
    if (!so) throw new Error("Reference Sales Order not found");

    const newSi = {
      id,
      salesOrderId: so.id,
      deliveryNoteId: siData.deliveryNoteId || "",
      companyId: so.companyId,
      customerId: so.customerId,
      customerName: so.customerName,
      date,
      items: so.items,
      subtotal: so.subtotal,
      tax: so.tax,
      withholding: so.withholding,
      total: so.total,
      status: "Draft"
    };

    this.state.salesInvoices.push(newSi);
    this.saveState();
    return newSi;
  }

  submitSalesInvoice(invoiceId) {
    if (!this.checkPermission("o2c", "approve")) throw new Error("Security Access Denied: Invoice submit approval privileges required!");
    const si = this.state.salesInvoices.find(s => s.id === invoiceId);
    if (!si) throw new Error("Sales Invoice not found");
    if (si.status !== "Draft") throw new Error("Sales Invoice has already been submitted");

    const so = this.state.salesOrders.find(s => s.id === si.salesOrderId);
    if (!so) throw new Error("Reference SO not found");

    const maps = this.state.settings.glMappings;
    const baseTotal = this.convertToBase(si.total, so.currency);
    const baseSubtotal = this.convertToBase(si.subtotal, so.currency);
    const baseTax = this.convertToBase(si.tax, so.currency);
    const baseWht = this.convertToBase(si.withholding, so.currency);

    // Compute COGS
    let totalCogs = 0;
    si.items.forEach(line => {
      const prod = this.getItem(line.itemId);
      totalCogs += prod.cost * line.qty;
    });

    const jeId = "JE-2026-" + String(this.state.journalEntries.length + 1).padStart(4, "0");
    const jeLines = [
      { code: maps.arAccount, debit: baseTotal, credit: 0 },
      { code: maps.whtAssetAccount, debit: baseWht, credit: 0 },
      { code: maps.salesAccount, debit: 0, credit: baseSubtotal },
      { code: maps.taxAccount, debit: 0, credit: baseTax },
      { code: maps.cogsAccount, debit: totalCogs, credit: 0 },
      { code: maps.inventoryAccount, debit: 0, credit: totalCogs }
    ];

    this.postJournalEntry({
      id: jeId,
      date: si.date,
      reference: `Invoice ${si.id} (SO: ${so.id})`,
      lines: jeLines,
      status: "Posted"
    });

    si.status = "Unpaid";
    so.status = "Closed";
    this.saveState();
  }

  createSalesReturn(srData) {
    if (!this.checkPermission("o2c", "create")) throw new Error("Security Access Denied: Return creation privileges required!");
    const date = srData.date || new Date().toISOString().split("T")[0];
    if (this.isPeriodClosed(date)) throw new Error("Posting date falls within a closed fiscal period!");

    const id = "SR-2026-" + String(this.state.salesReturns.length + 1).padStart(3, "0");
    const si = this.state.salesInvoices.find(s => s.id === srData.salesInvoiceId);
    if (!si) throw new Error("Invoice details not found");

    srData.items.forEach(line => {
      const item = this.getItem(line.itemId);
      if (item) {
        if (!item.stocks[srData.warehouseId]) item.stocks[srData.warehouseId] = 0;
        item.stocks[srData.warehouseId] += line.qty;
      }
    });

    let returnCogs = 0;
    srData.items.forEach(line => {
      const item = this.getItem(line.itemId);
      if (item) returnCogs += item.cost * line.qty;
    });

    const ratio = srData.totalReturn / si.total;
    const revRev = parseFloat((this.convertToBase(si.subtotal, "USD") * ratio).toFixed(2));
    const revTax = parseFloat((this.convertToBase(si.tax, "USD") * ratio).toFixed(2));
    const revWht = parseFloat((this.convertToBase(si.withholding, "USD") * ratio).toFixed(2));
    const revTotal = parseFloat((this.convertToBase(si.total, "USD") * ratio).toFixed(2));

    const maps = this.state.settings.glMappings;
    const jeId = "JE-2026-" + String(this.state.journalEntries.length + 1).padStart(4, "0");
    
    const jeLines = [
      { code: maps.salesAccount, debit: revRev, credit: 0 },
      { code: maps.taxAccount, debit: revTax, credit: 0 },
      { code: maps.arAccount, debit: 0, credit: revTotal },
      { code: maps.whtAssetAccount, debit: 0, credit: revWht },
      { code: maps.inventoryAccount, debit: returnCogs, credit: 0 },
      { code: maps.cogsAccount, debit: 0, credit: returnCogs }
    ];

    this.postJournalEntry({
      id: jeId,
      date,
      reference: `Sales Return ${id} (Inv: ${si.id})`,
      lines: jeLines,
      status: "Posted"
    });

    const newSr = {
      id,
      salesInvoiceId: si.id,
      customerId: si.customerId,
      customerName: si.customerName,
      date,
      items: srData.items,
      totalReturn: srData.totalReturn,
      status: "Submitted"
    };

    si.status = "Returned";
    this.state.salesReturns.push(newSr);
    this.saveState();
    return newSr;
  }

  // --- 4. PURCHASE ORDER WORKFLOW ---
  createPurchaseOrder(poData) {
    if (!this.checkPermission("p2p", "create")) throw new Error("Security Access Denied: Purchase order creation privileges required!");
    const date = poData.date || new Date().toISOString().split("T")[0];
    if (this.isPeriodClosed(date)) throw new Error("Posting date falls within a closed fiscal period!");

    const id = "PO-2026-" + String(this.state.purchaseOrders.length + 1).padStart(3, "0");
    const vend = this.state.partners.vendors.find(v => v.id === poData.vendorId);

    let total = 0;
    const items = poData.items.map(l => {
      const prod = this.getItem(l.itemId);
      total += prod.cost * l.qty;
      return {
        itemId: l.itemId,
        sku: prod.sku,
        name: prod.name,
        qty: Number(l.qty),
        cost: prod.cost,
        uom: l.uom || "pcs"
      };
    });

    const newPo = {
      id,
      companyId: this.state.settings.activeCompany,
      vendorId: poData.vendorId,
      vendorName: vend ? vend.name : "Unknown",
      date,
      items,
      currency: poData.currency || "USD",
      rate: Number(poData.rate) || 1.0,
      total,
      status: "Draft"
    };

    this.state.purchaseOrders.push(newPo);
    this.saveState();
    return newPo;
  }

  approvePurchaseOrder(orderId) {
    if (!this.checkPermission("p2p", "approve")) throw new Error("Security Access Denied: Purchase order approval privileges required!");
    const po = this.state.purchaseOrders.find(p => p.id === orderId);
    if (!po) throw new Error("Purchase Order not found");
    if (po.status !== "Draft") throw new Error("Only Draft purchase orders can be approved");

    po.status = "Approved";
    this.saveState();
  }

  // --- 5. GOODS RECEIPT NOTE WORKFLOW ---
  createGoodsReceipt(grnData) {
    if (!this.checkPermission("p2p", "create")) throw new Error("Security Access Denied: Goods receipt creation privileges required!");
    const date = grnData.date || new Date().toISOString().split("T")[0];
    if (this.isPeriodClosed(date)) throw new Error("Posting date falls within a closed fiscal period!");

    const id = "GRN-2026-" + String(this.state.goodsReceipts.length + 1).padStart(3, "0");
    const po = this.state.purchaseOrders.find(p => p.id === grnData.purchaseOrderId);
    if (!po) throw new Error("Reference PO not found");
    if (po.status !== "Approved") throw new Error("Purchase Order must be Approved before receiving goods");

    const newGrn = {
      id,
      purchaseOrderId: po.id,
      companyId: po.companyId,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      date,
      items: grnData.items,
      warehouseId: grnData.warehouseId,
      status: "Draft"
    };

    this.state.goodsReceipts.push(newGrn);
    this.saveState();
    return newGrn;
  }

  submitGoodsReceipt(grnId) {
    if (!this.checkPermission("p2p", "approve")) throw new Error("Security Access Denied: Goods receipt submit approval privileges required!");
    const grn = this.state.goodsReceipts.find(g => g.id === grnId);
    if (!grn) throw new Error("Goods Receipt Note not found");
    if (grn.status !== "Draft") throw new Error("Goods Receipt has already been submitted");

    // Add accepted stock
    grn.items.forEach(line => {
      const item = this.getItem(line.itemId);
      if (item) {
        if (!item.stocks[grn.warehouseId]) item.stocks[grn.warehouseId] = 0;
        item.stocks[grn.warehouseId] += line.acceptedQty;
      }
    });

    grn.status = "Submitted";

    const po = this.state.purchaseOrders.find(p => p.id === grn.purchaseOrderId);
    if (po) {
      po.status = "Received";
    }

    this.saveState();
  }

  // --- 6. PURCHASE INVOICE WORKFLOW ---
  createPurchaseInvoice(piData) {
    if (!this.checkPermission("p2p", "create")) throw new Error("Security Access Denied: Purchase invoice creation privileges required!");
    const date = piData.date || new Date().toISOString().split("T")[0];
    if (this.isPeriodClosed(date)) throw new Error("Posting date falls within a closed fiscal period!");

    const id = "PI-2026-" + String(this.state.purchaseInvoices.length + 1).padStart(3, "0");
    const po = this.state.purchaseOrders.find(p => p.id === piData.purchaseOrderId);
    if (!po) throw new Error("Reference PO not found");

    const newPi = {
      id,
      purchaseOrderId: po.id,
      goodsReceiptId: piData.goodsReceiptId || "",
      companyId: po.companyId,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      date,
      items: po.items,
      total: po.total,
      status: "Draft"
    };

    this.state.purchaseInvoices.push(newPi);
    this.saveState();
    return newPi;
  }

  submitPurchaseInvoice(invoiceId) {
    if (!this.checkPermission("p2p", "approve")) throw new Error("Security Access Denied: Purchase invoice submit approval privileges required!");
    const pi = this.state.purchaseInvoices.find(p => p.id === invoiceId);
    if (!pi) throw new Error("Purchase Invoice not found");
    if (pi.status !== "Draft") throw new Error("Purchase Invoice has already been submitted");

    const po = this.state.purchaseOrders.find(p => p.id === pi.purchaseOrderId);
    if (!po) throw new Error("Reference PO not found");
    const grn = this.state.goodsReceipts.find(g => g.purchaseOrderId === po.id);
    if (!grn) throw new Error("No warehouse Goods Receipt found for this PO");

    const maps = this.state.settings.glMappings;
    const baseTotal = this.convertToBase(po.total, po.currency);

    // Calculate accepted vs rejected values
    let acceptedCost = 0;
    let rejectedCost = 0;
    grn.items.forEach(line => {
      const item = this.getItem(line.itemId);
      const cost = item ? item.cost : 0;
      acceptedCost += cost * line.acceptedQty;
      rejectedCost += cost * line.rejectedQty;
    });

    const baseAccepted = this.convertToBase(acceptedCost, po.currency);
    const baseRejected = this.convertToBase(rejectedCost, po.currency);

    const jeId = "JE-2026-" + String(this.state.journalEntries.length + 1).padStart(4, "0");
    const jeLines = [
      { code: maps.inventoryAccount, debit: baseAccepted, credit: 0 },
      { code: maps.apAccount, debit: 0, credit: baseTotal }
    ];

    if (baseRejected > 0) {
      jeLines.push({ code: maps.opexAccount, debit: baseRejected, credit: 0 });
    }

    this.postJournalEntry({
      id: jeId,
      date: pi.date,
      reference: `Purchase Invoice ${pi.id} (PO: ${po.id})`,
      lines: jeLines,
      status: "Posted"
    });

    pi.status = "Unpaid";
    po.status = "Billed";
    this.saveState();
  }

  createPurchaseReturn(prData) {
    if (!this.checkPermission("p2p", "create")) throw new Error("Security Access Denied: Purchase return creation privileges required!");
    const date = prData.date || new Date().toISOString().split("T")[0];
    if (this.isPeriodClosed(date)) throw new Error("Posting date falls within a closed fiscal period!");

    const id = "PR-2026-" + String(this.state.purchaseReturns.length + 1).padStart(3, "0");
    const pi = this.state.purchaseInvoices.find(p => p.id === prData.purchaseInvoiceId);
    if (!pi) throw new Error("Reference Purchase Invoice not found");

    let returnCost = 0;
    prData.items.forEach(line => {
      const item = this.getItem(line.itemId);
      if (item) {
        item.stocks[prData.warehouseId] = Math.max(0, item.stocks[prData.warehouseId] - line.qty);
        returnCost += item.cost * line.qty;
      }
    });

    const maps = this.state.settings.glMappings;
    const baseReturn = this.convertToBase(prData.totalReturn, "USD");
    const jeId = "JE-2026-" + String(this.state.journalEntries.length + 1).padStart(4, "0");

    const jeLines = [
      { code: maps.apAccount, debit: baseReturn, credit: 0 },
      { code: maps.inventoryAccount, debit: 0, credit: returnCost }
    ];

    const variance = baseReturn - returnCost;
    if (Math.abs(variance) > 0.01) {
      if (variance > 0) {
        jeLines.push({ code: maps.opexAccount, debit: 0, credit: Math.abs(variance) });
      } else {
        jeLines.push({ code: maps.opexAccount, debit: Math.abs(variance), credit: 0 });
      }
    }

    this.postJournalEntry({
      id: jeId,
      date,
      reference: `Purchase Return ${id} (Bill: ${pi.id})`,
      lines: jeLines,
      status: "Posted"
    });

    const newPr = {
      id,
      purchaseInvoiceId: pi.id,
      vendorId: pi.vendorId,
      vendorName: pi.vendorName,
      date,
      items: prData.items,
      totalReturn: prData.totalReturn,
      status: "Submitted"
    };

    pi.status = "Returned";
    this.state.purchaseReturns.push(newPr);
    this.saveState();
    return newPr;
  }

  // --- 7. PAYMENTS ENTRY WORKFLOW ---
  createPaymentEntry(payData) {
    if (!this.checkPermission("finance", "create")) throw new Error("Security Access Denied: Payment entry creation privileges required!");
    const date = payData.date || new Date().toISOString().split("T")[0];
    if (this.isPeriodClosed(date)) throw new Error("Posting date falls within a closed fiscal period!");

    const id = "PAY-2026-" + String(this.state.payments.length + 1).padStart(3, "0");

    const newPay = {
      id,
      type: payData.type,
      companyId: this.state.settings.activeCompany,
      partnerId: payData.partnerId,
      partnerName: this.getPartner(payData.partnerId).name,
      referenceInvoiceId: payData.referenceInvoiceId || "",
      reference: payData.reference,
      date,
      amount: payData.amount,
      currency: payData.currency || "USD",
      rate: Number(payData.rate) || 1.0,
      status: "Draft"
    };

    this.state.payments.push(newPay);
    this.saveState();
    return newPay;
  }

  submitPaymentEntry(paymentId) {
    if (!this.checkPermission("finance", "approve")) throw new Error("Security Access Denied: Payment post approval privileges required!");
    const pay = this.state.payments.find(p => p.id === paymentId);
    if (!pay) throw new Error("Payment Entry not found");
    if (pay.status !== "Draft") throw new Error("Payment has already been posted");

    const maps = this.state.settings.glMappings;
    const baseAmt = this.convertToBase(pay.amount, pay.currency);

    const jeId = "JE-2026-" + String(this.state.journalEntries.length + 1).padStart(4, "0");
    let jeLines = [];

    if (pay.type === "Receive") {
      jeLines = [
        { code: maps.cashAccount, debit: baseAmt, credit: 0 },
        { code: maps.arAccount, debit: 0, credit: baseAmt }
      ];

      if (pay.referenceInvoiceId) {
        const inv = this.state.salesInvoices.find(s => s.id === pay.referenceInvoiceId);
        if (inv) inv.status = "Paid";
      }
    } else {
      jeLines = [
        { code: maps.apAccount, debit: baseAmt, credit: 0 },
        { code: maps.cashAccount, debit: 0, credit: baseAmt }
      ];

      if (pay.referenceInvoiceId) {
        const inv = this.state.purchaseInvoices.find(p => p.id === pay.referenceInvoiceId);
        if (inv) inv.status = "Paid";
      }
    }

    this.postJournalEntry({
      id: jeId,
      date: pay.date,
      reference: `Payment ${pay.id} (${pay.reference})`,
      lines: jeLines,
      status: "Posted"
    });

    pay.status = "Posted";
    this.saveState();
  }

  // --- 8. STOCK ENTRY WORKFLOW ---
  createStockEntry(seData) {
    if (!this.checkPermission("inventory", "create")) throw new Error("Security Access Denied: Stock entry creation privileges required!");
    const date = seData.date || new Date().toISOString().split("T")[0];
    if (this.isPeriodClosed(date)) throw new Error("Posting date falls within a closed fiscal period!");

    const id = "SE-2026-" + String(this.state.stockEntries.length + 1).padStart(3, "0");

    const newSe = {
      id,
      type: seData.type,
      date,
      items: seData.items,
      sourceWarehouseId: seData.sourceWarehouseId || "",
      targetWarehouseId: seData.targetWarehouseId || "",
      reason: seData.reason,
      status: "Draft"
    };

    this.state.stockEntries.push(newSe);
    this.saveState();
    return newSe;
  }

  submitStockEntry(entryId) {
    if (!this.checkPermission("inventory", "approve")) throw new Error("Security Access Denied: Stock entry submit approval privileges required!");
    const se = this.state.stockEntries.find(s => s.id === entryId);
    if (!se) throw new Error("Stock Entry not found");
    if (se.status !== "Draft") throw new Error("Stock Entry has already been submitted");

    se.items.forEach(line => {
      const item = this.getItem(line.itemId);
      if (!item) throw new Error("Product not found");

      if (se.type === "Issue") {
        const curr = item.stocks[se.sourceWarehouseId] || 0;
        if (curr < line.qty) throw new Error(`Insufficient stock in warehouse for ${item.name}`);
        item.stocks[se.sourceWarehouseId] -= line.qty;

        const jeId = "JE-2026-" + String(this.state.journalEntries.length + 1).padStart(4, "0");
        const val = line.qty * item.cost;
        this.postJournalEntry({
          id: jeId,
          date: se.date,
          reference: `Stock Issue ${se.id}`,
          lines: [
            { code: this.state.settings.glMappings.opexAccount, debit: val, credit: 0 },
            { code: this.state.settings.glMappings.inventoryAccount, debit: 0, credit: val }
          ],
          status: "Posted"
        });

      } else if (se.type === "Receipt") {
        if (!item.stocks[se.targetWarehouseId]) item.stocks[se.targetWarehouseId] = 0;
        item.stocks[se.targetWarehouseId] += line.acceptedQty;

        const jeId = "JE-2026-" + String(this.state.journalEntries.length + 1).padStart(4, "0");
        const acceptedVal = line.acceptedQty * item.cost;
        const rejectedVal = line.rejectedQty * item.cost;
        
        const lines = [
          { code: this.state.settings.glMappings.inventoryAccount, debit: acceptedVal, credit: 0 },
          { code: this.state.settings.glMappings.opexAccount, debit: 0, credit: acceptedVal }
        ];

        if (rejectedVal > 0) {
          lines.push({ code: this.state.settings.glMappings.opexAccount, debit: rejectedVal, credit: 0 });
          lines.push({ code: this.state.settings.glMappings.opexAccount, debit: 0, credit: rejectedVal });
        }

        this.postJournalEntry({
          id: jeId,
          date: se.date,
          reference: `Stock Receipt ${se.id}`,
          lines,
          status: "Posted"
        });

      } else if (se.type === "Transfer") {
        const curr = item.stocks[se.sourceWarehouseId] || 0;
        if (curr < line.qty) throw new Error(`Insufficient stock for transfer in source warehouse`);
        
        item.stocks[se.sourceWarehouseId] -= line.qty;
        if (!item.stocks[se.targetWarehouseId]) item.stocks[se.targetWarehouseId] = 0;
        item.stocks[se.targetWarehouseId] += line.qty;
      }
    });

    se.status = "Submitted";
    this.saveState();
  }

  // --- 9. FIXED ASSETS & DEPRECIATION ---
  addFixedAsset(asset) {
    if (!this.checkPermission("finance", "create")) throw new Error("Security Access Denied: Asset acquisition creation privileges required!");
    const id = "AST" + String(this.state.fixedAssets.length + 1).padStart(3, "0");
    const newAsset = {
      id,
      name: asset.name,
      purchaseDate: asset.purchaseDate,
      cost: Number(asset.cost),
      usefulLife: Number(asset.usefulLife),
      salvageValue: Number(asset.salvageValue),
      accumDepreciation: 0,
      assetAccount: asset.assetAccount || "1800",
      deprAccount: asset.deprAccount || "1810",
      expenseAccount: asset.expenseAccount || "6100",
      active: true
    };

    const jeId = "JE-2026-" + String(this.state.journalEntries.length + 1).padStart(4, "0");
    this.postJournalEntry({
      id: jeId,
      date: asset.purchaseDate,
      reference: `Capitalize Fixed Asset ${id}`,
      lines: [
        { code: newAsset.assetAccount, debit: newAsset.cost, credit: 0 },
        { code: this.state.settings.glMappings.cashAccount, debit: 0, credit: newAsset.cost }
      ],
      status: "Posted"
    });

    this.state.fixedAssets.push(newAsset);
    this.saveState();
    return newAsset;
  }

  runDepreciation(dateStr) {
    if (!this.checkPermission("finance", "approve")) throw new Error("Security Access Denied: Depreciation run approval privileges required!");
    if (this.isPeriodClosed(dateStr)) throw new Error("Posting date falls within a closed fiscal period!");
    let totalDepr = 0;
    const lines = [];

    this.state.fixedAssets.forEach(asset => {
      if (!asset.active) return;

      const annual = (asset.cost - asset.salvageValue) / asset.usefulLife;
      const monthly = parseFloat((annual / 12).toFixed(2));
      const remaining = asset.cost - asset.salvageValue - asset.accumDepreciation;
      const deprAmount = Math.min(monthly, remaining);

      if (deprAmount > 0) {
        asset.accumDepreciation = parseFloat((asset.accumDepreciation + deprAmount).toFixed(2));
        totalDepr += deprAmount;

        lines.push({ code: asset.expenseAccount, debit: deprAmount, credit: 0 });
        lines.push({ code: asset.deprAccount, debit: 0, credit: deprAmount });
      }
    });

    if (totalDepr > 0) {
      const jeId = "JE-2026-" + String(this.state.journalEntries.length + 1).padStart(4, "0");
      this.postJournalEntry({
        id: jeId,
        date: dateStr,
        reference: `Monthly Depreciation Posting`,
        lines: lines,
        status: "Posted"
      });
      this.saveState();
      return totalDepr;
    }
    
    return 0;
  }

  // --- 10. ACCOUNTING MANUAL JOURNAL ENTRY ---
  addManualJournalEntry(ref, lines) {
    if (!this.checkPermission("accounting", "create")) throw new Error("Security Access Denied: Journal creation privileges required!");
    const date = new Date().toISOString().split("T")[0];
    if (this.isPeriodClosed(date)) throw new Error("Posting date falls within a closed fiscal period!");

    const jeId = "JE-2026-" + String(this.state.journalEntries.length + 1).padStart(4, "0");
    const newJe = {
      id: jeId,
      date,
      reference: ref,
      lines,
      companyId: this.state.settings.activeCompany,
      status: "Draft"
    };

    this.state.journalEntries.push(newJe);
    this.saveState();
    return newJe;
  }

  submitJournalEntry(journalId) {
    if (!this.checkPermission("accounting", "approve")) throw new Error("Security Access Denied: Journal submit approval privileges required!");
    const je = this.state.journalEntries.find(j => j.id === journalId);
    if (!je) throw new Error("Journal Entry not found");
    if (je.status !== "Draft") throw new Error("Journal has already been posted");

    // Perform balance verification and post to account nodes
    let totalDebit = 0;
    let totalCredit = 0;
    
    je.lines.forEach(l => {
      totalDebit += Number(l.debit) || 0;
      totalCredit += Number(l.credit) || 0;
    });

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Unbalanced Entry: Debits ($${totalDebit.toFixed(2)}) must equal Credits ($${totalCredit.toFixed(2)})`);
    }

    je.lines.forEach(l => {
      const acct = this.getAccount(l.code);
      if (acct) {
        if (acct.type === "Asset" || acct.type === "Expense") {
          acct.balance = parseFloat((acct.balance + l.debit - l.credit).toFixed(2));
        } else {
          acct.balance = parseFloat((acct.balance - l.debit + l.credit).toFixed(2));
        }
      }
    });

    je.status = "Posted";
    this.updateRetainedEarnings();
    this.saveState();
  }

  // --- CORE DOUBLE ENTRY POST ENGINE (AUTO TRANSACTIONS ONLY) ---
  postJournalEntry(entry) {
    let totalDebit = 0;
    let totalCredit = 0;
    
    entry.lines.forEach(l => {
      totalDebit += Number(l.debit) || 0;
      totalCredit += Number(l.credit) || 0;
    });

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Unbalanced Entry: Debits ($${totalDebit.toFixed(2)}) must equal Credits ($${totalCredit.toFixed(2)})`);
    }

    entry.lines.forEach(l => {
      const acct = this.getAccount(l.code);
      if (acct) {
        if (acct.type === "Asset" || acct.type === "Expense") {
          acct.balance = parseFloat((acct.balance + l.debit - l.credit).toFixed(2));
        } else {
          acct.balance = parseFloat((acct.balance - l.debit + l.credit).toFixed(2));
        }
      }
    });

    entry.companyId = entry.companyId || this.state.settings.activeCompany;
    entry.status = "Posted";
    this.state.journalEntries.push(entry);
    this.updateRetainedEarnings();
    this.saveState();
  }

  updateRetainedEarnings() {
    const revenues = this.state.accounts.filter(a => a.type === "Revenue" && a.parentCode).reduce((sum, a) => sum + a.balance, 0);
    const expenses = this.state.accounts.filter(a => a.type === "Expense" && a.parentCode).reduce((sum, a) => sum + a.balance, 0);
    const reAcct = this.getAccount("3100");
    if (reAcct) {
      reAcct.balance = parseFloat((revenues - expenses).toFixed(2));
    }
  }
}

export const store = new Store();
export default store;
