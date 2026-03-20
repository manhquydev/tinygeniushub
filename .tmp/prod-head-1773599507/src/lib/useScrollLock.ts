import { useEffect, useRef } from "react";

/**
 * useScrollLock - Custom hook for scroll-locked sections (Apple pattern)
 * 
 * Uses IntersectionObserver to detect when section reaches 50% visibility,
 * then smoothly scrolls to lock it at the top of viewport.
 * 
 * This creates the "progressive immersion" effect where users naturally
 * discover the interactive section through scroll, then engage with it
 * in fullscreen mode.
 * 
 * @returns sectionRef - Attach to section element
 */
export function useScrollLock<T extends HTMLElement = HTMLElement>() {
  const sectionRef = useRef<T>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          // Section is 50%+ visible - scroll to lock at top
          section.scrollIntoView({ 
            behavior: "smooth", 
            block: "start" 
          });
        }
      },
      { 
        threshold: 0.5, // Trigger at 50% visibility
        rootMargin: "0px"
      }
    );

    observer.observe(section);

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  return sectionRef;
}
