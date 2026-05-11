"use client";

import { Check } from "lucide-react";

import { useAccentTheme } from "@/components/theme-provider";
import { accentThemes } from "@/lib/themes";
import { cn } from "@/lib/utils";

export function ThemeSelector() {
  const { accentTheme, setAccentTheme } = useAccentTheme();

  return (
    <div className="mt-12 max-w-xl rounded-lg border border-border/45 bg-card/65 p-5 shadow-calm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Choose your accent</p>
          <p className="mt-1 text-sm leading-6 text-subtle">
            Pastels stay gentle: buttons, highlights, badges, and progress moments.
          </p>
        </div>
        <span className="rounded-full bg-surface-tint px-3 py-1 text-xs text-soft">
          saved
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {accentThemes.map((theme) => {
          const isSelected = accentTheme === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setAccentTheme(theme.id)}
              className={cn(
                "group grid gap-2 rounded-md border border-border/55 bg-card/70 p-2 text-left transition-all hover:border-primary/70 hover:bg-surface-tint/60",
                isSelected && "border-primary/80 bg-surface-tint ring-2 ring-primary/30",
              )}
            >
              <span
                className="flex h-10 items-center justify-center rounded-md border border-white/70 shadow-sm"
                style={{ backgroundColor: theme.hex }}
              >
                {isSelected ? <Check className="h-4 w-4 text-foreground/70" /> : null}
              </span>
              <span className="truncate text-xs font-medium text-soft">{theme.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
