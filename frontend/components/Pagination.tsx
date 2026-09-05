"use client";

import { useTranslations } from "next-intl";
import { visiblePageItems } from "@/lib/pagination";

export function Pagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {
  const t = useTranslations();

  if (pageCount <= 1) {
    return null;
  }

  const items = visiblePageItems(page, pageCount);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label={t("pagination")}>
      <button
        type="button"
        disabled={page <= 1}
        className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink/70 transition-colors hover:text-ink disabled:opacity-40"
        onClick={() => onPage(page - 1)}
      >
        {t("previous")}
      </button>
      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="min-w-9 px-2 py-1.5 text-sm font-semibold text-ink/40"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            className={`min-w-9 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              item === page ? "bg-ink text-cream" : "text-ink/70 hover:bg-ink/5 hover:text-ink"
            }`}
            onClick={() => onPage(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page >= pageCount}
        className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink/70 transition-colors hover:text-ink disabled:opacity-40"
        onClick={() => onPage(page + 1)}
      >
        {t("next")}
      </button>
    </nav>
  );
}
