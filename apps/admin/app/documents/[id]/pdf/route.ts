import { createHash } from "node:crypto";
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

  const input = { settings: await getSettings(), ...full };
  // Rendering is the slow part, and the preview reloads on every visit. The
  // ETag is a hash of everything the PDF is drawn from (plus the deployment,
  // for template changes), so an unchanged document is a 304, not a render.
  const etag = `"${createHash("sha256")
    .update(process.env.VERCEL_DEPLOYMENT_ID ?? "local")
    .update(
      JSON.stringify(input, (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    )
    .digest("base64url")}"`;
  const headers = {
    ETag: etag,
    // Kept by the browser, but checked with the server on every use.
    "Cache-Control": "private, no-cache",
  };
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  const pdf = await renderDocumentPdf(input);
  const filename = pdfFilename(full.document.number, full.customer.company);
  const disposition = new URL(request.url).searchParams.has("download")
    ? "attachment"
    : "inline";
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      ...headers,
    },
  });
}
