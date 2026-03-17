import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logWarn } from "@/lib/observability/logger";
import { DomainError } from "@/modules/platform/errors";
import {
  DEFAULT_FOOTER_SOCIAL_LINKS,
  footerSocialLinksSchema,
  parseFooterSocialLinks,
  type FooterSocialLinks,
} from "@/modules/platform/footer-social-links-schema";

const SITE_CONTENT_SETTINGS_ROW_ID = "default";

export async function getFooterSocialLinks(options?: { forceRefresh?: boolean }) {
  void options;
  if (env.NODE_ENV === "test") {
    return { ...DEFAULT_FOOTER_SOCIAL_LINKS };
  }

  try {
    const row = await prisma.siteContentSettings.findUnique({
      where: {
        id: SITE_CONTENT_SETTINGS_ROW_ID,
      },
      select: {
        footerSocialLinks: true,
      },
    });

    let resolvedLinks: FooterSocialLinks;
    if (!row?.footerSocialLinks) {
      resolvedLinks = { ...DEFAULT_FOOTER_SOCIAL_LINKS };
    } else {
      const parsed = footerSocialLinksSchema.safeParse(row.footerSocialLinks);
      if (!parsed.success) {
        logWarn("site_content_settings.footer_social_links_invalid_payload", {
          issues: parsed.error.issues,
        });
      }
      resolvedLinks = parsed.success ? parsed.data : { ...DEFAULT_FOOTER_SOCIAL_LINKS };
    }

    return resolvedLinks;
  } catch (error) {
    logWarn("site_content_settings.footer_social_links_read_failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return { ...DEFAULT_FOOTER_SOCIAL_LINKS };
  }
}

export async function updateFooterSocialLinks(params: {
  actorId: string;
  input: unknown;
}) {
  const payload = footerSocialLinksSchema.parse(params.input);

  try {
    const row = await prisma.siteContentSettings.upsert({
      where: {
        id: SITE_CONTENT_SETTINGS_ROW_ID,
      },
      update: {
        footerSocialLinks: payload,
        updatedByActorId: params.actorId,
      },
      create: {
        id: SITE_CONTENT_SETTINGS_ROW_ID,
        footerSocialLinks: payload,
        updatedByActorId: params.actorId,
      },
      select: {
        footerSocialLinks: true,
      },
    });

    return parseFooterSocialLinks(row.footerSocialLinks);
  } catch (error) {
    logWarn("site_content_settings.footer_social_links_write_failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    throw new DomainError(
      "Site content settings unavailable. Run latest database migrations.",
      503,
      "SITE_CONTENT_SETTINGS_UNAVAILABLE",
    );
  }
}
