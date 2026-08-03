import { useParams } from "@tanstack/react-router";

import { dirFor, getDictionary, toLocale, type Dictionary, type Locale } from "./index";

export function useLocaleData(): {
  locale: Locale;
  t: Dictionary;
  dir: "rtl" | "ltr";
} {
  const params = useParams({ strict: false }) as { locale?: string };
  const locale = toLocale(params.locale);
  return { locale, t: getDictionary(locale), dir: dirFor(locale) };
}
