// ─── Core Entity Types ───

export interface Company {
  id: string;
  name: string;
  taxId: string;
  address: string;
  currency: string;
}

export interface SKURule {
  prefix: string;
  sequence: number;
  suffix: string;
}

export interface GLMappings {
  cashAccount: string;
  arAccount: string;
  apAccount: string;
  whtAssetAccount: string;
  inventoryAccount: string;
  taxAccount: string;
  whtLiabilityAccount: string;
  salesAccount: string;
  cogsAccount: string;
  opexAccount: string;
  deprExpenseAccount: string;
  accumDeprAccount: string;
}

export interface WorkflowRequirements {
  soApproval: boolean;
  dnSubmission: boolean;
  siSubmission: boolean;
  poApproval: boolean;
  grnSubmission: boolean;
  piSubmission: boolean;
  paymentSubmission: boolean;
  journalSubmission: boolean;
}

export interface FiscalPeriod {
  name: string;
  start: string;
  end: string;
  closed: boolean;
}

export interface Settings {
  activeCompany: string;
  companies: Company[];
  activeCurrency: string;
  exchangeRates: Record<string, number>;
  periods: FiscalPeriod[];
  skuRule: SKURule;
  glMappings: GLMappings;
  workflowRequirements: WorkflowRequirements;
}

// ─── Auth & RBAC ───

export interface Permission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  approve: boolean;
}

export interface RolePermissions {
  o2c: Permission;
  p2p: Permission;
  inventory: Permission;
  accounting: Permission;
  finance: Permission;
  settings: Permission;
}

export interface Role {
  id: string;
  name: string;
  permissions: RolePermissions;
}

export interface User {
  id: string;
  username: string;
  name: string;
  roleId: string;
  companyIds: string[];
  password: string;
}

// ─── Business Partners ───

export interface Lead {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  status: string;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  taxRate: number;
  whtRate: number;
}

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  defaultTerms: string;
}

export interface Partners {
  leads: Lead[];
  customers: Customer[];
  vendors: Vendor[];
}

// ─── Inventory ───

export interface Warehouse {
  id: string;
  name: string;
  address: string;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  category: string;
  uom: string;
  cost: number;
  price: number;
  stocks: Record<string, number>;
  reorder: number;
}

export interface UOMConversion {
  from: string;
  to: string;
  rate: number;
}

// ─── Chart of Accounts ───

export interface Account {
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  parentCode: string | null;
  balance: number;
}

// ─── Fixed Assets ───

export interface FixedAsset {
  id: string;
  name: string;
  purchaseDate: string;
  cost: number;
  usefulLife: number;
  salvageValue: number;
  accumDepreciation: number;
  assetAccount: string;
  deprAccount: string;
  expenseAccount: string;
  active: boolean;
}

export interface DepreciationScheduleEntry {
  period: number;
  date: string;
  yearMonth: string;
  deprAmount: number;
  accumDepreciation: number;
  netBookValue: number;
}

// ─── Document Line Items ───

export interface SOLine {
  itemId: string;
  qty: number;
  uom: string;
}

export interface SalesOrderItem {
  itemId: string;
  sku: string;
  name: string;
  qty: number;
  price: number;
  uom: string;
}

export interface SalesOrder {
  id: string;
  companyId: string;
  customerId: string;
  customerName: string;
  date: string;
  items: SalesOrderItem[];
  currency: string;
  rate: number;
  subtotal: number;
  tax: number;
  withholding: number;
  total: number;
  status: string;
}

export interface DeliveryLine {
  itemId: string;
  sku: string;
  qty: number;
  uom: string;
}

export interface DeliveryNote {
  id: string;
  salesOrderId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  date: string;
  items: DeliveryLine[];
  warehouseId: string;
  status: string;
}

export interface SalesInvoice {
  id: string;
  salesOrderId: string;
  deliveryNoteId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  date: string;
  items: SalesOrderItem[];
  subtotal: number;
  tax: number;
  withholding: number;
  total: number;
  status: string;
}

export interface SalesReturn {
  id: string;
  salesInvoiceId: string;
  customerId: string;
  customerName: string;
  date: string;
  items: { itemId: string; qty: number; uom: string }[];
  totalReturn: number;
  status: string;
}

// ─── P2P ───

export interface PurchaseOrderItem {
  itemId: string;
  sku: string;
  name: string;
  qty: number;
  cost: number;
  uom: string;
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  vendorId: string;
  vendorName: string;
  date: string;
  items: PurchaseOrderItem[];
  currency: string;
  rate: number;
  total: number;
  status: string;
}

export interface GRNLine {
  itemId: string;
  acceptedQty: number;
  rejectedQty: number;
  uom: string;
}

export interface GoodsReceiptNote {
  id: string;
  purchaseOrderId: string;
  companyId: string;
  vendorId: string;
  vendorName: string;
  date: string;
  items: GRNLine[];
  warehouseId: string;
  status: string;
}

export interface PurchaseInvoice {
  id: string;
  purchaseOrderId: string;
  goodsReceiptId: string;
  companyId: string;
  vendorId: string;
  vendorName: string;
  date: string;
  items: PurchaseOrderItem[];
  total: number;
  status: string;
}

export interface PurchaseReturn {
  id: string;
  purchaseInvoiceId: string;
  vendorId: string;
  vendorName: string;
  date: string;
  items: { itemId: string; qty: number; uom: string }[];
  totalReturn: number;
  status: string;
}

// ─── Treasury ───

export interface Payment {
  id: string;
  type: "Receive" | "Pay";
  companyId: string;
  partnerId: string;
  partnerName: string;
  referenceInvoiceId: string;
  reference: string;
  date: string;
  amount: number;
  currency: string;
  rate: number;
  status: string;
}

// ─── Stock Movements ───

export interface StockEntry {
  id: string;
  type: string;
  date: string;
  items: { itemId: string; qty?: number; acceptedQty?: number; rejectedQty?: number; uom?: string }[];
  sourceWarehouseId: string;
  targetWarehouseId: string;
  reason: string;
  status: string;
}

// ─── General Ledger ───

export interface JournalLine {
  code: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  lines: JournalLine[];
  companyId: string;
  status: string;
}

// ─── App State ───

export interface AppState {
  settings: Settings;
  users: User[];
  roles: Role[];
  currentUser: string;
  partners: Partners;
  warehouses: Warehouse[];
  items: Item[];
  uomConversions: UOMConversion[];
  fixedAssets: FixedAsset[];
  accounts: Account[];
  salesOrders: SalesOrder[];
  deliveries: DeliveryNote[];
  salesInvoices: SalesInvoice[];
  salesReturns: SalesReturn[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceiptNote[];
  purchaseInvoices: PurchaseInvoice[];
  purchaseReturns: PurchaseReturn[];
  payments: Payment[];
  stockEntries: StockEntry[];
  journalEntries: JournalEntry[];
}

// ─── Store Interface (Dependency Inversion — views depend on this, not the class) ───
export interface IStore {
  // State access
  getSettings(): Settings;
  getCompanies(): Company[];
  getPartners(): Partners[];
  getWarehouses(): Warehouse[];
  getItems(): Item[];
  getUsers(): User[];
  getRoles(): Role[];
  getCurrentUser(): User | undefined;
  getCurrentRole(): Role | undefined;

  // Auth
  login(username: string, password: string): User;
  logout(): void;
  isLoggedIn(): boolean;
  checkPermission(module: string, action: string): boolean;

  // Documents
  getSalesOrders(): SalesOrder[];
  getDeliveries(): DeliveryNote[];
  getSalesInvoices(): SalesInvoice[];
  getPurchaseOrders(): PurchaseOrder[];
  getGoodsReceipts(): GoodsReceiptNote[];
  getPurchaseInvoices(): PurchaseInvoice[];
  getPayments(): Payment[];
  getJournalEntries(): JournalEntry[];

  // Inventory
  getUOMConversions(): UOMConversion[];
  getProductCategories(): string[];
  generateSKU(): string;

  // Mutations
  saveState(): void;
  resetDatabase(): void;
}
