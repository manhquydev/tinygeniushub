import { describe, expect, it } from "vitest";
import { defaultLocale, resolveAppLocale, supportedLocales } from "@/i18n/locales";
import { getMessagesForLocale, translate } from "@/i18n/translator";

describe("i18n translator", () => {
  it("keeps English as the primary locale and Vietnamese as the secondary locale", () => {
    expect(defaultLocale).toBe("en");
    expect(supportedLocales).toEqual(["en", "vi"]);
    expect(resolveAppLocale(undefined)).toBe("en");
    expect(resolveAppLocale("fr")).toBe("en");
    expect(resolveAppLocale("vi")).toBe("vi");
  });

  it("loads matching message catalogs for both supported locales", () => {
    expect(getMessagesForLocale("en").language.english).toBe("English");
    expect(getMessagesForLocale("vi").language.vietnamese).not.toBe("Vietnamese");
  });

  it("translates navigation copy by locale and falls back to English keys", () => {
    expect(translate("navigation.guest.courses", undefined, "en")).toBe(
      getMessagesForLocale("en").navigation.guest.courses,
    );
    expect(translate("navigation.guest.courses", undefined, "vi")).toBe(
      getMessagesForLocale("vi").navigation.guest.courses,
    );
    expect(translate("navigation.guest.courses", undefined, "vi")).not.toBe(
      getMessagesForLocale("en").navigation.guest.courses,
    );
    expect(translate("common.actions.save", undefined, "fr" as never)).toBe("Save");
    expect(translate("missing.key", undefined, "vi")).toBe("missing.key");
  });

  it("interpolates values in translated messages", () => {
    expect(translate("generated.see_details_at_1e48b574", {}, "en")).toContain("See details at");
  });
});
