import { describe, expect, it, vi } from "vitest";

const mockSessionsCreate = vi.fn();
const mockSubscriptionsCancel = vi.fn();

vi.mock("stripe", () => ({
  default: class StripeMock {
    checkout = { sessions: { create: mockSessionsCreate } };
    subscriptions = { cancel: mockSubscriptionsCancel };
  },
}));

vi.mock("../src/config.js", () => ({
  config: {
    stripeSecretKey: "sk_test",
    stripePriceId: "price_test",
    frontendOrigin: "http://localhost:3000",
  },
}));

vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    user: { update: vi.fn(async () => ({})) },
  },
}));

vi.mock("../src/lib/demoUser.js", () => ({
  getDemoUser: vi.fn(async () => ({
    id: "u1",
    email: "demo@example.com",
    subscriptionStatus: "none",
    stripeCustomerId: null,
    stripeSubscriptionId: "sub_old",
  })),
}));

import { applyStripeEvent, cancelSubscription, createCheckoutUrl, mapStripeStatus } from "../src/services/stripe.js";
import { prisma } from "../src/lib/prisma.js";
import { getDemoUser } from "../src/lib/demoUser.js";

describe("mapStripeStatus", () => {
  it("maps Stripe statuses onto the User enum", () => {
    expect(mapStripeStatus("active")).toBe("active");
    expect(mapStripeStatus("trialing")).toBe("active");
    expect(mapStripeStatus("past_due")).toBe("past_due");
    expect(mapStripeStatus("canceled")).toBe("canceled");
    expect(mapStripeStatus("unpaid")).toBe("canceled");
    expect(mapStripeStatus("incomplete")).toBe("canceled");
    expect(mapStripeStatus("paused")).toBe("canceled");
  });
});

describe("applyStripeEvent", () => {
  it("sets active on checkout.session.completed", async () => {
    await applyStripeEvent({
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          customer: "cus_1",
          subscription: "sub_1",
        },
      },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: {
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: "sub_1",
        subscriptionStatus: "active",
      },
    });
  });

  it("sets canceled on customer.subscription.deleted", async () => {
    await applyStripeEvent({
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_old", customer: "cus_1" } },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: {
        subscriptionStatus: "canceled",
        stripeSubscriptionId: null,
      },
    });
  });
});

describe("createCheckoutUrl", () => {
  it("maps Stripe API failures to checkout_unavailable", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSessionsCreate.mockRejectedValueOnce(new Error("Stripe is down"));
    await expect(createCheckoutUrl("en")).rejects.toMatchObject({
      code: "checkout_unavailable",
      status: 502,
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("returns session url on success", async () => {
    mockSessionsCreate.mockResolvedValueOnce({ url: "https://checkout.stripe.com/test" });
    await expect(createCheckoutUrl("en")).resolves.toBe("https://checkout.stripe.com/test");
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        locale: "en",
        line_items: [{ price: "price_test", quantity: 1 }],
      }),
    );
  });
});

describe("cancelSubscription", () => {
  it("returns 409 when there is no active subscription", async () => {
    await expect(cancelSubscription()).rejects.toMatchObject({
      code: "no_active_subscription",
      status: 409,
    });
  });

  it("cancels via Stripe and updates the demo user", async () => {
    vi.mocked(getDemoUser).mockResolvedValueOnce({
      id: "u1",
      email: "demo@example.com",
      subscriptionStatus: "active",
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_active",
    });
    mockSubscriptionsCancel.mockResolvedValueOnce({ id: "sub_active", status: "canceled" });
    await expect(cancelSubscription()).resolves.toEqual({ subscriptionStatus: "canceled" });
    expect(mockSubscriptionsCancel).toHaveBeenCalledWith("sub_active");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: {
        subscriptionStatus: "canceled",
        stripeSubscriptionId: null,
      },
    });
  });

  it("maps Stripe API failures to cancel_unavailable", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getDemoUser).mockResolvedValueOnce({
      id: "u1",
      email: "demo@example.com",
      subscriptionStatus: "active",
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_active",
    });
    mockSubscriptionsCancel.mockRejectedValueOnce(new Error("Stripe is down"));
    await expect(cancelSubscription()).rejects.toMatchObject({
      code: "cancel_unavailable",
      status: 502,
    });
    errorSpy.mockRestore();
  });
});
