import type { Metadata } from "next";
import { EditDocumentPage } from "@/components/document-pages";

export const metadata: Metadata = { title: "Edit quote" };

export default function EditQuotePage({
  params,
}: PageProps<"/quotes/[id]/edit">) {
  return <EditDocumentPage kind="quote" params={params} />;
}
