import { auth } from "@/lib/auth";
import { getSend } from "@/lib/queries";
import { readSnapshot } from "@/lib/snapshots";

// The exact PDF attached to one past send, from its snapshot.
export async function GET(
  request: Request,
  ctx: RouteContext<"/sends/[id]/pdf">,
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const send = await getSend(id);
  const snapshot = send?.pdfPathname
    ? await readSnapshot(send.pdfPathname)
    : null;
  if (!snapshot) return new Response("Not found", { status: 404 });

  const body = Buffer.isBuffer(snapshot) ? new Uint8Array(snapshot) : snapshot;
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="sent-${send?.sentAt.toISOString().slice(0, 10)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
