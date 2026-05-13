import "./for-schools.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Learning solutions for preschools — TinyGenius Hub",
  description:
    "Mental Math + English Phonics platform for preschools: teacher dashboard, parent reports, and quick student list import.",
  alternates: { canonical: "https://www.tinygeniushubvn.tech/for-schools" },
  openGraph: {
    title: "Learning solutions for preschools — TinyGenius Hub",
    description: "Teacher Dashboard · Parent Report · Quick Initialization",
    url: "https://www.tinygeniushubvn.tech/for-schools",
    type: "website",
  },
};

const BENEFITS = [
  {
    icon: "📱",
    title: "No specialized equipment required",
    desc: "Students can study on popular phones or tablets, without needing to install complicated applications.",
  },
  {
    icon: "📊",
    title: "Automatic reporting",
    desc: "Parents receive weekly reports, teachers track activities by class right on the system.",
  },
  {
    icon: "⚡",
    title: "Fast deployment",
    desc: "Create in a short time and import student list according to CSV file.",
  },
];

const PLANS = [
  {
    name: "Experience package",
    price: "Contact",
    desc: "Tested for a class with initial implementation support.",
    highlight: false,
  },
  {
    name: "Standard package",
    price: "Contact",
    desc: "Suitable for schools with less than 200 students, with initial initiation support.",
    highlight: true,
  },
  {
    name: "Expansion pack",
    price: "Contact",
    desc: "Suitable for large schools, with advanced reporting and service commitment.",
    highlight: false,
  },
];

export default function ForSchoolsPage() {
  return (
    <div className="page-stack">
      <section className="schools-hero">
        <div className="schools-hero-inner">
          <div className="schools-hero-badge">For preschool</div>
          <h1 className="schools-hero-title">
            Digital learning platform for preschool operations —<br />
            <span className="schools-hero-accent">quick deployment, easy to apply</span>
          </h1>
          <p className="schools-hero-sub">
            Mental Math + English Phonics, teacher dashboard and weekly parent reports.
          </p>
          <Link href="/contact?subject=H%E1%BB%A3p+t%C3%A1c+%2F+B2B" className="solid-button schools-hero-cta">
            Schedule a demo
          </Link>
        </div>
      </section>

      <section className="container">
        <h2 className="schools-section-title">Benefits for the school</h2>
        <div className="card-grid">
          {BENEFITS.map((b) => (
            <article key={b.title} className="card schools-benefit-card">
              <span className="schools-benefit-icon" aria-hidden="true">
                {b.icon}
              </span>
              <h3 className="schools-benefit-title">{b.title}</h3>
              <p className="schools-benefit-desc">{b.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container">
        <h2 className="schools-section-title">Deployment package</h2>
        <div className="card-grid">
          {PLANS.map((p) => (
            <article key={p.name} className={`card schools-plan-card ${p.highlight ? "schools-plan-highlight" : ""}`}>
              <div className="schools-plan-name">{p.name}</div>
              <div className="schools-plan-price">{p.price}</div>
              <p className="schools-plan-desc">{p.desc}</p>
              <Link href="/contact?subject=H%E1%BB%A3p+t%C3%A1c+%2F+B2B" className="ghost-button schools-plan-cta">
                Contact for consultation
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="schools-demo-cta container">
        <div className="page-card schools-demo-inner">
          <h2>See the product through an online demo</h2>
          <p>Our team will accompany the school from setting up and operating the class to communicating with parents.</p>
          <Link href="/contact?subject=H%E1%BB%A3p+t%C3%A1c+%2F+B2B" className="solid-button">
            Sign up for a demo
          </Link>
        </div>
      </section>
    </div>
  );
}
