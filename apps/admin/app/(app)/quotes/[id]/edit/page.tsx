import type { Metadata } from "next";
import { EditDocumentPage } from "@/components/document-pages";

export const metadata: Metadata = { title: "Edit quote" };

export default async function EditQuotePage({
  params,
}: PageProps<"/quotes/[id]/edit">) {
  return <EditDocumentPage kind="quote" id={(await params).id} />;
}
