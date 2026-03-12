import { headers } from "next/headers";
import type { ReactNode } from "react";

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

  return (
    <main
      className="kid-app-shell"
      aria-label={"Khu v\u1ef1c h\u1ecdc t\u1eadp cho b\u00e9"}
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
      {children}
    </main>
  );
}
