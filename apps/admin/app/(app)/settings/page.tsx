import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { SecuritySection } from "@/components/security-section";
import { SettingsForm } from "@/components/settings-form";
import { FormSkeleton, Loading, TableSkeleton } from "@/components/skeletons";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Changes show on the next PDF you open or send; PDFs already sent stay as they were."
      />
      <Suspense
        fallback={
          <Loading>
            <FormSkeleton />
          </Loading>
        }
      >
        <Settings />
      </Suspense>
      <Suspense
        fallback={
          <Loading>
            <TableSkeleton rows={6} />
          </Loading>
        }
      >
        <SecuritySection />
      </Suspense>
    </>
  );
}

async function Settings() {
  return <SettingsForm settings={await getSettings()} />;
}
