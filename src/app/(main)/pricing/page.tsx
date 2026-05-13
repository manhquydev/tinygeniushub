import "./pricing.css";
import type { Metadata } from "next";
import Link from "next/link";
import { IconCheckCircle, IconInfo } from "@/components/icons";

export const metadata: Metadata = {
  title: "Course price list",
  description:
    "Transparent price list for each course, view sample lessons before buying and 30-day refund policy.",
  alternates: {
    canonical: "https://www.tinygeniushubvn.tech/pricing",
  },
  openGraph: {
    title: "Course Price List — TinyGenius Hub",
    description: "Buy by course · Fast payment · 30-day money back",
    url: "https://www.tinygeniushubvn.tech/pricing",
    type: "website",
  },
};

const FAQ_ITEMS = [
  {
    q: "How to pay?",
    a: "You can pay by bank transfer or QR following the instructions on the payment page.",
  },
  {
    q: "When is the course active?",
    a: "The course is activated automatically as soon as the transaction is successfully confirmed.",
  },
  {
    q: "What is the refund policy?",
    a: "You can request a refund within the first 30 days if the course does not suit your needs.",
  },
  {
    q: "Can I try it out before I buy?",
    a: "Have. You can watch sample lessons first, then buy them when you're ready.",
  },
] as const;

const CONVERSION_POINTS = [
  {
    title: "Buy quickly, operate easily",
    description: "The payment process is short, suitable for busy parents.",
  },
  {
    title: "Choose the correct subkey you need",
    description: "Buy individual courses instead of committing to a large package from the start.",
  },
  {
    title: "Reduce decision risks",
    description: "There are sample lessons before purchasing and a 30-day refund policy.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Transparent price list for each course</h1>
        <p>
          Choose the course that suits your child's goals, pay quickly and start learning right after the transaction is confirmed
          received.
        </p>
        <div className="hero-actions">
          <Link href="/courses" className="solid-button">
            See key list
          </Link>
          <Link href="/courses" className="ghost-button">
            See sample lesson
          </Link>
        </div>
        <p className="pricing-hero-proof">Clear roadmap: preview → select key → automatic activation.</p>
      </section>

      <section className="card pricing-conversion">
        <h2>Why is it easy for parents to make decisions?</h2>
        <div className="pricing-conversion-grid">
          {CONVERSION_POINTS.map((point) => (
            <article key={point.title} className="pricing-conversion-item">
              <h3>{point.title}</h3>
              <p className="muted-text">{point.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card pricing-social-proof">
        <p className="muted-text pricing-trust-row">
          <span className="pricing-trust-item">
            <IconCheckCircle size={15} /> Fast checkout
          </span>
          <span className="pricing-trust-sep">·</span>
          <span className="pricing-trust-item">
            <IconCheckCircle size={15} /> 30-day refund
          </span>
          <span className="pricing-trust-sep">·</span>
          <span className="pricing-trust-item">
            <IconCheckCircle size={15} /> Automatic activation
          </span>
        </p>
      </section>

      <section className="card">
        <div style={{ display: "grid", gap: "0.4rem" }}>
          <h2>Courses are open</h2>
          <p className="muted-text">Prices and incentives are updated directly on each course detail page.</p>
          <p className="pricing-card__tip muted-text">
            <IconInfo size={14} className="pricing-tip-icon" />
            Listed prices and promotional prices may change according to each program period.
          </p>
        </div>
        <div style={{ marginTop: "0.8rem" }}>
          <Link href="/courses" className="solid-button" style={{ width: "fit-content" }}>
            Choose your course now
          </Link>
        </div>
      </section>

      <section className="card">
        <h2>Frequently asked questions</h2>
        <div className="faq-list">
          {FAQ_ITEMS.map((item, idx) => (
            <details key={idx} className="faq-item">
              <summary className="faq-question">{item.q}</summary>
              <p className="faq-answer">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="card pricing-final-cta">
        <h2>Ready to get started?</h2>
        <p className="muted-text">Look at the sample lessons first, then choose the right course so your child can study regularly and make clear progress.</p>
        <div className="pricing-final-cta__actions">
          <Link href="/courses" className="solid-button">
            View course
          </Link>
          <Link href="/blog" className="ghost-button">
            Read the parent handbook
          </Link>
        </div>
      </section>
    </div>
  );
}

