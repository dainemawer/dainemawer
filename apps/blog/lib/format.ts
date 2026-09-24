// timeZone: "UTC" keeps this aligned with the UTC-midnight instant that
// `new Date("yyyy-mm-dd")` parses to — without it, timezones behind UTC
// would format these ISO dates as one day earlier.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

function getDateParts(iso: string): {
  day: string;
  month: string;
  year: string;
} {
  const parts = dateFormatter.formatToParts(new Date(iso));
  return {
    day: parts.find((part) => part.type === "day")?.value ?? "",
    month: parts.find((part) => part.type === "month")?.value ?? "",
    year: parts.find((part) => part.type === "year")?.value ?? "",
  };
}

export function formatPostDate(iso: string): string {
  const { day, month, year } = getDateParts(iso);
  return `${month} ${day} ${year}`;
}

export function formatArticleDate(iso: string): {
  day: string;
  month: string;
  year: string;
} {
  return getDateParts(iso);
}
