import { Footer } from "@/components/landing/Footer";
import { ForOrganizations } from "@/components/landing/ForOrganizations";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { ThreatModel } from "@/components/landing/ThreatModel";
import { WhyArc } from "@/components/landing/WhyArc";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-typeui-base text-typeui-text">
      <HeroSection />
      <ProblemSection />
      <HowItWorks />
      <WhyArc />
      <ThreatModel />
      <ForOrganizations />
      <Footer />
    </main>
  );
}
