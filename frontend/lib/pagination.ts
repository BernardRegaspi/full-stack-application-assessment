export type PageItem = number | "ellipsis";

export function visiblePageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 10) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, pageCount]);
  for (let p = page - 1; p <= page + 1; p++) {
    if (p >= 1 && p <= pageCount) {
      pages.add(p);
    }
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const items: PageItem[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]!;
    if (i > 0 && current - sorted[i - 1]! > 1) {
      items.push("ellipsis");
    }
    items.push(current);
  }
  return items;
}
