import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCsv } from "../lib/csv.ts";
import {
  hundredths,
  planZohoImport,
  readZohoFiles,
  zohoDate,
} from "../lib/zoho-import.ts";

const csv = (rows: string[][]) =>
  rows
    .map((row) => row.map((f) => `"${f.replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

const contacts = csv([
  [
    "Customer ID",
    "Display Name",
    "Company Name",
    "First Name",
    "Last Name",
    "EmailID",
    "Currency Code",
    "Payment Terms",
    "Billing Address",
    "Billing City",
    "Billing Code",
    "Contact Type",
  ],
  [
    "c1",
    "Acme",
    "Acme Ltd",
    "Ada",
    "Lovelace",
    "Ada@Acme.test",
    "ZAR",
    "14",
    "1 Main Rd",
    "Cape Town",
    "8001",
    "customer",
  ],
  ["v1", "Supplier", "Supplier", "", "", "", "ZAR", "0", "", "", "", "vendor"],
]);

const quotes = csv([
  [
    "Quote Date",
    "Quote ID",
    "Quote Number",
    "Quote Status",
    "Customer ID",
    "Customer Name",
    "Expiry Date",
    "Currency Code",
    "Total",
    "Subject",
    "Notes",
    "Terms & Conditions",
    "Item Name",
    "Item Desc",
    "Quantity",
    "Item Price",
  ],
  [
    "2026/06/02",
    "q1",
    "QT-000001",
    "invoiced",
    "c1",
    "Acme",
    "2026/06/16",
    "ZAR",
    "3450.00",
    "Site build",
    "",
    "",
    "Design",
    'Two rounds,\nwith "notes"',
    "2.50",
    "1000.00",
  ],
  [
    "2026/06/02",
    "q1",
    "QT-000001",
    "invoiced",
    "c1",
    "Acme",
    "2026/06/16",
    "ZAR",
    "3450.00",
    "Site build",
    "",
    "",
    "Hosting",
    "",
    "1.00",
    "950.00",
  ],
]);

const invoices = csv([
  [
    "Invoice Date",
    "Invoice ID",
    "Invoice Number",
    "Invoice Status",
    "Customer ID",
    "Customer Name",
    "Due Date",
    "Currency Code",
    "Total",
    "Balance",
    "Last Payment Date",
    "Estimate Number",
    "Subject",
    "Notes",
    "Terms & Conditions",
    "Item Name",
    "Item Desc",
    "Quantity",
    "Item Price",
  ],
  [
    "2026/06/05",
    "i1",
    "INV-000002",
    "Overdue",
    "c1",
    "Acme",
    "2026/06/05",
    "ZAR",
    "3450.00",
    "2450.00",
    "2026/06/05",
    "QT-000001",
    "",
    "",
    "",
    "Design",
    "",
    "2.50",
    "1000.00",
  ],
  [
    "2026/06/05",
    "i1",
    "INV-000002",
    "Overdue",
    "c1",
    "Acme",
    "2026/06/05",
    "ZAR",
    "3450.00",
    "2450.00",
    "2026/06/05",
    "QT-000001",
    "",
    "",
    "",
    "Hosting",
    "",
    "1.00",
    "950.00",
  ],
  [
    "2026/05/01",
    "i2",
    "INV-000001",
    "Paid",
    "c1",
    "Acme",
    "2026/05/15",
    "ZAR",
    "500.00",
    "0.00",
    "2026/05/10",
    "",
    "",
    "",
    "",
    "Fix",
    "",
    "1.00",
    "500.00",
  ],
  [
    "2026/05/03",
    "i3",
    "INV-000003",
    "Sent",
    "c1",
    "Acme",
    "2026/05/15",
    "ZAR",
    "575.00",
    "575.00",
    "",
    "",
    "",
    "",
    "",
    "Fix + VAT",
    "",
    "1.00",
    "500.00",
  ],
  [
    "2026/05/04",
    "i4",
    "INV-000004",
    "Sent",
    "zz",
    "Unknown",
    "2026/05/15",
    "ZAR",
    "1.00",
    "1.00",
    "",
    "",
    "",
    "",
    "",
    "X",
    "",
    "1.00",
    "1.00",
  ],
]);

const payments = csv([
  [
    "CustomerPayment ID",
    "Invoice Number",
    "Date",
    "Amount",
    "Reference Number",
  ],
  ["p1", "INV-000001", "2026/05/10", "500.000", "EFT 123"],
]);

const plan = () =>
  planZohoImport(
    readZohoFiles([
      { name: "a.csv", text: contacts },
      { name: "b.csv", text: quotes },
      { name: "c.csv", text: invoices },
      { name: "d.csv", text: payments },
    ]).files,
  );

test("parseCsv handles BOMs, quoted commas, doubled quotes and newlines", () => {
  const rows = parseCsv('﻿a,b\r\n"1,2","say ""hi""\nthere"\r\n\r\n');
  assert.deepEqual(rows, [{ a: "1,2", b: 'say "hi"\nthere' }]);
});

test("readZohoFiles sorts files by their columns, not their names", () => {
  const { files, unknown } = readZohoFiles([
    { name: "Customer_Payment.csv", text: payments },
    { name: "x.csv", text: invoices },
    { name: "notes.csv", text: "hello,world\n1,2" },
  ]);
  assert.equal(files.payments.length, 1);
  assert.equal(files.invoices.length, 5);
  assert.deepEqual(unknown, ["notes.csv"]);
});

test("zohoDate and hundredths refuse what they can't read exactly", () => {
  assert.equal(zohoDate("2026/08/09"), "2026-08-09");
  assert.equal(zohoDate("09/08/2026"), null);
  assert.equal(hundredths("10320.000"), 1_032_000);
  assert.equal(hundredths("1.255"), null);
  assert.equal(hundredths("abc"), null);
});

test("customers: vendors skipped, emails lowercased, address joined", () => {
  const { customers } = plan();
  assert.equal(customers.length, 1);
  assert.deepEqual(customers[0], {
    zohoId: "c1",
    company: "Acme Ltd",
    contactName: "Ada Lovelace",
    emails: ["ada@acme.test"],
    address: "1 Main Rd\nCape Town\n8001",
    currency: "ZAR",
    termsDays: 14,
    notes: null,
  });
});

test("documents: quotes first, then invoices by date, with mapped statuses", () => {
  const { documents } = plan();
  assert.deepEqual(
    documents.map((d) => [d.kind, d.zohoNumber, d.status]),
    [
      ["quote", "QT-000001", "accepted"],
      ["invoice", "INV-000001", "paid"],
      ["invoice", "INV-000002", "sent"],
    ],
  );
  const [quote, paid, overdue] = documents;
  assert.equal(quote.lines[0].description, 'Design\nTwo rounds,\nwith "notes"');
  assert.equal(quote.lines[0].quantityHundredths, 250);
  assert.equal(quote.totalMinor, 345_000);
  assert.equal(quote.acceptedOn, "2026-06-05");
  assert.equal(quote.validUntil, "2026-06-16");
  assert.equal(paid.paidAt, "2026-05-10");
  assert.equal(paid.paymentRef, "EFT 123");
  assert.equal(overdue.fromQuote, "QT-000001");
  assert.equal(overdue.sentOn, "2026-06-05");
  assert.equal(overdue.dueDate, "2026-06-05");
});

test("totals that don't match the lines, and unknown customers, are left out", () => {
  const { problems, warnings } = plan();
  assert.equal(problems.length, 2);
  assert.match(problems[0], /^INV-000003: Zoho's total is R\s?575\.00/);
  assert.match(problems[1], /^INV-000004: its customer \(Unknown\)/);
  assert.equal(warnings.length, 1);
  assert.match(
    warnings[0],
    /^INV-000002 has R\s?1[\s,]?000\.00 of R\s?3[\s,]?450\.00 paid/,
  );
});
