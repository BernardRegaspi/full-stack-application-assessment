import Stripe from "stripe";
import { config } from "../config.js";
import { getDemoUser } from "../lib/demoUser.js";
import { parseLocale } from "../lib/locale.js";
import { prisma } from "../lib/prisma.js";
import { AppError, type Locale, type SubscriptionStatus } from "../types.js";

function stripeClient(): Stripe {
  if (!config.stripeSecretKey) {
    throw new AppError("checkout_unavailable", "Stripe is not configured", 502);
  }
  return new Stripe(config.stripeSecretKey);
}

export function mapStripeStatus(status: string): SubscriptionStatus {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due") return "past_due";
  return "canceled";
}

export async function createCheckoutUrl(lang: Locale): Promise<string> {
  if (!config.stripeSecretKey || !config.stripePriceId) {
    throw new AppError("checkout_unavailable", "Stripe is not configured", 502);
  }
  const user = await getDemoUser();
  const locale = parseLocale(lang);
  const origin = config.frontendOrigin.replace(/\/$/, "");
  let session: Stripe.Checkout.Session;
  try {
    session = await stripeClient().checkout.sessions.create({
      mode: "subscription",
      locale,
      line_items: [{ price: config.stripePriceId, quantity: 1 }],
      customer: user.stripeCustomerId ?? undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      success_url: `${origin}/${locale}/subscribe/success`,
      cancel_url: `${origin}/${locale}/subscribe/cancel`,
    });
  } catch (error) {
    console.error("Stripe checkout.sessions.create failed", error);
    throw new AppError("checkout_unavailable", "Stripe checkout failed", 502);
  }
  if (!session.url) {
    throw new AppError("checkout_unavailable", "Stripe did not return a URL", 502);
  }
  return session.url;
}

export async function cancelSubscription(): Promise<{ subscriptionStatus: SubscriptionStatus }> {
  if (!config.stripeSecretKey) {
    throw new AppError("cancel_unavailable", "Stripe is not configured", 502);
  }
  const user = await getDemoUser();
  if (user.subscriptionStatus !== "active" || !user.stripeSubscriptionId) {
    throw new AppError("no_active_subscription", "No active subscription", 409);
  }
  try {
    await stripeClient().subscriptions.cancel(user.stripeSubscriptionId);
  } catch (error) {
    console.error("Stripe subscriptions.cancel failed", error);
    throw new AppError("cancel_unavailable", "Could not cancel subscription", 502);
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: "canceled",
      stripeSubscriptionId: null,
    },
  });
  return { subscriptionStatus: "canceled" };
}

export async function applyStripeWebhook(
  rawBody: Buffer,
  signature: string,
): Promise<void> {
  if (!config.stripeWebhookSecret || !config.stripeSecretKey) {
    throw new Error("invalid_signature");
  }
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      config.stripeWebhookSecret,
    );
  } catch {
    throw new Error("invalid_signature");
  }
  await applyStripeEvent(event);
}

export async function applyStripeEvent(event: {
  type: string;
  data: { object: unknown };
}): Promise<void> {
  const user = await getDemoUser();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      mode?: string;
      customer?: string | { id: string } | null;
      subscription?: string | { id: string } | null;
    };
    if (session.mode !== "subscription") return;
    const customerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeCustomerId: customerId ?? user.stripeCustomerId,
        stripeSubscriptionId: subscriptionId ?? user.stripeSubscriptionId,
        subscriptionStatus: "active",
      },
    });
    return;
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as { id: string; status: string; customer: string | { id: string } };
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeCustomerId: typeof sub.customer === "string" ? sub.customer : user.stripeCustomerId,
        stripeSubscriptionId: sub.id,
        subscriptionStatus: mapStripeStatus(sub.status),
      },
    });
    return;
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as { id: string };
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: "canceled",
        stripeSubscriptionId:
          user.stripeSubscriptionId === sub.id ? null : user.stripeSubscriptionId,
      },
    });
  }
}
