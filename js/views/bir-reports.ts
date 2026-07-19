// JMIT ERP — BIR CAS Compliance Reports (Philippines)
// 7 BIR-mandated reports: Cash Disbursement, General Ledger, Expense Journal,
// Tax Journal, VAT Cash Receipt, VAT Sales Journal, Subsidiary Ledger
import { store } from "../store";
import { formatMoney } from "../utils";

// ─── shared helpers ───

function birTable(title: string, subtitle: string, columns: string[], body: string): string {
  return `<div class="card animate-fade-in">
    <div class="card-header"><h3 class="card-title">${title}</h3>
      <div class="no-print"><button onclick="window.print()" class="btn btn-outline btn-sm">🖨️ Print</button></div></div>
    <p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:12px;">${subtitle}</p>
    <div class="table-container"><table class="bir-report">
      <thead><tr>${columns.map(c => `<th>${c}</th>`).join("")}</tr></thead>
      <tbody>${body || '<tr><td colspan="'+columns.length+'" style="text-align:center;padding:24px;">No records for this period</td></tr>'}</tbody>
    </table></div></div>`;
}

// ─── 1. BIR CASH DISBURSEMENT JOURNAL ───
export function renderBIRCashDisbursement(container: HTMLElement) {
  const payments = store.getPayments().filter((p: any) => p.type === "Pay");
  let rows = "", totalDr = 0, totalCr = 0;
  payments.forEach((p: any) => {
    const partner = store.getPartner(p.partnerId);
    rows += `<tr>
      <td>${p.date}</td><td style="font-family:monospace;">${p.id}</td>
      <td>${p.partnerName}</td><td>${partner?.taxId || "—"}</td><td>${partner?.address || "—"}</td>
      <td>Payment to ${p.partnerName}</td>
      <td style="text-align:right;">${formatMoney(0)}</td>
      <td style="text-align:right;">${formatMoney(p.amount)}</td>
      <td style="text-align:right;">${formatMoney(0)}</td>
      <td style="text-align:right;">${formatMoney(p.amount)}</td>
    </tr>`;
    totalDr += p.amount; totalCr += p.amount;
  });
  container.innerHTML = birTable("BIR Cash Disbursement Journal", "For the period",
    ["Date","Ref#","Payee","TIN","Address","Description","VAT Input (Dr)","Non-VAT (Dr)","WHT (Cr)","Cash/Bank (Cr)"], rows)
    + `<div class="card" style="text-align:right;margin-top:8px;"><strong>Totals:</strong> Dr: ${formatMoney(totalDr)} | Cr: ${formatMoney(totalCr)}</div>`;
}

// ─── 2. BIR GENERAL LEDGER ───
export function renderBIRGeneralLedger(container: HTMLElement) {
  const accounts = store.getAccounts();
  const entries = store.getJournalEntries();
  let body = "";
  accounts.forEach((acct: any) => {
    let balance = 0;
    const lines = entries.flatMap((je: any) =>
      je.lines.filter((l: any) => l.code === acct.code).map((l: any) => ({ ...l, date: je.date, ref: je.reference }))
    );
    if (lines.length === 0) return;
    body += `<tr style="background:rgba(255,255,255,0.03);"><td colspan="6" style="font-weight:700;color:var(--color-primary);">${acct.code} — ${acct.name} (${acct.type})</td></tr>`;
    lines.forEach((l: any) => {
      const dr = l.debit || 0, cr = l.credit || 0;
      balance += (acct.type === "Asset" || acct.type === "Expense") ? (dr - cr) : (cr - dr);
      body += `<tr>
        <td>${l.date}</td><td style="font-family:monospace;font-size:0.72rem;">${l.ref}</td>
        <td>${l.ref.slice(0, 40)}</td>
        <td style="text-align:right;">${dr > 0 ? formatMoney(dr) : ""}</td>
        <td style="text-align:right;">${cr > 0 ? formatMoney(cr) : ""}</td>
        <td style="text-align:right;font-weight:700;">${formatMoney(balance)}</td>
      </tr>`;
    });
  });
  container.innerHTML = birTable("BIR General Ledger", "All accounts — running balance",
    ["Date","Ref","Description","Debit","Credit","Balance"], body);
}

// ─── 3. BIR EXPENSE JOURNAL ───
export function renderBIRExpenseJournal(container: HTMLElement) {
  const entries = store.getJournalEntries();
  const accounts = store.getAccounts();
  const expAccts = accounts.filter((a: any) => a.type === "Expense");
  let rows = "";
  expAccts.forEach((acct: any) => {
    entries.forEach((je: any) => {
      je.lines.filter((l: any) => l.code === acct.code && l.debit > 0).forEach((l: any) => {
        const pi = store.getPurchaseInvoices().find((p: any) => p.id && je.reference.includes(p.id));
        rows += `<tr>
          <td>${je.date}</td><td style="font-family:monospace;">${je.id}</td>
          <td>${pi?.vendorName || "—"}</td><td>—</td><td>—</td>
          <td>${je.reference.slice(0, 50)}</td>
          <td style="text-align:right;">${formatMoney(l.debit)}</td>
          <td style="text-align:right;">${formatMoney(0)}</td>
          <td style="text-align:right;">${formatMoney(0)}</td>
          <td style="text-align:right;">${formatMoney(l.debit)}</td>
        </tr>`;
      });
    });
  });
  container.innerHTML = birTable("BIR Expense Journal", "Expense account postings",
    ["Date","Ref#","Vendor","TIN","Address","Description","Amount (Dr)","VAT Input (Dr)","WHT (Cr)","Cash/AP (Cr)"], rows);
}

// ─── 4. BIR TAX JOURNAL ───
export function renderBIRTaxJournal(container: HTMLElement) {
  const entries = store.getJournalEntries();
  const maps = store.getSettings().glMappings;
  let rows = "", totalOutput = 0, totalInput = 0, totalWht = 0;
  entries.forEach((je: any) => {
    let outputVat = 0, inputVat = 0, whtRemitted = 0;
    je.lines.forEach((l: any) => {
      if (l.code === maps.taxAccount && l.credit > 0) outputVat += l.credit;
      if (l.code === (maps.inputVatAccount || "1220") && l.debit > 0) inputVat += l.debit;
      if (l.code === maps.whtLiabilityAccount && l.credit > 0) whtRemitted += l.credit;
    });
    if (outputVat === 0 && inputVat === 0 && whtRemitted === 0) return;
    rows += `<tr>
      <td>${je.date}</td><td style="font-family:monospace;">${je.id}</td>
      <td>${je.reference.slice(0, 50)}</td>
      <td style="text-align:right;">${outputVat > 0 ? formatMoney(outputVat) : ""}</td>
      <td style="text-align:right;">${inputVat > 0 ? formatMoney(inputVat) : ""}</td>
      <td style="text-align:right;">${whtRemitted > 0 ? formatMoney(whtRemitted) : ""}</td>
      <td style="text-align:right;font-weight:700;">${formatMoney(outputVat - inputVat - whtRemitted)}</td>
    </tr>`;
    totalOutput += outputVat; totalInput += inputVat; totalWht += whtRemitted;
  });
  container.innerHTML = birTable("BIR Tax Journal", "VAT & WHT summary per journal entry",
    ["Date","JE#","Description","Output VAT (Cr)","Input VAT (Dr)","WHT Remitted","Net Tax Payable"], rows)
    + `<div class="card" style="text-align:right;margin-top:8px;"><strong>Totals:</strong> Output VAT: ${formatMoney(totalOutput)} | Input VAT: ${formatMoney(totalInput)} | WHT: ${formatMoney(totalWht)} | Net: ${formatMoney(totalOutput - totalInput - totalWht)}</div>`;
}

// ─── 5. BIR VAT CASH RECEIPT ───
export function renderBIRVATCashReceipt(container: HTMLElement) {
  const receipts = store.getPayments().filter((p: any) => p.type === "Receive");
  let rows = "", totalSales = 0, totalVat = 0, totalCash = 0;
  receipts.forEach((p: any) => {
    const si = store.getSalesInvoices().find((s: any) => s.id === p.referenceInvoiceId);
    const partner = store.getPartner(p.partnerId);
    const vatAmt = si ? (si.tax || 0) : 0;
    const salesAmt = (p.amount || 0) - vatAmt;
    rows += `<tr>
      <td>${p.date}</td><td style="font-family:monospace;">${p.id}</td>
      <td>${p.partnerName}</td><td>${partner?.taxId || "—"}</td><td>${partner?.address || "—"}</td>
      <td>Payment received</td>
      <td style="text-align:right;">${formatMoney(salesAmt)}</td>
      <td style="text-align:right;">${formatMoney(vatAmt)}</td>
      <td style="text-align:right;">${formatMoney(0)}</td>
      <td style="text-align:right;">${formatMoney(p.amount)}</td>
    </tr>`;
    totalSales += salesAmt; totalVat += vatAmt; totalCash += p.amount;
  });
  container.innerHTML = birTable("BIR VAT Cash Receipt Journal", "Receipts from customers",
    ["Date","OR#","Customer","TIN","Address","Description","Sales (Cr)","Output VAT (Cr)","WHT (Dr)","Cash (Dr)"], rows)
    + `<div class="card" style="text-align:right;margin-top:8px;"><strong>Totals:</strong> Sales: ${formatMoney(totalSales)} | VAT: ${formatMoney(totalVat)} | Cash: ${formatMoney(totalCash)}</div>`;
}

// ─── 6. BIR VAT SALES JOURNAL ───
export function renderBIRVATSalesJournal(container: HTMLElement) {
  const invoices = store.getSalesInvoices();
  let rows = "", totalVatSales = 0, totalVat = 0, totalNonVat = 0, grandTotal = 0;
  invoices.forEach((si: any) => {
    const vatAmt = si.tax || 0;
    const nonVat = (si.total || 0) - vatAmt - (si.subtotal || 0) + (si.otherChargesTotal || 0);
    const vatSales = (si.subtotal || 0);
    rows += `<tr>
      <td>${si.date}</td><td style="font-family:monospace;">${si.id}</td>
      <td>${si.customerName}</td><td>—</td><td>—</td>
      <td>Sales Invoice</td>
      <td style="text-align:right;">${formatMoney(vatSales)}</td>
      <td style="text-align:right;">${formatMoney(vatAmt)}</td>
      <td style="text-align:right;">${formatMoney(Math.max(0, nonVat))}</td>
      <td style="text-align:right;font-weight:700;">${formatMoney(si.total)}</td>
    </tr>`;
    totalVatSales += vatSales; totalVat += vatAmt; totalNonVat += Math.max(0, nonVat); grandTotal += si.total;
  });
  container.innerHTML = birTable("BIR VAT Sales Journal", "All sales invoices",
    ["Date","SI#","Customer","TIN","Address","Description","VAT Sales (Cr)","VAT Amount (Cr)","Non-VAT (Cr)","Total (Cr)"], rows)
    + `<div class="card" style="text-align:right;margin-top:8px;"><strong>Totals:</strong> VAT Sales: ${formatMoney(totalVatSales)} | VAT: ${formatMoney(totalVat)} | Non-VAT: ${formatMoney(totalNonVat)} | Grand: ${formatMoney(grandTotal)}</div>`;
}

// ─── 7. BIR SUBSIDIARY LEDGER ───
export function renderBIRSubsidiaryLedger(container: HTMLElement) {
  const partners = [...store.getPartners().customers, ...store.getPartners().vendors];
  const invoices = [...store.getSalesInvoices(), ...store.getPurchaseInvoices()];
  const payments = store.getPayments();
  let body = "";
  partners.forEach((p: any) => {
    let balance = 0, hasActivity = false;
    let subRows = "";
    // Sales invoices (debit AR / customer owes)
    invoices.filter((i: any) => i.customerId === p.id).forEach((i: any) => {
      balance += i.total || 0; hasActivity = true;
      subRows += `<tr><td>${i.date}</td><td style="font-family:monospace;">${i.id}</td><td>Sales Invoice</td><td style="text-align:right;">${formatMoney(i.total)}</td><td style="text-align:right;"></td><td style="text-align:right;">${formatMoney(balance)}</td></tr>`;
    });
    // Purchase invoices (credit AP / we owe vendor)
    invoices.filter((i: any) => i.vendorId === p.id).forEach((i: any) => {
      balance += i.total || 0; hasActivity = true;
      subRows += `<tr><td>${i.date}</td><td style="font-family:monospace;">${i.id}</td><td>Purchase Invoice</td><td style="text-align:right;"></td><td style="text-align:right;">${formatMoney(i.total)}</td><td style="text-align:right;">${formatMoney(balance)}</td></tr>`;
    });
    // Payments
    payments.filter((pm: any) => pm.partnerId === p.id).forEach((pm: any) => {
      if (pm.type === "Receive") balance -= pm.amount; else balance -= pm.amount;
      hasActivity = true;
      subRows += `<tr><td>${pm.date}</td><td style="font-family:monospace;">${pm.id}</td><td>Payment (${pm.type})</td><td style="text-align:right;">${pm.type === "Pay" ? formatMoney(pm.amount) : ""}</td><td style="text-align:right;">${pm.type === "Receive" ? formatMoney(pm.amount) : ""}</td><td style="text-align:right;">${formatMoney(Math.abs(balance))}</td></tr>`;
    });
    if (!hasActivity) return;
    body += `<tr style="background:rgba(255,255,255,0.03);"><td colspan="6" style="font-weight:700;color:var(--color-primary);">${p.name} (TIN: ${p.taxId || "—"})</td></tr>`;
    body += subRows;
  });
  container.innerHTML = birTable("BIR Subsidiary Ledger", "Per customer/vendor — running balance",
    ["Date","Ref#","Description","Debit","Credit","Balance"], body);
}

// ─── MAIN BIR ROUTER ───
export function renderBIR(container: HTMLElement, pathParts: string[]) {
  const report = pathParts[1] || "cash-disbursement";

  const tabs = [
    { label: "Cash Disbursement", hash: "bir/cash-disbursement" },
    { label: "General Ledger", hash: "bir/general-ledger" },
    { label: "Expense Journal", hash: "bir/expense-journal" },
    { label: "Tax Journal", hash: "bir/tax-journal" },
    { label: "VAT Cash Receipt", hash: "bir/vat-cash-receipt" },
    { label: "VAT Sales Journal", hash: "bir/vat-sales-journal" },
    { label: "Subsidiary Ledger", hash: "bir/subsidiary-ledger" },
  ];

  container.innerHTML = `<div class="animate-fade-in">
    <div class="settings-tab-nav" style="flex-wrap:wrap;">${tabs.map(t =>
      `<button class="settings-tab-btn ${report === t.hash.split('/')[1] ? 'active' : ''}" onclick="window.location.hash='#${t.hash}'">📋 ${t.label}</button>`
    ).join("")}</div>
    <div id="bir-viewport" style="margin-top:16px;"></div>
  </div>`;

  const vp = container.querySelector("#bir-viewport") as HTMLElement;
  if (report === "cash-disbursement") renderBIRCashDisbursement(vp);
  else if (report === "general-ledger") renderBIRGeneralLedger(vp);
  else if (report === "expense-journal") renderBIRExpenseJournal(vp);
  else if (report === "tax-journal") renderBIRTaxJournal(vp);
  else if (report === "vat-cash-receipt") renderBIRVATCashReceipt(vp);
  else if (report === "vat-sales-journal") renderBIRVATSalesJournal(vp);
  else if (report === "subsidiary-ledger") renderBIRSubsidiaryLedger(vp);
}
