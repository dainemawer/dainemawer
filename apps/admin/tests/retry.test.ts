import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchWithRetry } from "../lib/retry.ts";

const noSleep = { sleep: async () => {} };

function sequence(...steps: (number | Error)[]) {
  let calls = 0;
  const send = async () => {
    const step = steps[Math.min(calls++, steps.length - 1)];
    if (step instanceof Error) throw step;
    return new Response(null, { status: step });
  };
  return { send, calls: () => calls };
}

test("a good first response comes straight back", async () => {
  const s = sequence(200);
  assert.equal((await fetchWithRetry(s.send, noSleep)).status, 200);
  assert.equal(s.calls(), 1);
});

test("a 5xx is retried until it succeeds", async () => {
  const s = sequence(500, 502, 200);
  assert.equal((await fetchWithRetry(s.send, noSleep)).status, 200);
  assert.equal(s.calls(), 3);
});

test("a 429 and a network error are retried too", async () => {
  const s = sequence(429, new TypeError("fetch failed"), 200);
  assert.equal((await fetchWithRetry(s.send, noSleep)).status, 200);
});

test("a 4xx is not retried", async () => {
  const s = sequence(401, 200);
  assert.equal((await fetchWithRetry(s.send, noSleep)).status, 401);
  assert.equal(s.calls(), 1);
});

test("gives up after the last retry with the last answer", async () => {
  const s = sequence(500);
  assert.equal((await fetchWithRetry(s.send, noSleep)).status, 500);
  assert.equal(s.calls(), 3);
  const e = sequence(new TypeError("fetch failed"));
  await assert.rejects(fetchWithRetry(e.send, noSleep), /fetch failed/);
});

test("waits the given delays between tries", async () => {
  const waited: number[] = [];
  const s = sequence(503);
  await fetchWithRetry(s.send, {
    delays: [10, 20],
    sleep: async (ms) => {
      waited.push(ms);
    },
  });
  assert.deepEqual(waited, [10, 20]);
});
