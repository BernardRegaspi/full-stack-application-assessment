"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { HeroSticker } from "@/components/HeroSticker";
import { Pagination } from "@/components/Pagination";
import { PaywallBanner } from "@/components/PaywallBanner";
import { ProductCard } from "@/components/ProductCard";
import { RecentSearches } from "@/components/RecentSearches";
import { SearchBar } from "@/components/SearchBar";
import { api, ApiError } from "@/lib/api";
import type { ProductSummary, SearchHistoryItem } from "@/lib/types";

const TRENDS = ["chocolate", "cola", "pasta", "yogurt", "tomato"] as const;

function searchErrorMessage(code: string, t: (key: string) => string): string {
  if (code === "invalid_query") {
    return t("invalidQuery");
  }
  return t("searchRateLimitError");
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-ink/10 bg-white"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="skel aspect-square" />
      <div className="space-y-2.5 p-4">
        <div className="skel h-3 w-1/3 rounded" />
        <div className="skel h-5 w-4/5 rounded" />
        <div className="skel h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductSummary[] | null>(null);
  const [featured, setFeatured] = useState<ProductSummary[] | null>(null);
  const [featuredPage, setFeaturedPage] = useState(1);
  const [featuredPageCount, setFeaturedPageCount] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const [searchPageCount, setSearchPageCount] = useState(1);
  const [resultCount, setResultCount] = useState(0);
  const [searches, setSearches] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void api
      .history()
      .then((result) => {
        if (!cancelled) {
          setSearches(result.searches);
        }
      })
      .catch(() => {
        /* history is optional chrome */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFeatured(null);
    void api
      .featured(locale, featuredPage)
      .then((result) => {
        if (!cancelled) {
          setFeatured(result.products);
          setFeaturedPageCount(result.pageCount);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFeatured([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [locale, featuredPage]);

  const runSearch = useCallback(
    async (q: string, page = 1) => {
      const trimmed = q.trim();
      if (!trimmed) {
        return;
      }
      setQuery(trimmed);
      setSubmittedQuery(trimmed);
      setSearchPage(page);
      setLoading(true);
      setError(null);
      try {
        const result = await api.search(trimmed, locale, page);
        setProducts(result.products);
        setResultCount(result.resultCount);
        setSearchPageCount(result.pageCount);
        try {
          const history = await api.history();
          setSearches(history.searches);
        } catch {
          /* keep previous history on refresh failure */
        }
      } catch (err) {
        setProducts(null);
        setError(
          searchErrorMessage(err instanceof ApiError ? err.code : "upstream_unavailable", t),
        );
      } finally {
        setLoading(false);
      }
    },
    [locale, t],
  );

  function clearResults() {
    setSubmittedQuery("");
    setProducts(null);
    setError(null);
    setQuery("");
    setSearchPage(1);
    setSearchPageCount(1);
    setResultCount(0);
  }

  const hasSearched = products !== null || error !== null || loading;

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mb-4 flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-moss uppercase">
              <span className="pulse-dot h-2 w-2 rounded-full bg-moss" />
              <span>{t("overline")}</span>
            </p>
            <h1 className="font-display text-4xl leading-[1.06] font-bold tracking-tight sm:text-5xl xl:text-[3.6rem]">
              {t("headline")}
            </h1>
            <svg className="mt-3" width="190" height="12" viewBox="0 0 190 12" fill="none" aria-hidden>
              <path
                d="M3 8c30-6 60 4 92-2s62-4 92 0"
                stroke="#E9A13B"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            <p className="mt-4 max-w-xl leading-relaxed text-ink/70">{t("subline")}</p>
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={() => void runSearch(query)}
              loading={loading}
            />
            <RecentSearches
              searches={searches}
              onSelect={(historyQuery) => {
                void runSearch(historyQuery);
              }}
              onClear={() => {
                void api
                  .clearHistory()
                  .then(() => setSearches([]))
                  .catch(() => {
                    /* keep chips if clear fails */
                  });
              }}
            />
            <div className="mt-4 flex max-w-2xl flex-wrap items-start gap-2">
              <span className="pt-1.5 text-xs font-semibold tracking-wider text-ink/50 uppercase">
                {t("trending")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TRENDS.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="rounded-full border border-ink/15 bg-white px-3.5 py-1.5 text-sm transition-colors hover:bg-ink hover:text-cream"
                    onClick={() => void runSearch(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <HeroSticker />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="border-t-2 border-ink/10 pt-4">
          <PaywallBanner />
        </div>

        {hasSearched ? (
          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-bold">
              {loading
                ? t("loading")
                : products && products.length > 0
                  ? t("productsFound", { n: resultCount })
                  : error
                    ? t("searchErrorTitle")
                    : t("noResults")}
            </h2>
            <div className="flex items-center gap-3">
              {submittedQuery ? (
                <span className="text-sm text-ink/55">
                  {t("resultsFor")} “{submittedQuery}”
                </span>
              ) : null}
              {submittedQuery ? (
                <button
                  type="button"
                  className="text-sm font-semibold text-amber underline-offset-2 transition-colors hover:text-ink hover:underline"
                  onClick={clearResults}
                >
                  {t("clear")}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 text-sm text-ink">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        ) : null}

        {products && products.length === 0 && !loading && !error ? (
          <div className="card-in col-span-full mt-8 flex flex-col items-center py-16 text-center">
            <svg
              className="mb-4 h-24 w-24 text-ink/25"
              viewBox="0 0 96 96"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              aria-hidden
            >
              <circle cx="42" cy="42" r="24" />
              <path d="M60 60l16 16" strokeLinecap="round" />
              <path d="M34 46c2 4 14 4 16 0" strokeLinecap="round" />
              <circle cx="35" cy="37" r="1.6" fill="currentColor" />
              <circle cx="49" cy="37" r="1.6" fill="currentColor" />
            </svg>
            <h3 className="font-display text-2xl font-bold">{t("noResults")}</h3>
            <p className="mt-2 max-w-sm text-sm text-ink/60">{t("noResultsDesc")}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-1.5">
              {TRENDS.map((term) => (
                <button
                  key={term}
                  type="button"
                  className="rounded-full border border-ink/15 bg-white px-3.5 py-1.5 text-sm transition-colors hover:bg-ink hover:text-cream"
                  onClick={() => void runSearch(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {products && products.length > 0 && !loading ? (
          <>
            <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product, index) => (
                <li key={product.barcode}>
                  <ProductCard product={product} index={index} />
                </li>
              ))}
            </ul>
            <Pagination
              page={searchPage}
              pageCount={searchPageCount}
              onPage={(next) => {
                void runSearch(submittedQuery, next);
              }}
            />
          </>
        ) : null}

        {!hasSearched ? (
          <>
            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl font-bold">{t("featured")}</h2>
              {featured ? (
                <span className="text-sm text-ink/55">
                  {t("pageOf", { page: featuredPage, pages: featuredPageCount })}
                </span>
              ) : null}
            </div>
            {featured === null ? (
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <SkeletonCard key={i} index={i} />
                ))}
              </div>
            ) : featured.length > 0 ? (
              <>
                <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {featured.map((product, index) => (
                    <li key={product.barcode}>
                      <ProductCard product={product} index={index} />
                    </li>
                  ))}
                </ul>
                <Pagination
                  page={featuredPage}
                  pageCount={featuredPageCount}
                  onPage={setFeaturedPage}
                />
              </>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}
