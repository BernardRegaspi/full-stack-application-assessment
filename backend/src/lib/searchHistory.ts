export function uniqueRecentSearches<T extends { query: string; language: string }>(
  rows: T[],
  limit = 10,
): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const row of rows) {
    const key = `${row.language}:${row.query.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
    if (unique.length >= limit) break;
  }
  return unique;
}
