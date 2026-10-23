import { DocumentDetailPage } from "@/components/document-pages";
import { getDocument } from "@/lib/queries";
import { requireSession } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/quotes/[id]">) {
  // Metadata renders alongside the page, so it checks the session itself.
  await requireSession();
  const full = await getDocument((await params).id);
  return { title: full?.document.number ?? "Quote" };
}

export default async function QuotePage({ params }: PageProps<"/quotes/[id]">) {
  return <DocumentDetailPage kind="quote" id={(await params).id} />;
}
