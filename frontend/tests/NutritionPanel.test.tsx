import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { NutritionPanel } from "@/components/NutritionPanel";
import en from "@/messages/en.json";
import type { ProductDetail } from "@/lib/types";

function renderPanel(product: ProductDetail, onSubscribe = vi.fn()) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <NutritionPanel product={product} onSubscribe={onSubscribe} />
    </NextIntlClientProvider>,
  );
}

describe("NutritionPanel", () => {
  it("shows a locked facts table and Get Pro CTA without real nutrient values", () => {
    renderPanel({
      barcode: "1",
      name: "X",
      brand: "Y",
      imageUrl: null,
      servingSize: null,
      quantity: null,
      packaging: null,
      categories: [],
      labels: [],
      ingredients: null,
      origins: null,
      manufacturingPlaces: null,
      countries: null,
      nutriScore: null,
      novaGroup: null,
      incomplete: false,
      nutritionAccess: "locked",
    });
    expect(screen.getByRole("button", { name: /Get Pro/i })).toBeInTheDocument();
    expect(screen.getByText("Full nutrition is a Pro feature")).toBeInTheDocument();
    expect(screen.queryByText("539")).not.toBeInTheDocument();
  });

  it("renders per-100g table when granted", () => {
    renderPanel({
      barcode: "1",
      name: "X",
      brand: "Y",
      imageUrl: null,
      servingSize: "15g",
      quantity: null,
      packaging: null,
      categories: [],
      labels: [],
      ingredients: null,
      origins: null,
      manufacturingPlaces: null,
      countries: null,
      nutriScore: null,
      novaGroup: null,
      incomplete: false,
      nutritionAccess: "granted",
      nutrition: {
        energyKcal: 539,
        fat: 30.9,
        saturates: 10.6,
        sugars: 56.3,
        salt: 0.107,
        protein: 6.3,
      },
    });
    expect(screen.getByText(/539/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /subscribe/i })).not.toBeInTheDocument();
  });
});
