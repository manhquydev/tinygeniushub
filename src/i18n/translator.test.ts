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

  it("translates specialPages.notFound.title to Vietnamese", () => {
    const enTitle = translate("specialPages.notFound.title", undefined, "en");
    const viTitle = translate("specialPages.notFound.title", undefined, "vi");
    expect(enTitle).toBe(getMessagesForLocale("en").specialPages.notFound.title);
    expect(viTitle).toBe(getMessagesForLocale("vi").specialPages.notFound.title);
    expect(viTitle).not.toBe(enTitle);
  });

  it("translates auth.form login copy by locale", () => {
    const vi = getMessagesForLocale("vi").auth.form;
    const en = getMessagesForLocale("en").auth.form;
    expect(translate("auth.form.login.title", undefined, "vi")).toBe(vi.login.title);
    expect(translate("auth.form.login.submit", undefined, "vi")).toBe(vi.login.submit);
    expect(translate("auth.form.fields.passwordLabel", undefined, "vi")).toBe(vi.fields.passwordLabel);
    expect(vi.login.title).not.toBe(en.login.title);
    expect(vi.login.submit).not.toBe(en.login.submit);
    expect(vi.fields.passwordLabel).not.toBe(en.fields.passwordLabel);
  });

  it("translates parent.dashboard.activity.heading by locale", () => {
    const enHeading = translate("parent.dashboard.activity.heading", undefined, "en");
    const viHeading = translate("parent.dashboard.activity.heading", undefined, "vi");
    expect(enHeading).toBe(getMessagesForLocale("en").parent.dashboard.activity.heading);
    expect(viHeading).toBe(getMessagesForLocale("vi").parent.dashboard.activity.heading);
    expect(viHeading).not.toBe(enHeading);
  });

  it("translates residual leftover labels by locale", () => {
    expect(translate("common.actions.done", undefined, "en")).toBe("Done");
    expect(translate("common.actions.done", undefined, "vi")).toBe(
      getMessagesForLocale("vi").common.actions.done,
    );
    expect(translate("kid.lesson.renderer.done", undefined, "vi")).not.toBe(
      translate("kid.lesson.renderer.done", undefined, "en"),
    );
    expect(translate("metadata.homeTitle", undefined, "vi")).not.toBe(
      translate("metadata.homeTitle", undefined, "en"),
    );
    expect(translate("admin.contentActivity.trueFalse.incorrect", undefined, "en")).toBe("Incorrect");
    expect(translate("admin.contentActivity.trueFalse.incorrect", undefined, "vi")).toBe(
      getMessagesForLocale("vi").admin.contentActivity.trueFalse.incorrect,
    );
  });

  it("translates curriculum daily-plan chrome by locale", () => {
    expect(translate("curriculum.dailyPlan.lessonNumber", { n: 3 }, "en")).toBe("Lesson 3");
    expect(translate("curriculum.dailyPlan.lessonNumber", { n: 3 }, "vi")).toBe("Bài 3");
    expect(translate("curriculum.subjects.ARITHMETIC", undefined, "vi")).not.toBe(
      translate("curriculum.subjects.ARITHMETIC", undefined, "en"),
    );
  });

  it("translates homepage JSON-LD FAQ by locale", () => {
    expect(translate("metadata.jsonLd.faq1q", undefined, "en")).toContain("ages");
    expect(translate("metadata.jsonLd.faq1q", undefined, "vi")).not.toBe(
      translate("metadata.jsonLd.faq1q", undefined, "en"),
    );
  });
});
