import assert from "node:assert/strict";
import { test } from "node:test";
import { fillTemplate } from "../lib/templates.ts";

const vars = {
  number: "INV-2026-0003",
  business: "Daine Mawer",
  contact: "Sam",
  company: "Acme",
  total: "R 1,000.00",
  validUntil: "—",
  dueDate: "22 Nov 2026",
};

test("fillTemplate replaces known placeholders", () => {
  assert.equal(
    fillTemplate("Hi {contact}, {number} for {total} is due {dueDate}.", vars),
    "Hi Sam, INV-2026-0003 for R 1,000.00 is due 22 Nov 2026.",
  );
});

test("fillTemplate leaves unknown placeholders visible", () => {
  assert.equal(fillTemplate("{numbr} {business}", vars), "{numbr} Daine Mawer");
});
