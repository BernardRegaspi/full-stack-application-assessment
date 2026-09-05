import { describe, expect, it } from "vitest";
import { uniqueRecentSearches } from "../src/lib/searchHistory.js";

describe("uniqueRecentSearches", () => {
  it("keeps the latest row per query and language, case-insensitive", () => {
    const rows = [
      { id: "1", query: "Cola", language: "en", createdAt: "2026-09-05T12:00:00.000Z" },
      { id: "2", query: "apple", language: "en", createdAt: "2026-09-05T11:00:00.000Z" },
      { id: "3", query: "cola", language: "en", createdAt: "2026-09-05T10:00:00.000Z" },
      { id: "4", query: "cola", language: "nl", createdAt: "2026-09-05T09:00:00.000Z" },
    ];
    expect(uniqueRecentSearches(rows, 10)).toEqual([
      { id: "1", query: "Cola", language: "en", createdAt: "2026-09-05T12:00:00.000Z" },
      { id: "2", query: "apple", language: "en", createdAt: "2026-09-05T11:00:00.000Z" },
      { id: "4", query: "cola", language: "nl", createdAt: "2026-09-05T09:00:00.000Z" },
    ]);
  });
});
