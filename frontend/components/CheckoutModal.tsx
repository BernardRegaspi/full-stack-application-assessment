"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useCheckout } from "./CheckoutProvider";

export function CheckoutModal() {
  const t = useTranslations();
  const { open, error, submitting, closeCheckout, startCheckout } = useCheckout();
  const panelRef = useRef<HTMLDivElement>(null);
  const featureKeys = ["feat1", "feat2", "feat3"] as const;

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCheckout();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeCheckout]);

  if (!open) {
    return null;
  }

  return (
    <div
      data-testid="checkout-overlay"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeCheckout();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        tabIndex={-1}
        className="pop-in relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-card"
      >
        <div className="flex items-center justify-center gap-2 bg-stripe py-1.5 text-center text-[10px] font-black tracking-[0.25em] text-white uppercase">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
          </svg>
          {t("testMode")}
        </div>
        <button
          type="button"
          className="absolute top-5 right-3 h-8 w-8 rounded-full text-ink/50 transition-colors hover:bg-ink/5"
          aria-label={t("close")}
          onClick={closeCheckout}
        >
          ✕
        </button>
        <div className="p-6">
          <p id="checkout-title" className="font-display text-xl font-bold">
            {t("planName")}
          </p>
          <p className="text-sm text-ink/60">{t("planDesc")}</p>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-ink/10 bg-cream px-4 py-3">
            <span className="text-sm font-semibold">{t("planName")}</span>
            <span className="font-display text-xl font-bold">
              {t("price")}
              <span className="font-sans text-xs text-ink/50">{t("perMonth")}</span>
            </span>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-ink/75">
            {featureKeys.map((key) => (
              <li key={key} className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-moss"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden
                >
                  <path d="M4 12l5 5L20 7" />
                </svg>
                {t(key)}
              </li>
            ))}
          </ul>
          {error ? (
            <p role="alert" className="mt-4 text-sm text-ink">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            disabled={submitting}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-stripe py-3 font-semibold text-white transition-all hover:brightness-110 active:scale-[.98] disabled:opacity-60"
            onClick={() => void startCheckout()}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden
            >
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <span>
              {submitting ? t("paying") : `${t("pay")} · ${t("price")}${t("perMonth")}`}
            </span>
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-ink/50">{t("testNote")}</p>
        </div>
      </div>
    </div>
  );
}
