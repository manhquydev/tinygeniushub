import type { ReactNode } from "react";

export default function KidAppLayout({ children }: { children: ReactNode }) {
  return (
    <main className="kid-app-shell" aria-label="Khu vuc hoc tap cho be">
      {children}
    </main>
  );
}

