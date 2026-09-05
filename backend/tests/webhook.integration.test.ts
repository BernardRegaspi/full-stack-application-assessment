import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp, type AppDeps } from "../src/app.js";
import type { DemoUser } from "../src/types.js";

const demoUser: DemoUser = {
  id: "u1",
  email: "demo@example.com",
  subscriptionStatus: "none",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
};

function baseDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    searchProducts: async () => ({
      products: [],
      resultCount: 0,
      page: 1,
      pageSize: 24,
      pageCount: 1,
    }),
    getProduct: async () => {
      throw new Error("unused");
    },
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
    cancelSubscription: async () => ({ subscriptionStatus: "canceled" }),
    applyStripeWebhook: async () => undefined,
    ...overrides,
  };
}

describe("POST /api/webhooks/stripe", () => {
  it("returns 400 when applyStripeWebhook rejects invalid_signature", async () => {
    const app = createApp(
      baseDeps({
        applyStripeWebhook: async () => {
          throw new Error("invalid_signature");
        },
      }),
    );
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "bad")
      .set("Content-Type", "application/json")
      .send({ type: "checkout.session.completed" });
    expect(res.status).toBe(400);
  });

  it("returns 200 and invokes handler for signed payloads", async () => {
    const applyStripeWebhook = vi.fn(async () => undefined);
    const app = createApp(baseDeps({ applyStripeWebhook }));
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "sig_test")
      .set("Content-Type", "application/json")
      .send({ type: "checkout.session.completed" });
    expect(res.status).toBe(200);
    expect(applyStripeWebhook).toHaveBeenCalledOnce();
  });
});
