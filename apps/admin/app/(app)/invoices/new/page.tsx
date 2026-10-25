import type { Metadata } from "next";
import { NewDocumentPage } from "@/components/document-pages";

export const metadata: Metadata = { title: "New invoice" };

export default function NewInvoicePage({
  searchParams,
}: PageProps<"/invoices/new">) {
  return <NewDocumentPage kind="invoice" searchParams={searchParams} />;
}
