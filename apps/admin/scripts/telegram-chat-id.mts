// Finds the chat ID for TELEGRAM_CHAT_ID. Send your bot any message in
// Telegram first, then run:
//   TELEGRAM_BOT_TOKEN=... pnpm --filter admin telegram:chat-id
// (or put the token in apps/admin/.env.local). Prints each chat that has
// messaged the bot recently; the token itself is never printed.

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("Set TELEGRAM_BOT_TOKEN (from @BotFather) first.");
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const body = (await response.json()) as {
  ok: boolean;
  description?: string;
  result?: {
    message?: {
      chat: { id: number; type: string; first_name?: string; title?: string };
    };
  }[];
};
if (!body.ok) {
  console.error(`Telegram said: ${body.description ?? response.status}`);
  process.exit(1);
}

const chats = new Map<number, string>();
for (const update of body.result ?? []) {
  const chat = update.message?.chat;
  if (chat)
    chats.set(
      chat.id,
      `${chat.title ?? chat.first_name ?? "?"} (${chat.type})`,
    );
}
if (!chats.size) {
  console.log(
    "No messages yet. Send your bot a message in Telegram, then run this again.",
  );
} else {
  for (const [id, name] of chats)
    console.log(`TELEGRAM_CHAT_ID=${id}   ${name}`);
}
