import { DocumentDetailPage } from "@/components/document-pages";
import { getDocument } from "@/lib/queries";

export async function generateMetadata({ params }: PageProps<"/quotes/[id]">) {
  const full = await getDocument((await params).id);
  return { title: full?.document.number ?? "Quote" };
}

export default async function QuotePage({ params }: PageProps<"/quotes/[id]">) {
  return <DocumentDetailPage kind="quote" id={(await params).id} />;
}
