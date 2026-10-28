import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ZohoImport } from "@/components/zoho-import";

export const metadata: Metadata = { title: "Import from Zoho" };

// Static: no data until a preview, which the Server Action reads and checks
// the session for.
export default function ImportPage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/settings" className="hover:text-ink">
            Settings
          </Link>
        }
        title="Import from Zoho"
        description="Customers, quotes and invoices from Zoho Invoice, renumbered into this admin's sequence. Nothing is saved until you import."
      />
      <ZohoImport />
    </>
  );
}
