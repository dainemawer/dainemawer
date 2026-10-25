import { auth } from "@/lib/auth";
import { getDocument, getSettings } from "@/lib/queries";
import { pdfFilename, renderDocumentPdf } from "@/pdf/render";

// The live PDF for a document: the in-app preview (inline) and the
// download button (?download=1). Sends use the same renderer.
export async function GET(
  request: Request,
  ctx: RouteContext<"/documents/[id]/pdf">,
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const full = await getDocument(id);
  if (!full) return new Response("Not found", { status: 404 });

  const pdf = await renderDocumentPdf({
    settings: await getSettings(),
    ...full,
  });
  const filename = pdfFilename(full.document.number, full.customer.company);
  const disposition = new URL(request.url).searchParams.has("download")
    ? "attachment"
    : "inline";
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
