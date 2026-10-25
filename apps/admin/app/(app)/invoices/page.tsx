import type { Metadata } from "next";
import { DocumentListPage } from "@/components/document-pages";

export const metadata: Metadata = { title: "Invoices" };

export default function InvoicesPage({ searchParams }: PageProps<"/invoices">) {
  return <DocumentListPage kind="invoice" searchParams={searchParams} />;
}
