import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings-form";
import { getSettings } from "@/lib/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireSession();
  const settings = await getSettings();
  return (
    <>
      <PageHeader
        title="Settings"
        description="Changes show on the next PDF you open or send; PDFs already sent stay as they were."
      />
      <SettingsForm settings={settings} />
    </>
  );
}
