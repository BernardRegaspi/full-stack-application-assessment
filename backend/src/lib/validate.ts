import { AppError } from "../types.js";

const MAX_QUERY_LENGTH = 80;
const BARCODE_RE = /^\d{8,14}$/;
export const MAX_FEATURED_PAGES = 10;
export const MAX_SEARCH_PAGES = 1000;

export function parseQuery(value: unknown): string {
  if (typeof value !== "string") {
    throw new AppError("invalid_query", "Query is required", 400);
  }
  const query = value.trim();
  if (query.length === 0 || query.length > MAX_QUERY_LENGTH) {
    throw new AppError("invalid_query", "Query must be 1-80 characters", 400);
  }
  return query;
}

function parsePageInRange(value: unknown, max: number, message: string): number {
  if (value === undefined) {
    return 1;
  }
  const raw = Array.isArray(value) ? value[0] : value;
  const page = typeof raw === "string" ? Number.parseInt(raw, 10) : Number(raw);
  if (!Number.isInteger(page) || page < 1 || page > max) {
    throw new AppError("invalid_page", message, 400);
  }
  return page;
}

/** Featured listing: pages 1–10. */
export function parseFeaturedPage(value: unknown): number {
  return parsePageInRange(value, MAX_FEATURED_PAGES, "Page must be between 1 and 10");
}

/** Product search: pages 1–1000. */
export function parseSearchPage(value: unknown): number {
  return parsePageInRange(value, MAX_SEARCH_PAGES, "Page must be between 1 and 1000");
}

/** @deprecated Use parseFeaturedPage or parseSearchPage. */
export function parsePage(value: unknown): number {
  return parseFeaturedPage(value);
}

export function parseBarcode(value: string): string {
  if (!BARCODE_RE.test(value)) {
    throw new AppError("invalid_barcode", "Barcode must be 8-14 digits", 400);
  }
  return value;
}
