import { DocumentDetailPage, documentTitle } from "@/components/document-pages";

export function generateMetadata({ params }: PageProps<"/invoices/[id]">) {
  return documentTitle(params, "Invoice");
}

export default function InvoicePage({ params }: PageProps<"/invoices/[id]">) {
  return <DocumentDetailPage kind="invoice" params={params} />;
}
