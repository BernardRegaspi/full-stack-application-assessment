import { config } from "../config.js";
import { AppError, type DemoUser } from "../types.js";
import { prisma } from "./prisma.js";

export async function getDemoUser(): Promise<DemoUser> {
  const user = await prisma.user.findUnique({
    where: { email: config.demoUserEmail },
  });
  if (!user) {
    throw new AppError("upstream_unavailable", "Demo user is not seeded", 500);
  }
  return {
    id: user.id,
    email: user.email,
    subscriptionStatus: user.subscriptionStatus,
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId,
  };
}
