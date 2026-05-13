import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Mail, MapPin } from "lucide-react";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the TinyGenius Hub team for support or collaboration.",
  alternates: { canonical: "https://www.tinygeniushubvn.tech/contact" },
};

export default function ContactPage() {
  return (
    <div className="contact-page">
      <header className="contact-header">
        <h1>Contact us</h1>
        <p className="muted-text">We are always ready to support parents, schools and partners.</p>
      </header>

      <section className="contact-grid">
        <aside className="contact-info-card">
          <div className="contact-info-item">
            <Mail size={18} aria-hidden />
            <div>
              <strong>Support email</strong>
              <p>support@tinygeniushubvn.tech</p>
            </div>
          </div>

          <div className="contact-info-item">
            <Clock3 size={18} aria-hidden />
            <div>
              <strong>Response time</strong>
              <p>Within 24-48 working hours</p>
            </div>
          </div>

          <div className="contact-info-item">
            <MapPin size={18} aria-hidden />
            <div>
              <strong>Contact address</strong>
              <p>Vietnam (working remotely)</p>
            </div>
          </div>

          <p className="muted-text">
            Need quick answers? See frequently asked questions at{" "}
            <Link href="/#faq" className="hp-more-link">
              /#faq
            </Link>
            .
          </p>
        </aside>

        <ContactForm />
      </section>
    </div>
  );
}
