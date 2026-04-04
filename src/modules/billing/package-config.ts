/**
 * Abeka Curriculum Package Constants
 * 
 * Pricing fixes applied:
 * - Lite tier: 99K → 149K (margin 3% → 36%) - MOVED to plan-config.ts
 * - Trung Học: 399K → 349K (competitive với Tiểu Học)
 */

import { z } from "zod";

// Package code schema for validation
export const packageCodeSchema = z.enum([
  "PRESCHOOL_PREMIUM",      // K4-K5: Mầm Non
  "ELEMENTARY_PRO",         // G1-G5: Tiểu Học  
  "MIDDLE_SCHOOL_ADVANCED", // G6-G9: Trung Học
  "HIGH_SCHOOL_ELITE",      // G10-G12: THPT
  "ENGLISH_MASTER",         // K4-G5: Tiếng Anh
  "MATH_THINKING",          // K4-G8: Toán Tư Duy
  "STEM_INNOVATOR",         // G3-G8: STEM
  "ULTIMATE_FULL",          // K4-G12: Toàn Diện
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
    nameVi: "Gói Mầm Non PREMIUM",
    description: "Nền tảng vàng cho con yêu - Từ chưa biết chữ đến đọc thông viết thạo",
    grades: ["k4", "k5"],
    gradeRange: "K4-K5",
    subjects: ["PH", "AT", "BI", "AC", "WR"],
    videoCount: 2800,
    lessonCount: 340,
    monthlyPrice: 199_000,
    yearlyPrice: 1_790_000,
    displayOrder: 1,
    features: [
      "Phonics cơ bản từ ABC",
      "Nhận biết chữ cái và âm",
      "Kỹ năng sống đầu đời",
      "Nền tảng đạo đức",
      "Hoạt động sáng tạo"
    ],
    targetAge: "2-6 tuổi",
    valueProposition: "Chuẩn bị nền tảng vững chắc cho việc học tập"
  },

  ELEMENTARY_PRO: {
    code: "ELEMENTARY_PRO",
    name: "Elementary PRO",
    nameVi: "Gói Tiểu Học PRO",
    description: "5 năm vàng - Xây dựng nền tảng vững chắc cho tương lai",
    grades: ["g1", "g2", "g3", "g4", "g5"],
    gradeRange: "G1-G5",
    subjects: ["PH", "RE", "AT", "SC", "HI", "WR", "BI"],
    videoCount: 7250,
    lessonCount: 850,
    monthlyPrice: 349_000,
    yearlyPrice: 2_990_000,
    displayOrder: 2,
    features: [
      "Phonics nâng cao",
      "Toán tư duy logic",
      "Khoa học cơ bản",
      "Lịch sử thế giới",
      "Đọc hiểu và viết luận"
    ],
    targetAge: "6-11 tuổi",
    valueProposition: "Nền tảng toàn diện cho cấp 2"
  },

  MIDDLE_SCHOOL_ADVANCED: {
    code: "MIDDLE_SCHOOL_ADVANCED",
    name: "Middle School Advanced",
    nameVi: "Gói Trung Học ADVANCED",
    description: "Chinh phục THCS - Từ học sinh giỏi đến xuất sắc",
    grades: ["g6", "g7", "g8", "g9"],
    gradeRange: "G6-G9",
    subjects: ["AT", "SC", "HI", "RE", "BI", "WR"],
    videoCount: 5800,
    lessonCount: 680,
    monthlyPrice: 349_000,  // Fixed: 399K → 349K (competitive with Tiểu Học)
    yearlyPrice: 3_190_000, // Adjusted yearly to match
    displayOrder: 3,
    features: [
      "Toán đại số và hình học",
      "Khoa học tự nhiên",
      "Lịch sử Mỹ",
      "Văn học Anh phân tích",
      "Tư duy phản biện"
    ],
    targetAge: "11-15 tuổi",
    valueProposition: "Chuẩn bị vững chắc cho cấp 3"
  },

  HIGH_SCHOOL_ELITE: {
    code: "HIGH_SCHOOL_ELITE",
    name: "High School Elite",
    nameVi: "Gói THPT ELITE",
    description: "Vào đại học top - Chuẩn bị vượt trội cho tương lai",
    grades: ["g10", "g11", "g12"],
    gradeRange: "G10-G12",
    subjects: ["AT", "SC", "HI", "RE", "BI", "WR"],
    videoCount: 4350,
    lessonCount: 510,
    monthlyPrice: 449_000,
    yearlyPrice: 3_990_000,
    displayOrder: 4,
    features: [
      "Calculus và Geometry nâng cao",
      "Chemistry và Physics chuyên sâu",
      "Chuẩn bị SAT/ĐH",
      "Văn học phân tích nâng cao",
      "Chính trị và Kinh tế"
    ],
    targetAge: "15-18 tuổi",
    valueProposition: "Vượt trội trong kỳ thi đại học"
  },

  ENGLISH_MASTER: {
    code: "ENGLISH_MASTER",
    name: "English Master",
    nameVi: "Gói Tiếng Anh MASTER",
    description: "Song ngữ từ nhỏ - Tiếng Anh như người bản xứ",
    grades: ["k4", "k5", "g1", "g2", "g3", "g4", "g5"],
    gradeRange: "K4-G5",
    subjects: ["PH", "RE", "WR"],
    videoCount: 1500,
    lessonCount: 1020,
    monthlyPrice: 249_000,
    yearlyPrice: 2_190_000,
    displayOrder: 5,
    features: [
      "Phonics từ cơ bản đến nâng cao",
      "Đọc hiểu và phát âm chuẩn Mỹ",
      "Viết luận cơ bản",
      "Từ ABC đến đọc thông viết thạo",
      "6 năm tiếng Anh liên tục"
    ],
    targetAge: "2-11 tuổi",
    valueProposition: "Tiếng Anh vượt trội từ nhỏ"
  },

  MATH_THINKING: {
    code: "MATH_THINKING",
    name: "Math Thinking",
    nameVi: "Gói Toán Tư Duy",
    description: "Tư duy Toán học - Con giỏi logic, không sợ đề",
    grades: ["k4", "k5", "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8"],
    gradeRange: "K4-G8",
    subjects: ["AT"],
    videoCount: 1200,
    lessonCount: 1190,
    monthlyPrice: 199_000,
    yearlyPrice: 1_790_000,
    displayOrder: 6,
    features: [
      "Số học từ cơ bản đến nâng cao",
      "Đại số và hình học",
      "Tư duy logic",
      "Giải bài toán thực tế",
      "9 năm toán liên tục"
    ],
    targetAge: "2-14 tuổi",
    valueProposition: "Nền tảng toán học vững chắc"
  },

  STEM_INNOVATOR: {
    code: "STEM_INNOVATOR",
    name: "STEM Innovator",
    nameVi: "Gói STEM INNOVATOR",
    description: "Nhà khoa học nhí - Khám phá thế giới tự nhiên",
    grades: ["g3", "g4", "g5", "g6", "g7", "g8"],
    gradeRange: "G3-G8",
    subjects: ["SC", "AT"],
    videoCount: 1500,
    lessonCount: 1020,
    monthlyPrice: 299_000,
    yearlyPrice: 2_690_000,
    displayOrder: 7,
    features: [
      "Khoa học từ cơ bản đến nâng cao",
      "Thí nghiệm ảo",
      "Tư duy khoa học",
      "Toán ứng dụng",
      "6 năm STEM liên tục"
    ],
    targetAge: "8-14 tuổi",
    valueProposition: "Nền tảng STEM cho tương lai"
  },

  ULTIMATE_FULL: {
    code: "ULTIMATE_FULL",
    name: "Ultimate Full Access",
    nameVi: "Gói Toàn Diện ULTIMATE",
    description: "Kho báu tri thức - Một lần đầu tư, trọn đời thụ hưởng",
    grades: ["k4", "k5", "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9", "g10", "g11", "g12"],
    gradeRange: "K4-G12",
    subjects: [], // All subjects
    videoCount: 20195,
    lessonCount: 2380,
    monthlyPrice: 699_000,
    yearlyPrice: 6_990_000,
    displayOrder: 8,
    features: [
      "Toàn bộ 20,195 video",
      "Tất cả 8 môn học",
      "14 cấp lớp từ K4 đến G12",
      "Đa người dùng trong gia đình",
      "Dashboard và báo cáo tiến độ"
    ],
    targetAge: "2-18 tuổi",
    valueProposition: "Giá trị tốt nhất cho gia đình"
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
  RE: { name: "Reading", nameVi: "Đọc hiểu" },
  AT: { name: "Arithmetic/Math", nameVi: "Toán" },
  SC: { name: "Science", nameVi: "Khoa học" },
  HI: { name: "History", nameVi: "Lịch sử" },
  BI: { name: "Bible", nameVi: "Kinh Thánh" },
  WR: { name: "Writing", nameVi: "Viết" },
  AC: { name: "Activities", nameVi: "Hoạt động" }
};
