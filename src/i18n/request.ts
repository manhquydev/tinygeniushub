import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { getMessagesForLocale } from "./translator";
import { localeCookieName, resolveAppLocale } from "./locales";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = resolveAppLocale(cookieStore.get(localeCookieName)?.value);

  return {
    locale,
    messages: getMessagesForLocale(locale),
  };
});
