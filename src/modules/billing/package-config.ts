/**
 * Abeka Curriculum Package Constants
 * 
 * Pricing fixes applied:
 * - Lite tier: 99K → 149K (margin 3% → 36%) - MOVED to plan-config.ts
 * - Middle School: 399K -> 349K (competitive with Elementary)
 */

import { z } from "zod";

// Package code schema for validation
export const packageCodeSchema = z.enum([
  "PRESCHOOL_PREMIUM",      // K4-K5: Preschool
  "ELEMENTARY_PRO",         // G1-G5: Elementary
  "MIDDLE_SCHOOL_ADVANCED", // G6-G9: Middle School
  "HIGH_SCHOOL_ELITE",      // G10-G12: THPT
  "ENGLISH_MASTER",         // K4-G5: English
  "MATH_THINKING",          // K4-G8: Thinking Math
  "STEM_INNOVATOR",         // G3-G8: STEM
  "ULTIMATE_FULL",          // K4-G12: Full Access
]);

export type PackageCode = z.infer<typeof packageCodeSchema>;

// Package configuration type
export interface PackageConfig {
  code: PackageCode;
  name: string;
  nameVi: string;
  description: string;
  grades: string[];          // e.g., ["k4", "k5"]
  gradeRange: string;        // e.g., "K4-K5"
  subjects: string[];        // e.g., ["PH", "AT", "BI"] or [] for all
  videoCount: number;
  lessonCount: number;
  monthlyPrice: number;      // VND
  yearlyPrice: number;       // VND
  displayOrder: number;
  features: string[];
  targetAge: string;
  valueProposition: string;
}

// Package configurations
export const PACKAGE_CONFIG: Record<PackageCode, PackageConfig> = {
  PRESCHOOL_PREMIUM: {
    code: "PRESCHOOL_PREMIUM",
    name: "Preschool Premium",
    nameVi: "PREMIUM Preschool Package",
    description: "Golden foundation for children - From illiterate to fluent in reading and writing",
    grades: ["k4", "k5"],
    gradeRange: "K4-K5",
    subjects: ["PH", "AT", "BI", "AC", "WR"],
    videoCount: 2800,
    lessonCount: 340,
    monthlyPrice: 199_000,
    yearlyPrice: 1_790_000,
    displayOrder: 1,
    features: [
      "Basic Phonics from ABC",
      "Recognize letters and sounds",
      "Early life skills",
      "Ethical foundation",
      "Creative activities"
    ],
    targetAge: "2-6 years old",
    valueProposition: "Prepare a solid foundation for learning"
  },

  ELEMENTARY_PRO: {
    code: "ELEMENTARY_PRO",
    name: "Elementary PRO",
    nameVi: "PRO Primary Package",
    description: "5 golden years - Building a solid foundation for the future",
    grades: ["g1", "g2", "g3", "g4", "g5"],
    gradeRange: "G1-G5",
    subjects: ["PH", "RE", "AT", "SC", "HI", "WR", "BI"],
    videoCount: 7250,
    lessonCount: 850,
    monthlyPrice: 349_000,
    yearlyPrice: 2_990_000,
    displayOrder: 2,
    features: [
      "Advanced Phonics",
      "Logical thinking math",
      "Basic science",
      "World history",
      "Reading comprehension and essay writing"
    ],
    targetAge: "6-11 years old",
    valueProposition: "Comprehensive foundation for level 2"
  },

  MIDDLE_SCHOOL_ADVANCED: {
    code: "MIDDLE_SCHOOL_ADVANCED",
    name: "Middle School Advanced",
    nameVi: "ADVANCED High School Package",
    description: "Conquering middle school - From good student to excellent student",
    grades: ["g6", "g7", "g8", "g9"],
    gradeRange: "G6-G9",
    subjects: ["AT", "SC", "HI", "RE", "BI", "WR"],
    videoCount: 5800,
    lessonCount: 680,
    monthlyPrice: 349_000,  // Fixed: 399K -> 349K (competitive with Elementary)
    yearlyPrice: 3_190_000, // Adjusted yearly to match
    displayOrder: 3,
    features: [
      "Algebra and geometry",
      "Natural science",
      "American History",
      "English literature analysis",
      "Critical thinking"
    ],
    targetAge: "11-15 years old",
    valueProposition: "Solid preparation for level 3"
  },

  HIGH_SCHOOL_ELITE: {
    code: "HIGH_SCHOOL_ELITE",
    name: "High School Elite",
    nameVi: "ELITE High School Package",
    description: "Go to a top university - Prepare outstandingly for the future",
    grades: ["g10", "g11", "g12"],
    gradeRange: "G10-G12",
    subjects: ["AT", "SC", "HI", "RE", "BI", "WR"],
    videoCount: 4350,
    lessonCount: 510,
    monthlyPrice: 449_000,
    yearlyPrice: 3_990_000,
    displayOrder: 4,
    features: [
      "Advanced Calculus and Geometry",
      "Intensive Chemistry and Physics",
      "Prepare for SAT/University",
      "Advanced analytical literature",
      "Politics and Economics"
    ],
    targetAge: "15-18 years old",
    valueProposition: "Excel in the university exam"
  },

  ENGLISH_MASTER: {
    code: "ENGLISH_MASTER",
    name: "English Master",
    nameVi: "MASTER English Package",
    description: "Bilingual since childhood - English like a native",
    grades: ["k4", "k5", "g1", "g2", "g3", "g4", "g5"],
    gradeRange: "K4-G5",
    subjects: ["PH", "RE", "WR"],
    videoCount: 1500,
    lessonCount: 1020,
    monthlyPrice: 249_000,
    yearlyPrice: 2_190_000,
    displayOrder: 5,
    features: [
      "Phonics from basic to advanced",
      "Read and pronounce American standards",
      "Basic essay writing",
      "From ABC to fluent reading and writing",
      "6 years of continuous English"
    ],
    targetAge: "2-11 years old",
    valueProposition: "English has excelled since childhood"
  },

  MATH_THINKING: {
    code: "MATH_THINKING",
    name: "Math Thinking",
    nameVi: "Mental Math Package",
    description: "Mathematical Thinking - I'm good at logic, not afraid of problems",
    grades: ["k4", "k5", "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8"],
    gradeRange: "K4-G8",
    subjects: ["AT"],
    videoCount: 1200,
    lessonCount: 1190,
    monthlyPrice: 199_000,
    yearlyPrice: 1_790_000,
    displayOrder: 6,
    features: [
      "Arithmetic from basic to advanced",
      "Algebra and geometry",
      "Logical thinking",
      "Solve real problems",
      "9 years of continuous math"
    ],
    targetAge: "2-14 years old",
    valueProposition: "Solid mathematical foundation"
  },

  STEM_INNOVATOR: {
    code: "STEM_INNOVATOR",
    name: "STEM Innovator",
    nameVi: "STEM INNOVATOR Package",
    description: "Little scientist - Explore the natural world",
    grades: ["g3", "g4", "g5", "g6", "g7", "g8"],
    gradeRange: "G3-G8",
    subjects: ["SC", "AT"],
    videoCount: 1500,
    lessonCount: 1020,
    monthlyPrice: 299_000,
    yearlyPrice: 2_690_000,
    displayOrder: 7,
    features: [
      "Science from basic to advanced",
      "Virtual experiment",
      "Scientific thinking",
      "Applied Mathematics",
      "6 consecutive years of STEM"
    ],
    targetAge: "8-14 years old",
    valueProposition: "STEM foundation for the future"
  },

  ULTIMATE_FULL: {
    code: "ULTIMATE_FULL",
    name: "Ultimate Full Access",
    nameVi: "ULTIMATE Comprehensive Package",
    description: "Treasure of knowledge - One time investment, lifetime enjoyment",
    grades: ["k4", "k5", "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9", "g10", "g11", "g12"],
    gradeRange: "K4-G12",
    subjects: [], // All subjects
    videoCount: 20195,
    lessonCount: 2380,
    monthlyPrice: 699_000,
    yearlyPrice: 6_990_000,
    displayOrder: 8,
    features: [
      "Total 20,195 videos",
      "All 8 subjects",
      "14 grade levels from K4 to G12",
      "Multi-user in the family",
      "Dashboard and progress reports"
    ],
    targetAge: "2-18 years old",
    valueProposition: "Best value for families"
  },
};

// Helper functions
export function getPackageConfig(code: PackageCode): PackageConfig {
  return PACKAGE_CONFIG[code];
}

export function getAllPackages(): PackageConfig[] {
  return Object.values(PACKAGE_CONFIG).sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getActivePackages(): PackageConfig[] {
  return getAllPackages().filter(p => p.monthlyPrice > 0);
}

export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  const monthlyCostForYear = monthlyPrice * 12;
  const savings = monthlyCostForYear - yearlyPrice;
  return Math.round((savings / monthlyCostForYear) * 100);
}

export function getPackagePriceWithSavings(code: PackageCode) {
  const pkg = getPackageConfig(code);
  const savings = calculateYearlySavings(pkg.monthlyPrice, pkg.yearlyPrice);
  const savingsAmount = (pkg.monthlyPrice * 12) - pkg.yearlyPrice;
  
  return {
    monthlyPrice: pkg.monthlyPrice,
    yearlyPrice: pkg.yearlyPrice,
    savings,
    savingsAmount,
    dailyPrice: Math.round(pkg.yearlyPrice / 365)
  };
}

// Find packages by grade level
export function getPackagesByGrade(grade: string): PackageConfig[] {
  return getAllPackages().filter(pkg => pkg.grades.includes(grade.toLowerCase()));
}

// Find packages containing a specific subject
export function getPackagesBySubject(subject: string): PackageConfig[] {
  return getAllPackages().filter(pkg => 
    pkg.subjects.length === 0 || pkg.subjects.includes(subject.toUpperCase())
  );
}

// Package upgrade path (natural progression)
export const PACKAGE_UPGRADE_PATH: Record<PackageCode, PackageCode[]> = {
  PRESCHOOL_PREMIUM: ["ELEMENTARY_PRO", "ULTIMATE_FULL"],
  ELEMENTARY_PRO: ["MIDDLE_SCHOOL_ADVANCED", "ULTIMATE_FULL"],
  MIDDLE_SCHOOL_ADVANCED: ["HIGH_SCHOOL_ELITE", "ULTIMATE_FULL"],
  HIGH_SCHOOL_ELITE: ["ULTIMATE_FULL"],
  ENGLISH_MASTER: ["ELEMENTARY_PRO", "ULTIMATE_FULL"],
  MATH_THINKING: ["MIDDLE_SCHOOL_ADVANCED", "ULTIMATE_FULL"],
  STEM_INNOVATOR: ["ULTIMATE_FULL"],
  ULTIMATE_FULL: []
};

export function getUpgradeOptions(currentCode: PackageCode): PackageConfig[] {
  const upgradeCodes = PACKAGE_UPGRADE_PATH[currentCode] || [];
  return upgradeCodes.map(code => getPackageConfig(code as PackageCode));
}

// Subject code mapping for reference
export const SUBJECT_CODES: Record<string, { name: string; nameVi: string }> = {
  PH: { name: "Phonics", nameVi: "Phonics" },
  RE: { name: "Reading", nameVi: "Read comprehension" },
  AT: { name: "Arithmetic/Math", nameVi: "Maths" },
  SC: { name: "Science", nameVi: "Science" },
  HI: { name: "History", nameVi: "History" },
  BI: { name: "Bible", nameVi: "Bible" },
  WR: { name: "Writing", nameVi: "Write" },
  AC: { name: "Activities", nameVi: "Work" }
};
