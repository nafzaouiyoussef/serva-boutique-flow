import { PlayCircle, Star } from "lucide-react";

import { useLocaleData } from "@/i18n/useLocale";

export function SocialProof() {
  const { t } = useLocaleData();

  return (
    <section id="reviews" className="scroll-mt-24 bg-cream py-16 md:py-24">
      <div className="container-serva">
        <p className="eyebrow">{t.proof.eyebrow}</p>
        <h2 className="font-display rule-brass mt-3 text-3xl sm:text-4xl">{t.proof.title}</h2>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {t.proof.reviews.map((review) => (
            <figure
              key={review.name}
              className="flex h-full flex-col rounded-2xl bg-background p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="flex gap-1 text-brass">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                “{review.text}”
              </blockquote>
              <figcaption className="mt-5 text-xs tracking-wide text-muted-foreground">
                {review.name} — {review.city}
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-8 grid place-items-center rounded-2xl border border-dashed border-brass/50 bg-background/60 p-10 text-center">
          <PlayCircle className="h-9 w-9 text-brass" />
          <p className="mt-3 text-sm font-semibold text-foreground">{t.proof.videoTitle}</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">{t.proof.videoNote}</p>
        </div>
      </div>
    </section>
  );
}
