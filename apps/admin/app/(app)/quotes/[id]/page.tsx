import { DocumentDetailPage, documentTitle } from "@/components/document-pages";

export function generateMetadata({ params }: PageProps<"/quotes/[id]">) {
  return documentTitle(params, "Quote");
}

export default function QuotePage({ params }: PageProps<"/quotes/[id]">) {
  return <DocumentDetailPage kind="quote" params={params} />;
}
