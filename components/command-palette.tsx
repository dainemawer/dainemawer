"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { formatPostDate } from "@/lib/format";
import type { Post } from "@/lib/posts";
import {
  buildSearchEntries,
  filterSearchEntries,
  SEARCH_GROUPS,
  type SearchEntry,
} from "@/lib/search";
import {
  useCommandPaletteOpen,
  useSetCommandPaletteOpen,
} from "./command-palette-context";

// One result row. Renders an <a> for the route-handler endpoints and a
// <Link> for real pages, so a click behaves the same way Enter does — the
// keyboard path goes through `select`, and this keeps the pointer path from
// quietly diverging from it.
function PaletteOption({
  entry,
  selected,
  onHover,
  onChoose,
}: {
  entry: SearchEntry;
  selected: boolean;
  onHover: () => void;
  onChoose: () => void;
}) {
  const shared = {
    id: `command-palette-option-${entry.id}`,
    role: "option" as const,
    "aria-selected": selected,
    onMouseEnter: onHover,
    tabIndex: -1,
    className: `grid grid-cols-1 gap-x-5 gap-y-0.5 rounded-md p-2 text-left sm:grid-cols-result sm:items-baseline sm:gap-y-0 ${selected ? "bg-ink/5" : ""}`,
  };

  const body = (
    <>
      <div className="text-xs text-faint sm:text-right">{entry.meta}</div>
      <div className="flex flex-col gap-0.5">
        <div className="font-medium text-base text-ink tracking-tight text-pretty">
          {entry.label}
        </div>
        <div className="text-muted text-sm text-pretty">
          {entry.description}
        </div>
      </div>
    </>
  );

  if (entry.external) {
    return (
      <a href={entry.href} onClick={onChoose} {...shared}>
        {body}
      </a>
    );
  }
  return (
    <Link href={entry.href} onClick={onChoose} {...shared}>
      {body}
    </Link>
  );
}

export function CommandPalette({ posts }: { posts: Post[] }) {
  const open = useCommandPaletteOpen();
  const setOpen = useSetCommandPaletteOpen();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(
    () => buildSearchEntries(posts, formatPostDate),
    [posts],
  );

  const results = useMemo(
    () => filterSearchEntries(entries, query),
    [entries, query],
  );

  // Sliced back into display groups, but every entry keeps the index it has
  // in `results` — the cursor stays one flat number, so ↑↓ walk straight
  // across a group boundary with no special casing.
  const grouped = useMemo(
    () =>
      SEARCH_GROUPS.map((group) => ({
        group,
        items: results
          .map((entry, index) => ({ entry, index }))
          .filter((row) => row.entry.group === group),
      })).filter((section) => section.items.length > 0),
    [results],
  );

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

  function select(entry: SearchEntry) {
    close();
    // The feeds, llms.txt and the markdown twins are route handlers rather
    // than React routes, so there's nothing for the client router to render.
    if (entry.external) {
      window.location.href = entry.href;
      return;
    }
    router.push(entry.href);
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
        aria-label="Search this site"
        className="flex max-h-palette w-full max-w-155 flex-col overflow-hidden rounded-palette bg-surface p-4 pb-5 shadow-palette outline-none sm:p-6"
      >
        <div className="flex items-baseline gap-3">
          <input
            ref={inputRef}
            role="combobox"
            aria-label="Search this site"
            aria-expanded="true"
            aria-haspopup="listbox"
            aria-controls="command-palette-listbox"
            aria-autocomplete="list"
            aria-activedescendant={
              results[cursor]
                ? `command-palette-option-${results[cursor].id}`
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
                select(results[cursor]);
              }
            }}
            placeholder="Search articles, pages and endpoints"
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
          {grouped.map((section) => (
            // biome-ignore lint/a11y/useSemanticElements: ARIA allows only `option` and `group` as children of role="listbox", so role="group" on a div is the correct construct here; the suggested <fieldset> carries form semantics and is not valid in that position.
            <div
              key={section.group}
              role="group"
              aria-label={section.group}
              className="flex flex-col gap-5"
            >
              {/* aria-hidden because the group's accessible name already
                  carries this; leaving it exposed makes a screen reader
                  announce the heading twice per section. */}
              <div aria-hidden="true" className="text-2xs text-faint">
                {section.group}
              </div>
              {section.items.map(({ entry, index }) => (
                <PaletteOption
                  key={entry.id}
                  entry={entry}
                  selected={index === cursor}
                  onHover={() => setCursor(index)}
                  onChoose={() => select(entry)}
                />
              ))}
            </div>
          ))}
          {results.length === 0 && (
            <div className="text-md text-faint">
              Nothing here — try “sticky”, “storybook”, “uses”, “rss”.
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
