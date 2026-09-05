export type Locale = "en" | "nl" | "de" | "fr";

export const LOCALES: Locale[] = ["en", "nl", "de", "fr"];

export type SubscriptionStatus = "none" | "active" | "canceled" | "past_due";

export type NutritionFacts = {
  energyKcal: number | null;
  fat: number | null;
  saturates: number | null;
  sugars: number | null;
  salt: number | null;
  protein: number | null;
};

export type ProductSummary = {
  barcode: string;
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
};

export type ProductFacts = {
  quantity: string | null;
  packaging: string | null;
  categories: string[];
  labels: string[];
  ingredients: string | null;
  origins: string | null;
  manufacturingPlaces: string | null;
  countries: string | null;
  nutriScore: string | null;
  novaGroup: number | null;
  incomplete: boolean;
};

export const EMPTY_PRODUCT_FACTS: ProductFacts = {
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
};

export type NormalizedProduct = ProductSummary &
  ProductFacts & {
    servingSize: string | null;
    nutrition: NutritionFacts;
  };

export type ProductDetail = ProductSummary &
  ProductFacts & {
    servingSize: string | null;
    nutritionAccess: "granted" | "locked";
    nutrition?: NutritionFacts;
  };

export type AppErrorCode =
  | "invalid_query"
  | "invalid_page"
  | "invalid_barcode"
  | "upstream_unavailable"
  | "product_not_found"
  | "checkout_unavailable"
  | "no_active_subscription"
  | "cancel_unavailable";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export type SearchHistoryItem = {
  id: string;
  query: string;
  language: Locale;
  resultCount: number;
  createdAt: string;
};

export type DemoUser = {
  id: string;
  email: string;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};
