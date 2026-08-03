import { Outlet, createFileRoute, notFound } from "@tanstack/react-router";

import { dirFor, getDictionary, isLocale, toLocale } from "@/i18n";

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale)) throw notFound();
  },
  head: ({ params }) => {
    const locale = toLocale(params.locale);
    const t = getDictionary(locale);
    return {
      meta: [
        { title: t.meta.title },
        { name: "description", content: t.meta.description },
        { property: "og:title", content: t.meta.title },
        { property: "og:description", content: t.meta.description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      htmlAttrs: { lang: locale, dir: dirFor(locale) },
    };
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  return <Outlet />;
}
