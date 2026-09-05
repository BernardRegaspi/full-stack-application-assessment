import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp, type AppDeps } from "../src/app.js";
import { AppError, EMPTY_PRODUCT_FACTS, type DemoUser, type NormalizedProduct } from "../src/types.js";

const demoUser: DemoUser = {
  id: "u1",
  email: "demo@example.com",
  subscriptionStatus: "none",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
};

function deps(overrides: Partial<AppDeps> = {}): AppDeps {
  const product: NormalizedProduct = {
    barcode: "3017620422003",
    name: "Nutella",
    brand: "Ferrero",
    imageUrl: null,
    servingSize: "15g",
    ...EMPTY_PRODUCT_FACTS,
    nutrition: {
      energyKcal: 539,
      fat: 30.9,
      saturates: 10.6,
      sugars: 56.3,
      salt: 0.107,
      protein: 6.3,
    },
  };
  return {
    searchProducts: async () => ({
      products: [],
      resultCount: 0,
      page: 1,
      pageSize: 24,
      pageCount: 1,
    }),
    getProduct: async () => product,
    getDemoUser: async () => demoUser,
    recordSearch: async () => undefined,
    listRecentSearches: async () => [],
    clearRecentSearches: async () => undefined,
    listFeaturedProducts: async () => ({
      products: [],
      resultCount: 0,
      page: 1,
      pageSize: 24,
      pageCount: 1,
    }),
    createCheckoutUrl: async () => "https://checkout.stripe.com/test",
    cancelSubscription: async () => ({ subscriptionStatus: "canceled" as const }),
    applyStripeWebhook: async () => undefined,
    ...overrides,
  };
}

describe("GET /api/search", () => {
  it("returns 400 for empty q", async () => {
    const res = await request(createApp(deps())).get("/api/search?q=");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_query");
  });

  it("returns 200 empty list", async () => {
    const recordSearch = vi.fn(async () => undefined);
    const res = await request(createApp(deps({ recordSearch }))).get(
      "/api/search?q=zzzzzz&lang=en",
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      products: [],
      resultCount: 0,
      page: 1,
      pageSize: 24,
      pageCount: 1,
    });
    expect(recordSearch).toHaveBeenCalledOnce();
  });

  it("forwards page to searchProducts", async () => {
    const searchProducts = vi.fn(async () => ({
      products: [{ barcode: "1", name: "Corn", brand: "Del Monte", imageUrl: null }],
      resultCount: 62,
      page: 2,
      pageSize: 24,
      pageCount: 3,
    }));
    const res = await request(createApp(deps({ searchProducts }))).get(
      "/api/search?q=delmonte&lang=en&page=2",
    );
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.pageCount).toBe(3);
    expect(res.body.resultCount).toBe(62);
    expect(searchProducts).toHaveBeenCalledWith("delmonte", "en", 2);
  });

  it("defaults page to 1", async () => {
    const searchProducts = vi.fn(async () => ({
      products: [],
      resultCount: 0,
      page: 1,
      pageSize: 24,
      pageCount: 1,
    }));
    const res = await request(createApp(deps({ searchProducts }))).get(
      "/api/search?q=milk&lang=en",
    );
    expect(res.status).toBe(200);
    expect(searchProducts).toHaveBeenCalledWith("milk", "en", 1);
  });

  it("returns 400 for an invalid page", async () => {
    const res = await request(createApp(deps())).get("/api/search?q=milk&page=0");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_page");
  });

  it("allows search page 11", async () => {
    const searchProducts = vi.fn(async () => ({
      products: [],
      resultCount: 5000,
      page: 11,
      pageSize: 24,
      pageCount: 209,
    }));
    const res = await request(createApp(deps({ searchProducts }))).get(
      "/api/search?q=chocolate&lang=en&page=11",
    );
    expect(res.status).toBe(200);
    expect(searchProducts).toHaveBeenCalledWith("chocolate", "en", 11);
  });

  it("returns 400 when search page exceeds 1000", async () => {
    const res = await request(createApp(deps())).get("/api/search?q=milk&page=1001");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_page");
  });

  it("returns 502 when adapter throws upstream", async () => {
    const app = createApp(
      deps({
        searchProducts: async () => {
          throw new AppError("upstream_unavailable", "down", 502);
        },
      }),
    );
    const res = await request(app).get("/api/search?q=milk");
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("upstream_unavailable");
  });
});

describe("GET /api/featured", () => {
  it("returns a page of featured products", async () => {
    const listFeaturedProducts = vi.fn(async () => ({
      products: [{ barcode: "1", name: "Water", brand: "Volvic", imageUrl: null }],
      resultCount: 100,
      page: 2,
      pageSize: 24,
      pageCount: 5,
    }));
    const res = await request(createApp(deps({ listFeaturedProducts }))).get(
      "/api/featured?page=2&lang=en",
    );
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.page).toBe(2);
    expect(res.body.pageCount).toBe(5);
    expect(listFeaturedProducts).toHaveBeenCalledWith("en", 2);
  });

  it("returns 400 for an invalid page", async () => {
    const res = await request(createApp(deps())).get("/api/featured?page=0");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_page");
  });
});

describe("DELETE /api/search-history", () => {
  it("clears recent searches", async () => {
    const clearRecentSearches = vi.fn(async () => undefined);
    const res = await request(createApp(deps({ clearRecentSearches }))).delete(
      "/api/search-history",
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ searches: [] });
    expect(clearRecentSearches).toHaveBeenCalledOnce();
  });
});

describe("GET /api/products/:barcode", () => {
  it("omits nutrition for non-subscribers", async () => {
    const res = await request(createApp(deps())).get("/api/products/3017620422003?lang=en");
    expect(res.status).toBe(200);
    expect(res.body.nutritionAccess).toBe("locked");
    expect(res.body).not.toHaveProperty("nutrition");
    expect(JSON.stringify(res.body)).not.toContain("539");
  });
});

describe("POST /api/subscription/cancel", () => {
  it("returns canceled status on success", async () => {
    const cancelSubscription = vi.fn(async () => ({ subscriptionStatus: "canceled" as const }));
    const res = await request(createApp(deps({ cancelSubscription }))).post(
      "/api/subscription/cancel",
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ subscriptionStatus: "canceled" });
    expect(cancelSubscription).toHaveBeenCalledOnce();
  });

  it("returns 409 when there is no active subscription", async () => {
    const cancelSubscription = vi.fn(async () => {
      throw new AppError("no_active_subscription", "No active subscription", 409);
    });
    const res = await request(createApp(deps({ cancelSubscription }))).post(
      "/api/subscription/cancel",
    );
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("no_active_subscription");
  });
});
