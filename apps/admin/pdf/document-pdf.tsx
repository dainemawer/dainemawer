import path from "node:path";
import { LOGO_PATH_D, LOGO_VIEWBOX } from "@dm/ui/logo-mark";
import {
  Document,
  Font,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import type {
  Customer,
  Document as Doc,
  LineItem,
  Settings,
} from "@/db/schema";
import { formatDate } from "@/lib/documents";
import { formatMoney } from "@/lib/money";
import { formatQuantity, formatTaxRate } from "@/lib/totals";

// The quote/invoice PDF: what clients receive as the attachment and what
// the in-app preview shows (both come from /documents/[id]/pdf), so the
// two can't differ. Same type and palette as the blog.

const fontDir = path.join(process.cwd(), "pdf/fonts");
Font.register({
  family: "Figtree",
  fonts: [
    { src: path.join(fontDir, "figtree-400.ttf"), fontWeight: 400 },
    { src: path.join(fontDir, "figtree-500.ttf"), fontWeight: 500 },
    { src: path.join(fontDir, "figtree-700.ttf"), fontWeight: 700 },
  ],
});
// Words never hyphenate mid-line in a client-facing document.
Font.registerHyphenationCallback((word) => [word]);

const ink = "#111111";
const muted = "#6b6b6b";
const divider = "#cfcfcf";
const A4_HEIGHT = 841.89;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Figtree",
    fontSize: 9.5,
    color: ink,
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 52,
    lineHeight: 1.45,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 36,
  },
  // Unitless lineHeight is inherited as points from the page's 9.5pt
  // body size, so larger text sets its own.
  title: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.3,
    lineHeight: 1.15,
  },
  number: { fontSize: 10, color: muted, marginTop: 4 },
  from: { textAlign: "right", color: muted },
  fromName: { color: ink, fontWeight: 500 },
  meta: { flexDirection: "row", marginBottom: 28 },
  metaBlock: { flex: 1, paddingRight: 16 },
  label: {
    fontSize: 7.5,
    fontWeight: 500,
    color: muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  strong: { fontWeight: 500 },
  docTitle: {
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.3,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: divider,
  },
  headRow: { borderBottomWidth: 1, borderBottomColor: ink, paddingVertical: 5 },
  colDescription: { flex: 1, paddingRight: 12 },
  colQty: { width: 48, textAlign: "right" },
  colPrice: { width: 84, textAlign: "right" },
  colAmount: { width: 92, textAlign: "right" },
  totals: { marginTop: 12, marginLeft: "auto", width: 224 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  grandTotal: {
    lineHeight: 1.3,
    borderTopWidth: 1,
    borderTopColor: ink,
    marginTop: 4,
    paddingTop: 7,
    fontSize: 12,
    fontWeight: 700,
  },
  section: { marginTop: 28 },
  body: { color: ink },
  // Placed from the top: with a page-level lineHeight, react-pdf drops
  // absolutely positioned elements anchored with `bottom`.
  footer: {
    position: "absolute",
    top: A4_HEIGHT - 32 - 10,
    left: 52,
    right: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: muted,
  },
});

export type PdfData = {
  settings: Settings;
  customer: Customer;
  document: Doc;
  lines: LineItem[];
};

export function DocumentPdf({ settings, customer, document, lines }: PdfData) {
  const isQuote = document.kind === "quote";
  const money = (minor: number) => formatMoney(minor, document.currency);
  const label = isQuote ? "Quote" : "Invoice";

  return (
    <Document
      title={`${label} ${document.number}`}
      author={settings.businessName}
      creator="admin.dainemawer.com"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Svg
              viewBox={LOGO_VIEWBOX}
              style={{ width: 120, height: 16, marginBottom: 18 }}
            >
              <Path d={LOGO_PATH_D} fill={ink} stroke={ink} strokeWidth={0.5} />
            </Svg>
            <Text style={styles.title}>{label}</Text>
            <Text style={styles.number}>{document.number}</Text>
          </View>
          <View style={styles.from}>
            <Text style={styles.fromName}>{settings.businessName}</Text>
            {settings.address ? <Text>{settings.address}</Text> : null}
            {settings.email ? <Text>{settings.email}</Text> : null}
            {settings.phone ? <Text>{settings.phone}</Text> : null}
            {settings.website ? <Text>{settings.website}</Text> : null}
            {settings.taxNumber ? (
              <Text>Tax no. {settings.taxNumber}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>
              {isQuote ? "Prepared for" : "Bill to"}
            </Text>
            <Text style={styles.strong}>{customer.company}</Text>
            {customer.contactName ? <Text>{customer.contactName}</Text> : null}
            {customer.address ? <Text>{customer.address}</Text> : null}
            {customer.taxNumber ? (
              <Text>Tax no. {customer.taxNumber}</Text>
            ) : null}
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>Issued</Text>
            <Text>{formatDate(document.issueDate)}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>{isQuote ? "Valid until" : "Due"}</Text>
            <Text style={styles.strong}>
              {formatDate(isQuote ? document.validUntil : document.dueDate)}
            </Text>
          </View>
          <View
            style={[styles.metaBlock, { paddingRight: 0, textAlign: "right" }]}
          >
            <Text style={styles.label}>{isQuote ? "Total" : "Amount due"}</Text>
            <Text style={styles.strong}>
              {money(document.totalMinor - (isQuote ? 0 : document.paidMinor))}
            </Text>
          </View>
        </View>

        {document.title ? (
          <Text style={styles.docTitle}>{document.title}</Text>
        ) : null}

        <View style={[styles.row, styles.headRow]} fixed>
          <Text
            style={[styles.label, styles.colDescription, { marginBottom: 0 }]}
          >
            Description
          </Text>
          <Text style={[styles.label, styles.colQty, { marginBottom: 0 }]}>
            Qty
          </Text>
          <Text style={[styles.label, styles.colPrice, { marginBottom: 0 }]}>
            Unit price
          </Text>
          <Text style={[styles.label, styles.colAmount, { marginBottom: 0 }]}>
            Amount
          </Text>
        </View>
        {lines.map((line) => (
          <View key={line.id} style={styles.row} wrap={false}>
            <Text style={styles.colDescription}>{line.description}</Text>
            <Text style={styles.colQty}>
              {formatQuantity(line.quantityHundredths)}
            </Text>
            <Text style={styles.colPrice}>{money(line.unitPriceMinor)}</Text>
            <Text style={styles.colAmount}>{money(line.amountMinor)}</Text>
          </View>
        ))}

        <View style={styles.totals} wrap={false}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{money(document.subtotalMinor)}</Text>
          </View>
          {document.discountMinor ? (
            <View style={styles.totalRow}>
              <Text>Discount</Text>
              <Text>−{money(document.discountMinor)}</Text>
            </View>
          ) : null}
          {document.taxRateBp ? (
            <View style={styles.totalRow}>
              <Text>Tax ({formatTaxRate(document.taxRateBp)}%)</Text>
              <Text>{money(document.taxMinor)}</Text>
            </View>
          ) : null}
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>Total {document.currency}</Text>
            <Text>{money(document.totalMinor)}</Text>
          </View>
          {!isQuote && document.paidMinor > 0 ? (
            <>
              <View style={styles.totalRow}>
                <Text>Paid</Text>
                <Text>−{money(document.paidMinor)}</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotal]}>
                <Text>Balance due {document.currency}</Text>
                <Text>{money(document.totalMinor - document.paidMinor)}</Text>
              </View>
            </>
          ) : null}
        </View>

        {document.notes ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.body}>{document.notes}</Text>
          </View>
        ) : null}

        {!isQuote && settings.bankDetails ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.label}>Payment details</Text>
            <Text style={styles.body}>{settings.bankDetails}</Text>
            <Text style={[styles.body, { color: muted, marginTop: 4 }]}>
              Please use {document.number} as the payment reference.
            </Text>
          </View>
        ) : null}

        {document.terms ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.label}>Terms</Text>
            <Text style={[styles.body, { color: muted }]}>
              {document.terms}
            </Text>
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>
            {settings.businessName} · {label} {document.number}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
