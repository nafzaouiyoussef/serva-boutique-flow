import { Outlet, createFileRoute, notFound } from "@tanstack/react-router";

import { dirFor, getDictionary, isLocale, toLocale } from "@/i18n";

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale)) throw notFound();
  },
  head: ({ params }) => {
    const locale = toLocale(params.locale);
    const t = getDictionary(locale);
    const origin = "https://www.servaelegance.store";
    const url = `${origin}/${locale}`;
    const image = `${origin}/images/bag-pink-lifestyle.jpg`;
    return {
      meta: [
        { title: t.meta.title },
        { name: "description", content: t.meta.description },
        { property: "og:title", content: t.meta.title },
        { property: "og:description", content: t.meta.description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { property: "og:locale", content: locale === "ar" ? "ar_MA" : "fr_MA" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: t.meta.title },
        { name: "twitter:description", content: t.meta.description },
        { name: "twitter:image", content: image },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "fr", href: `${origin}/fr` },
        { rel: "alternate", hrefLang: "ar", href: `${origin}/ar` },
        { rel: "alternate", hrefLang: "x-default", href: `${origin}/fr` },
      ],
      htmlAttrs: { lang: locale, dir: dirFor(locale) },
    };
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  return <Outlet />;
}
