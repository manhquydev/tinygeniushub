import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/modules/platform/errors";
import { DEFAULT_FOOTER_SOCIAL_LINKS } from "@/modules/platform/footer-social-links";

const {
  siteContentSettingsFindUniqueMock,
  siteContentSettingsUpsertMock,
  logWarnMock,
} = vi.hoisted(() => ({
  siteContentSettingsFindUniqueMock: vi.fn(),
  siteContentSettingsUpsertMock: vi.fn(),
  logWarnMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    siteContentSettings: {
      findUnique: siteContentSettingsFindUniqueMock,
      upsert: siteContentSettingsUpsertMock,
    },
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "production",
  },
}));

vi.mock("@/lib/observability/logger", () => ({
  logWarn: logWarnMock,
}));

import {
  getFooterSocialLinks,
  updateFooterSocialLinks,
} from "@/modules/platform/site-content-settings-service";

describe("site-content-settings-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    siteContentSettingsFindUniqueMock.mockResolvedValue(null);
    siteContentSettingsUpsertMock.mockResolvedValue({
      footerSocialLinks: { ...DEFAULT_FOOTER_SOCIAL_LINKS },
    });
  });

  it("returns defaults when db row does not exist", async () => {
    const result = await getFooterSocialLinks({ forceRefresh: true });
    expect(result).toEqual(DEFAULT_FOOTER_SOCIAL_LINKS);
    expect(siteContentSettingsFindUniqueMock).toHaveBeenCalledTimes(1);
  });

  it("returns persisted footer social links when row exists", async () => {
    const customLinks = {
      facebook: "https://facebook.com/custom-page",
      youtube: "https://youtube.com/@custom-channel",
    };
    siteContentSettingsFindUniqueMock.mockResolvedValue({
      footerSocialLinks: customLinks,
    });

    const result = await getFooterSocialLinks({ forceRefresh: true });
    expect(result).toEqual(customLinks);
  });

  it("falls back to defaults and logs warning for invalid payload", async () => {
    siteContentSettingsFindUniqueMock.mockResolvedValue({
      footerSocialLinks: {
        facebook: "not-a-url",
      },
    });

    const result = await getFooterSocialLinks({ forceRefresh: true });

    expect(result).toEqual(DEFAULT_FOOTER_SOCIAL_LINKS);
    expect(logWarnMock).toHaveBeenCalledWith(
      "site_content_settings.footer_social_links_invalid_payload",
      expect.objectContaining({
        issues: expect.any(Array),
      }),
    );
  });

  it("persists and returns updated footer social links", async () => {
    const customLinks = {
      facebook: "https://facebook.com/next-page",
      youtube: "https://youtube.com/@next-channel",
    };
    siteContentSettingsUpsertMock.mockResolvedValue({
      footerSocialLinks: customLinks,
    });

    const result = await updateFooterSocialLinks({
      actorId: "admin-1",
      input: customLinks,
    });

    expect(result).toEqual(customLinks);
    expect(siteContentSettingsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "default" },
        update: expect.objectContaining({
          footerSocialLinks: customLinks,
          updatedByActorId: "admin-1",
        }),
      }),
    );
  });

  it("throws SITE_CONTENT_SETTINGS_UNAVAILABLE when write fails", async () => {
    siteContentSettingsUpsertMock.mockRejectedValueOnce(new Error("db write failed"));

    await expect(
      updateFooterSocialLinks({
        actorId: "admin-1",
        input: DEFAULT_FOOTER_SOCIAL_LINKS,
      }),
    ).rejects.toMatchObject({
      name: "DomainError",
      code: "SITE_CONTENT_SETTINGS_UNAVAILABLE",
      status: 503,
    } satisfies Partial<DomainError>);

    expect(logWarnMock).toHaveBeenCalledWith(
      "site_content_settings.footer_social_links_write_failed",
      expect.objectContaining({
        message: "db write failed",
      }),
    );
  });
});
