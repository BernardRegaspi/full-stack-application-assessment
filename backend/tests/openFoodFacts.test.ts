import { afterEach, describe, expect, it, vi } from "vitest";
import { mapOffHit, mapOffProduct } from "../src/lib/mapOffProduct.js";
import { clearSearchCache } from "../src/lib/searchCache.js";
import {
  getOpenFoodFactsProduct,
  listFeaturedOpenFoodFacts,
  searchOpenFoodFacts,
} from "../src/services/openFoodFacts.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  clearSearchCache();
});

describe("mapOffHit", () => {
  it("prefers product_name_{lang} then falls back", () => {
    const mapped = mapOffHit(
      {
        code: "12345678",
        product_name: "English name",
        product_name_fr: "Nom français",
        brands: "Acme, Other",
        image_front_small_url: "https://img/small.jpg",
      },
      "fr",
    );
    expect(mapped).toEqual({
      barcode: "12345678",
      name: "Nom français",
      brand: "Acme",
      imageUrl: "https://img/small.jpg",
    });
  });

  it("skips hits without a code", () => {
    expect(mapOffHit({ product_name: "X" }, "en")).toBeNull();
  });

  it("coerces numeric code to string barcode", () => {
    const mapped = mapOffHit({ code: 12345678, product_name: "Milk" }, "en");
    expect(mapped?.barcode).toBe("12345678");
  });
});

describe("mapOffProduct", () => {
  it("maps kcal only and leaves missing nutriments null", () => {
    const mapped = mapOffProduct(
      {
        code: "12345678",
        product_name: "Oat drink",
        nutriments: { "energy-kcal_100g": 45, fat_100g: 1.5 },
        serving_size: "100ml",
      },
      "en",
    );
    expect(mapped?.nutrition).toEqual({
      energyKcal: 45,
      fat: 1.5,
      saturates: null,
      sugars: null,
      salt: null,
      protein: null,
    });
    expect(mapped?.servingSize).toBe("100ml");
  });

  it("falls back to nutriments_estimated when packaged nutriments omit per-100g facts", () => {
    const mapped = mapOffProduct(
      {
        code: "0058496059866",
        brands: "DelMonte",
        nutriments: {
          "added-sugars_100g": 0,
          "fruits-vegetables-legumes-estimate-from-ingredients_100g": 100,
        },
        nutriments_estimated: {
          "energy-kcal_100g": 90.5,
          fat_100g: 0.25,
          "saturated-fat_100g": 0.005,
          sugars_100g: 15.6,
          salt_100g: 0.0063,
          proteins_100g: 1.06,
        },
      },
      "en",
    );
    expect(mapped?.nutrition).toEqual({
      energyKcal: 90.5,
      fat: 0.25,
      saturates: 0.005,
      sugars: 15.6,
      salt: 0.0063,
      protein: 1.06,
    });
  });

  it("prefers packaged nutriments over estimated values for the same nutrient", () => {
    const mapped = mapOffProduct(
      {
        code: "12345678",
        product_name: "Oat drink",
        nutriments: { "energy-kcal_100g": 45, fat_100g: 1.5 },
        nutriments_estimated: { "energy-kcal_100g": 90, fat_100g: 0.25, sugars_100g: 4.2 },
      },
      "en",
    );
    expect(mapped?.nutrition).toEqual({
      energyKcal: 45,
      fat: 1.5,
      saturates: null,
      sugars: 4.2,
      salt: null,
      protein: null,
    });
  });

  it("maps public Open Food Facts details used in the product modal", () => {
    const mapped = mapOffProduct(
      {
        code: "7622300336646",
        product_name: "Chocolate Sandwich Cookies",
        quantity: "154 g",
        packaging: "Plastic",
        categories: "Snacks, Sweet snacks, Biscuits",
        labels_tags: ["en:vegetarian", "en:vegan"],
        ingredients_text_en: "Wheat flour, sugar, palm oil.",
        origins: "Morocco",
        manufacturing_places: "Maroc",
        countries: "France, Morocco",
        nutriscore_grade: "e",
        nova_group: 4,
        states_tags: ["en:to-be-completed"],
      },
      "en",
    );
    expect(mapped).toMatchObject({
      quantity: "154 g",
      packaging: "Plastic",
      categories: ["Snacks", "Sweet snacks", "Biscuits"],
      labels: ["Vegetarian", "Vegan"],
      ingredients: "Wheat flour, sugar, palm oil.",
      origins: "Morocco",
      manufacturingPlaces: "Maroc",
      countries: "France, Morocco",
      nutriScore: "E",
      novaGroup: 4,
      incomplete: true,
    });
  });
});

describe("searchOpenFoodFacts", () => {
  it("calls cgi search.pl and skips malformed hits", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        count: 2,
        products: [
          { product_name: "no code" },
          { code: "12345678", product_name: "Milk" },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchOpenFoodFacts("milk", "en");
    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.barcode).toBe("12345678");
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("cgi/search.pl");
    expect(url).toContain("search_terms=milk");
  });

  it("returns cached search results without calling Open Food Facts again", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        count: 1,
        products: [{ code: "12345678", product_name: "Cola" }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await searchOpenFoodFacts("cola", "en", 1);
    await searchOpenFoodFacts("cola", "en", 1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries after a 503 and then returns products", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          count: 1,
          products: [{ code: "12345678", product_name: "Milk" }],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchOpenFoodFacts("milk", "en");
    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.barcode).toBe("12345678");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maps timeout/5xx to upstream_unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }),
    );
    await expect(searchOpenFoodFacts("milk", "en")).rejects.toMatchObject({
      code: "upstream_unavailable",
      status: 502,
    });
  });

  it("requests the given page and returns pagination metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        count: 62,
        products: [{ code: "12345678", product_name: "Del Monte Corn" }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchOpenFoodFacts("delmonte", "en", 2);
    expect(result.products).toHaveLength(1);
    expect(result.resultCount).toBe(62);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(24);
    expect(result.pageCount).toBe(3);
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("cgi/search.pl");
    expect(url).toContain("search_terms=delmonte");
    expect(url).toContain("page_size=24");
    expect(url).toContain("page=2");
  });

  it("returns full pageCount for large result sets", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          count: 5000,
          products: [{ code: "12345678", product_name: "Chocolate" }],
        }),
      }),
    );

    const result = await searchOpenFoodFacts("chocolate", "en", 1);
    expect(result.pageCount).toBe(Math.ceil(5000 / 24));
    expect(result.pageSize).toBe(24);
  });
});

describe("listFeaturedOpenFoodFacts", () => {
  it("lists popular products by page without a search term", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        count: 80,
        page: 2,
        products: [{ code: "5449000054227", product_name: "Coca-Cola" }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await listFeaturedOpenFoodFacts("en", 2);
    expect(result.products[0]?.barcode).toBe("5449000054227");
    expect(result.page).toBe(2);
    expect(result.pageCount).toBeLessThanOrEqual(10);
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("cgi/search.pl");
    expect(url).toContain("sort_by=unique_scans_n");
    expect(url).toContain("page=2");
    expect(url).not.toContain("search_terms=");
  });
});

describe("getOpenFoodFactsProduct", () => {
  it("requests nutriments_estimated so category estimates can fill missing packaged facts", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 1,
        product: {
          code: "0058496059866",
          nutriments: {},
          nutriments_estimated: { "energy-kcal_100g": 90.5, fat_100g: 0.25 },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const product = await getOpenFoodFactsProduct("0058496059866", "en");
    expect(product.nutrition.energyKcal).toBe(90.5);
    expect(product.nutrition.fat).toBe(0.25);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("nutriments_estimated");
  });

  it("maps OFF status 0 to product_not_found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 0, status_verbose: "product not found" }),
      }),
    );
    await expect(getOpenFoodFactsProduct("12345678", "en")).rejects.toMatchObject({
      code: "product_not_found",
    });
  });
});
