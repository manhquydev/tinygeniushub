import type { ReactNode } from "react";

export default function KidAppLayout({ children }: { children: ReactNode }) {
  return (
    <main className="kid-app-shell" aria-label={"Khu v\u1ef1c h\u1ecdc t\u1eadp cho b\u00e9"}>
      {children}
    </main>
  );
}

