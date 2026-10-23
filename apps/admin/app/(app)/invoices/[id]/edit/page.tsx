import type { Metadata } from "next";
import { EditDocumentPage } from "@/components/document-pages";

export const metadata: Metadata = { title: "Edit invoice" };

export default async function EditInvoicePage({
  params,
}: PageProps<"/invoices/[id]/edit">) {
  return <EditDocumentPage kind="invoice" id={(await params).id} />;
}
