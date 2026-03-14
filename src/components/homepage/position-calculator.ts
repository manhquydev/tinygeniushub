/**
 * Position calculation utilities for Unified Scroll Journey
 * 
 * Calculates absolute positions for tiers and marketing sections
 * in a 5500px vertical scroll experience.
 */

export interface ElementPosition {
  id: string;
  type: 'tier' | 'marketing';
  yPos: number; // Position from top (px)
  height: number; // Element height (px)
  zIndex: number; // Stacking order
  alignment?: 'left' | 'right' | 'center'; // For tiers
  section?: 'hero' | 'features' | 'pricing' | 'faq'; // For marketing
}

export interface PositionConfig {
  sceneHeight: number; // Total scene height (default: 5500px)
  tierSpacing: number; // Vertical spacing between tiers (default: 620px)
  tierCount: number; // Number of tiers (default: 5)
  breakpoint?: 'desktop' | 'tablet' | 'mobile'; // Responsive adjustments
}

/**
 * Calculate tier alignment based on index
 * Pattern: left → right → center (for last tier if count > 2)
 */
export function calculateTierAlignment(
  tierIndex: number,
  totalTiers: number
): 'left' | 'right' | 'center' {
  // Last tier centered (if more than 2 tiers)
  if (tierIndex === totalTiers - 1 && totalTiers > 2) {
    return 'center';
  }
  // Alternate left/right
  return tierIndex % 2 === 0 ? 'left' : 'right';
}

/**
 * Calculate tier positions from bottom up
 * (Original BeanstalkJourney logic preserved)
 */
export function calculateTierPositions(config: PositionConfig): ElementPosition[] {
  const { sceneHeight, tierSpacing, tierCount } = config;
  const tierHeight = 400; // Approximate tier visual height
  const bottomBaseline = 520; // Offset from bottom
  
  return Array.from({ length: tierCount }, (_, index) => {
    const tierNo = index + 1;
    const yPosFromBottom = bottomBaseline + index * tierSpacing;
    const yPosFromTop = sceneHeight - yPosFromBottom - tierHeight;
    
    return {
      id: `tier-${tierNo}`,
      type: 'tier',
      yPos: Math.max(0, yPosFromTop), // Ensure not negative
      height: tierHeight,
      zIndex: 10,
      alignment: calculateTierAlignment(index, tierCount),
    };
  });
}

/**
 * Calculate marketing section positions
 * Fixed positions optimized for content + tier spacing
 */
export function calculateMarketingPositions(config: PositionConfig): ElementPosition[] {
  const { breakpoint = 'desktop' } = config;
  const SECTION_GAP = 300; // Breathing room between sections
  
  // Adjust heights based on breakpoint
  const heights = {
    hero: breakpoint === 'mobile' ? 600 : 800,
    features: breakpoint === 'mobile' ? 1000 : 800,
    pricing: breakpoint === 'mobile' ? 1400 : 1200,
    faq: breakpoint === 'mobile' ? 1800 : 1500,
  };
  
  return [
    {
      id: 'marketing-hero',
      type: 'marketing',
      section: 'hero',
      yPos: 0,
      height: heights.hero,
      zIndex: 18,
    },
    {
      id: 'marketing-features',
      type: 'marketing',
      section: 'features',
      yPos: 0 + heights.hero + SECTION_GAP, // 1100px (was 800)
      height: heights.features,
      zIndex: 18,
    },
    {
      id: 'marketing-pricing',
      type: 'marketing',
      section: 'pricing',
      yPos: 1100 + heights.features + SECTION_GAP, // 2200px (was 2800)
      height: heights.pricing,
      zIndex: 18,
    },
    {
      id: 'marketing-faq',
      type: 'marketing',
      section: 'faq',
      yPos: 2200 + heights.pricing + SECTION_GAP, // 3700px (was 4000)
      height: heights.faq,
      zIndex: 18,
    },
  ];
}

/**
 * Calculate all element positions (tiers + marketing)
 * Returns merged array sorted by yPos
 */
export function calculateUnifiedPositions(
  config: PositionConfig
): ElementPosition[] {
  const tiers = calculateTierPositions(config);
  const marketing = calculateMarketingPositions(config);
  
  // Merge and sort by yPos (top to bottom)
  return [...tiers, ...marketing].sort((a, b) => a.yPos - b.yPos);
}

/**
 * Get responsive config based on viewport width
 */
export function getResponsiveConfig(
  viewportWidth: number,
  tierCount: number = 5
): PositionConfig {
  // Mobile: < 768px
  if (viewportWidth < 768) {
    return {
      sceneHeight: 3800, // Reduced from 4000
      tierSpacing: 465, // 25% reduction (620 * 0.75)
      tierCount,
      breakpoint: 'mobile',
    };
  }
  
  // Tablet: 768-1023px
  if (viewportWidth < 1024) {
    return {
      sceneHeight: 4500, // Reduced from 4700
      tierSpacing: 500, // 20% reduction
      tierCount,
      breakpoint: 'tablet',
    };
  }
  
  // Desktop: >= 1024px
  return {
    sceneHeight: 5200, // Changed from 5500 (old total was 5500, new is ~5200)
    tierSpacing: 620,
    tierCount,
    breakpoint: 'desktop',
  };
}

/**
 * Calculate gradient zones for adaptive text colors
 * Returns array of [yStart, yEnd, textColorClass]
 * Updated for reversed gradient (navy at top → yellow at bottom)
 */
export function calculateGradientZones(sceneHeight: number): Array<{
  yStart: number;
  yEnd: number;
  textColorClass: 'zone-dark' | 'zone-mid' | 'zone-light';
}> {
  // Dark zone: 0-40% (navy)
  const darkEnd = sceneHeight * 0.4;
  // Mid zone: 40-70% (purple)
  const midEnd = sceneHeight * 0.7;
  // Light zone: 70-100% (yellow)
  
  return [
    { yStart: 0, yEnd: darkEnd, textColorClass: 'zone-dark' },
    { yStart: darkEnd, yEnd: midEnd, textColorClass: 'zone-mid' },
    { yStart: midEnd, yEnd: sceneHeight, textColorClass: 'zone-light' },
  ];
}
