"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Headset, Info, MessageCircle, Phone, PhoneCall } from "lucide-react";
import { Mascot } from "@/components/mascot";
import type { MascotActionProp, MascotState } from "@/components/mascot";

const TOOLTIP_MESSAGE = "Ba mẹ cần hỗ trợ ạ?";
const HOTLINE_LABEL = "Hotline: 1900 xxxx";
const HUB_FRAME_SIZE = 92;
const IDLE_MASCOT_SIZE = 100;
const ACTIVE_MASCOT_SIZE = 104;
const IDLE_MASCOT_ZOOM = 2.28;
const ACTIVE_MASCOT_ZOOM = 2.42;
const MENU_ITEM_SPRING = { type: "spring" as const, stiffness: 320, damping: 24 };
const SIGNAL_RING_COUNT = 2;

interface SupportPersona {
  state: MascotState;
  actionProp: MascotActionProp;
  message: string;
  label: string;
}

const SUPPORT_PERSONAS: SupportPersona[] = [
  {
    state: "thinking",
    actionProp: "music",
    message: "Cú con đang lắng nghe câu hỏi của ba mẹ.",
    label: "Listening Mode",
  },
  {
    state: "love",
    actionProp: "heart",
    message: "Ba mẹ cần hỗ trợ ạ?",
    label: "Care Mode",
  },
  {
    state: "proud",
    actionProp: "reading",
    message: "Cú con có sẵn hướng dẫn chi tiết cho ba mẹ.",
    label: "Guide Mode",
  },
  {
    state: "happy",
    actionProp: "space",
    message: "Kết nối nhanh qua hotline hoặc Zalo ngay nhé!",
    label: "Connect Mode",
  },
];

export function MascotSupportHub() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [personaIndex, setPersonaIndex] = useState(0);
  const [pressFxPulse, setPressFxPulse] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const hubRef = useRef<HTMLDivElement | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isKidRoute = pathname?.startsWith("/kid");
  const isHomepage = pathname === "/";
  const mascotRenderSize = open ? ACTIVE_MASCOT_SIZE : IDLE_MASCOT_SIZE;
  const mascotZoom = open ? ACTIVE_MASCOT_ZOOM : IDLE_MASCOT_ZOOM;
  const activePersona = SUPPORT_PERSONAS[personaIndex % SUPPORT_PERSONAS.length] ?? SUPPORT_PERSONAS[0];
  const tooltipMessage = activePersona?.message ?? TOOLTIP_MESSAGE;
  const shouldRunPressAnimation = pressFxPulse > 0;

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isHomepage || isKidRoute || open) {
      return;
    }

    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const popTooltip = () => {
      setShowTooltip(true);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setShowTooltip(false), 2800);
    };

    const startTimer = setTimeout(popTooltip, 10000);
    const interval = setInterval(popTooltip, 10000);

    return () => {
      clearTimeout(startTimer);
      clearInterval(interval);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [isHomepage, isKidRoute, open]);

  useEffect(() => {
    if (!isHomepage || isKidRoute || open || prefersReducedMotion) return;

    const personaTimer = setInterval(() => {
      setPersonaIndex((current) => (current + 1) % SUPPORT_PERSONAS.length);
    }, 5200);

    return () => clearInterval(personaTimer);
  }, [isHomepage, isKidRoute, open, prefersReducedMotion]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const targetNode = event.target as Node | null;
      if (!hubRef.current || !targetNode) return;
      if (!hubRef.current.contains(targetNode)) setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!isHomepage || isKidRoute || typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const footerElement = document.querySelector(".site-footer");
    if (!footerElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setIsFooterVisible(entry.isIntersecting);
      },
      { threshold: [0, 0.1, 0.35] },
    );

    observer.observe(footerElement);
    return () => observer.disconnect();
  }, [isHomepage, isKidRoute]);

  if (!isHomepage || isKidRoute) {
    return null;
  }

  function handleHubPress() {
    setShowTooltip(false);
    setPressFxPulse((current) => current + 1);
    setIsPressing(false);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => setIsPressing(true));
    } else {
      setIsPressing(true);
    }
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => setIsPressing(false), 430);
    setOpen((current) => !current);
  }

  return (
    <LayoutGroup id="mascot-support-hub">
      <div
        ref={hubRef}
        data-support-hub-version="press-ring-v4"
        className={`pointer-events-none fixed right-4 z-[130] sm:right-6 ${isFooterVisible ? "bottom-24 sm:bottom-28" : "bottom-4 sm:bottom-6"}`}
      >
        <div className="flex flex-col items-end gap-3">
          <AnimatePresence>
            {showTooltip && !open ? (
              <m.div
                initial={{ opacity: 0, y: 12, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.94 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="pointer-events-none rounded-2xl border px-4 py-2 text-sm font-semibold text-slate-800 shadow-[0_12px_34px_rgba(15,23,42,0.18)] backdrop-blur-xl"
                style={{
                  borderColor: "color-mix(in srgb, var(--brand-500) 36%, transparent)",
                  background:
                    "linear-gradient(140deg, color-mix(in srgb, var(--popover, #ffffff) 92%, transparent), color-mix(in srgb, var(--brand-500) 10%, var(--popover, #ffffff)))",
                }}
              >
                {tooltipMessage}
              </m.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {open ? (
              <m.div
                layout
                initial={{ opacity: 0, y: 16, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                className="pointer-events-auto w-[min(92vw,328px)] rounded-[1.35rem] border p-4 shadow-[0_28px_56px_rgba(15,23,42,0.24)] backdrop-blur-2xl"
                style={{
                  borderColor: "color-mix(in srgb, var(--brand-500) 38%, transparent)",
                  background:
                    "linear-gradient(155deg, color-mix(in srgb, var(--popover, #ffffff) 86%, transparent), color-mix(in srgb, var(--brand-500) 11%, var(--popover, #ffffff)))",
                }}
              >
                <div className="mb-3 grid gap-1 text-slate-900">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700/90">Mascot Support Hub</p>
                  <p className="text-sm font-semibold leading-relaxed">Chào ba mẹ, Cú con có thể giúp gì được ạ?</p>
                </div>

                <m.div
                  className="grid gap-2.5"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0.96 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.07, delayChildren: 0.04 },
                    },
                  }}
                >
                  <m.a
                    href="https://zalo.me"
                    target="_blank"
                    rel="noreferrer"
                    variants={{
                      hidden: { opacity: 0, y: 8, scale: 0.97 },
                      visible: { opacity: 1, y: 0, scale: 1 },
                    }}
                    transition={MENU_ITEM_SPRING}
                    className="group inline-flex min-h-11 items-center gap-3 rounded-full border px-3.5 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(16,185,129,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    style={{
                      borderColor: "color-mix(in srgb, var(--brand-500) 28%, transparent)",
                      background:
                        "linear-gradient(145deg, color-mix(in srgb, #ffffff 82%, transparent), color-mix(in srgb, var(--brand-500) 12%, #ffffff))",
                    }}
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-sky-500 text-xs font-black text-white shadow-[0_8px_16px_rgba(14,165,233,0.32)]">
                      Z
                    </span>
                    <span className="flex-1 text-left">Chat qua Zalo</span>
                    <MessageCircle className="h-4 w-4 text-sky-600 transition group-hover:scale-110" />
                  </m.a>

                  <m.a
                    href="tel:1900xxxx"
                    variants={{
                      hidden: { opacity: 0, y: 8, scale: 0.97 },
                      visible: { opacity: 1, y: 0, scale: 1 },
                    }}
                    transition={MENU_ITEM_SPRING}
                    className="group inline-flex min-h-11 items-center gap-3 rounded-full border px-3.5 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(16,185,129,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    style={{
                      borderColor: "color-mix(in srgb, var(--brand-500) 28%, transparent)",
                      background:
                        "linear-gradient(145deg, color-mix(in srgb, #ffffff 82%, transparent), color-mix(in srgb, var(--brand-500) 12%, #ffffff))",
                    }}
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_8px_16px_rgba(16,185,129,0.3)]">
                      <Phone className="h-4 w-4" />
                    </span>
                    <span className="text-left">{HOTLINE_LABEL}</span>
                  </m.a>

                  <m.div
                    variants={{
                      hidden: { opacity: 0, y: 8, scale: 0.97 },
                      visible: { opacity: 1, y: 0, scale: 1 },
                    }}
                    transition={MENU_ITEM_SPRING}
                  >
                    <Link
                    href="/#faq"
                    className="group inline-flex min-h-11 items-center gap-3 rounded-full border px-3.5 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(16,185,129,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    style={{
                      borderColor: "color-mix(in srgb, var(--brand-500) 28%, transparent)",
                      background:
                        "linear-gradient(145deg, color-mix(in srgb, #ffffff 82%, transparent), color-mix(in srgb, var(--brand-500) 12%, #ffffff))",
                    }}
                    onClick={() => setOpen(false)}
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-500 text-white shadow-[0_8px_16px_rgba(139,92,246,0.32)]">
                      <Info className="h-4 w-4" />
                    </span>
                    <span className="text-left">Hướng dẫn sử dụng</span>
                    </Link>
                  </m.div>
                </m.div>

                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/70 px-3 py-1.5 text-[0.72rem] font-semibold text-emerald-700">
                  <Headset className="h-3.5 w-3.5" />
                  Đội ngũ CS luôn sẵn sàng hỗ trợ • {activePersona?.label}
                </div>
              </m.div>
            ) : null}
          </AnimatePresence>

          <m.button
            layout
            type="button"
            aria-expanded={open}
            aria-label="Mở kênh liên lạc hỗ trợ"
            onClick={handleHubPress}
            className="pointer-events-auto relative grid place-items-center overflow-hidden rounded-[1.5rem] border shadow-[0_16px_30px_rgba(15,23,42,0.46)]"
            style={{
              width: HUB_FRAME_SIZE,
              height: HUB_FRAME_SIZE,
              borderColor: "color-mix(in srgb, #7dd3fc 45%, transparent)",
              background:
                "linear-gradient(155deg, color-mix(in srgb, #0f172a 90%, transparent), color-mix(in srgb, #1e293b 82%, transparent))",
            }}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            animate={
              !isPressing || !shouldRunPressAnimation
                ? { scale: 1, rotate: 0 }
                : { scale: [1, 0.9, 1.06, 1], rotate: [0, -2.2, 1.2, 0] }
            }
            transition={
              !isPressing || !shouldRunPressAnimation
                ? { duration: 0.2 }
                : { duration: 0.42, ease: "easeOut" }
            }
          >
            <AnimatePresence mode="wait">
              {!prefersReducedMotion && isPressing ? (
                <m.span
                  key={`press-fx-${pressFxPulse}`}
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[1.5rem] border border-cyan-200/90"
                  initial={{ opacity: 0.62, scale: 0.78 }}
                  animate={{ opacity: 0, scale: 1.32 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.42, ease: "easeOut" }}
                />
              ) : null}
            </AnimatePresence>
            {!prefersReducedMotion
              ? Array.from({ length: SIGNAL_RING_COUNT }).map((_, index) => (
                  <m.span
                    key={`signal-ring-${index + 1}`}
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[1.5rem] border border-emerald-300/55"
                    animate={{ scale: [1, 1.12 + index * 0.06], opacity: [0.4, 0] }}
                    transition={{ duration: 1.9 + index * 0.32, repeat: Infinity, ease: "easeOut", delay: index * 0.18 }}
                  />
                ))
              : null}
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1]" style={{ transform: "translate(-50%, -50%)" }}>
              <m.div
                animate={
                  prefersReducedMotion
                    ? { y: 0, rotate: 0 }
                    : {
                        y: [0, -6, 0],
                        rotate: [0, -1.1, 0.7, 0],
                      }
                }
                transition={
                  prefersReducedMotion
                    ? { type: "spring", stiffness: 340, damping: 28 }
                    : { repeat: Infinity, duration: open ? 1.25 : 1.85, ease: "easeInOut" }
                }
                style={{ transformOrigin: "center center", display: "grid", placeItems: "center" }}
              >
                <Mascot
                  variant="small"
                  state={open ? "celebrating" : activePersona.state}
                  actionProp={open ? "heart" : "none"}
                  motionLevel="full"
                  pauseWhenOffscreen
                  showBaseGlow={false}
                  title="Cú liên lạc hỗ trợ"
                  size={mascotRenderSize}
                  zoom={mascotZoom}
                />
              </m.div>
            </div>

            <m.span
              aria-hidden
              className="pointer-events-none absolute -right-1 -top-1 grid h-8 w-8 place-items-center rounded-full border border-white/85 bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_10px_18px_rgba(16,185,129,0.36)]"
              animate={
                prefersReducedMotion
                  ? {
                      scale: [1, 1.01, 1],
                      rotate: [0, -2, 1.8, 0],
                      y: [0, -0.2, 0],
                    }
                  : {
                      scale: [1, 1.03, 1],
                      rotate: [0, -5, 4, -3, 2, 0],
                      x: [0, -0.4, 0.4, -0.2, 0],
                      y: [0, -0.8, 0],
                    }
              }
              transition={
                prefersReducedMotion
                  ? {
                      duration: 1.05,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 2.25,
                    }
                  : {
                      duration: 0.92,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 1.75,
                    }
              }
            >
              <m.span
                animate={
                  prefersReducedMotion
                    ? {
                        rotate: [0, -4, 3, 0],
                        scale: [1, 1.02, 1],
                      }
                    : {
                        rotate: [0, -11, 8, -6, 3, 0],
                        scale: [1, 1.08, 1],
                      }
                }
                transition={
                  prefersReducedMotion
                    ? { duration: 1.05, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.25 }
                    : { duration: 0.92, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.75 }
                }
              >
                <PhoneCall className="h-4 w-4" />
              </m.span>
            </m.span>
          </m.button>
        </div>
      </div>
    </LayoutGroup>
  );
}
