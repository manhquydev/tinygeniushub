export const defaultLocale = "en";
export const supportedLocales = ["en", "vi"] as const;
export const localeCookieName = "tgh_locale";

export type AppLocale = (typeof supportedLocales)[number];

export function isAppLocale(value: string | undefined): value is AppLocale {
  return supportedLocales.includes(value as AppLocale);
}

export function resolveAppLocale(value: string | undefined): AppLocale {
  return isAppLocale(value) ? value : defaultLocale;
}
