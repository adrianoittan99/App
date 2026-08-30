import { useEffect } from "react";
import { useAppStore } from "../lib/store";
import { MarketingNav } from "../components/landing/MarketingNav";
import { Hero } from "../components/landing/Hero";
import { FeatureGrid } from "../components/landing/FeatureGrid";
import { HowItWorks } from "../components/landing/HowItWorks";
import { CompareSection } from "../components/landing/CompareSection";
import { Testimonials } from "../components/landing/Testimonials";
import { CTASection } from "../components/landing/CTASection";
import { Footer } from "../components/landing/Footer";

export function LandingPage() {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div style={{ background: "var(--bg)" }} className="min-h-screen">
      <MarketingNav />
      <Hero />
      <FeatureGrid />
      <HowItWorks />
      <CompareSection />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
}
