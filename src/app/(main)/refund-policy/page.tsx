import type { Metadata } from "next";
import { LEGAL_POLICY_LAST_UPDATED_LABEL } from "@/lib/legal/legal-policy-version";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "Refund policy for course purchases at TinyGenius Hub.",
  alternates: { canonical: "https://www.tinygeniushubvn.tech/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <article className="prose-page">
      <h1>Refund policy</h1>
      <p>
        We apply a transparent refund policy to protect parents' rights during the process of using the service
        learning service.
      </p>

      <h2>1. Scope of application</h2>
      <ul>
        <li>Applies to online course/package purchases on the platform.</li>
        <li>Refund refusal cases only apply to the extent permitted by law.</li>
      </ul>

      <h2>2. Refund conditions</h2>
      <ul>
        <li>Requests are submitted within 30 days of the first successful payment.</li>
        <li>Request sent from account registered email or verified support channel.</li>
        <li>The requested information must be complete to authenticate the transaction.</li>
      </ul>

      <h2>3. Required documents</h2>
      <ul>
        <li>Registered account email.</li>
        <li>Transaction code/payment receipt (if any).</li>
        <li>Reason for requesting refund.</li>
      </ul>

      <h2>4. Reception channel</h2>
      <ul>
        <li>Email: billing@tinygeniushubvn.tech</li>
        <li>Suggested title: “Request a refund - [Account email]”.</li>
      </ul>

      <h2>5. Processing time</h2>
      <ul>
        <li>We will respond to the reception status as soon as possible.</li>
        <li>Expected processing time is 5-10 working days from receipt of complete valid documents, depending on the payment partner.</li>
      </ul>

      <h2>6. Note</h2>
      <ul>
        <li>This policy does not limit consumers' mandatory rights under the law.</li>
        <li>Refunds may be affected by the payment gateway or card issuing bank's policies.</li>
        <li>We reserve the right to request additional information to prevent transaction fraud.</li>
      </ul>

      <h2>7. Legal basis of reference</h2>
      <ul>
        <li>Law on Protection of Consumer Rights No. 19/2023/QH15 (effective from July 1, 2024).</li>
        <li>Decree 55/2024/ND-CP details a number of articles of the Law on Consumer Rights Protection.</li>
        <li>Electronic Transaction Law No. 20/2023/QH15 (effective from July 1, 2024).</li>
        <li>Decree 52/2013/ND-CP and Decree 85/2021/ND-CP on e-commerce.</li>
      </ul>

      <p className="last-updated">Last updated: {LEGAL_POLICY_LAST_UPDATED_LABEL}</p>
    </article>
  );
}
