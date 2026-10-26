import type { CategoryKind } from "@/lib/expenses/transactions";

// Stands in for the AI when there are no AI Gateway credentials (local
// dev): a fixed starter list and keyword matching. Good enough to exercise
// every screen; it sends anything it can't place to Review.

type Starter = { name: string; kind: CategoryKind; description: string };

const STARTER: (Starter & { keywords: string[] })[] = [
  {
    name: "Groceries",
    kind: "spending",
    description: "Supermarkets and food shopping.",
    keywords: [
      "SPAR",
      "CHECKERS",
      "SHOPRITE",
      "WOOLWORTHS",
      "PNP",
      "PICK N PAY",
    ],
  },
  {
    name: "Eating out",
    kind: "spending",
    description: "Restaurants, takeaways, coffee and food delivery.",
    keywords: [
      "UBER EATS",
      "MR D",
      "KFC",
      "MCD",
      "NANDOS",
      "STEERS",
      "WIMPY",
      "COFFEE",
    ],
  },
  {
    name: "Fuel and transport",
    kind: "spending",
    description: "Fuel, parking, tolls, Uber and Bolt rides.",
    keywords: [
      "SASOL",
      "ENGEN",
      "SHELL",
      "BP ",
      "CALTEX",
      "TOTAL",
      "UBER",
      "BOLT",
      "TOLL",
      "PARKING",
    ],
  },
  {
    name: "Home loan and levies",
    kind: "spending",
    description: "Bond repayments, body corporate and HOA levies.",
    keywords: ["H LOAN", "HOME LOAN", "BHL", "LEVY", "HOA"],
  },
  {
    name: "Utilities and rates",
    kind: "spending",
    description: "Municipal rates, electricity, water and refuse.",
    keywords: ["CITY OF", "MUNICIPAL", "ESKOM", "PREPAID ELEC"],
  },
  {
    name: "Medical",
    kind: "spending",
    description: "Medical aid, pharmacies, doctors and dentists.",
    keywords: [
      "MOMMED",
      "DISCOVERY HEALTH",
      "MEDICAL",
      "PHARM",
      "DIS-CHEM",
      "CLICKS",
    ],
  },
  {
    name: "Insurance",
    kind: "spending",
    description: "Life, car and household insurance premiums.",
    keywords: ["MOMENTUM", "OUTSURANCE", "SANTAM", "OLD MUTUAL", "INSURANCE"],
  },
  {
    name: "Subscriptions",
    kind: "spending",
    description: "Streaming, apps and other personal monthly subscriptions.",
    keywords: ["NETFLIX", "SPOTIFY", "SHOWMAX", "DSTV", "APPLE.COM", "YOUTUBE"],
  },
  {
    name: "Shopping",
    kind: "spending",
    description: "Clothing, homeware, online shopping and general retail.",
    keywords: [
      "TAKEALOT",
      "CAROUSEL",
      "MR PRICE",
      "EDGARS",
      "CLOTHING",
      "AMAZON",
    ],
  },
  {
    name: "Entertainment",
    kind: "spending",
    description: "Going out, cinema, events and hobbies.",
    keywords: ["BOWLING", "CINEMA", "NU METRO", "TICKET", "ARENA"],
  },
  {
    name: "Business expenses",
    kind: "spending",
    description:
      "Software, hosting, equipment and other costs of freelance work.",
    keywords: [
      "GITHUB",
      "VERCEL",
      "AWS",
      "GOOGLE",
      "ADOBE",
      "FIGMA",
      "OPENAI",
      "ANTHROPIC",
    ],
  },
  {
    name: "Bank fees and interest",
    kind: "spending",
    description: "Service charges, card fees and interest charged.",
    keywords: ["SERVICE CHARGE", "DEBIT INTEREST", "FEE"],
  },
  {
    name: "Cash",
    kind: "spending",
    description: "ATM withdrawals.",
    keywords: ["ATM"],
  },
  {
    name: "Income",
    kind: "income",
    description: "Client payments, salary, interest earned and refunds.",
    keywords: ["CREDIT INTEREST", "SALARY", "DEPOSIT"],
  },
  {
    name: "Transfers",
    kind: "transfer",
    description:
      "Money moved between your own accounts, savings or card repayments.",
    keywords: ["TRANSFER", "PRIMESAVER", "SAVINGS"],
  },
  {
    name: "Other",
    kind: "spending",
    description: "Anything that doesn't fit elsewhere.",
    keywords: [],
  },
];

export function offlineProposal(): Starter[] {
  return STARTER.map(({ name, kind, description }) => ({
    name,
    kind,
    description,
  }));
}

export function offlineClassify(
  merchant: { description: string; type: "DEBIT" | "CREDIT" },
  categories: { name: string; kind: CategoryKind }[],
) {
  const description = merchant.description.toUpperCase();
  const names = new Set(categories.map((c) => c.name));
  const hit = STARTER.find(
    (s) => names.has(s.name) && s.keywords.some((k) => description.includes(k)),
  );
  if (hit) {
    return {
      category: hit.name,
      deductible: hit.name === "Business expenses" && merchant.type === "DEBIT",
      confidence: 0.8,
    };
  }
  // A credit with no keyword is most likely income; otherwise a guess.
  const fallback =
    (merchant.type === "CREDIT" &&
      categories.find((c) => c.kind === "income")?.name) ||
    categories.find((c) => c.name === "Other")?.name ||
    categories[0].name;
  return { category: fallback, deductible: false, confidence: 0.3 };
}
