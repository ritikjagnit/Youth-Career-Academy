import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, X, Plus, ListPlus } from "lucide-react";

export function PreferencePicker({
  label,
  available,
  selected,
  onChange,
}: {
  label: string;
  available: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const remaining = available.filter((c) => !selected.includes(c));

  const add = (item: string) => onChange([...selected, item]);
  const remove = (item: string) =>
    onChange(selected.filter((s) => s !== item));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= selected.length) return;
    const next = [...selected];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const addAll = () => onChange([...selected, ...remaining]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-primary">{label}</h4>
        {remaining.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addAll}
            className="h-7 text-xs"
          >
            <ListPlus className="mr-1 h-3 w-3" /> Add All
          </Button>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {/* Available */}
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Available ({remaining.length})
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {remaining.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                All added to preferences
              </p>
            )}
            {remaining.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => add(c)}
                className="group flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-2 py-1.5 text-left text-xs transition hover:border-accent hover:bg-accent/5"
              >
                <span className="truncate">{c}</span>
                <Plus className="h-3.5 w-3.5 shrink-0 text-accent opacity-60 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>

        {/* Selected with preference order */}
        <div className="rounded-xl border-2 border-accent/30 bg-accent/5 p-3">
          <div className="mb-2 text-xs font-semibold uppercase text-accent">
            Your Preferences ({selected.length})
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {selected.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No preferences added yet
              </p>
            )}
            {selected.map((c, i) => (
              <div
                key={c}
                className="flex items-center gap-1 rounded-lg border border-accent/40 bg-card px-2 py-1.5 text-xs"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {i + 1}
                </span>
                <span className="flex-1 truncate" title={c}>
                  {c}
                </span>
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
                  title="Move up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === selected.length - 1}
                  className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
                  title="Move down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(c)}
                  className="rounded p-0.5 text-destructive hover:bg-destructive/10"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
