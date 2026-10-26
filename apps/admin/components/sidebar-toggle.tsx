"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// The collapsed state lives on <html data-sidebar="collapsed">, set before
// first paint by the script in app/layout.tsx, so the static shell never
// flashes open. Everything else (widths, icons-only, tooltips) is CSS keyed
// off that attribute: the `sidebar-collapsed` variant in globals.css.

export const SIDEBAR_KEY = "sidebar";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-sidebar"],
  });
  return () => observer.disconnect();
}

const isCollapsed = () =>
  document.documentElement.dataset.sidebar === "collapsed";

function toggle() {
  const root = document.documentElement;
  const collapsed = !isCollapsed();
  if (collapsed) root.dataset.sidebar = "collapsed";
  else delete root.dataset.sidebar;
  try {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "expanded");
  } catch {}
}

export function SidebarToggle({ className }: { className?: string }) {
  const collapsed = useSyncExternalStore(subscribe, isCollapsed, () => false);

  // ⌘B / Ctrl+B, as in most editors.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const label = collapsed ? "Expand sidebar" : "Collapse sidebar";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          onClick={toggle}
          className={className}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {label} <kbd className="ml-1 font-sans opacity-70">⌘B</kbd>
      </TooltipContent>
    </Tooltip>
  );
}
