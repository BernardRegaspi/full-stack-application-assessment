"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { NutritionFacts, ProductDetail } from "@/lib/types";

function hasAnyFact(product: ProductDetail): boolean {
  const n = product.nutrition;
  if (!n) return false;
  return Object.values(n).some((value) => value !== null);
}

const NUTRIENT_KEYS = [
  "energyKcal",
  "fat",
  "saturates",
  "sugars",
  "salt",
  "protein",
] as const satisfies readonly (keyof NutritionFacts)[];

function formatValue(key: keyof NutritionFacts, value: number | null): string {
  if (value === null) return "—";
  return key === "energyKcal" ? `${value} kcal` : `${value} g`;
}

function NutrientRows({ nutrition }: { nutrition: NutritionFacts }) {
  const t = useTranslations();
  return (
    <>
      {NUTRIENT_KEYS.map((key) => (
        <div key={key} className={`nrow ${key === "saturates" || key === "sugars" ? "sub" : ""}`}>
          <span>{t(key)}</span>
          <b>{formatValue(key, nutrition[key])}</b>
        </div>
      ))}
    </>
  );
}

const PLACEHOLDER_NUTRITION: NutritionFacts = {
  energyKcal: null,
  fat: null,
  saturates: null,
  sugars: null,
  salt: null,
  protein: null,
};

function FactsShell({ children }: { children: ReactNode }) {
  const t = useTranslations();
  return (
    <div className="relative rounded-md border-[3px] border-ink bg-white p-4">
      <p className="border-b-4 border-ink pb-1 text-lg font-black tracking-tight uppercase">
        {t("nutritionFacts")}
      </p>
      <p className="mt-1 mb-2 text-[10px] tracking-widest text-ink/50 uppercase">{t("per100")}</p>
      {children}
    </div>
  );
}

export function NutritionPanel({
  product,
  onSubscribe,
}: {
  product: ProductDetail;
  onSubscribe: () => void;
}) {
  const t = useTranslations();

  if (product.nutritionAccess === "locked") {
    return (
      <FactsShell>
        <div className="blurred select-none" aria-hidden>
          <NutrientRows nutrition={PLACEHOLDER_NUTRITION} />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-paper/70 px-6 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-cream">
            <svg
              className="h-5 w-5"
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
          <p className="font-display font-bold">{t("bannerTitle")}</p>
          <button
            type="button"
            className="mt-1 rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-cream transition-all hover:bg-mossdark active:scale-95"
            onClick={onSubscribe}
          >
            {t("cta")}
          </button>
        </div>
      </FactsShell>
    );
  }

  if (!hasAnyFact(product)) {
    return (
      <FactsShell>
        <p className="text-sm text-ink/70">{t("noNutritionData")}</p>
      </FactsShell>
    );
  }

  const nutrition = product.nutrition!;

  return (
    <FactsShell>
      {product.servingSize ? (
        <p className="mb-2 text-xs text-ink/60">
          {t("servingSize")}: {product.servingSize}
        </p>
      ) : null}
      <NutrientRows nutrition={nutrition} />
      <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-moss">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <path d="M4 12l5 5L20 7" />
        </svg>
        {t("proActive")}
      </p>
    </FactsShell>
  );
}
