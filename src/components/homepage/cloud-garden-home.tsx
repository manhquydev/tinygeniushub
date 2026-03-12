"use client";

/**
 * CloudGardenHome - Main homepage component
 * 
 * Structure:
 * 1. Garden-themed hero
 * 2. Value prop strip (3 benefit cards)
 * 3. Features section
 * 4. Beanstalk Journey preview (hành trình leo đậu thần)
 * 5. Pricing preview
 * 6. FAQ section
 */

import { HeroGarden } from "./hero-garden";
import { ValuePropStrip } from "./value-prop-strip";
import { SectionFeatures } from "./section-features";
import { JourneyPreviewSection } from "./journey-preview-section";
import { SectionPricingPreview } from "./section-pricing-preview";
import { SectionFaq } from "./section-faq";
import "./homepage.css"; // CSS for hp-* classes (sections, features, FAQ, pricing)
import "./cloud-garden-home.css"; // CSS for cgh-* classes (container layout)

export function CloudGardenHome() {
  return (
    <div className="cgh-page">
      {/* Section 1: Garden-Themed Hero */}
      <HeroGarden />

      {/* Section 2: Value Proposition Strip */}
      <ValuePropStrip />

      {/* Section 3: Features */}
      <SectionFeatures />

      {/* Section 4: Beanstalk Journey Preview */}
      <JourneyPreviewSection />

      {/* Section 5: Pricing Preview */}
      <SectionPricingPreview />

      {/* Section 6: FAQ */}
      <SectionFaq />
    </div>
  );
}
