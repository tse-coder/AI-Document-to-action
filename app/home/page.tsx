import Navbar from "@/components/home/Navbar";
import HeroSection from "@/components/home/HeroSection";
import ProblemSection from "@/components/home/ProblemSection";
import WorkflowSection from "@/components/home/WorkflowSection";
import CoreFeaturesSection from "@/components/home/CoreFeaturesSection";
import TrustSection from "@/components/home/TrustSection";
import FinalCtaSection from "@/components/home/FinalCtaSection";
import Footer from "@/components/home/Footer";

export default function HomeRoutePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased selection:bg-blue-500 selection:text-white">
      {/* 1. Navigation */}
      <Navbar />

      {/* 2. Hero Section */}
      <HeroSection />

      {/* 3. The Problem Section */}
      <ProblemSection />

      {/* 4. Workflow Section */}
      <WorkflowSection />

      {/* 5. Core Features Section */}
      <CoreFeaturesSection />

      {/* 6. Institutional Trust Section */}
      <TrustSection />

      {/* 7. Final Conversion Section */}
      <FinalCtaSection />

      {/* 8. Footer */}
      <Footer />
    </div>
  );
}
