import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Introduce",
  description:
    "The story of TinyGenius Hub's formation and why we built a child-centered learning platform for Vietnamese families.",
  alternates: { canonical: "https://www.tinygeniushubvn.tech/about" },
};

export default function AboutPage() {
  return (
    <div>
      <section className="about-hero">
        <h1>Our story</h1>
        <p className="about-lead">
          TinyGenius Hub was built by parents who understand the challenge of helping their children learn consistently every day
          at home.
        </p>
      </section>

      <section className="about-mission">
        <article className="mission-card">
          <h2>Mission</h2>
          <p>
            Help children form self-study habits early with clear roadmaps, fun lessons, and easy progress data
            follow for parents.
          </p>
        </article>
        <article className="mission-card">
          <h2>Vision</h2>
          <p>Become the most reliable home learning companion for Vietnamese families with children from 2-6 years old.</p>
        </article>
      </section>

      <section className="about-why">
        <h2>Why did we build this platform?</h2>
        <p>
          Parents often wonder whether their child is learning at the right pace, what comes next, and how to see progress
          real instead of just guessing?
        </p>
        <p>
          TinyGenius Hub was created to answer those questions with structured lessons, measurable progress indicators, and reports.
          clear weekly report.
        </p>
      </section>

      <section className="about-values">
        <h2>Core values</h2>
        <div className="values-grid">
          <article>
            <h3>Based on evidence</h3>
            <p>Activities are designed according to the developmental characteristics and memory abilities of each age.</p>
          </article>
          <article>
            <h3>Child-centered</h3>
            <p>Short lessons and guided progression help reduce pressure and keep your child motivated to learn.</p>
          </article>
          <article>
            <h3>Be transparent with parents</h3>
            <p>Parents can clearly see what their children have learned, where they are progressing and what they should do next.</p>
          </article>
        </div>
      </section>

      <section className="about-cta">
        <h2>Get started with TinyGenius Hub</h2>
        <p>Create a parent account and discover the course that best fits your child's goals.</p>
        <Link href="/courses">Explore the course</Link>
      </section>
    </div>
  );
}
