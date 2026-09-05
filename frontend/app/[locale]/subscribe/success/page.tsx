"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";

export default function SubscribeSuccessPage() {
  const t = useTranslations();
  const [active, setActive] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);

  const checkStatus = useCallback(async () => {
    const me = await api.me();
    return me.subscriptionStatus === "active";
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const isActive = await checkStatus();
          if (cancelled) {
            return;
          }
          if (isActive) {
            setActive(true);
            return;
          }
        } catch {
          /* webhook may not have landed yet */
        }
        if (attempt < 4) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      if (!cancelled) {
        setShowRefresh(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [checkStatus]);

  async function refresh() {
    try {
      if (await checkStatus()) {
        setActive(true);
        setShowRefresh(false);
      }
    } catch {
      /* keep refresh available */
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-card">
        <div className="bg-stripe py-1.5 text-center text-[10px] font-black tracking-[0.25em] text-white uppercase">
          Stripe · test mode
        </div>
        <div className="p-8 text-center">
          <span
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
              active ? "bg-moss text-cream" : "bg-amber/25 text-ink"
            }`}
          >
            {active ? (
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M4 12l5 5L20 7" />
              </svg>
            ) : (
              <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
          </span>
          <h1 className="font-display text-2xl font-bold">{t("successTitle")}</h1>
          <p className="mt-2 text-sm text-ink/70">{active ? t("successActive") : t("successPending")}</p>
          {showRefresh && !active ? (
            <button
              type="button"
              className="mt-5 rounded-xl bg-ink px-5 py-3 font-semibold text-cream shadow-card transition-all hover:bg-mossdark"
              onClick={() => void refresh()}
            >
              {t("successRefresh")}
            </button>
          ) : null}
          <Link
            href="/"
            className="mt-5 block text-sm font-semibold text-moss underline-offset-2 hover:underline"
          >
            {t("backToSearch")}
          </Link>
        </div>
      </div>
    </main>
  );
}
