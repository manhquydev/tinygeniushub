"use client";

import type { MouseEvent } from "react";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { id: "features", label: "Features" },
  { id: "pricing", label: "Study package" },
  { id: "faq", label: "FAQ" },
] as const;

type NavId = (typeof NAV_ITEMS)[number]["id"];

export function SectionNav() {
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState<NavId>(NAV_ITEMS[0].id);

  useEffect(() => {
    const update = () => {
      const hero = document.getElementById("home-hero");
      const heroBottom = hero?.getBoundingClientRect().bottom ?? 0;
      setVisible(heroBottom <= 140);

      const pivot = window.scrollY + 164;
      let next: NavId = NAV_ITEMS[0].id;

      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= pivot) next = item.id;
      }

      setActiveId(next);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>, id: NavId) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  };

  return (
    <nav
      className={`hp-section-nav${visible ? " is-visible" : ""}`}
      aria-label="Home page navigation"
    >
      <div className="hp-section-nav-inner">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={activeId === item.id ? "is-active" : undefined}
            onClick={(e) => handleClick(e, item.id)}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
