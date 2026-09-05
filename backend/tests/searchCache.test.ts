import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSearchCache, getCached, setCached } from "../src/lib/searchCache.js";

describe("searchCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearSearchCache();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearSearchCache();
  });

  it("returns a cached value before TTL expires", () => {
    setCached("en:cola:1", { page: 1 }, 60_000);
    expect(getCached("en:cola:1")).toEqual({ page: 1 });
  });

  it("drops expired entries", () => {
    setCached("en:cola:1", { page: 1 }, 60_000);
    vi.advanceTimersByTime(60_000);
    expect(getCached("en:cola:1")).toBeUndefined();
  });
});
