import type { Locale, NormalizedProduct, NutritionFacts, ProductSummary } from "../types.js";

export type OffRawProduct = {
  code?: unknown;
  product_name?: unknown;
  product_name_en?: unknown;
  product_name_nl?: unknown;
  product_name_de?: unknown;
  product_name_fr?: unknown;
  generic_name?: unknown;
  generic_name_en?: unknown;
  generic_name_nl?: unknown;
  generic_name_de?: unknown;
  generic_name_fr?: unknown;
  brands?: unknown;
  image_front_small_url?: unknown;
  image_front_url?: unknown;
  serving_size?: unknown;
  nutriments?: Record<string, unknown>;
  nutriments_estimated?: Record<string, unknown>;
  quantity?: unknown;
  packaging?: unknown;
  categories?: unknown;
  categories_tags?: unknown;
  labels?: unknown;
  labels_tags?: unknown;
  ingredients_text?: unknown;
  ingredients_text_en?: unknown;
  ingredients_text_nl?: unknown;
  ingredients_text_de?: unknown;
  ingredients_text_fr?: unknown;
  origins?: unknown;
  manufacturing_places?: unknown;
  countries?: unknown;
  nutriscore_grade?: unknown;
  nova_group?: unknown;
  states_tags?: unknown;
  completeness?: unknown;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asBarcode(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim());
  }
  const text = asString(value);
  if (!text) return [];
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function humanizeTag(tag: string): string {
  const leaf = tag.includes(":") ? tag.slice(tag.indexOf(":") + 1) : tag;
  const words = leaf.replace(/-/g, " ");
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : words;
}

function displayList(commaSeparated: unknown, tags: unknown, limit = 8): string[] {
  const fromText = asStringList(commaSeparated);
  const source = fromText.length > 0 ? fromText : asStringList(tags).map(humanizeTag);
  return [...new Set(source)].slice(0, limit);
}

function localized(
  raw: OffRawProduct,
  lang: Locale,
  base: "product_name" | "generic_name" | "ingredients_text",
): string | null {
  const keyed = `${base}_${lang}` as keyof OffRawProduct;
  return asString(raw[keyed]) ?? asString(raw[base]);
}

function pickName(raw: OffRawProduct, lang: Locale): string | null {
  return localized(raw, lang, "product_name") ?? localized(raw, lang, "generic_name");
}

function pickBrand(raw: OffRawProduct): string | null {
  const brands = asString(raw.brands);
  if (!brands) return null;
  return brands.split(",")[0]?.trim() || null;
}

function pickImage(raw: OffRawProduct): string | null {
  return asString(raw.image_front_small_url) ?? asString(raw.image_front_url);
}

function nutrientValue(
  nutriments: Record<string, unknown>,
  estimated: Record<string, unknown>,
  key: string,
): number | null {
  return asNumber(nutriments[key]) ?? asNumber(estimated[key]);
}

function pickNutrition(raw: OffRawProduct): NutritionFacts {
  const n = raw.nutriments ?? {};
  const estimated = raw.nutriments_estimated ?? {};
  return {
    energyKcal: nutrientValue(n, estimated, "energy-kcal_100g"),
    fat: nutrientValue(n, estimated, "fat_100g"),
    saturates: nutrientValue(n, estimated, "saturated-fat_100g"),
    sugars: nutrientValue(n, estimated, "sugars_100g"),
    salt: nutrientValue(n, estimated, "salt_100g"),
    protein: nutrientValue(n, estimated, "proteins_100g"),
  };
}

function pickNutriScore(raw: OffRawProduct): string | null {
  const grade = asString(raw.nutriscore_grade)?.toUpperCase();
  return grade && /^[A-E]$/.test(grade) ? grade : null;
}

function pickNova(raw: OffRawProduct): number | null {
  const value = asNumber(raw.nova_group);
  return value === 1 || value === 2 || value === 3 || value === 4 ? value : null;
}

function pickIncomplete(raw: OffRawProduct): boolean {
  const states = asStringList(raw.states_tags);
  if (states.some((state) => state.endsWith(":to-be-completed"))) {
    return true;
  }
  return typeof raw.completeness === "number" && raw.completeness < 0.5;
}

export function mapOffHit(raw: OffRawProduct, lang: Locale): ProductSummary | null {
  const barcode = asBarcode(raw.code);
  if (!barcode) return null;
  return {
    barcode,
    name: pickName(raw, lang),
    brand: pickBrand(raw),
    imageUrl: pickImage(raw),
  };
}

export function mapOffProduct(
  raw: OffRawProduct,
  lang: Locale,
): NormalizedProduct | null {
  const summary = mapOffHit(raw, lang);
  if (!summary) return null;
  return {
    ...summary,
    servingSize: asString(raw.serving_size),
    nutrition: pickNutrition(raw),
    quantity: asString(raw.quantity),
    packaging: asString(raw.packaging),
    categories: displayList(raw.categories, raw.categories_tags, 6),
    labels: displayList(raw.labels, raw.labels_tags, 8),
    ingredients: localized(raw, lang, "ingredients_text"),
    origins: asString(raw.origins),
    manufacturingPlaces: asString(raw.manufacturing_places),
    countries: asString(raw.countries),
    nutriScore: pickNutriScore(raw),
    novaGroup: pickNova(raw),
    incomplete: pickIncomplete(raw),
  };
}
