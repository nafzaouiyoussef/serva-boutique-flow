import { useQuery } from "@tanstack/react-query";
import { StorageImage } from "@/components/StorageImage";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/i18n";
import { useLocaleData } from "@/i18n/useLocale";
import { listPublicProducts } from "@/lib/products.functions";

function scrollToOrder() {
  document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Collection() {
  const { locale, t } = useLocaleData();
  const fetchProducts = useServerFn(listPublicProducts);
  const { data, isLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => fetchProducts({}),
  });

  const products = data ?? [];
  if (!isLoading && products.length === 0) return null;

  return (
    <section id="collection" className="scroll-mt-24 bg-cream py-16 md:py-24">
      <div className="container-serva">
        <p className="eyebrow">{t.collection.eyebrow}</p>
        <h2 className="font-display rule-brass mt-3 text-3xl sm:text-4xl">{t.collection.title}</h2>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">{t.collection.subtitle}</p>

        {isLoading ? (
          <div className="mt-10 grid place-items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-brass" />
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const name = locale === "ar" ? product.name_ar : product.name_fr;
              const description =
                locale === "ar" ? product.description_ar : product.description_fr;
              const cover = product.images?.[0];

              return (
                <article
                  key={product.id}
                  className="flex flex-col overflow-hidden rounded-[1.5rem] bg-background shadow-[var(--shadow-soft)]"
                >
                  <StorageImage
                    src={cover}
                    alt={name}
                    loading="lazy"
                    width={800}
                    height={800}
                    className="aspect-square w-full object-cover"
                  />

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-xl">{name}</h3>
                    {description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {description}
                      </p>
                    ) : null}

                    {product.variants?.length ? (
                      <div className="mt-4 flex items-center gap-2">
                        {product.variants.map((variant) => (
                          <span
                            key={variant.key}
                            title={locale === "ar" ? variant.ar : variant.fr}
                            className="h-5 w-5 rounded-full border border-border"
                            style={{ background: variant.swatch ?? "var(--muted)" }}
                          />
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-5 flex items-baseline gap-3">
                      <span className="font-display text-2xl">
                        {formatPrice(Number(product.price), locale)}
                      </span>
                      {product.compare_at_price ? (
                        <span className="text-sm line-through text-muted-foreground">
                          {formatPrice(Number(product.compare_at_price), locale)}
                        </span>
                      ) : null}
                    </div>

                    <Button className="mt-5 w-full rounded-full" onClick={scrollToOrder}>
                      {t.collection.cta}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
