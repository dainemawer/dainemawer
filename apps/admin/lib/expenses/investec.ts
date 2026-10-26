import "server-only";
import { UserError } from "@/lib/errors";
import type { Transaction } from "@/lib/expenses/transactions";

// Investec Private Banking API (read-only use): accounts and posted
// transactions. OAuth client credentials plus an API key; tokens last 30
// minutes and are kept per server instance. Responses are never cached
// beyond the request: transactions are fetched live, not stored.
//
// INVESTEC_BASE_URL defaults to production. .env.example points local dev
// at Investec's sandbox, which returns mock accounts and transactions.

const BASE_URL =
  process.env.INVESTEC_BASE_URL ?? "https://openapi.investec.com";

export function investecConfigured() {
  return Boolean(
    process.env.INVESTEC_CLIENT_ID &&
      process.env.INVESTEC_CLIENT_SECRET &&
      process.env.INVESTEC_API_KEY,
  );
}

let token: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (token && token.expiresAt > Date.now()) return token.value;
  if (!investecConfigured()) throw new UserError("Investec isn't configured.");
  const basic = Buffer.from(
    `${process.env.INVESTEC_CLIENT_ID}:${process.env.INVESTEC_CLIENT_SECRET}`,
  ).toString("base64");
  const response = await fetch(`${BASE_URL}/identity/v2/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "x-api-key": process.env.INVESTEC_API_KEY ?? "",
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new UserError(`Investec sign-in failed (${response.status}).`);
  }
  const body = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  // A minute's margin so a token never expires mid-request.
  token = {
    value: body.access_token,
    expiresAt: Date.now() + (body.expires_in - 60) * 1000,
  };
  return token.value;
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (response.status === 401) token = null;
  if (!response.ok) {
    throw new UserError(`Investec request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}

export type InvestecAccount = {
  accountId: string;
  name: string;
  productName: string;
};

export async function listAccounts(): Promise<InvestecAccount[]> {
  const body = await get<{
    data: {
      accounts: {
        accountId: string;
        referenceName: string;
        accountName: string;
        productName: string;
      }[];
    };
  }>("/za/pb/v1/accounts");
  return body.data.accounts.map((account) => ({
    accountId: account.accountId,
    name: account.referenceName || account.accountName,
    productName: account.productName,
  }));
}

type RawTransaction = {
  accountId: string;
  type: "DEBIT" | "CREDIT";
  transactionType: string | null;
  status: "POSTED" | "PENDING";
  description: string;
  postingDate: string | null;
  transactionDate: string | null;
  valueDate: string | null;
  amount: number;
  uuid: string | null;
};

/**
 * Posted transactions between two dates (inclusive). Pending
 * ones are left out: they have no stable ID and their amount can change.
 */
export async function getTransactions(
  accountId: string,
  fromDate: string,
  toDate: string,
): Promise<Transaction[]> {
  const transactions: Transaction[] = [];
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({ fromDate, toDate });
    if (page > 1) query.set("page", String(page));
    const body = await get<{
      data: { transactions: RawTransaction[] };
      meta?: { totalPages?: number };
    }>(
      `/za/pb/v1/accounts/${encodeURIComponent(accountId)}/transactions?${query}`,
    );
    for (const tx of body.data.transactions) {
      if (tx.status !== "POSTED" || !tx.uuid || !tx.postingDate) continue;
      transactions.push({
        id: tx.uuid,
        accountId: tx.accountId,
        date: tx.transactionDate ?? tx.valueDate ?? tx.postingDate,
        postingDate: tx.postingDate,
        type: tx.type,
        transactionType: tx.transactionType ?? "",
        description: tx.description.trim(),
        // Rands as a float; rounded once into cents.
        amountMinor: Math.round(Math.abs(tx.amount) * 100),
      });
    }
    if (page >= (body.meta?.totalPages ?? 1)) break;
  }
  return transactions;
}

/** Every included account's transactions over the range, newest purchase first. */
export async function getAllTransactions(
  accountIds: string[],
  fromDate: string,
  toDate: string,
): Promise<Transaction[]> {
  const lists = await Promise.all(
    accountIds.map((id) => getTransactions(id, fromDate, toDate)),
  );
  return lists
    .flat()
    .sort((a, b) =>
      a.date === b.date
        ? b.id.localeCompare(a.id)
        : b.date.localeCompare(a.date),
    );
}

export async function getBalance(accountId: string) {
  const body = await get<{
    data: { currentBalance: number; availableBalance: number };
  }>(`/za/pb/v1/accounts/${encodeURIComponent(accountId)}/balance`);
  return {
    currentMinor: Math.round(body.data.currentBalance * 100),
    availableMinor: Math.round(body.data.availableBalance * 100),
  };
}
