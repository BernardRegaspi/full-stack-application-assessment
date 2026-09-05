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

export type ProductDetail = ProductSummary &
  ProductFacts & {
    servingSize: string | null;
    nutritionAccess: "granted" | "locked";
    nutrition?: NutritionFacts;
  };

export type SearchHistoryItem = {
  id: string;
  query: string;
  language: string;
  resultCount: number;
  createdAt: string;
};
