"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function SubscribeCancelPage() {
  const t = useTranslations();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-ink/10 bg-white p-8 text-center shadow-card">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber/25 text-2xl">
          ✕
        </span>
        <h1 className="font-display text-2xl font-bold">{t("cancelTitle")}</h1>
        <p className="mt-2 text-sm text-ink/70">{t("cancelBody")}</p>
        <Link
          href="/"
          className="mt-5 inline-block text-sm font-semibold text-moss underline-offset-2 hover:underline"
        >
          {t("backToSearch")}
        </Link>
      </div>
    </main>
  );
}
