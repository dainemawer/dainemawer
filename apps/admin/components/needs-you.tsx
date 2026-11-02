import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Bone, Loading, times, widthFor } from "@/components/skeletons";
import { getAttention } from "@/lib/attention";
import type { Urgency } from "@/lib/attention-items";
import { cn } from "@/lib/utils";

// The top of the dashboard: one line per thing waiting on you, most urgent
// first, each linking to where it gets done. Sources and rules: lib/attention.ts.

const DOT: Record<Urgency, string> = {
  urgent: "bg-destructive",
  normal: "bg-ink",
  low: "bg-ink/25",
};

const URGENCY_LABEL: Record<Urgency, string> = {
  urgent: "Urgent",
  normal: "To do",
  low: "When you can",
};

function Frame({
  count,
  children,
}: {
  count?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby="needs-you" className="mb-12">
      <h2 id="needs-you" className="mb-3 text-lg font-bold">
        Needs you
        {count ? (
          <span className="ml-2 font-normal text-muted-foreground">
            {count}
          </span>
        ) : null}
      </h2>
      {children}
    </section>
  );
}

export async function NeedsYou() {
  const { items, failed } = await getAttention();
  return (
    <Frame count={items.length || null}>
      {items.length ? (
        <ul className="divide-y border-y">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex items-center gap-3 py-2.5 outline-none hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    DOT[item.urgency],
                  )}
                />
                <span className="sr-only">{URGENCY_LABEL[item.urgency]}: </span>
                <span className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-3">
                  <span className="block font-medium">{item.title}</span>
                  {item.detail ? (
                    <span className="block truncate text-sm text-muted-foreground">
                      {item.detail}
                    </span>
                  ) : null}
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-y py-2.5 text-sm text-muted-foreground">
          All clear.
        </p>
      )}
      {failed.length ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Couldn't check {failed.join(", ").toLowerCase()} just now.
        </p>
      ) : null}
    </Frame>
  );
}

export function NeedsYouSkeleton() {
  return (
    <Loading>
      <Frame>
        <ul className="divide-y border-y">
          {times(3, (i) => (
            <li key={i} className="flex items-center gap-3 py-2.5">
              <span className="size-2 shrink-0 rounded-full bg-ink/10" />
              <span className="font-medium">
                <Bone w={widthFor(i, 1)} />
              </span>
              <span className="text-sm">
                <Bone w={widthFor(i, 4)} />
              </span>
            </li>
          ))}
        </ul>
      </Frame>
    </Loading>
  );
}
