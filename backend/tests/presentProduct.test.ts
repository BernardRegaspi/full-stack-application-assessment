import { describe, expect, it } from "vitest";
import { presentProduct } from "../src/lib/presentProduct.js";
import { EMPTY_PRODUCT_FACTS, type NormalizedProduct } from "../src/types.js";

const product: NormalizedProduct = {
  barcode: "3017620422003",
  name: "Nutella",
  brand: "Ferrero",
  imageUrl: "https://images.openfoodfacts.org/x.jpg",
  servingSize: "15g",
  ...EMPTY_PRODUCT_FACTS,
  quantity: "400 g",
  ingredients: "Sugar, palm oil.",
  nutrition: {
    energyKcal: 539,
    fat: 30.9,
    saturates: 10.6,
    sugars: 56.3,
    salt: 0.107,
    protein: 6.3,
  },
};

describe("presentProduct", () => {
  it("omits nutrition for non-subscribers", () => {
    const result = presentProduct(product, false);
    expect(result.nutritionAccess).toBe("locked");
    expect(result).not.toHaveProperty("nutrition");
    expect(JSON.stringify(result)).not.toContain("539");
    expect(result.quantity).toBe("400 g");
    expect(result.ingredients).toBe("Sugar, palm oil.");
  });

  it("includes nutrition for subscribers", () => {
    const result = presentProduct(product, true);
    expect(result.nutritionAccess).toBe("granted");
    expect(result.nutrition).toEqual(product.nutrition);
  });

  it("grants access with all-null nutrition (empty, not locked)", () => {
    const empty: NormalizedProduct = {
      ...product,
      nutrition: {
        energyKcal: null,
        fat: null,
        saturates: null,
        sugars: null,
        salt: null,
        protein: null,
      },
    };
    const result = presentProduct(empty, true);
    expect(result.nutritionAccess).toBe("granted");
    expect(result.nutrition?.energyKcal).toBeNull();
  });
});
