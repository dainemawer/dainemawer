/**
 * Finds conferences with an open call for papers that fit Daine's talk
 * topics, from the open confs.tech dataset
 * (github.com/tech-conferences/conference-data). Prints a Markdown digest.
 *
 *   pnpm --filter blog cfp-scan [--previous <file>]
 *
 * `--previous` takes last week's digest; any CFP URL not in it is marked
 * new. Run weekly by .github/workflows/cfp-scan.yml, which posts the digest
 * as a GitHub issue.
 */
import { readFileSync } from "node:fs";

type Conference = {
  name: string;
  url: string;
  startDate: string;
  endDate?: string;
  city?: string;
  country?: string;
  online?: boolean;
  cfpUrl?: string;
  cfpEndDate?: string;
};

// confs.tech topic files worth scanning, with how well each fits the talk
// topics in docs/growth/pitching.md. Higher sorts first.
const TOPICS: Record<string, number> = {
  javascript: 3,
  typescript: 3,
  leadership: 3,
  ios: 1,
  android: 1,
  general: 1,
  ux: 1,
  accessibility: 1,
  devops: 1,
  security: 1,
};

// Name/URL keywords that make a conference a strong fit regardless of file.
const KEYWORDS =
  /react|native|expo|frontend|front-end|css|web|next|typescript|lead|staff|engineering manag|ai eng/i;

// Places that mean little or no travel from Cape Town.
const NEARBY = /south africa|kenya|nigeria|ghana|egypt|morocco|rwanda|africa/i;

const DATA =
  "https://raw.githubusercontent.com/tech-conferences/conference-data/main/conferences";

const args = process.argv.slice(2);
const previousFile = args[args.indexOf("--previous") + 1];
const previous =
  args.includes("--previous") && previousFile
    ? readFileSync(previousFile, "utf-8")
    : "";

const today = new Date().toISOString().slice(0, 10);
const year = new Date().getFullYear();

async function load(y: number, topic: string): Promise<Conference[]> {
  const response = await fetch(`${DATA}/${y}/${topic}.json`);
  // A topic file for next year often doesn't exist yet.
  if (!response.ok) return [];
  return response.json() as Promise<Conference[]>;
}

type OpenCfp = Conference & {
  cfpUrl: string;
  cfpEndDate: string;
  score: number;
  topics: string[];
};

const byKey = new Map<string, OpenCfp>();

for (const y of [year, year + 1]) {
  const results = await Promise.all(
    Object.keys(TOPICS).map(async (topic) => ({
      topic,
      conferences: await load(y, topic),
    })),
  );
  for (const { topic, conferences } of results) {
    for (const conference of conferences) {
      if (!conference.cfpUrl || !conference.cfpEndDate) continue;
      if (conference.cfpEndDate < today) continue;
      const key = conference.cfpUrl;
      const existing = byKey.get(key);
      if (existing) {
        existing.score += TOPICS[topic];
        existing.topics.push(topic);
        continue;
      }
      const haystack = `${conference.name} ${conference.url}`;
      byKey.set(key, {
        ...conference,
        cfpUrl: conference.cfpUrl,
        cfpEndDate: conference.cfpEndDate,
        topics: [topic],
        score:
          TOPICS[topic] +
          (KEYWORDS.test(haystack) ? 3 : 0) +
          (NEARBY.test(conference.country ?? "") ? 3 : 0),
      });
    }
  }
}

const daysUntil = (date: string) =>
  Math.ceil((Date.parse(date) - Date.parse(today)) / 86_400_000);

const open = [...byKey.values()]
  .filter((c) => c.score >= 3)
  .toSorted(
    (a, b) => b.score - a.score || (a.cfpEndDate < b.cfpEndDate ? -1 : 1),
  );

const row = (c: (typeof open)[number]) => {
  const days = daysUntil(c.cfpEndDate);
  const flags = [
    previous && !previous.includes(c.cfpUrl) ? "🆕" : "",
    days <= 14 ? "⏰" : "",
    NEARBY.test(c.country ?? "") ? "📍" : "",
  ].join("");
  const where = c.online
    ? "Online"
    : [c.city, c.country].filter(Boolean).join(", ");
  return `| ${flags} | [${c.name}](${c.url}) | ${c.startDate} | ${where} | ${c.cfpEndDate} (${days}d) | [Submit](${c.cfpUrl}) | ${c.topics.join(", ")} |`;
};

const header = [
  "| | Conference | Date | Where | CFP closes | | Topics |",
  "| --- | --- | --- | --- | --- | --- | --- |",
];
const strong = open.filter((c) => c.score >= 6);
const maybe = open.filter((c) => c.score < 6);

console.log(
  [
    `Open calls for papers as of ${today}, from [confs.tech](https://confs.tech/cfp). 🆕 new since last week · ⏰ closes within 14 days · 📍 Africa`,
    "",
    "Pick a talk from `apps/blog/docs/growth/pitching.md` and log submissions in its tracker.",
    "",
    `## Strong fit (${strong.length})`,
    "",
    ...(strong.length ? [...header, ...strong.map(row)] : ["None this week."]),
    "",
    `## Worth a look (${maybe.length})`,
    "",
    ...(maybe.length ? [...header, ...maybe.map(row)] : ["None this week."]),
    "",
    "## Not in the dataset: check by hand",
    "",
    "DevConf (South Africa), LeadDev, React Summit / JSNation (GitNation), React Advanced London, Chain React, App.js Conf. Also browse [sessionize.com](https://sessionize.com) for open calls.",
  ].join("\n"),
);
