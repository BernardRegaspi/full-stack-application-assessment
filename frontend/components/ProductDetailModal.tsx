"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCheckout } from "./CheckoutProvider";
import { ProductDetailContent } from "./ProductDetailContent";
import { useProductDetail } from "./ProductDetailProvider";
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

export function ProductDetailModal() {
  const t = useTranslations();
  const locale = useLocale();
  const { barcode, closeProduct } = useProductDetail();
  const { openCheckout, open: checkoutOpen } = useCheckout();
  const panelRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<LoadState>({ kind: "idle" });

  useEffect(() => {
    if (!barcode) {
      setState({ kind: "idle" });
      return;
    }
    let cancelled = false;
    setState({ kind: "idle" });
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

  useEffect(() => {
    if (!barcode) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !checkoutOpen) {
        closeProduct();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [barcode, closeProduct, checkoutOpen]);

  if (!barcode) {
    return null;
  }

  const product = state.kind === "ok" && state.barcode === barcode ? state.product : null;
  const error = state.kind === "error" && state.barcode === barcode ? state.message : null;
  const loading = !product && !error;

  return (
    <div
      data-testid="product-detail-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeProduct();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        tabIndex={-1}
        className="pop-in relative max-h-[90vh] min-h-[min(90vh,36rem)] w-full max-w-4xl overflow-y-auto rounded-2xl bg-paper shadow-card"
      >
        <button
          type="button"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 transition-colors hover:bg-ink hover:text-cream"
          aria-label={t("close")}
          onClick={closeProduct}
        >
          ✕
        </button>
        {loading ? (
          <div className="grid md:grid-cols-2">
            <div className="skel min-h-[16rem] md:min-h-[36rem]" />
            <div className="space-y-3 p-6">
              <div className="skel h-8 w-3/4 rounded" />
              <div className="skel h-4 w-1/3 rounded" />
              <div className="skel h-40 w-full rounded" />
            </div>
          </div>
        ) : null}
        {error ? (
          <p id="product-detail-title" role="alert" className="p-6">
            {error}
          </p>
        ) : null}
        {product ? (
          <ProductDetailContent
            product={product}
            onSubscribe={openCheckout}
            titleId="product-detail-title"
            titleAs="h2"
          />
        ) : null}
      </div>
    </div>
  );
}
