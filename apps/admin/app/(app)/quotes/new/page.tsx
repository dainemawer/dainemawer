import type { Metadata } from "next";
import { NewDocumentPage } from "@/components/document-pages";

export const metadata: Metadata = { title: "New quote" };

export default async function NewQuotePage({
  searchParams,
}: PageProps<"/quotes/new">) {
  const { customer } = await searchParams;
  return (
    <NewDocumentPage
      kind="quote"
      customerId={typeof customer === "string" ? customer : undefined}
    />
  );
}
