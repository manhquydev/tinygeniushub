"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, type ReactNode, useEffect } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Cloud,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trophy,
} from "lucide-react";
import "./unified-scroll-journey.css";

const FAQ_ITEMS = [
  {
    q: "What ages is the platform suitable for?",
    a: "The content is designed for children 2-6 years old, divided according to development level so that children learn at the right pace.",
  },
  {
    q: "How to pay?",
    a: "Pay by bank transfer or QR according to the instructions on the payment page. No need to link tags.",
  },
  {
    q: "How do parents monitor progress?",
    a: "The tracking panel displays lessons learned, level of completion, and weekly reports sent automatically via email.",
  },
] as const;

type Stage = {
  id: string;
  label: string;
  left: ReactNode;
  right: ReactNode;
};

const COURSE_PROMOS = [
  {
    id: "littlefox-en",
    title: "Little Fox English",
    src: "/images/courses/course_cover_littlefox.png",
  },
  {
    id: "littlefox-cn",
    title: "Little Fox Chinese",
    src: "/images/courses/course_cover_littlefox_cn.png",
  },
  {
    id: "abeka-math",
    title: "Abeka Math Foundations",
    src: "/images/courses/course_cover_abeka.png",
  },
] as const;

const STAGES: Stage[] = [
  {
    id: "hero",
    label: "Depart",
    left: (
      <article className="usj-card usj-card-hero">
        <span className="usj-chip">Home learning roadmap for children 2-6 years old</span>
        <h1>The learning garden is on both sides, leaving the middle axis for climbing bean plants</h1>
        <p>
          Every time you scroll down, you pass through a new classroom level. Components located on both edges of the screen to hold the climbing path
          The tree is always clearly in the center.
        </p>
        <div className="usj-actions">
          <Link href="/courses" className="usj-btn usj-btn-solid">
            View course
          </Link>
          <Link href="/pricing" className="usj-btn usj-btn-ghost">
            See price list
          </Link>
        </div>
      </article>
    ),
    right: (
      <article className="usj-card">
        <h2>Difference</h2>
        <ul className="usj-list">
          <li>
            <Sprout size={18} aria-hidden />
            The roadmap from easy to difficult depends on each child
          </li>
          <li>
            <Cloud size={18} aria-hidden />
            Open content layers according to actual progress
          </li>
          <li>
            <Trophy size={18} aria-hidden />
            Clear weekly reports for parents
          </li>
        </ul>
      </article>
    ),
  },
  {
    id: "method",
    label: "1st floor",
    left: (
      <article className="usj-card">
        <h2>Mental Math + English Phonics</h2>
        <p>
          The content is organized into short stages, each lasting 15 minutes. Children learn regularly every day instead of being overloaded.
        </p>
        <div className="usj-course-promos" aria-label="Set of 3 outstanding courses">
          {COURSE_PROMOS.map((course) => (
            <figure key={course.id} className="usj-course-promo">
              <Image
                src={course.src}
                alt={`Course advertisement photo${course.title}`}
                width={1376}
                height={768}
                className="usj-course-promo-image"
              />
              <figcaption>{course.title}</figcaption>
            </figure>
          ))}
        </div>
      </article>
    ),
    right: (
      <article className="usj-card">
        <h2>Design according to behavioral learning</h2>
        <ul className="usj-list">
          <li>
            <Brain size={18} aria-hidden />
            Lessons are short, clearly paced
          </li>
          <li>
            <BookOpen size={18} aria-hidden />
            Study online and have offline activities
          </li>
          <li>
            <Sparkles size={18} aria-hidden />
            Keep the excitement going with unlocking mechanics
          </li>
        </ul>
      </article>
    ),
  },
  {
    id: "proof",
    label: "2nd floor",
    left: (
      <article className="usj-card">
        <h2>Evidence of progress</h2>
        <p>
          Not just scores. The system saves quiz results, school logs, and evidence of weekly activities for parents
          see specific changes.
        </p>
      </article>
    ),
    right: (
      <article className="usj-card">
        <h2>Parents always know the situation</h2>
        <ul className="usj-list">
          <li>
            <BarChart3 size={18} aria-hidden />
            Tracking table for each child
          </li>
          <li>
            <CheckCircle2 size={18} aria-hidden />
            Weekly reports sent automatically
          </li>
          <li>
            <ShieldCheck size={18} aria-hidden />
            Safe learning environment, no advertising
          </li>
        </ul>
      </article>
    ),
  },
  {
    id: "pricing",
    label: "3rd floor",
    left: (
      <article className="usj-card usj-price">
        <span className="usj-chip usj-chip-soft">Buy retail by key</span>
        <h2>Prices are displayed for each course</h2>
        <p>Parents choose the right course to take instead of having to register for a trial package.</p>
        <Link href="/courses" className="usj-btn usj-btn-ghost">
          Select course
        </Link>
      </article>
    ),
    right: (
      <article className="usj-card usj-price usj-price-highlight">
        <span className="usj-chip">Course offers</span>
        <h2>There is a list price and a selling price</h2>
        <p>Prices are displayed transparently for parents to quickly compare and choose the right course.</p>
        <Link href="/courses" className="usj-btn usj-btn-solid">
          Buy the course
          <ArrowRight size={16} aria-hidden />
        </Link>
      </article>
    ),
  },
  {
    id: "faq",
    label: "Tree Root",
    left: (
      <article className="usj-card">
        <h2>Frequently asked questions</h2>
        <div className="usj-faq-list">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="usj-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </article>
    ),
    right: (
      <article className="usj-card usj-card-cta">
        <h2>Ready to start your journey?</h2>
        <p>Let your baby learn at the right pace every day, so parents can monitor real progress.</p>
        <Link href="/courses" className="usj-btn usj-btn-solid">
          Explore the course
          <ArrowRight size={16} aria-hidden />
        </Link>
      </article>
    ),
  },
];

const STARS = [
  { top: "4%", left: "8%", size: 2, duration: 3.6, delay: -1.1 },
  { top: "7%", left: "18%", size: 3, duration: 4.1, delay: -0.6 },
  { top: "5%", left: "31%", size: 2, duration: 3.2, delay: -2.2 },
  { top: "9%", left: "46%", size: 2, duration: 4.4, delay: -1.7 },
  { top: "6%", left: "59%", size: 3, duration: 3.8, delay: -0.4 },
  { top: "10%", left: "71%", size: 2, duration: 4.6, delay: -2.5 },
  { top: "8%", left: "84%", size: 3, duration: 3.5, delay: -1.2 },
  { top: "13%", left: "13%", size: 2, duration: 4.7, delay: -3.1 },
  { top: "15%", left: "24%", size: 2, duration: 3.9, delay: -1.4 },
  { top: "18%", left: "37%", size: 3, duration: 4.2, delay: -0.9 },
  { top: "16%", left: "52%", size: 2, duration: 3.3, delay: -2.6 },
  { top: "14%", left: "66%", size: 2, duration: 4.8, delay: -0.8 },
  { top: "17%", left: "79%", size: 3, duration: 3.7, delay: -2.1 },
  { top: "22%", left: "7%", size: 2, duration: 4.3, delay: -1.5 },
  { top: "24%", left: "20%", size: 2, duration: 3.1, delay: -0.2 },
  { top: "26%", left: "34%", size: 3, duration: 4.9, delay: -3.3 },
  { top: "27%", left: "48%", size: 2, duration: 3.8, delay: -1.9 },
  { top: "23%", left: "62%", size: 2, duration: 4.6, delay: -0.5 },
  { top: "25%", left: "75%", size: 3, duration: 3.4, delay: -2.8 },
  { top: "28%", left: "88%", size: 2, duration: 4.5, delay: -1.6 },
  { top: "34%", left: "12%", size: 2, duration: 4.2, delay: -2.4 },
  { top: "36%", left: "30%", size: 3, duration: 3.6, delay: -0.7 },
  { top: "33%", left: "54%", size: 2, duration: 4.1, delay: -1.3 },
  { top: "37%", left: "78%", size: 2, duration: 3.9, delay: -2.7 },
] as const;

export function UnifiedScrollJourney() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.homeTheme = "1";

    const computeTone = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(window.scrollY / maxScroll, 1);

      let tone = "dark";
      if (progress >= 0.72) {
        tone = "light";
      } else if (progress >= 0.38) {
        tone = "mid";
      }

      root.dataset.homeNavTone = tone;
    };

    let rafId = 0;
    const scheduleToneUpdate = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        computeTone();
      });
    };

    computeTone();
    window.addEventListener("scroll", scheduleToneUpdate, { passive: true });
    window.addEventListener("resize", scheduleToneUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleToneUpdate);
      window.removeEventListener("resize", scheduleToneUpdate);
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
      delete root.dataset.homeTheme;
      delete root.dataset.homeNavTone;
    };
  }, []);

  return (
    <main className="usj-page">
      <div className="usj-starfield" aria-hidden>
        {STARS.map((star) => (
          <span
            key={`${star.top}-${star.left}`}
            className="usj-star"
            style={
              {
                top: star.top,
                left: star.left,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="usj-sky-glow usj-sky-glow-a" aria-hidden />
      <div className="usj-sky-glow usj-sky-glow-b" aria-hidden />
      <div className="usj-climb-track" aria-hidden />

      <ol className="usj-stage-list">
        {STAGES.map((stage, index) => (
          <li key={stage.id} className="usj-stage-row">
            <div className="usj-side">{stage.left}</div>

            <div className="usj-center">
              <div className="usj-node">
                <span>{index + 1}</span>
              </div>
              <div className="usj-node-label">{stage.label}</div>
            </div>

            <div className="usj-side">{stage.right}</div>
          </li>
        ))}
      </ol>

      <section className="usj-destination" aria-label="End point of the journey">
        <div className="usj-cloud-platform" aria-hidden>
          <Image
            src="/assets/garden/cloud_platform.png"
            alt=""
            width={768}
            height={768}
            className="usj-cloud-platform-image"
          />
        </div>

        <div className="usj-island-wrap">
          <Image
            src="/assets/garden/ground.png"
            alt="Floating island at the end of the bean stem"
            width={768}
            height={768}
            className="usj-island-image"
          />
        </div>

        <div className="usj-marketing-cta">
          <h3>Ready for your baby to start his journey?</h3>
          <p>View sample lessons, choose the right course, and complete payment in just a few steps.</p>
          <Link href="/courses" className="usj-btn usj-btn-solid">
            View the course now
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  );
}
