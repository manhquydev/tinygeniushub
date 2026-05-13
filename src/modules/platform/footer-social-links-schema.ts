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
  .url("Invalid URL.")
  .max(320, "The URL is too long.")
  .refine(isHttpUrl, "URL must start with http:// or https://");

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
