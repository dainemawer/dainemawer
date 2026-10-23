import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { DocumentPdf, type PdfData } from "./document-pdf";

export async function renderDocumentPdf(data: PdfData): Promise<Buffer> {
  return renderToBuffer(<DocumentPdf {...data} />);
}

/** `Q-2026-0001-acme.pdf` — what the client sees in their mail client. */
export function pdfFilename(number: string, company: string) {
  const slug = company
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${number}${slug ? `-${slug}` : ""}.pdf`;
}
