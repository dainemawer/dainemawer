import type { Metadata } from "next";
import { DocumentListPage } from "@/components/document-pages";

export const metadata: Metadata = { title: "Quotes" };

export default async function QuotesPage({
  searchParams,
}: PageProps<"/quotes">) {
  const { status } = await searchParams;
  return (
    <DocumentListPage
      kind="quote"
      status={typeof status === "string" ? status : undefined}
    />
  );
}
