"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useCheckout } from "./CheckoutProvider";

export function PaywallBanner() {
  const t = useTranslations();
  const { openCheckout } = useCheckout();
  const [show, setShow] = useState(false);

  useEffect(() => {
    void api
      .me()
      .then((me) => setShow(me.subscriptionStatus !== "active"))
      .catch(() => setShow(true));

    function onSubscriptionChanged() {
      void api
        .me()
        .then((me) => setShow(me.subscriptionStatus !== "active"))
        .catch(() => setShow(true));
    }
    window.addEventListener("subscription-changed", onSubscriptionChanged);
    return () => window.removeEventListener("subscription-changed", onSubscriptionChanged);
  }, []);

  if (!show) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-col gap-4 rounded-2xl border-2 border-amber/50 bg-gradient-to-r from-amber/15 via-paper to-moss/10 p-4 sm:flex-row sm:items-center sm:p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber/50 bg-amber/25">
        <svg
          className="h-5 w-5 text-ink"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          aria-hidden
        >
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </span>
      <div className="flex-1">
        <p className="font-display text-lg font-bold">{t("bannerTitle")}</p>
        <p className="text-sm text-ink/65">{t("bannerDesc")}</p>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-xl bg-ink px-5 py-3 font-semibold text-cream shadow-card transition-all hover:bg-mossdark active:scale-95"
        onClick={openCheckout}
      >
        {t("cta")}
      </button>
    </div>
  );
}
