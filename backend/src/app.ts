import cors from "cors";
import express, { type Express } from "express";
import { config } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { parseLocale } from "./lib/locale.js";
import { presentProduct } from "./lib/presentProduct.js";
import { parseBarcode, parseFeaturedPage, parseQuery, parseSearchPage } from "./lib/validate.js";
import type {
  DemoUser,
  Locale,
  NormalizedProduct,
  ProductSummary,
  SearchHistoryItem,
  SubscriptionStatus,
} from "./types.js";

export type AppDeps = {
  searchProducts: (
    q: string,
    lang: Locale,
    page: number,
  ) => Promise<{
    products: ProductSummary[];
    resultCount: number;
    page: number;
    pageSize: number;
    pageCount: number;
  }>;
  getProduct: (barcode: string, lang: Locale) => Promise<NormalizedProduct>;
  getDemoUser: () => Promise<DemoUser>;
  recordSearch: (query: string, language: Locale, resultCount: number) => Promise<void>;
  listRecentSearches: () => Promise<SearchHistoryItem[]>;
  clearRecentSearches: () => Promise<void>;
  listFeaturedProducts: (
    lang: Locale,
    page: number,
  ) => Promise<{
    products: ProductSummary[];
    resultCount: number;
    page: number;
    pageSize: number;
    pageCount: number;
  }>;
  createCheckoutUrl: (lang: Locale) => Promise<string>;
  cancelSubscription: () => Promise<{ subscriptionStatus: SubscriptionStatus }>;
  applyStripeWebhook: (rawBody: Buffer, signature: string) => Promise<void>;
};

export function createApp(deps: AppDeps): Express {
  const app = express();
  app.use(cors({ origin: config.frontendOrigin }));

  app.post(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }),
    (req, res, next) => {
      const signature = req.header("stripe-signature");
      if (!signature) {
        res.status(400).send("Missing stripe-signature");
        return;
      }
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
      deps
        .applyStripeWebhook(rawBody, signature)
        .then(() => {
          res.status(200).json({ received: true });
        })
        .catch((error: unknown) => {
          if (error instanceof Error && error.message === "invalid_signature") {
            res.status(400).send("Invalid signature");
            return;
          }
          next(error);
        });
    },
  );

  app.use(express.json());

  app.get("/api/search", async (req, res, next) => {
    try {
      const q = parseQuery(req.query.q);
      const lang = parseLocale(typeof req.query.lang === "string" ? req.query.lang : undefined);
      const page = parseSearchPage(req.query.page);
      const result = await deps.searchProducts(q, lang, page);
      try {
        await deps.recordSearch(q, lang, result.resultCount);
      } catch (error) {
        console.error("recordSearch failed", error);
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/products/:barcode", async (req, res, next) => {
    try {
      const barcodeParam = req.params.barcode;
      const barcode = parseBarcode(
        Array.isArray(barcodeParam) ? barcodeParam[0] : barcodeParam,
      );
      const lang = parseLocale(typeof req.query.lang === "string" ? req.query.lang : undefined);
      const [product, user] = await Promise.all([
        deps.getProduct(barcode, lang),
        deps.getDemoUser(),
      ]);
      res.json(presentProduct(product, user.subscriptionStatus === "active"));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/me", async (_req, res, next) => {
    try {
      const user = await deps.getDemoUser();
      res.json({ email: user.email, subscriptionStatus: user.subscriptionStatus });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/featured", async (req, res, next) => {
    try {
      const lang = parseLocale(typeof req.query.lang === "string" ? req.query.lang : undefined);
      const page = parseFeaturedPage(req.query.page);
      const result = await deps.listFeaturedProducts(lang, page);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/search-history", async (_req, res, next) => {
    try {
      const searches = await deps.listRecentSearches();
      res.json({ searches });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/search-history", async (_req, res, next) => {
    try {
      await deps.clearRecentSearches();
      res.json({ searches: [] });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/checkout", async (req, res, next) => {
    try {
      const lang = parseLocale(req.body?.lang);
      const url = await deps.createCheckoutUrl(lang);
      res.json({ url });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/subscription/cancel", async (_req, res, next) => {
    try {
      const result = await deps.cancelSubscription();
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.use(errorHandler);
  return app;
}
