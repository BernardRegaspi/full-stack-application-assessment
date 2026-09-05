import type { ProductDetail, ProductSummary, SearchHistoryItem, SubscriptionStatus } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, init);
  if (!response.ok) {
    let code = "upstream_unavailable";
    try {
      const body = (await response.json()) as { error?: { code?: string; message?: string } };
      code = body.error?.code ?? code;
    } catch {
      /* ignore */
    }
    throw new ApiError(code, code);
  }
  return (await response.json()) as T;
}

export const api = {
  search: (q: string, lang: string, page = 1) =>
    request<{
      products: ProductSummary[];
      resultCount: number;
      page: number;
      pageSize: number;
      pageCount: number;
    }>(
      `/api/search?q=${encodeURIComponent(q)}&lang=${encodeURIComponent(lang)}&page=${page}`,
    ),
  product: (barcode: string, lang: string) =>
    request<ProductDetail>(
      `/api/products/${encodeURIComponent(barcode)}?lang=${encodeURIComponent(lang)}`,
    ),
  me: () => request<{ email: string; subscriptionStatus: SubscriptionStatus }>("/api/me"),
  history: () =>
    request<{
      searches: SearchHistoryItem[];
    }>("/api/search-history"),
  clearHistory: () =>
    request<{ searches: SearchHistoryItem[] }>("/api/search-history", { method: "DELETE" }),
  featured: (lang: string, page: number) =>
    request<{
      products: ProductSummary[];
      resultCount: number;
      page: number;
      pageSize: number;
      pageCount: number;
    }>(`/api/featured?lang=${encodeURIComponent(lang)}&page=${page}`),
  checkout: (lang: string) =>
    request<{ url: string }>("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang }),
    }),
  cancelSubscription: () =>
    request<{ subscriptionStatus: SubscriptionStatus }>("/api/subscription/cancel", {
      method: "POST",
    }),
};

export const apiSearch = api.search;
export const apiProduct = api.product;
export const apiMe = api.me;
export const apiHistory = api.history;
export const apiCheckout = api.checkout;
