"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCategories,
  deleteCategory,
  saveCategory,
  suggestCategories,
} from "@/lib/actions/expenses";
import {
  CATEGORY_KINDS,
  type CategoryKind,
  KIND_LABEL,
} from "@/lib/expenses/transactions";

type Draft = {
  key: number;
  name: string;
  kind: CategoryKind;
  description: string;
};

// React keys only (never rendered into HTML), so it needn't match the server.
let nextKey = 0;
const draft = (c: Partial<Omit<Draft, "key">> = {}): Draft => ({
  key: nextKey++,
  name: c.name ?? "",
  kind: c.kind ?? "spending",
  description: c.description ?? "",
});

function KindSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: CategoryKind;
  onChange: (kind: CategoryKind) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as CategoryKind)}>
      <SelectTrigger id={id} aria-label="Kind" className="w-full sm:w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CATEGORY_KINDS.map((kind) => (
          <SelectItem key={kind} value={kind}>
            {KIND_LABEL[kind]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DraftRow({
  value,
  onChange,
  actions,
}: {
  value: Draft;
  onChange: (next: Draft) => void;
  actions: React.ReactNode;
}) {
  // Not value.key: that counter differs between server and client render.
  const id = useId();
  return (
    <li className="grid gap-2 py-3 sm:grid-cols-[12rem_auto_1fr_auto] sm:items-center">
      <Input
        aria-label="Name"
        value={value.name}
        maxLength={40}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
      />
      <KindSelect
        id={`${id}-kind`}
        value={value.kind}
        onChange={(kind) => onChange({ ...value, kind })}
      />
      <Input
        aria-label="What belongs here"
        placeholder="What belongs here (the AI reads this)"
        value={value.description}
        maxLength={200}
        onChange={(e) => onChange({ ...value, description: e.target.value })}
      />
      <div className="flex gap-1">{actions}</div>
    </li>
  );
}

/** Setup: the AI suggests a list from your history; you edit it, then save it all. */
export function SetupCategories({ ai }: { ai: boolean }) {
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [pending, startTransition] = useTransition();
  const update = (key: number, next: Draft) =>
    setDrafts((list) => list?.map((d) => (d.key === key ? next : d)) ?? null);

  if (!drafts) {
    return (
      <div className="grid justify-items-start gap-3">
        <p className="text-sm text-muted-foreground">
          {ai
            ? "The AI reads the merchants in your last six months and suggests a category list. You can change all of it before anything is saved."
            : "No AI Gateway credentials here, so you'll get a standard starter list to edit instead of a tailored one."}
        </p>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await suggestCategories();
              if (result.error) toast.error(result.error);
              else setDrafts((result.categories ?? []).map((c) => draft(c)));
            })
          }
        >
          {pending ? "Reading your transactions…" : "Suggest categories"}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <ul className="divide-y border-y">
        {drafts.map((d) => (
          <DraftRow
            key={d.key}
            value={d}
            onChange={(next) => update(d.key, next)}
            actions={
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setDrafts(
                    (list) => list?.filter((x) => x.key !== d.key) ?? null,
                  )
                }
              >
                Remove
              </Button>
            }
          />
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => setDrafts((list) => [...(list ?? []), draft()])}
        >
          Add a category
        </Button>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await createCategories(
                drafts.map(({ name, kind, description }) => ({
                  name,
                  kind,
                  description,
                })),
              );
              if (result?.error) toast.error(result.error);
            })
          }
        >
          {pending
            ? "Labelling six months of transactions…"
            : "Save and label my history"}
        </Button>
      </div>
    </div>
  );
}

/** Settings: each category saves on its own. */
export function CategoryEditor({
  categories,
}: {
  categories: {
    id: string;
    name: string;
    kind: CategoryKind;
    description: string | null;
    used: number;
  }[];
}) {
  const [adding, setAdding] = useState<Draft | null>(null);
  return (
    <div className="grid gap-3">
      <ul className="divide-y border-y">
        {categories.map((c) => (
          <SavedCategory key={c.id} category={c} />
        ))}
        {adding ? (
          <NewCategory
            value={adding}
            onChange={setAdding}
            onDone={() => setAdding(null)}
          />
        ) : null}
      </ul>
      {adding ? null : (
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAdding(draft())}
          >
            Add a category
          </Button>
        </div>
      )}
    </div>
  );
}

function SavedCategory({
  category,
}: {
  category: {
    id: string;
    name: string;
    kind: CategoryKind;
    description: string | null;
    used: number;
  };
}) {
  const [value, setValue] = useState(() =>
    draft({ ...category, description: category.description ?? "" }),
  );
  const [pending, startTransition] = useTransition();
  const dirty =
    value.name !== category.name ||
    value.kind !== category.kind ||
    value.description !== (category.description ?? "");
  return (
    <DraftRow
      value={value}
      onChange={setValue}
      actions={
        <>
          <Button
            size="sm"
            variant={dirty ? "default" : "ghost"}
            disabled={pending || !dirty}
            onClick={() =>
              startTransition(async () => {
                const result = await saveCategory({
                  id: category.id,
                  ...value,
                });
                if (result.error) toast.error(result.error);
                else toast.success("Saved.");
              })
            }
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending || category.used > 0}
            title={
              category.used
                ? `${category.used} transaction${category.used === 1 ? "" : "s"} use this category`
                : undefined
            }
            onClick={() =>
              startTransition(async () => {
                const result = await deleteCategory(category.id);
                if (result.error) toast.error(result.error);
              })
            }
          >
            Delete
          </Button>
        </>
      }
    />
  );
}

function NewCategory({
  value,
  onChange,
  onDone,
}: {
  value: Draft;
  onChange: (next: Draft) => void;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <DraftRow
      value={value}
      onChange={onChange}
      actions={
        <>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await saveCategory(value);
                if (result.error) toast.error(result.error);
                else onDone();
              })
            }
          >
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </>
      }
    />
  );
}
