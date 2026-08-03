import { Headphones, RefreshCcw, Truck, Wallet } from "lucide-react";

import { useLocaleData } from "@/i18n/useLocale";

const icons = [Wallet, Truck, RefreshCcw, Headphones];

export function CodStrip() {
  const { t } = useLocaleData();

  return (
    <section className="border-y border-border bg-background py-12">
      <div className="container-serva">
        <h2 className="font-display text-center text-2xl sm:text-3xl">{t.cod.title}</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.cod.items.map((item, index) => {
            const Icon = icons[index] ?? Wallet;
            return (
              <li key={item.title} className="rounded-2xl bg-cream p-5 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-background text-brass">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
