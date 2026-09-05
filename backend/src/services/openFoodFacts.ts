import { mapOffHit, mapOffProduct, type OffRawProduct } from "../lib/mapOffProduct.js";
import { clearSearchCache, getCached, setCached } from "../lib/searchCache.js";
import { AppError, type Locale, type NormalizedProduct, type ProductSummary } from "../types.js";

const USER_AGENT = "NutriFind/1.0 (assessment; contact: demo@example.com)";
const TIMEOUT_MS = 15000;
const PAGE_SIZE = 24;
const MAX_ATTEMPTS = 3;
const SEARCH_CACHE_TTL_MS = 60_000;
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SEARCH_FIELDS = [
  "code",
  "product_name",
  "product_name_en",
  "product_name_nl",
  "product_name_de",
  "product_name_fr",
  "generic_name",
  "generic_name_en",
  "generic_name_nl",
  "generic_name_de",
  "generic_name_fr",
  "brands",
  "image_front_small_url",
  "image_front_url",
].join(",");

const DETAIL_FIELDS = `${SEARCH_FIELDS},nutriments,nutriments_estimated,serving_size,quantity,packaging,categories,categories_tags,labels,labels_tags,ingredients_text,ingredients_text_en,ingredients_text_nl,ingredients_text_de,ingredients_text_fr,origins,manufacturing_places,countries,nutriscore_grade,nova_group,states_tags,completeness`;

async function offFetch(url: string): Promise<Response> {
  let lastNetworkError = false;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });
      const retryable = RETRYABLE_STATUS.has(response.status);
      if (!retryable || attempt === MAX_ATTEMPTS) {
        return response;
      }
    } catch {
      lastNetworkError = true;
      if (attempt === MAX_ATTEMPTS) {
        throw new AppError("upstream_unavailable", "Open Food Facts request failed", 502);
      }
    } finally {
      clearTimeout(timer);
    }
    await delay(200 * 2 ** (attempt - 1));
  }

  if (lastNetworkError) {
    throw new AppError("upstream_unavailable", "Open Food Facts request failed", 502);
  }
  throw new AppError("upstream_unavailable", "Open Food Facts request failed", 502);
}

const MAX_FEATURED_PAGES = 10;

function searchPageCountFor(resultCount: number): number {
  return Math.max(1, Math.ceil(resultCount / PAGE_SIZE) || 1);
}

function featuredPageCountFor(resultCount: number): number {
  return Math.min(
    MAX_FEATURED_PAGES,
    Math.max(1, Math.ceil(resultCount / PAGE_SIZE) || 1),
  );
}

export async function searchOpenFoodFacts(
  q: string,
  lang: Locale,
  page = 1,
): Promise<{
  products: ProductSummary[];
  resultCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}> {
  const cacheKey = `${lang}:${q.trim().toLowerCase()}:${page}`;
  const cached = getCached<{
    products: ProductSummary[];
    resultCount: number;
    page: number;
    pageSize: number;
    pageCount: number;
  }>(cacheKey);
  if (cached) {
    return cached;
  }

  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}` +
    `&search_simple=1&action=process&json=1&page_size=${PAGE_SIZE}` +
    `&page=${page}` +
    `&lc=${encodeURIComponent(lang)}&fields=${encodeURIComponent(SEARCH_FIELDS)}`;
  const listed = await parseOffList(await offFetch(url), lang);
  const result = {
    ...listed,
    page,
    pageSize: PAGE_SIZE,
    pageCount: searchPageCountFor(listed.resultCount),
  };
  setCached(cacheKey, result, SEARCH_CACHE_TTL_MS);
  return result;
}

export async function listFeaturedOpenFoodFacts(
  lang: Locale,
  page: number,
): Promise<{
  products: ProductSummary[];
  resultCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}> {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1` +
    `&page_size=${PAGE_SIZE}&page=${page}&sort_by=unique_scans_n` +
    `&lc=${encodeURIComponent(lang)}&fields=${encodeURIComponent(SEARCH_FIELDS)}`;
  const listed = await parseOffList(await offFetch(url), lang);
  return {
    ...listed,
    page,
    pageSize: PAGE_SIZE,
    pageCount: featuredPageCountFor(listed.resultCount),
  };
}

async function parseOffList(
  response: Response,
  lang: Locale,
): Promise<{ products: ProductSummary[]; resultCount: number }> {
  if (!response.ok) {
    throw new AppError("upstream_unavailable", "Open Food Facts search failed", 502);
  }

  let body: { count?: unknown; products?: unknown };
  try {
    body = (await response.json()) as { count?: unknown; products?: unknown };
  } catch {
    throw new AppError("upstream_unavailable", "Open Food Facts returned invalid JSON", 502);
  }

  const rawList = Array.isArray(body.products) ? body.products : [];
  const products: ProductSummary[] = [];
  for (const raw of rawList) {
    const mapped = mapOffHit(raw as OffRawProduct, lang);
    if (mapped) products.push(mapped);
  }

  const resultCount = typeof body.count === "number" ? body.count : products.length;
  return { products, resultCount };
}

export async function getOpenFoodFactsProduct(
  barcode: string,
  lang: Locale,
): Promise<NormalizedProduct> {
  const url =
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}` +
    `?lc=${encodeURIComponent(lang)}&fields=${encodeURIComponent(DETAIL_FIELDS)}`;

  const response = await offFetch(url);
  if (response.status === 404) {
    throw new AppError("product_not_found", "Product not found", 404);
  }
  if (!response.ok) {
    throw new AppError("upstream_unavailable", "Open Food Facts product failed", 502);
  }

  let body: { status?: unknown; product?: unknown };
  try {
    body = (await response.json()) as { status?: unknown; product?: unknown };
  } catch {
    throw new AppError("upstream_unavailable", "Open Food Facts returned invalid JSON", 502);
  }

  if (body.status === 0 || !body.product) {
    throw new AppError("product_not_found", "Product not found", 404);
  }

  const mapped = mapOffProduct(body.product as OffRawProduct, lang);
  if (!mapped) {
    throw new AppError("product_not_found", "Product not found", 404);
  }
  return mapped;
}
