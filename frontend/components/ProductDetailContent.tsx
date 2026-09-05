"use client";

import { useTranslations } from "next-intl";
import type { ProductDetail } from "@/lib/types";
import { NutritionPanel } from "./NutritionPanel";
import { ProductImage } from "./ProductImage";

const NS_COLORS: Record<string, { bg: string; fg: string }> = {
  A: { bg: "#038141", fg: "#fff" },
  B: { bg: "#85BB2F", fg: "#fff" },
  C: { bg: "#FECB02", fg: "#1F2D26" },
  D: { bg: "#EE8100", fg: "#fff" },
  E: { bg: "#E63E11", fg: "#fff" },
};

export function ProductDetailContent({
  product,
  onSubscribe,
  titleId,
  titleAs: Title = "h2",
}: {
  product: ProductDetail;
  onSubscribe: () => void;
  titleId?: string;
  titleAs?: "h1" | "h2";
}) {
  const t = useTranslations();
  const title = product.name ?? t("unknownProduct");
  const nutri = product.nutriScore ? NS_COLORS[product.nutriScore] : null;
  const extraRows = [
    { key: "packaging", value: product.packaging },
    { key: "origins", value: product.origins },
    { key: "manufacturingPlaces", value: product.manufacturingPlaces },
    { key: "countries", value: product.countries },
  ] as const;

  return (
    <div className="grid md:grid-cols-2">
      <div className="relative min-h-[16rem] bg-[#f0e9da] md:min-h-[36rem]">
        <ProductImage
          imageUrl={product.imageUrl}
          name={product.name}
          className="absolute inset-0 h-full w-full object-contain p-6"
        />
      </div>
      <div className="p-6">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {nutri && product.nutriScore ? (
            <span
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-black"
              style={{ background: nutri.bg, color: nutri.fg }}
              title={t("nutriScore")}
            >
              <span className="text-base">{product.nutriScore}</span>
              <span className="text-[8px] tracking-wider uppercase opacity-90">{t("nutriScore")}</span>
            </span>
          ) : null}
          {product.novaGroup ? (
            <span
              className="inline-flex items-center rounded-md bg-ink px-1.5 py-0.5 text-xs font-black text-cream"
              title={t("novaHint")}
            >
              {t("nova")} {product.novaGroup}
            </span>
          ) : null}
          {product.categories.map((category) => (
            <span
              key={category}
              className="rounded-full border border-ink/10 bg-ink/5 px-2 py-1 text-[10px] font-bold tracking-wider uppercase"
            >
              {category}
            </span>
          ))}
          {product.labels.map((label) => (
            <span
              key={label}
              className="rounded-full border border-moss/25 bg-moss/10 px-2 py-1 text-[10px] font-bold tracking-wider text-moss uppercase"
            >
              {label}
            </span>
          ))}
        </div>
        <Title id={titleId} className="font-display text-2xl leading-tight font-bold">
          {title}
        </Title>
        <p
          className={`mt-1 text-sm ${
            product.brand ? "text-ink/55" : "font-semibold text-amber italic"
          }`}
        >
          {product.brand ?? t("unknownBrand")}
        </p>
        <div className="mt-3 space-y-1 text-xs text-ink/55">
          <p>
            {product.quantity ? (
              <>
                <b className="text-ink/70">{t("quantity")}:</b> {product.quantity}
                {" · "}
              </>
            ) : null}
            <b className="text-ink/70">{t("barcode")}:</b> {product.barcode}
          </p>
          {extraRows.map((row) =>
            row.value ? (
              <p key={row.key}>
                <b className="text-ink/70">{t(row.key)}:</b> {row.value}
              </p>
            ) : null,
          )}
        </div>
        {product.incomplete ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber/50 bg-amber/15 p-3 text-xs">
            <span className="leading-none text-base">⚠</span>
            <p>
              <b>{t("incomplete")}.</b> {t("incompleteNote")}
            </p>
          </div>
        ) : null}
        <div className="mt-5">
          <NutritionPanel product={product} onSubscribe={onSubscribe} />
        </div>
        {product.ingredients ? (
          <div className="mt-4">
            <p className="mb-1 text-xs font-bold tracking-wider text-ink/50 uppercase">
              {t("ingredients")}
            </p>
            <p className="text-sm leading-relaxed text-ink/75">{product.ingredients}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
