import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle, Phone } from "lucide-react";

import { useLocaleData } from "@/i18n/useLocale";

export function SiteFooter() {
  const { locale, t } = useLocaleData();

  return (
    <footer className="bg-primary py-14 text-primary-foreground">
      <div className="container-serva grid gap-10 md:grid-cols-3">
        <div>
          <span className="font-display text-2xl tracking-[0.32em]">
            {t.brand.name.toUpperCase()}
          </span>
          <p className="mt-4 max-w-xs text-sm leading-relaxed opacity-80">{t.footer.blurb}</p>
        </div>

        <div className="text-sm">
          <h3 className="text-brass">{t.footer.contact}</h3>
          <ul className="mt-4 space-y-2 opacity-90">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <a href="tel:+212600000000" dir="ltr">
                +212 6 00 00 00 00
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0" />
              <a href="https://wa.me/212600000000" target="_blank" rel="noreferrer">
                {t.footer.whatsapp}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Instagram className="h-4 w-4 shrink-0" />
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                {t.footer.follow}
              </a>
            </li>
          </ul>
        </div>

        <div className="text-sm">
          <h3 className="text-brass">{t.nav.faq}</h3>
          <p className="mt-4 opacity-80">{t.footer.policies}</p>
          <Link
            to="/$locale/admin"
            params={{ locale }}
            className="mt-4 inline-block text-xs underline opacity-70 hover:opacity-100"
          >
            {t.nav.admin}
          </Link>
        </div>
      </div>

      <div className="container-serva mt-10 border-t border-primary-foreground/15 pt-6 text-xs opacity-70">
        © {new Date().getFullYear()} {t.brand.name}. {t.footer.rights}
      </div>
    </footer>
  );
}
