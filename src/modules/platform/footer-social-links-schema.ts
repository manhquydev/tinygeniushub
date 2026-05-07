import { z } from "zod";
import { DEFAULT_FOOTER_SOCIAL_LINKS, type FooterSocialLinks } from "@/modules/platform/footer-social-links";

export { DEFAULT_FOOTER_SOCIAL_LINKS };
export type { FooterSocialLinks };

function isHttpUrl(value: string) {
  return value.startsWith("https://") || value.startsWith("http://");
}

const footerSocialLinkFieldSchema = z
  .string()
  .trim()
  .url("URL không hợp lệ.")
  .max(320, "URL quá dài.")
  .refine(isHttpUrl, "URL phải bắt đầu bằng http:// hoặc https://");

export const footerSocialLinksSchema = z.object({
  facebook: footerSocialLinkFieldSchema,
  youtube: footerSocialLinkFieldSchema,
});

export function parseFooterSocialLinks(input: unknown): FooterSocialLinks {
  const parsed = footerSocialLinksSchema.safeParse(input);
  if (!parsed.success) {
    return { ...DEFAULT_FOOTER_SOCIAL_LINKS };
  }
  return parsed.data;
}
