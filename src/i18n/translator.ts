import enMessages from "../../locales/en/translation.json";
import viMessages from "../../locales/vi/translation.json";
import { defaultLocale, type AppLocale } from "./locales";

export type TranslationValue = string | number | boolean | null | undefined;
export type TranslationValues = Record<string, TranslationValue>;

type MessageTree = string | { [key: string]: MessageTree };
type MessageCatalog = typeof enMessages;

const catalogs: Record<AppLocale, MessageTree> = {
  en: enMessages,
  vi: viMessages,
};

export function getMessagesForLocale(locale: AppLocale): MessageCatalog {
  return catalogs[locale] as MessageCatalog;
}

export function translate(
  key: string,
  values?: TranslationValues,
  locale: AppLocale = defaultLocale,
): string {
  const message = resolveMessage(catalogs[locale], key) ?? resolveMessage(catalogs[defaultLocale], key);
  if (!message) {
    return key;
  }
  return interpolateMessage(message, values);
}

function resolveMessage(catalog: MessageTree, key: string): string | undefined {
  let current: MessageTree | undefined = catalog;
  for (const segment of key.split(".")) {
    if (!current || typeof current === "string") {
      return undefined;
    }
    current = current[segment];
  }
  return typeof current === "string" ? current : undefined;
}

function interpolateMessage(message: string, values: TranslationValues = {}): string {
  return message.replace(/\{(\w+)\}/g, (match, token: string) => {
    const value = values[token];
    return value === undefined || value === null ? match : String(value);
  });
}
