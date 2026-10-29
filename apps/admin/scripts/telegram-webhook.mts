// Points the bot at the app, so what you send it is answered (see
// app/api/webhooks/telegram). Run once per bot, with the production values:
//   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... \
//     pnpm --filter admin telegram:webhook https://admin.dainemawer.com
// (or put both in apps/admin/.env.local). `--delete` removes the webhook
// again, which telegram:chat-id needs: Telegram refuses getUpdates while a
// webhook is set. Neither secret is ever printed.

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const [arg] = process.argv.slice(2);

if (!token) {
  console.error("Set TELEGRAM_BOT_TOKEN (from @BotFather) first.");
  process.exit(1);
}

async function call(method: string, body: Record<string, unknown>) {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const result = (await response.json()) as {
    ok: boolean;
    description?: string;
  };
  if (!result.ok) {
    console.error(`Telegram said: ${result.description ?? response.status}`);
    process.exit(1);
  }
}

if (arg === "--delete") {
  await call("deleteWebhook", {});
  console.log("Webhook removed.");
  process.exit(0);
}

if (!arg?.startsWith("https://")) {
  console.error(
    "Pass the app's https origin, e.g. https://admin.dainemawer.com",
  );
  process.exit(1);
}
if (!secret || !/^[A-Za-z0-9_-]{16,256}$/.test(secret)) {
  console.error(
    "Set TELEGRAM_WEBHOOK_SECRET to 16+ letters, digits, _ or - (`openssl rand -hex 32`), the same value as in Vercel.",
  );
  process.exit(1);
}

const url = `${new URL(arg).origin}/api/webhooks/telegram`;
await call("setWebhook", {
  url,
  secret_token: secret,
  allowed_updates: ["message"],
  drop_pending_updates: true,
});
await call("setMyCommands", {
  commands: [
    { command: "new", description: "Start a fresh conversation" },
    { command: "help", description: "What you can ask" },
  ],
});
console.log(`Webhook set: ${url}`);
