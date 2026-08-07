import { useState } from "react";

import { useLocaleData } from "@/i18n/useLocale";
import { cn } from "@/lib/utils";

const shots = [
  "/images/bag-cream-studio.jpg",
  "/images/bag-black-studio.jpg",
  "/images/bag-pink-lifestyle.jpg",
];

export function Gallery() {
  const { t } = useLocaleData();
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  return (
    <section id="gallery" className="scroll-mt-24 bg-background py-16 md:py-24">
      <div className="container-serva">
        <p className="eyebrow">{t.gallery.eyebrow}</p>
        <h2 className="font-display rule-brass mt-3 text-3xl sm:text-4xl">{t.gallery.title}</h2>

        <div className="mt-10 grid gap-6 md:grid-cols-[minmax(0,1fr)_7rem] md:items-start">
          <div
            className="relative overflow-hidden rounded-[1.75rem] bg-sand shadow-[var(--shadow-soft)]"
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setZoom({
                x: ((event.clientX - rect.left) / rect.width) * 100,
                y: ((event.clientY - rect.top) / rect.height) * 100,
              });
            }}
            onMouseLeave={() => setZoom(null)}
          >
            <img
              src={shots[active]}
              alt={t.gallery.title}
              loading="lazy"
              width={1024}
              height={1024}
              style={
                zoom
                  ? { transform: "scale(1.7)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                  : undefined
              }
              className="aspect-square w-full object-cover transition-transform duration-200 ease-out"
            />
            <span className="absolute bottom-3 end-3 rounded-full bg-background/80 px-3 py-1 text-[0.65rem] tracking-wide text-muted-foreground backdrop-blur">
              {t.gallery.zoomHint}
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto md:flex-col md:overflow-visible">
            {shots.map((shot, index) => (
              <button
                key={shot}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`${t.gallery.title} ${index + 1}`}
                className={cn(
                  "shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                  index === active ? "border-brass" : "border-transparent hover:border-border",
                )}
              >
                <img
                  src={shot}
                  alt=""
                  loading="lazy"
                  width={200}
                  height={200}
                  className="h-20 w-20 object-cover md:h-24 md:w-full"
                />
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{t.gallery.subtitle}</p>
      </div>
    </section>
  );
}
