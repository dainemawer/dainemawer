import assert from "node:assert/strict";
import { test } from "node:test";
import { fieldErrorsFrom } from "../lib/actions/form-state.ts";

test("fieldErrorsFrom keys list-field errors by the field and line errors by index", () => {
  assert.deepEqual(
    fieldErrorsFrom([
      { path: ["emails", 0], message: "bad" },
      { path: ["lines", 1, "description"], message: "required" },
      { path: ["company"], message: "required" },
    ]),
    {
      emails: ["bad"],
      "lines.1.description": ["required"],
      company: ["required"],
    },
  );
});
