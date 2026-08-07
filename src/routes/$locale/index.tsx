import { createFileRoute } from "@tanstack/react-router";

import { CodStrip } from "@/components/sections/CodStrip";
import { Collection } from "@/components/sections/Collection";
import { Faq } from "@/components/sections/Faq";
import { Gallery } from "@/components/sections/Gallery";
import { Hero } from "@/components/sections/Hero";
import { Offer } from "@/components/sections/Offer";
import { OrderForm } from "@/components/sections/OrderForm";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SocialProof } from "@/components/sections/SocialProof";
import { ValueBlock } from "@/components/sections/ValueBlock";

export const Route = createFileRoute("/$locale/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <OrderForm />
        <CodStrip />
        <Gallery />
        <Collection />
        <ValueBlock />
        <SocialProof />
        <Offer />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}
