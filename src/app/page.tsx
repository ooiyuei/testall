import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/lp/Hero";
import { Problem } from "@/components/lp/Problem";
import { Solution } from "@/components/lp/Solution";
import { Compare } from "@/components/lp/Compare";
import { Pricing } from "@/components/lp/Pricing";
import { Mission } from "@/components/lp/Mission";
import { CTASection } from "@/components/lp/CTASection";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <Compare />
        <Pricing />
        <Mission />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
