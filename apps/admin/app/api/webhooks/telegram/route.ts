import { timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import {
  answer,
  forgetConversation,
  rememberAnswer,
  rememberQuestion,
} from "@/lib/assistant";
import { logHealthMessage } from "@/lib/health-log";
import { HEALTH_HELP, parseHealthMessage } from "@/lib/health-messages";
import { replyTelegram, typingTelegram } from "@/lib/telegram";
import { incomingQuestion } from "@/lib/telegram-format";

// Telegram delivers what you send the bot here (registered with
// `pnpm --filter admin telegram:webhook`). Each delivery carries
// TELEGRAM_WEBHOOK_SECRET in a header, and only text messages from your own
// chat (TELEGRAM_CHAT_ID) are answered; everything else gets an empty 200
// so Telegram stops retrying it. The answer is worked out after the
// response, so Telegram isn't kept waiting and doesn't redeliver.

export const maxDuration = 120;

const HELP = `Ask me about invoices, quotes, customers, recurring invoices, your calendar for today and tomorrow, spending, your balance or your health. /new starts a fresh conversation.\n\n${HEALTH_HELP}`;

export async function POST(request: Request) {
  if (!validSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const question = incomingQuestion(
    await request.json().catch(() => null),
    process.env.TELEGRAM_CHAT_ID ?? "",
  );
  if (!question) return new Response(null, { status: 200 });

  after(async () => {
    if (question.text === "/start" || question.text === "/help") {
      await replyTelegram(HELP);
      return;
    }
    if (question.text === "/new") {
      await forgetConversation();
      await replyTelegram("Fresh start. What would you like to know?");
      return;
    }
    if (!(await rememberQuestion(question.updateId, question.text))) return;
    // A health log ("88.2", "craving", "moved") is saved, not asked about.
    const health = parseHealthMessage(question.text);
    if (health) {
      const reply = await logHealthMessage(health);
      await rememberAnswer(reply);
      await replyTelegram(reply);
      return;
    }
    // "typing…" lasts about five seconds; keep it up while Claude works.
    await typingTelegram();
    const typing = setInterval(() => void typingTelegram(), 4500);
    try {
      const reply = await answer(question.text);
      await rememberAnswer(reply);
      await replyTelegram(reply);
    } finally {
      clearInterval(typing);
    }
  });
  return new Response(null, { status: 200 });
}

function validSecret(given: string | null) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
