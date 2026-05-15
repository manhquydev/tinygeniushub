"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, type ReactNode, useEffect } from "react";
import { useTranslations } from "next-intl";
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

type Stage = {
  id: string;
  label: string;
  left: ReactNode;
  right: ReactNode;
};

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
  const t = useTranslations("generated");

  const faqItems = [
    {
      q: t("what_ages_is_the_platform_suitable_for_85ac1175"),
      a: t("the_content_is_designed_for_children_2_6_7e5d03ef"),
    },
    {
      q: t("how_to_pay_e58e994e"),
      a: t("pay_by_bank_transfer_or_qr_according_to_5f2b9891"),
    },
    {
      q: t("how_do_parents_monitor_progress_0cfda4e7"),
      a: t("the_tracking_panel_displays_lessons_learned_level_of_c53ce15d"),
    },
  ] as const;

  const coursePromos = [
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

  const stages: Stage[] = [
    {
      id: "hero",
      label: t("depart_f1951709"),
      left: (
        <article className="usj-card usj-card-hero">
          <span className="usj-chip">{t("home_learning_roadmap_for_children_2_6_years_e5347a74")}</span>
          <h1>{t("the_learning_garden_is_on_both_sides_leaving_3effe7b9")}</h1>
          <p>
            {t("every_time_you_scroll_down_you_pass_through_4b6dd4d9")}
            {" "}
            {t("the_tree_is_always_clearly_in_the_center_f5a5791a")}
          </p>
          <div className="usj-actions">
            <Link href="/courses" className="usj-btn usj-btn-solid">
              {t("view_course_ea9d1512")}
            </Link>
            <Link href="/courses" className="usj-btn usj-btn-ghost">
              {t("see_price_list_ab5a04d8")}
            </Link>
          </div>
        </article>
      ),
      right: (
        <article className="usj-card">
          <h2>{t("difference_4b766bd4")}</h2>
          <ul className="usj-list">
            <li>
              <Sprout size={18} aria-hidden />
              {t("the_roadmap_from_easy_to_difficult_depends_on_cf52b55e")}
            </li>
            <li>
              <Cloud size={18} aria-hidden />
              {t("open_content_layers_according_to_actual_progress_01e30ab7")}
            </li>
            <li>
              <Trophy size={18} aria-hidden />
              {t("clear_weekly_reports_for_parents_356e8953")}
            </li>
          </ul>
        </article>
      ),
    },
    {
      id: "method",
      label: t("1st_floor_e4ab50bf"),
      left: (
        <article className="usj-card">
          <h2>{t("mental_math_english_phonics_d8e72468")}</h2>
          <p>{t("the_content_is_organized_into_short_stages_each_4a0732f2")}</p>
          <div className="usj-course-promos" aria-label={t("set_of_3_outstanding_courses_1da07767")}>
            {coursePromos.map((course) => (
              <figure key={course.id} className="usj-course-promo">
                <Image
                  src={course.src}
                  alt={`${t("course_advertisement_photo_fcc339d2")} ${course.title}`}
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
          <h2>{t("design_according_to_behavioral_learning_6f4f43c6")}</h2>
          <ul className="usj-list">
            <li>
              <Brain size={18} aria-hidden />
              {t("lessons_are_short_clearly_paced_7837c6e2")}
            </li>
            <li>
              <BookOpen size={18} aria-hidden />
              {t("study_online_and_have_offline_activities_1467fc9c")}
            </li>
            <li>
              <Sparkles size={18} aria-hidden />
              {t("keep_the_excitement_going_with_unlocking_mechanics_1bd8657d")}
            </li>
          </ul>
        </article>
      ),
    },
    {
      id: "proof",
      label: t("2nd_floor_8a9442d9"),
      left: (
        <article className="usj-card">
          <h2>{t("evidence_of_progress_b896c177")}</h2>
          <p>
            {t("not_just_scores_the_system_saves_quiz_results_a19c31bb")}
            {" "}
            {t("see_specific_changes_c8a41018")}
          </p>
        </article>
      ),
      right: (
        <article className="usj-card">
          <h2>{t("parents_always_know_the_situation_72cf11e6")}</h2>
          <ul className="usj-list">
            <li>
              <BarChart3 size={18} aria-hidden />
              {t("tracking_table_for_each_child_ab73ff62")}
            </li>
            <li>
              <CheckCircle2 size={18} aria-hidden />
              {t("weekly_reports_sent_automatically_a8933136")}
            </li>
            <li>
              <ShieldCheck size={18} aria-hidden />
              {t("safe_learning_environment_no_advertising_20127f94")}
            </li>
          </ul>
        </article>
      ),
    },
    {
      id: "pricing",
      label: t("3rd_floor_1e09fe72"),
      left: (
        <article className="usj-card usj-price">
          <span className="usj-chip usj-chip-soft">{t("buy_retail_by_key_58365bd0")}</span>
          <h2>{t("prices_are_displayed_for_each_course_2f16e303")}</h2>
          <p>{t("parents_choose_the_right_course_to_take_instead_a0a8f44d")}</p>
          <Link href="/courses" className="usj-btn usj-btn-ghost">
            {t("select_course_e46ea0f6")}
          </Link>
        </article>
      ),
      right: (
        <article className="usj-card usj-price usj-price-highlight">
          <span className="usj-chip">{t("course_offers_e8902db4")}</span>
          <h2>{t("there_is_a_list_price_and_a_selling_ddd4db1e")}</h2>
          <p>{t("prices_are_displayed_transparently_for_parents_to_quickly_8f7bf03f")}</p>
          <Link href="/courses" className="usj-btn usj-btn-solid">
            {t("buy_the_course_509c42d2")}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </article>
      ),
    },
    {
      id: "faq",
      label: t("tree_root_e40564ed"),
      left: (
        <article className="usj-card">
          <h2>{t("frequently_asked_questions_ef0eb919")}</h2>
          <div className="usj-faq-list">
            {faqItems.map((item) => (
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
          <h2>{t("ready_to_start_your_journey_c6e59769")}</h2>
          <p>{t("let_your_baby_learn_at_the_right_pace_0c20cafe")}</p>
          <Link href="/courses" className="usj-btn usj-btn-solid">
            {t("explore_the_course_7b8f3f23")}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </article>
      ),
    },
  ];

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
        {stages.map((stage, index) => (
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

      <section className="usj-destination" aria-label={t("end_point_of_the_journey_5ade3a54")}>
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
            alt={t("floating_island_at_the_end_of_the_bean_34139a38")}
            width={768}
            height={768}
            className="usj-island-image"
          />
        </div>

        <div className="usj-marketing-cta">
          <h3>{t("ready_for_your_baby_to_start_his_journey_e8713142")}</h3>
          <p>{t("view_sample_lessons_choose_the_right_course_and_9a2a2f82")}</p>
          <Link href="/courses" className="usj-btn usj-btn-solid">
            {t("view_the_course_now_b05d8e71")}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  );
}
