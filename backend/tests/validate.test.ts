import { describe, expect, it } from "vitest";
import { parseLocale } from "../src/lib/locale.js";
import { parseBarcode, parseFeaturedPage, parseQuery, parseSearchPage } from "../src/lib/validate.js";
import { AppError } from "../src/types.js";

describe("parseLocale", () => {
  it("defaults unknown or missing to en", () => {
    expect(parseLocale(undefined)).toBe("en");
    expect(parseLocale("pt")).toBe("en");
    expect(parseLocale("de")).toBe("de");
  });
});

describe("parseQuery", () => {
  it("rejects empty and too-long queries", () => {
    expect(() => parseQuery("  ")).toThrow(AppError);
    expect(() => parseQuery("a".repeat(81))).toThrow(AppError);
    try {
      parseQuery("");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("invalid_query");
      expect((error as AppError).status).toBe(400);
    }
  });

  it("trims a valid query", () => {
    expect(parseQuery("  nutella  ")).toBe("nutella");
  });
});

describe("parseSearchPage", () => {
  it("defaults missing page to 1 and allows up to 1000", () => {
    expect(parseSearchPage(undefined)).toBe(1);
    expect(parseSearchPage("11")).toBe(11);
    expect(parseSearchPage("1000")).toBe(1000);
  });

  it("rejects out-of-range search pages", () => {
    expect(() => parseSearchPage("0")).toThrow(AppError);
    expect(() => parseSearchPage("1001")).toThrow(AppError);
  });
});

describe("parseFeaturedPage", () => {
  it("allows pages 1 through 10 only", () => {
    expect(parseFeaturedPage("10")).toBe(10);
    expect(() => parseFeaturedPage("11")).toThrow(AppError);
  });
});

describe("parseBarcode", () => {
  it("accepts 8-14 digits and rejects other shapes", () => {
    expect(parseBarcode("30176204")).toBe("30176204");
    expect(() => parseBarcode("abc")).toThrow(AppError);
    expect(() => parseBarcode("123")).toThrow(AppError);
    try {
      parseBarcode("12a4");
    } catch (error) {
      expect((error as AppError).code).toBe("invalid_barcode");
    }
  });
});
