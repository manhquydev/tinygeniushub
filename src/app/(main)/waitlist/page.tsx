import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistForm } from "./waitlist-form";
import { IconCalendar, IconStar } from "@/components/icons";
import "./waitlist.css";

export const metadata: Metadata = {
  title: "Priority List — TinyGenius Hub",
  description:
    "Register for the priority list to receive notifications of new openings and early incentives for families who register in advance.",
  alternates: { canonical: "https://www.tinygeniushubvn.tech/waitlist" },
  robots: { index: false, follow: false },
};

export default function WaitlistPage() {
  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Receive notification of new batch opening</h1>
        <p>
          We prioritize <strong>50 early registered families</strong> in each new opening to optimize the experience and support
          provide closer support.
        </p>
      </section>

      <section className="card">
        <h2>Sign up to receive notifications</h2>
        <WaitlistForm />
      </section>

      <section className="card-grid">
        <article className="card waitlist-info-card">
          <IconStar size={28} className="waitlist-card-icon" />
          <h2>Early registration benefits</h2>
          <p className="muted-text">Priority to receive incentives for each unlock period and quick support from the operations team.</p>
        </article>
        <article className="card waitlist-info-card">
          <IconCalendar size={28} className="waitlist-card-icon" />
          <h2>Time to receive information</h2>
          <p className="muted-text">You will receive an email as soon as there is a new opening, initialization schedule and accompanying incentives.</p>
        </article>
      </section>

      <section style={{ textAlign: "center", padding: "16px 0" }}>
        <p className="muted-text">
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "var(--color-accent)" }}>
            Login here
          </Link>
        </p>
      </section>
    </div>
  );
}
