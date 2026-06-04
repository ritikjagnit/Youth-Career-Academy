import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  "Verify",
  "Personal",
  "Academic",
  "Documents",
  "Stream",
  "Terms",
  "Review",
  "Done",
];

export function StepProgress({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>
          Step {Math.min(current, STEPS.length)} of {STEPS.length}
        </span>
        <span>{Math.round((Math.min(current, STEPS.length) / STEPS.length) * 100)}% complete</span>
      </div>
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => {
          const idx = i + 1;
          const done = current > idx;
          const active = current === idx;
          return (
            <div key={label} className="flex flex-1 items-center gap-1">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                    done && "border-success bg-success text-success-foreground",
                    active && "border-accent bg-accent text-accent-foreground shadow-md",
                    !done && !active && "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : idx}
                </div>
                <span
                  className={cn(
                    "hidden text-[10px] font-medium sm:block",
                    active ? "text-accent" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 transition",
                    done ? "bg-success" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
