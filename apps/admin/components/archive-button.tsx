"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setCustomerArchived } from "@/lib/actions/customers";

export function ArchiveButton({
  id,
  archived,
}: {
  id: string;
  archived: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setCustomerArchived(id, !archived);
          toast.success(archived ? "Customer restored." : "Customer archived.");
        })
      }
    >
      {archived ? "Restore" : "Archive"}
    </Button>
  );
}
