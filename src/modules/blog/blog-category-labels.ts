type BlogCategoryLabelInput = {
  slug: string;
  nameEn?: string | null;
  nameVi?: string | null;
};

const categoryNameBySlug: Record<string, string> = {
  "phat-trien-tre": "Child Development",
  "phuong-phap-hoc": "Learning Methods",
  "tieng-anh-som": "English for Children",
  "tieng-anh-cho-tre": "English for Children",
  "toan-tu-duy": "Mental Math",
  "dinh-huong-phu-huynh": "Parent Guidance",
  "cong-nghe-giao-duc": "Educational Technology",
  "suc-khoe-can-bang": "Health and Balance",
  "cau-chuyen-thanh-cong": "Success Stories",
};

export function getBlogCategoryDisplayName(category: BlogCategoryLabelInput): string {
  return category.nameEn?.trim() || categoryNameBySlug[category.slug] || titleizeSlug(category.slug);
}

function titleizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
