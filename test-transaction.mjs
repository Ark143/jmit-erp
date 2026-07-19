// Full O2C transaction test against the REAL compiled store (dist/store.js).
// Chain: SO (VAT 12% + WHT 2% rate-only charges + 50 fee) -> approve -> DN -> submit
//        -> SI -> submit (GL post) -> Payment Receive -> submit (GL post)
// Asserts totals, stock deduction, JE balance, account movements at every step.

// --- localStorage shim (store persists here) ---
const mem = {};
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; }
};

const { store } = await import("./dist/store.js");

let failures = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  ${ok ? "= " + JSON.stringify(actual) : "expected " + JSON.stringify(expected) + " got " + JSON.stringify(actual)}`);
  if (!ok) failures++;
}
const bal = (code) => store.getAccount(code).balance;

// --- login as admin (permissions) ---
store.login("admin", "jmit2026");
check("login admin", store.isLoggedIn(), true);

// --- baseline ---
const lap0 = store.getItem("ITM001");
const wh = "WH001";
const stock0 = lap0.stocks[wh];
const cash0 = bal("1010"), ar0 = bal("1200"), sales0 = bal("4100"), tax0 = bal("2200"),
      whtA0 = bal("1210"), cogs0 = bal("5100"), inv0 = bal("1300"), opex0 = bal("6010");
console.log(`baseline: stock(${wh})=${stock0} cash=${cash0} ar=${ar0}`);

// ============ STEP 1: CREATE SALES ORDER ============
const so = store.createSalesOrder({
  companyId: "CMP001",
  customerId: store.getPartners().customers[0].id,
  date: "2026-07-18",
  items: [{ itemId: "ITM001", qty: 2, uom: "pcs" }],
  currency: "PHP",
  rate: 1.0,
  taxAmount: 0,   // manual remainder (UI sends field - auto part)
  whtAmount: 0,
  salesAccountCode: "4100",
  otherCharges: [
    { accountCode: "2200", amount: 0, vatRate: 12, baseOn: "net", isVat: true,  isWht: false }, // 12% VAT rate-only
    { accountCode: "1210", amount: 0, vatRate: 2,  baseOn: "net", isVat: false, isWht: true  }, // 2% WHT rate-only
    { accountCode: "6010", amount: 50, vatRate: 0, baseOn: "net", isVat: false, isWht: false }  // fixed fee 50
  ]
});
check("SO subtotal", so.subtotal, 2400);
check("SO tax (12% of 2400)", so.tax, 288);
check("SO withholding (2%)", so.withholding, 48);
check("SO total (2400+288-48+50)", so.total, 2690);
check("SO status", so.status, "Draft");

// ============ STEP 2: APPROVE ============
store.approveSalesOrder(so.id);
check("SO approved", store.getSalesOrders().find(s => s.id === so.id).status, "Approved");

// ============ STEP 3: DELIVERY NOTE (items copied from SO like the UI does) ============
const dn = store.createDeliveryNote({
  salesOrderId: so.id,
  date: "2026-07-18",
  warehouseId: wh,
  items: so.items.map(i => ({ itemId: i.itemId, qty: i.qty, uom: i.uom }))
});
check("DN references SO", dn.salesOrderId, so.id);
check("DN items copied from SO", dn.items.map(i => i.itemId + "x" + i.qty), ["ITM001x2"]);
check("DN status", dn.status, "Draft");
store.submitDeliveryNote(dn.id);
check("DN submitted", store.getDeliveries().find(d => d.id === dn.id).status, "Submitted");
check("stock deducted 2", store.getItem("ITM001").stocks[wh], stock0 - 2);
check("SO -> Delivered", store.getSalesOrders().find(s => s.id === so.id).status, "Delivered");

// ============ STEP 4: SALES INVOICE + GL POST ============
const si = store.createSalesInvoice({ salesOrderId: so.id, deliveryNoteId: dn.id, date: "2026-07-18" });
check("SI totals copied", [si.subtotal, si.tax, si.withholding, si.total], [2400, 288, 48, 2690]);
check("SI status", si.status, "Draft");
store.submitSalesInvoice(si.id);
check("SI -> Unpaid", store.getSalesInvoices().find(s => s.id === si.id).status, "Unpaid");
check("SO -> Closed", store.getSalesOrders().find(s => s.id === so.id).status, "Closed");

const jeInv = store.getJournalEntries()[store.getJournalEntries().length - 1];
const dSum = jeInv.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
const cSum = jeInv.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
check("invoice JE balanced", Math.abs(dSum - cSum) < 0.01, true);
console.log("  JE lines:", jeInv.lines.map(l => `${l.code} D${l.debit} C${l.credit}`).join(" | "));
check("AR +2690", bal("1200"), ar0 + 2690);
check("Sales revenue +2400", bal("4100"), sales0 + 2400);
check("Output VAT +288", bal("2200"), tax0 + 288);
check("WHT receivable +48", bal("1210"), whtA0 + 48);
check("Other charges acct +50", bal("6010"), opex0 - 50); // 6010 is Expense: credit 50 lowers it
check("COGS +1600", bal("5100"), cogs0 + 1600);
check("Inventory -1600", bal("1300"), inv0 - 1600);

// ============ STEP 5: PAYMENT RECEIVE + GL POST ============
const pay = store.createPaymentEntry({
  type: "Receive",
  companyId: "CMP001",
  partnerId: so.customerId,
  referenceInvoiceId: si.id,
  reference: "Collection " + si.id,
  date: "2026-07-18",
  amount: si.total,
  currency: "PHP",
  rate: 1.0
});
check("payment draft", pay.status, "Draft");
store.submitPaymentEntry(pay.id);
check("SI -> Paid", store.getSalesInvoices().find(s => s.id === si.id).status, "Paid");
check("Cash +2690", bal("1010"), cash0 + 2690);
check("AR back to baseline", bal("1200"), ar0);

// ============ FINAL: every JE in the book balances ============
let unbalanced = 0;
store.getJournalEntries().forEach(je => {
  const d = je.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const c = je.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  if (Math.abs(d - c) > 0.01) { unbalanced++; console.log(`  UNBALANCED ${je.id}: D${d} C${c}`); }
});
check("all journal entries balanced", unbalanced, 0);

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
