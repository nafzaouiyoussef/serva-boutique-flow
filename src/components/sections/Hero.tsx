import { ShieldCheck, Truck, Wallet } from "lucide-react";

import heroAsset from "@/assets/serva-pink.png.asset.json";
import { Button } from "@/components/ui/button";
import { useLocaleData } from "@/i18n/useLocale";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Hero() {
  const { t } = useLocaleData();
  const badges = [
    { icon: Wallet, label: t.hero.badge1 },
    { icon: Truck, label: t.hero.badge2 },
    { icon: ShieldCheck, label: t.hero.badge3 },
  ];

  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="container-serva grid items-center gap-10 py-12 md:grid-cols-2 md:gap-16 md:py-20">
        <div className="order-2 md:order-1">
          <p className="eyebrow">{t.hero.eyebrow}</p>
          <h1 className="font-display mt-4 text-4xl leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
            {t.hero.title}
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t.hero.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" className="rounded-full px-8" onClick={() => scrollTo("order")}>
              {t.hero.cta}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-brass px-8 text-primary"
              onClick={() => scrollTo("gallery")}
            >
              {t.hero.secondary}
            </Button>
          </div>

          <ul className="mt-10 grid gap-3 sm:grid-cols-3">
            {badges.map(({ icon: Icon, label }) => (
              <li key={label} className="flex min-w-0 items-center gap-2 text-sm text-foreground">
                <Icon className="h-4 w-4 shrink-0 text-brass" />
                <span className="truncate">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="order-1 md:order-2">
          <div className="relative overflow-hidden rounded-[2rem] bg-sand shadow-[var(--shadow-lift)]">
            <img
              src={heroImage}
              alt={t.hero.title}
              width={1408}
              height={1760}
              className="h-[22rem] w-full object-cover sm:h-[30rem] md:h-[38rem]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
