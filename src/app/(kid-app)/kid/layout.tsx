import { headers } from "next/headers";
import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { KidNavigationFeedbackProvider } from "@/components/kid-navigation-feedback";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";

/**
 * Kid App Layout
 *
 * Wraps all /kid/* routes. Garden routes (/kid/garden/*) get
 * `data-route="garden"` on the shell, which removes padding/overflow
 * so the 100dvh immersive scene can fill the screen completely.
 */
export default async function KidAppLayout({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-next-pathname") ?? "";
  const isGarden = pathname.startsWith("/kid/garden") || /^\/kid\/courses\/[^/]+/.test(pathname);
  const locale = resolveAppLocale(await getLocale());

  return (
    <main
      className="kid-app-shell"
      aria-label={translate("kid.layout.ariaLabel", undefined, locale)}
      data-route={isGarden ? "garden" : "default"}
      style={
        isGarden
          ? {
              position: "fixed",
              inset: 0,
              overflow: "hidden",
              padding: 0,
              margin: 0,
            }
          : undefined
      }
    >
      <KidNavigationFeedbackProvider>{children}</KidNavigationFeedbackProvider>
    </main>
  );
}
