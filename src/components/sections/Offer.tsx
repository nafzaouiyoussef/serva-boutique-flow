import { Check, Flame } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/i18n";
import { useLocaleData } from "@/i18n/useLocale";
import { PRODUCT, computeTotal } from "@/lib/product";

function scrollToOrder() {
  document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Offer() {
  const { locale, t } = useLocaleData();
  const savings = PRODUCT.compareAtPrice - PRODUCT.unitPrice;

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container-serva grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.75rem] bg-primary p-8 text-primary-foreground sm:p-10">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-brass">{t.offer.eyebrow}</p>
          <h2 className="font-display mt-3 text-3xl sm:text-4xl">{t.offer.title}</h2>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-5xl">{formatPrice(PRODUCT.unitPrice, locale)}</span>
            <span className="text-lg line-through opacity-60">
              {formatPrice(PRODUCT.compareAtPrice, locale)}
            </span>
            <span className="rounded-full bg-brass px-3 py-1 text-xs font-semibold text-brass-foreground">
              {t.offer.save} {formatPrice(savings, locale)}
            </span>
          </div>

          <ul className="mt-6 space-y-2 text-sm opacity-90">
            {t.cod.items.map((item) => (
              <li key={item.title} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-brass" />
                <span>{item.title}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 flex items-center gap-2 text-sm text-brass">
            <Flame className="h-4 w-4 shrink-0" />
            {t.offer.urgency}
          </p>

          <Button
            size="lg"
            variant="secondary"
            className="mt-8 w-full rounded-full sm:w-auto sm:px-10"
            onClick={scrollToOrder}
          >
            {t.offer.cta}
          </Button>
        </div>

        <div className="flex flex-col justify-center rounded-[1.75rem] border border-brass/40 bg-cream p-8 sm:p-10">
          <h3 className="font-display text-2xl text-foreground">{t.offer.bundleTitle}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.offer.bundleText}</p>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <dt className="text-muted-foreground">2 × {t.brand.name}</dt>
              <dd className="font-semibold">{formatPrice(PRODUCT.unitPrice * 2, locale)}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <dt className="text-muted-foreground">{t.offer.delivery}</dt>
              <dd className="font-semibold text-brass">{t.offer.deliveryFree}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-foreground">{t.form.total}</dt>
              <dd className="font-display text-2xl">{formatPrice(computeTotal(2), locale)}</dd>
            </div>
          </dl>

          <Button
            size="lg"
            className="mt-8 w-full rounded-full sm:w-auto sm:px-10"
            onClick={scrollToOrder}
          >
            {t.offer.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}
