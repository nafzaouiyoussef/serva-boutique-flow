import { Check, Flame } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/i18n";
import { useLocaleData } from "@/i18n/useLocale";
import { PACKS, PRODUCT, listPriceFor, savingsFor } from "@/lib/product";

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

          <ul className="mt-6 space-y-3">
            {PACKS.map((pack) => {
              const saved = savingsFor(pack.qty);
              return (
                <li
                  key={pack.qty}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background px-4 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {pack.qty}{" "}
                      {pack.qty > 1 ? t.offer.packLabelPlural : t.offer.packLabel}
                    </p>
                    {saved > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {t.offer.packInstead} {formatPrice(listPriceFor(pack.qty), locale)} ·{" "}
                        <span className="text-brass">
                          -{formatPrice(saved, locale)}
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">{t.offer.deliveryFree}</p>
                    )}
                  </div>
                  <span className="font-display text-2xl">{formatPrice(pack.price, locale)}</span>
                </li>
              );
            })}
          </ul>

          <p className="mt-4 text-sm text-brass">
            {t.offer.delivery} : {t.offer.deliveryFree}
          </p>

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
