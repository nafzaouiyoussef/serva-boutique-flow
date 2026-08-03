import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocaleData } from "@/i18n/useLocale";

export function Faq() {
  const { t } = useLocaleData();

  return (
    <section id="faq" className="scroll-mt-24 bg-cream py-16 md:py-24">
      <div className="container-serva max-w-3xl">
        <p className="eyebrow">{t.faq.eyebrow}</p>
        <h2 className="font-display rule-brass mt-3 text-3xl sm:text-4xl">{t.faq.title}</h2>

        <Accordion type="single" collapsible className="mt-8">
          {t.faq.items.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-start text-base">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
