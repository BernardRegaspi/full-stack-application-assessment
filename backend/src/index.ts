import { createApp } from "./app.js";
import { config } from "./config.js";
import { getDemoUser } from "./lib/demoUser.js";
import { prisma } from "./lib/prisma.js";
import { parseLocale } from "./lib/locale.js";
import { uniqueRecentSearches } from "./lib/searchHistory.js";
import {
  getOpenFoodFactsProduct,
  listFeaturedOpenFoodFacts,
  searchOpenFoodFacts,
} from "./services/openFoodFacts.js";
import { applyStripeWebhook, cancelSubscription, createCheckoutUrl } from "./services/stripe.js";

const app = createApp({
  searchProducts: searchOpenFoodFacts,
  getProduct: getOpenFoodFactsProduct,
  getDemoUser,
  recordSearch: async (query, language, resultCount) => {
    const user = await getDemoUser();
    const recent = await prisma.searchHistory.findMany({
      where: { userId: user.id, language },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    const existing = recent.find(
      (row) => row.query.trim().toLowerCase() === query.trim().toLowerCase(),
    );
    if (existing) {
      await prisma.searchHistory.update({
        where: { id: existing.id },
        data: { query, resultCount, createdAt: new Date() },
      });
      return;
    }
    await prisma.searchHistory.create({
      data: { userId: user.id, query, language, resultCount },
    });
  },
  listRecentSearches: async () => {
    const user = await getDemoUser();
    const rows = await prisma.searchHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    return uniqueRecentSearches(rows, 10).map((row) => ({
      id: row.id,
      query: row.query,
      language: parseLocale(row.language),
      resultCount: row.resultCount,
      createdAt: row.createdAt.toISOString(),
    }));
  },
  clearRecentSearches: async () => {
    const user = await getDemoUser();
    await prisma.searchHistory.deleteMany({ where: { userId: user.id } });
  },
  listFeaturedProducts: listFeaturedOpenFoodFacts,
  createCheckoutUrl,
  cancelSubscription,
  applyStripeWebhook,
});

app.listen(config.port, () => {
  console.log(`API listening on ${config.port}`);
});
