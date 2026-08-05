import { Boxes, Gem, Ruler, Sparkles } from "lucide-react";

import bagInterior from "@/assets/bag-cream-studio.jpg";
import { useLocaleData } from "@/i18n/useLocale";

const icons = [Gem, Ruler, Boxes, Sparkles];

export function ValueBlock() {
  const { t } = useLocaleData();

  return (
    <section className="bg-cream py-16 md:py-24">
      <div className="container-serva grid items-center gap-12 md:grid-cols-2">
        <div className="overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-soft)]">
          <img
            src={bagInterior}
            alt={t.value.title}
            loading="lazy"
            width={1024}
            height={1024}
            className="aspect-square w-full object-cover"
          />
        </div>

        <div>
          <p className="eyebrow">{t.value.eyebrow}</p>
          <h2 className="font-display rule-brass mt-3 text-3xl sm:text-4xl">{t.value.title}</h2>
          <ul className="mt-8 space-y-6">
            {t.value.items.map((item, index) => {
              const Icon = icons[index] ?? Gem;
              return (
                <li key={item.title} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
