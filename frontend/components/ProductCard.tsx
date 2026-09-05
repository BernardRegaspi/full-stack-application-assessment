"use client";

import { useTranslations } from "next-intl";
import type { ProductSummary } from "@/lib/types";
import { useProductDetail } from "./ProductDetailProvider";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: ProductSummary; index?: number }) {
  const t = useTranslations();
  const { openProduct } = useProductDetail();

  return (
    <button
      type="button"
      className="group flex h-full w-full flex-col overflow-hidden rounded-xl border-2 border-ink/20 bg-white text-left shadow-[0_2px_8px_rgba(31,45,38,0.12)] transition-colors hover:border-moss"
      onClick={() => openProduct(product.barcode)}
    >
      <div className="relative aspect-square shrink-0 overflow-hidden bg-[#efe7d5] transition-colors group-hover:bg-moss/10">
        <ProductImage
          imageUrl={product.imageUrl}
          name={product.name}
          className="h-full w-full object-contain p-4"
        />
      </div>
      <div className="flex flex-1 flex-col bg-white p-4">
        <p
          className={`truncate text-[10px] font-bold tracking-[0.14em] uppercase ${
            product.brand ? "text-ink/50" : "text-amber italic"
          }`}
        >
          {product.brand ?? t("unknownBrand")}
        </p>
        <h3 className="font-display mt-0.5 line-clamp-2 min-h-[3.25rem] text-lg leading-snug font-bold">
          {product.name ?? t("unknownProduct")}
        </h3>
        <p className="mt-auto pt-3 text-xs font-semibold text-moss transition-colors group-hover:text-mossdark">
          {t("details")} <span aria-hidden>→</span>
        </p>
      </div>
    </button>
  );
}
