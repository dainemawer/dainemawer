import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { clockTime, dayOf, SOURCE_LABEL } from "@/lib/agenda";
import { getAgenda } from "@/lib/calendar-feeds";
import { activeCurrencies, getDashboard } from "@/lib/dashboard";
import {
  getBalances,
  getOverview,
  listMonthTransactions,
} from "@/lib/expenses/queries";
import { netFor } from "@/lib/expenses/transactions";
import {
  type AmountsByCurrency,
  type Currency,
  formatMoney,
  isCurrency,
} from "@/lib/money";
import {
  getDocument,
  listCustomers,
  listDocuments,
  listRecurring,
} from "@/lib/queries";
import { appUrl } from "@/lib/telegram";

// What the Telegram assistant can look up. Every tool only reads, through
// the same data layer as the pages (lib/session.ts asOwner() stands in for
// the browser session), so its numbers match the dashboard. Money goes out
// formatted, each figure in its own currency, so the model never has to
// convert minor units or add rands to dollars.

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const money = (amounts: AmountsByCurrency) =>
  Object.entries(amounts)
    .map(([currency, minor]) => formatMoney(minor ?? 0, currency as Currency))
    .join(" + ") || "nothing";

/** A failed lookup goes back to the model as an error it can explain. */
function safely<I, O>(run: (input: I) => Promise<O>) {
  return async (input: I) => {
    try {
      return await run(input);
    } catch (error) {
      console.error("[assistant] tool failed", error);
      return {
        error:
          error instanceof Error ? error.message : "That lookup didn't work.",
      };
    }
  };
}

export const tools = {
  overview: tool({
    description:
      "The business at a glance in one currency: outstanding and overdue invoices, paid this month and this year, open quotes, quote win rate, invoiced and paid per month for the last 12 months, overdue invoices, quotes awaiting a reply, top customers this year and recent activity.",
    inputSchema: z.object({
      currency: z
        .string()
        .optional()
        .describe("ZAR, USD, EUR or GBP. Defaults to the most used one."),
    }),
    execute: safely(async ({ currency }) => {
      const currencies = await activeCurrencies();
      const chosen: Currency = isCurrency(currency)
        ? currency
        : (currencies[0] ?? "ZAR");
      const m = (minor: number) => formatMoney(minor, chosen);
      const { today, stats, months, overdue, awaiting, top, activity } =
        await getDashboard(chosen);
      return {
        today,
        currency: chosen,
        otherCurrencies: currencies.filter((c) => c !== chosen),
        outstanding: `${m(stats.outstanding)} (${plural(stats.outstandingCount, "invoice")})`,
        overdue: `${m(stats.overdue)} (${plural(stats.overdueCount, "invoice")})`,
        paidThisMonth: m(stats.paidMonth),
        paidThisYear: m(stats.paidYear),
        openQuotes: `${m(stats.openQuotes)} (${plural(stats.openQuoteCount, "quote")})`,
        quoteWinRate:
          stats.winRate === null
            ? "no decided quotes in the last 12 months"
            : `${Math.round(stats.winRate * 100)}% of ${stats.decided} decided`,
        months: months.map((month) => ({
          month: month.month,
          invoiced: m(month.invoiced),
          paid: m(month.paid),
        })),
        overdueInvoices: overdue.map(({ document, company }) => ({
          number: document.number,
          company,
          due: document.dueDate,
          total: m(document.totalMinor),
        })),
        quotesAwaitingReply: awaiting.map(({ document, company }) => ({
          number: document.number,
          company,
          validUntil: document.validUntil,
          total: m(document.totalMinor),
        })),
        topCustomersThisYear: top.map((c) => ({
          company: c.company,
          paid: m(c.paid),
        })),
        recentActivity: activity.map((event) => ({
          what: `${event.number} ${event.kind}`,
          company: event.company,
          at: event.at,
          total: formatMoney(event.totalMinor, event.currency),
        })),
      };
    }),
  }),

  documents: tool({
    description:
      "Lists invoices and/or quotes, newest first, optionally filtered. Statuses: draft, sent, accepted, declined, paid, void, plus overdue (a sent invoice past due) and expired (a sent quote past its valid-until date).",
    inputSchema: z.object({
      kind: z.enum(["invoice", "quote"]).optional(),
      status: z.string().optional(),
      customer: z
        .string()
        .optional()
        .describe("Part of the customer's company name."),
      from: z.string().optional().describe("Issued on or after, YYYY-MM-DD."),
      to: z.string().optional().describe("Issued on or before, YYYY-MM-DD."),
      limit: z.number().int().min(1).max(100).optional(),
    }),
    execute: safely(async ({ kind, status, customer, from, to, limit }) => {
      const kinds = kind ? [kind] : (["invoice", "quote"] as const);
      const rows = (await Promise.all(kinds.map((k) => listDocuments(k))))
        .flat()
        .filter(
          (row) =>
            (!status || row.status === status) &&
            (!customer ||
              row.company.toLowerCase().includes(customer.toLowerCase())) &&
            (!from || row.document.issueDate >= from) &&
            (!to || row.document.issueDate <= to),
        )
        .sort((a, b) =>
          b.document.issueDate.localeCompare(a.document.issueDate),
        );
      return {
        matching: rows.length,
        documents: rows
          .slice(0, limit ?? 25)
          .map(({ document, company, status }) => ({
            number: document.number,
            kind: document.kind,
            company,
            title: document.title,
            status,
            issued: document.issueDate,
            due: document.dueDate,
            validUntil: document.validUntil,
            paid: document.paidAt,
            total: formatMoney(document.totalMinor, document.currency),
            link: appUrl(
              `/${document.kind === "quote" ? "quotes" : "invoices"}/${document.id}`,
            ),
          })),
      };
    }),
  }),

  document: tool({
    description:
      "One invoice or quote in full by its number (e.g. INV-2026-0004 or Q-2026-0002): customer, line items, totals, dates and when it was emailed.",
    inputSchema: z.object({ number: z.string() }),
    execute: safely(async ({ number }) => {
      const wanted = number.trim().toUpperCase();
      const match = (
        await Promise.all([listDocuments("invoice"), listDocuments("quote")])
      )
        .flat()
        .find((row) => row.document.number.toUpperCase() === wanted);
      const found = match && (await getDocument(match.document.id));
      if (!found) return { error: `No invoice or quote numbered ${number}.` };
      const { document, customer, lines, sends, status } = found;
      const m = (minor: number) => formatMoney(minor, document.currency);
      return {
        number: document.number,
        kind: document.kind,
        status,
        customer: {
          company: customer.company,
          contact: customer.contactName,
          emails: customer.emails,
        },
        title: document.title,
        issued: document.issueDate,
        due: document.dueDate,
        validUntil: document.validUntil,
        paid: document.paidAt,
        paymentRef: document.paymentRef,
        lines: lines.map((line) => ({
          description: line.description,
          quantity: line.quantityHundredths / 100,
          unitPrice: m(line.unitPriceMinor),
          amount: m(line.amountMinor),
        })),
        subtotal: m(document.subtotalMinor),
        discount: document.discountMinor ? m(document.discountMinor) : null,
        tax: m(document.taxMinor),
        total: m(document.totalMinor),
        notes: document.notes,
        emailed: sends.map((send) => ({ at: send.sentAt, to: send.to })),
        link: appUrl(
          `/${document.kind === "quote" ? "quotes" : "invoices"}/${document.id}`,
        ),
      };
    }),
  }),

  customers: tool({
    description:
      "Customers (not archived) with contacts, payment terms, and what each has outstanding and has paid in total.",
    inputSchema: z.object({
      search: z.string().optional().describe("Part of the company name."),
    }),
    execute: safely(async ({ search }) => {
      const rows = (await listCustomers()).filter(
        ({ customer }) =>
          !search ||
          customer.company.toLowerCase().includes(search.toLowerCase()),
      );
      return rows.map(({ customer, outstanding, paid }) => ({
        company: customer.company,
        contact: customer.contactName,
        emails: customer.emails,
        currency: customer.currency,
        termsDays: customer.termsDays,
        outstanding: money(outstanding),
        paidAllTime: money(paid),
        link: appUrl(`/customers/${customer.id}`),
      }));
    }),
  }),

  recurring: tool({
    description:
      "Recurring invoice schedules: customer, how often, the next issue date and the amount. Each one creates a draft invoice to review; nothing goes out by itself.",
    inputSchema: z.object({}),
    execute: safely(async () =>
      (await listRecurring()).map(({ schedule, company, status }) => ({
        company,
        title: schedule.title,
        every: schedule.interval,
        nextIssue: schedule.nextIssueDate,
        endDate: schedule.endDate,
        status,
        total: formatMoney(schedule.totalMinor, schedule.currency),
      })),
    ),
  }),

  calendar: tool({
    description:
      "Today's and tomorrow's events from the work and personal calendars, in Cape Town time. Declined and cancelled events are already left out. Only today and tomorrow are available.",
    inputSchema: z.object({}),
    execute: safely(async () => {
      const agenda = await getAgenda();
      return {
        today: agenda.today,
        calendars: agenda.sources.map((s) => SOURCE_LABEL[s]),
        unreadable: agenda.failed.map((s) => SOURCE_LABEL[s]),
        events: agenda.events.map((event) => ({
          day: dayOf(event.start),
          time: event.allDay
            ? "all day"
            : `${clockTime(event.start)}–${clockTime(event.end)}`,
          title: event.title,
          calendar: SOURCE_LABEL[event.source],
          location: event.location,
          video: Boolean(event.joinUrl),
          busy: event.busy,
        })),
      };
    }),
  }),

  spending: tool({
    description:
      "Personal spending and income per category per month from the Investec accounts, for up to the last 13 months, plus how many transactions are waiting for review. Transfers between own accounts are left out.",
    inputSchema: z.object({
      months: z.number().int().min(1).max(13).optional(),
    }),
    execute: safely(async ({ months }) => {
      const { categories, totals, review, lastSyncedAt } = await getOverview();
      const byId = new Map(categories.map((c) => [c.id, c]));
      const monthList = [...new Set(totals.map((t) => t.month))]
        .sort()
        .slice(-(months ?? 6));
      return {
        lastSyncedAt,
        waitingForReview: review,
        months: monthList.map((month) => ({
          month: month.slice(0, 7),
          categories: totals
            .filter((t) => t.month === month)
            .map((t) => {
              const category = byId.get(t.categoryId);
              const kind = category?.kind ?? "spending";
              return {
                category: category?.name ?? "Unknown",
                kind,
                net: formatMoney(netFor(kind, t), "ZAR"),
                deductible: t.deductibleOutMinor
                  ? formatMoney(t.deductibleOutMinor, "ZAR")
                  : null,
                transactions: t.count,
              };
            })
            .filter((c) => c.kind !== "transfer"),
        })),
      };
    }),
  }),

  transactions: tool({
    description:
      "One month's bank transactions, live from Investec, with each one's category. Filter by merchant text or category. Investec keeps about six months of history.",
    inputSchema: z.object({
      month: z.string().describe("YYYY-MM"),
      search: z.string().optional().describe("Part of the description."),
      category: z.string().optional(),
    }),
    execute: safely(async ({ month, search, category }) => {
      const rows = (await listMonthTransactions(`${month.slice(0, 7)}-01`))
        .filter(
          ({ transaction, category: c }) =>
            (!search ||
              transaction.description
                .toLowerCase()
                .includes(search.toLowerCase())) &&
            (!category || c?.name.toLowerCase() === category.toLowerCase()),
        )
        .sort((a, b) => b.transaction.date.localeCompare(a.transaction.date));
      const out = rows
        .filter((r) => r.transaction.type === "DEBIT")
        .reduce((sum, r) => sum + r.transaction.amountMinor, 0);
      const incoming = rows
        .filter((r) => r.transaction.type === "CREDIT")
        .reduce((sum, r) => sum + r.transaction.amountMinor, 0);
      return {
        matching: rows.length,
        totalOut: formatMoney(out, "ZAR"),
        totalIn: formatMoney(incoming, "ZAR"),
        transactions: rows
          .slice(0, 60)
          .map(({ transaction, label, category: c }) => ({
            date: transaction.date,
            description: transaction.description,
            amount: `${transaction.type === "DEBIT" ? "-" : "+"}${formatMoney(transaction.amountMinor, "ZAR")}`,
            category: c?.name ?? "unlabelled",
            deductible: label?.deductible ?? false,
          })),
      };
    }),
  }),

  balance: tool({
    description:
      "The current and available balance across the included Investec accounts, live.",
    inputSchema: z.object({}),
    execute: safely(async () => {
      const { currentMinor, availableMinor } = await getBalances();
      return {
        current: formatMoney(currentMinor, "ZAR"),
        available: formatMoney(availableMinor, "ZAR"),
      };
    }),
  }),
};
