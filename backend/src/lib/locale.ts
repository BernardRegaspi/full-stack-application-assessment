import { LOCALES, type Locale } from "../types.js";

export function parseLocale(value: string | undefined): Locale {
  if (value && (LOCALES as string[]).includes(value)) {
    return value as Locale;
  }
  return "en";
}
