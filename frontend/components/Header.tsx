"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import type { SubscriptionStatus } from "@/lib/types";
import { LanguageSelector } from "./LanguageSelector";
import { LogoMark } from "./LogoMark";
import { ProfileMenu } from "./ProfileMenu";

const TICKER_KEYS = ["ticker1", "ticker2", "ticker3", "ticker4", "ticker5"] as const;

export function Header() {
  const t = useTranslations();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    void api
      .me()
      .then((me) => {
        setStatus(me.subscriptionStatus);
        setEmail(me.email);
      })
      .catch(() => {
        setStatus("none");
      });
  }, []);

  const isPro = status === "active";
  const tickerItems = TICKER_KEYS.map((key) => t(key));

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="transition-transform group-hover:rotate-6">
            <LogoMark />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">{t("appTitle")}</span>
          <span className="rounded-full border border-amber/40 bg-amber/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber">
            {t("demoBadge")}
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSelector />
          {status ? (
            <span
              className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider sm:inline-flex ${
                isPro
                  ? "border-moss bg-moss text-cream"
                  : "border-ink/15 bg-white text-ink/60"
              }`}
            >
              {isPro ? t("statusPro") : t("statusFree")}
            </span>
          ) : null}
          <ProfileMenu email={email} status={status ?? "none"} onStatusChange={setStatus} />
        </div>
      </div>
    </header>
  );
}
