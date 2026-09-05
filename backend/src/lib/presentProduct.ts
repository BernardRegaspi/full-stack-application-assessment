import type { NormalizedProduct, ProductDetail, ProductFacts } from "../types.js";

function publicFacts(product: NormalizedProduct): ProductFacts {
  return {
    quantity: product.quantity,
    packaging: product.packaging,
    categories: product.categories,
    labels: product.labels,
    ingredients: product.ingredients,
    origins: product.origins,
    manufacturingPlaces: product.manufacturingPlaces,
    countries: product.countries,
    nutriScore: product.nutriScore,
    novaGroup: product.novaGroup,
    incomplete: product.incomplete,
  };
}

export function presentProduct(
  product: NormalizedProduct,
  isSubscribed: boolean,
): ProductDetail {
  const base: ProductDetail = {
    barcode: product.barcode,
    name: product.name,
    brand: product.brand,
    imageUrl: product.imageUrl,
    servingSize: product.servingSize,
    nutritionAccess: isSubscribed ? "granted" : "locked",
    ...publicFacts(product),
  };
  if (isSubscribed) {
    base.nutrition = product.nutrition;
  }
  return base;
}
