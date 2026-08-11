"use client";

import { useState, type KeyboardEvent } from "react";

type TagInputProps = {
  name?: string;
  defaultTags?: string[];
};

export function TagInput({ name = "tags", defaultTags = [] }: TagInputProps) {
  const [tags, setTags] = useState<string[]>(defaultTags);
  const [draft, setDraft] = useState("");

  function addTag(raw: string) {
    const value = raw.trim();
    if (!value) return;
    setTags((prev) =>
      prev.includes(value) ? prev : [...prev, value],
    );
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && !draft && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={tags.join(",")} />
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
            className="rounded-full bg-stone-200 px-3 py-1 text-sm text-stone-800"
          >
            {tag} ×
          </button>
        ))}
      </div>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => addTag(draft)}
        placeholder="Type a tag, press Enter"
        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-500"
      />
    </div>
  );
}
