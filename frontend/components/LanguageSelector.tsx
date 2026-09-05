"use client";

import { useLocale, useTranslations } from "next-intl";
import { routing, usePathname, useRouter } from "@/i18n/routing";

export function LanguageSelector() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div
      className="flex gap-0.5 rounded-full border border-ink/15 bg-white p-1"
      role="group"
      aria-label={t("language")}
    >
      {routing.locales.map((code) => (
        <button
          key={code}
          type="button"
          data-lang={code}
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all ${
            locale === code ? "bg-ink text-cream shadow" : "text-ink/50 hover:text-ink"
          }`}
          onClick={() => {
            router.replace(pathname, { locale: code });
          }}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
