"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LogoMark } from "./LogoMark";

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t-2 border-ink/10 bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <span className="transition-transform group-hover:rotate-6">
              <LogoMark className="h-11 w-11" />
            </span>
            <div>
              <p className="font-display text-xl font-bold tracking-tight">{t("appTitle")}</p>
              <p className="mt-0.5 text-sm text-ink/65">{t("footTagline")}</p>
            </div>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-ink/55 md:text-right">
            {t("footNote")}
          </p>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-ink/10 pt-6 text-xs text-ink/45 sm:flex-row">
          <p>{t("footCredit")}</p>
          <p>© {year} {t("appTitle")}</p>
        </div>
      </div>
    </footer>
  );
}
