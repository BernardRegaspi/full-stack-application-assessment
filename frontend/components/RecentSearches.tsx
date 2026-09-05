"use client";

import { useTranslations } from "next-intl";
import type { SearchHistoryItem } from "@/lib/types";

export function RecentSearches({
  searches,
  onSelect,
  onClear,
}: {
  searches: SearchHistoryItem[];
  onSelect: (query: string) => void;
  onClear?: () => void;
}) {
  const t = useTranslations();

  if (searches.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex max-w-2xl flex-wrap items-start gap-2">
      <span className="pt-1.5 text-xs font-semibold tracking-wider text-ink/50 uppercase">
        {t("recentSearches")}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {searches.map((item) => (
          <button
            key={item.id}
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 py-1 text-sm transition-colors hover:border-moss hover:text-moss"
            onClick={() => onSelect(item.query)}
          >
            <svg
              className="h-3 w-3 opacity-50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            {item.query}
          </button>
        ))}
      </div>
      {onClear ? (
        <button
          type="button"
          className="pt-1.5 text-xs font-semibold text-amber underline-offset-2 transition-colors hover:text-ink hover:underline"
          onClick={onClear}
        >
          {t("clearHistory")}
        </button>
      ) : null}
    </div>
  );
}
