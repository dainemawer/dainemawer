"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { formatPostDate } from "@/lib/format";
import type { Post } from "@/lib/posts";
import {
  useCommandPaletteOpen,
  useSetCommandPaletteOpen,
} from "./command-palette-context";

export function CommandPalette({ posts }: { posts: Post[] }) {
  const open = useCommandPaletteOpen();
  const setOpen = useSetCommandPaletteOpen();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((post) =>
      `${post.title} ${post.dek}`.toLowerCase().includes(q),
    );
  }, [posts, query]);

  // Debounced so a search event fires once the user stops typing, not on
  // every keystroke.
  useEffect(() => {
    const searchTerm = query.trim();
    if (!searchTerm) return;
    const timeout = setTimeout(() => {
      trackEvent("site_search", {
        search_term: searchTerm,
        result_count: results.length,
      });
    }, 400);
    return () => clearTimeout(timeout);
  }, [query, results.length]);

  // Restore focus to whatever opened the palette (the ⌘K shortcut or the
  // SearchTrigger button) once it closes. Focus must land inside the dialog
  // either way (an unfocused dialog is invisible to a screen reader's
  // virtual cursor) — on a precise pointer that's the input, so typing can
  // start immediately; otherwise it's the dialog itself, so a touch tap
  // doesn't force the on-screen keyboard open.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (window.matchMedia("(pointer: fine)").matches) {
      inputRef.current?.focus();
    } else {
      dialogRef.current?.focus();
    }
    return () => {
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  function close() {
    setOpen(false);
    setQuery("");
    setCursor(0);
  }

  function select(slug: string) {
    close();
    router.push(`/${slug}`);
  }

  return (
    // Click-outside-to-close is a supplementary mouse affordance; Escape
    // (handled globally in CommandPaletteProvider) is the keyboard-equivalent
    // way to dismiss this overlay.
    // biome-ignore lint/a11y/noStaticElementInteractions: see comment above
    // biome-ignore lint/a11y/useKeyWithClickEvents: see comment above
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="fixed inset-0 z-60 flex justify-center bg-overlay px-4 pt-palette-offset backdrop-blur-sm"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Search writing"
        className="flex max-h-palette w-full max-w-155 flex-col overflow-hidden rounded-palette bg-surface p-4 pb-5 shadow-palette outline-none sm:p-6"
      >
        <div className="flex items-baseline gap-3">
          <input
            ref={inputRef}
            role="combobox"
            aria-label="Search writing"
            aria-expanded="true"
            aria-haspopup="listbox"
            aria-controls="command-palette-listbox"
            aria-autocomplete="list"
            aria-activedescendant={
              results[cursor]
                ? `command-palette-option-${results[cursor].slug}`
                : undefined
            }
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setCursor((c) =>
                  results.length ? (c + 1) % results.length : 0,
                );
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setCursor((c) =>
                  results.length
                    ? (c - 1 + results.length) % results.length
                    : 0,
                );
              } else if (event.key === "Enter" && results[cursor]) {
                select(results[cursor].slug);
              }
            }}
            placeholder="Search writing"
            className="flex-1 rounded-md border-none bg-transparent text-md text-ink outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-ink/15"
          />
          <span className="font-mono text-2xs text-faint">esc</span>
        </div>

        <div
          id="command-palette-listbox"
          role="listbox"
          aria-label="Search results"
          className="mt-5 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain"
        >
          {results.map((post, index) => (
            <Link
              key={post.slug}
              id={`command-palette-option-${post.slug}`}
              role="option"
              aria-selected={index === cursor}
              href={`/${post.slug}`}
              onClick={close}
              onMouseEnter={() => setCursor(index)}
              tabIndex={-1}
              className={`grid grid-cols-1 gap-x-5 gap-y-0.5 rounded-md p-2 text-left sm:grid-cols-result sm:items-baseline sm:gap-y-0 ${index === cursor ? "bg-ink/5" : ""}`}
            >
              <div className="text-xs text-faint sm:text-right">
                {formatPostDate(post.date)}
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="text-base font-medium tracking-tight text-ink text-pretty">
                  {post.title}
                </div>
                <div className="text-sm text-muted text-pretty">{post.dek}</div>
              </div>
            </Link>
          ))}
          {results.length === 0 && (
            <div className="text-md text-faint">
              Nothing here — try “sticky”, “storybook”, “estimation”.
            </div>
          )}
        </div>

        <div className="mt-5 flex items-baseline gap-2 border-divider border-t pt-3.5 text-2xs text-faint">
          <span>↑↓ to navigate</span>
          <span className="text-divider">|</span>
          <span>↵ to open</span>
          <span className="text-divider">|</span>
          <span aria-live="polite">
            {results.length === 1 ? "1 result" : `${results.length} results`}
          </span>
        </div>
      </div>
    </div>
  );
}
