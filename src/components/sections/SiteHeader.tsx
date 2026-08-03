import { Link, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { otherLocale } from "@/i18n";
import { useLocaleData } from "@/i18n/useLocale";
import { cn } from "@/lib/utils";

function scrollToOrder(event: { preventDefault: () => void }) {
  event.preventDefault();
  document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SiteHeader() {
  const { locale, t } = useLocaleData();
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const swappedPath = pathname.replace(`/${locale}`, `/${otherLocale(locale)}`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-transparent transition-all duration-300",
        scrolled ? "border-border bg-background/85 backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="container-serva grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 sm:py-4">
        <div className="flex min-w-0 items-center gap-6">
          <Link to="/$locale" params={{ locale }} className="min-w-0">
            <span className="font-display block truncate text-2xl leading-none tracking-[0.32em] text-primary">
              {t.brand.name.toUpperCase()}
            </span>
            <span className="mt-1 hidden text-[0.6rem] tracking-[0.22em] text-muted-foreground sm:block">
              {t.brand.tagline.toUpperCase()}
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
            <a href="#gallery" className="transition-colors hover:text-primary">
              {t.nav.gallery}
            </a>
            <a href="#reviews" className="transition-colors hover:text-primary">
              {t.nav.reviews}
            </a>
            <a href="#faq" className="transition-colors hover:text-primary">
              {t.nav.faq}
            </a>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={swappedPath}
            className="rounded-full border border-border px-3 py-1.5 text-xs tracking-wide text-foreground transition-colors hover:border-brass hover:text-primary"
          >
            {t.nav.switchTo}
          </Link>
          <Button size="sm" onClick={scrollToOrder} className="rounded-full px-4">
            {t.nav.order}
          </Button>
          <a
            href="#gallery"
            aria-label={t.nav.gallery}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
