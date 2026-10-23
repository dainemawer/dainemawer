import { DocumentDetailPage } from "@/components/document-pages";
import { getDocument } from "@/lib/queries";

export async function generateMetadata({
  params,
}: PageProps<"/invoices/[id]">) {
  const full = await getDocument((await params).id);
  return { title: full?.document.number ?? "Invoice" };
}

export default async function InvoicePage({
  params,
}: PageProps<"/invoices/[id]">) {
  return <DocumentDetailPage kind="invoice" id={(await params).id} />;
}
