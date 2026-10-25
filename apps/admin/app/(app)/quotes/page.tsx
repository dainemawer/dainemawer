import type { Metadata } from "next";
import { DocumentListPage } from "@/components/document-pages";

export const metadata: Metadata = { title: "Quotes" };

export default function QuotesPage({ searchParams }: PageProps<"/quotes">) {
  return <DocumentListPage kind="quote" searchParams={searchParams} />;
}
