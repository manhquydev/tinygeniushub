import type { Metadata } from "next";
import { GiftCodeForm } from "@/components/gift-code-form";

export const metadata: Metadata = {
  title: "Enter gift code — TinyGenius Hub",
  description: "Activate the gift code to access the TinyGenius Hub course or service package.",
};

export default function GiftCodePage() {
  return (
    <div className="page-stack">
      <section className="card" style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Enter the gift code</h1>
        <p className="muted-text">
          Received a code from a relative or a promotion? Enter the code below to activate immediately.
        </p>
        <GiftCodeForm />
      </section>
    </div>
  );
}
