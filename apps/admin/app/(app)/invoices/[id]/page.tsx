import { DocumentDetailPage } from "@/components/document-pages";
import { getDocument } from "@/lib/queries";
import { requireSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/invoices/[id]">) {
  // Metadata renders alongside the page, so it checks the session itself.
  await requireSession();
  const full = await getDocument((await params).id);
  return { title: full?.document.number ?? "Invoice" };
}

export default async function InvoicePage({
  params,
}: PageProps<"/invoices/[id]">) {
  return <DocumentDetailPage kind="invoice" id={(await params).id} />;
}
