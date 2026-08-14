"use client";

import { useEffect, useRef, useState } from "react";
import type { HelpChooseControlWithOptions } from "@/lib/types";

type FilterBarProps = {
  controls: HelpChooseControlWithOptions[];
  selected: Set<string>;
  onToggle: (optionId: string) => void;
};

function chipClass(selected: boolean) {
  return selected
    ? "border-foreground bg-foreground text-surface"
    : "border-border-beige bg-surface text-muted-beige";
}

export function FilterBar({ controls, selected, onToggle }: FilterBarProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function update() {
      const node = scrollerRef.current;
      if (!node) return;
      setCanScrollLeft(node.scrollLeft > 4);
      setCanScrollRight(
        node.scrollLeft + node.clientWidth < node.scrollWidth - 4,
      );
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [controls]);

  if (controls.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="filter-scroll flex gap-2 overflow-x-auto py-2"
      >
        {controls.map((control) => {
          if (control.kind === "toggle") {
            const option = control.options[0];
            if (!option) return null;
            const isSelected = selected.has(option.id);
            return (
              <button
                key={control.id}
                type="button"
                onClick={() => onToggle(option.id)}
                aria-pressed={isSelected}
                className={`shrink-0 snap-start rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${chipClass(isSelected)}`}
              >
                {option.label}
              </button>
            );
          }

          return (
            <div
              key={control.id}
              role="radiogroup"
              aria-label={
                control.name ??
                control.options.map((option) => option.label).join(" or ")
              }
              className="flex shrink-0 snap-start overflow-hidden rounded-full border border-border-beige bg-surface"
            >
              {control.options.map((option, index) => {
                const isSelected = selected.has(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onToggle(option.id)}
                    className={`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                      isSelected
                        ? "bg-foreground text-surface"
                        : "bg-transparent text-muted-beige"
                    } ${index > 0 ? "border-l border-border-beige" : ""}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-7 bg-gradient-to-r from-background to-transparent transition-opacity ${
          canScrollLeft ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-background to-transparent transition-opacity ${
          canScrollRight ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
