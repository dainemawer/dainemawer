import type { Metadata } from "next";
import { EditDocumentPage } from "@/components/document-pages";

export const metadata: Metadata = { title: "Edit invoice" };

export default function EditInvoicePage({
  params,
}: PageProps<"/invoices/[id]/edit">) {
  return <EditDocumentPage kind="invoice" params={params} />;
}
