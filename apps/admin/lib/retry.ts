// Retries a fetch when the server has a passing problem: a 5xx, a 429 or a
// network error. Anything else (4xx, a good response) comes straight back.
// Waits between tries grow (1s, then 3s by default), so a short outage on the
// other side doesn't fail a whole cron run.

export type RetryOptions = {
  /** Waits before each retry, in ms. Its length is the number of retries. */
  delays?: number[];
  sleep?: (ms: number) => Promise<void>;
};

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function isRetryable(status: number) {
  return status >= 500 || status === 429;
}

export async function fetchWithRetry(
  send: () => Promise<Response>,
  { delays = [1000, 3000], sleep = wait }: RetryOptions = {},
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const last = attempt >= delays.length;
    try {
      const response = await send();
      if (last || !isRetryable(response.status)) return response;
    } catch (error) {
      if (last) throw error;
    }
    await sleep(delays[attempt]);
  }
}
