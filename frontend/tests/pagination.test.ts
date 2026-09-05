import { describe, expect, it } from "vitest";
import { visiblePageItems } from "@/lib/pagination";

describe("visiblePageItems", () => {
  it("lists every page when pageCount is 10 or less", () => {
    expect(visiblePageItems(1, 3)).toEqual([1, 2, 3]);
    expect(visiblePageItems(5, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("shows a compact window when pageCount exceeds 10", () => {
    expect(visiblePageItems(10, 40)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 40]);
    expect(visiblePageItems(1, 40)).toEqual([1, 2, "ellipsis", 40]);
    expect(visiblePageItems(40, 40)).toEqual([1, "ellipsis", 39, 40]);
  });
});
