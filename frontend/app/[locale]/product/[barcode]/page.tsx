"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useCheckout } from "@/components/CheckoutProvider";
import { ProductDetailContent } from "@/components/ProductDetailContent";
import { Link } from "@/i18n/routing";
import { api, ApiError } from "@/lib/api";
import type { ProductDetail } from "@/lib/types";

function productErrorMessage(code: string, t: (key: string) => string): string {
  if (code === "invalid_barcode" || code === "product_not_found") {
    return t("invalidBarcode");
  }
  return t("upstreamError");
}

type LoadState =
  | { kind: "idle" }
  | { kind: "ok"; barcode: string; product: ProductDetail }
  | { kind: "error"; barcode: string; message: string };

export default function ProductPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams<{ barcode: string }>();
  const barcode = params.barcode;
  const { openCheckout } = useCheckout();
  const [state, setState] = useState<LoadState>({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const detail = await api.product(barcode, locale);
        if (!cancelled) {
          setState({ kind: "ok", barcode, product: detail });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            kind: "error",
            barcode,
            message: productErrorMessage(
              err instanceof ApiError ? err.code : "upstream_unavailable",
              t,
            ),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [barcode, locale, t]);

  const product = state.kind === "ok" && state.barcode === barcode ? state.product : null;
  const error = state.kind === "error" && state.barcode === barcode ? state.message : null;
  const loading = !product && !error;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="mb-5 inline-flex text-sm font-semibold text-moss underline-offset-2 hover:underline"
      >
        ← {t("backToSearch")}
      </Link>
      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-card">
          <div className="grid md:grid-cols-2">
            <div className="skel min-h-[16rem] md:min-h-[36rem]" />
            <div className="space-y-3 p-6">
              <div className="skel h-8 w-3/4 rounded" />
              <div className="skel h-4 w-1/3 rounded" />
              <div className="skel h-40 w-full rounded" />
            </div>
          </div>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-xl border border-ink/10 bg-white p-6">
          {error}
        </p>
      ) : null}
      {product ? (
        <article className="overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-card">
          <ProductDetailContent product={product} onSubscribe={openCheckout} titleAs="h1" />
        </article>
      ) : null}
    </main>
  );
}
