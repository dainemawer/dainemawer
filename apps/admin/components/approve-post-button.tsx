"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { approvePost } from "@/lib/actions/posts";

/** Merges the post's PR at the commit on screen, after one confirmation. */
export function ApprovePostButton({
  number,
  sha,
  title,
  disabled,
}: {
  number: number;
  sha: string;
  title: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const approve = () =>
    startTransition(async () => {
      const result = await approvePost(number, sha);
      if (result.error) {
        toast.error(result.error);
        setOpen(false);
        return;
      }
      toast.success("Merged. Vercel is deploying it to dainemawer.com.");
      router.push("/reviews");
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>Approve and merge</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish this post?</DialogTitle>
          <DialogDescription>
            Merges #{number} ({title}) into main at commit {sha.slice(0, 7)}.
            Vercel deploys it to dainemawer.com in a minute or two.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={approve} disabled={pending}>
            {pending ? "Merging…" : "Merge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
