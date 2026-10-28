// A small RFC 4180 reader for imported exports: quoted fields may hold
// commas, doubled quotes and newlines. Pure, so the tests can import it.

/** Rows as arrays of fields. A trailing newline doesn't add an empty row. */
export function parseCsvRows(text: string): string[][] {
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char !== '"') field += char;
      else if (input[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Rows keyed by the header row's names; blank lines are skipped. */
export function parseCsv(text: string): Record<string, string>[] {
  const [header, ...rows] = parseCsvRows(text);
  if (!header) return [];
  const names = header.map((name) => name.trim());
  return rows
    .filter((row) => row.some((field) => field.trim() !== ""))
    .map((row) =>
      Object.fromEntries(names.map((name, i) => [name, row[i] ?? ""])),
    );
}
