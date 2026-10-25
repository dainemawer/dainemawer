import type { Metadata } from "next";
import { NewDocumentPage } from "@/components/document-pages";

export const metadata: Metadata = { title: "New quote" };

export default function NewQuotePage({
  searchParams,
}: PageProps<"/quotes/new">) {
  return <NewDocumentPage kind="quote" searchParams={searchParams} />;
}
