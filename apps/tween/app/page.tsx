import { SiteNavbar } from "@/components/home/site-navbar";
import { Hero } from "@/components/home/hero";
import { Features } from "@/components/home/features";
import { Showcase } from "@/components/home/showcase";
import { Pricing } from "@/components/home/pricing";
import { CtaBand } from "@/components/home/cta-band";
import { SiteFooter } from "@/components/home/site-footer";

export default function Home() {
  return (
    <>
      <SiteNavbar />
      <main>
        <Hero />
        <Features />
        <Showcase />
        <Pricing />
        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
