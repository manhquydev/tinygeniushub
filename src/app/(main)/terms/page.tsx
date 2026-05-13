import type { Metadata } from "next";
import { LEGAL_POLICY_LAST_UPDATED_LABEL } from "@/lib/legal/legal-policy-version";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms and conditions of use of the TinyGenius Hub platform.",
  alternates: { canonical: "https://www.tinygeniushubvn.tech/terms" },
};

export default function TermsOfServicePage() {
  return (
    <article className="prose-page">
      <h1>Terms of use</h1>
      <p>
        These terms stipulate the rights and obligations between users and TinyGenius Hub when using the website, application and
        related services.
      </p>

      <h2>1. Accept terms</h2>
      <ul>
        <li>By creating an account or continuing to use the service, you confirm that you have read and agree to these terms.</li>
        <li>If you do not agree, please stop accessing and using the service.</li>
      </ul>

      <h2>2. Target users</h2>
      <ul>
        <li>The account holder must be at least 18 years old or as required by applicable law.</li>
        <li>Parents are responsible for managing their children's account information and learning activities on the platform.</li>
      </ul>

      <h2>3. Service description</h2>
      <ul>
        <li>The platform provides learning content for children, progress tracking tools, and reporting for parents.</li>
        <li>Some features may require a paid service plan or additional terms of use.</li>
      </ul>

      <h2>4. Account and security</h2>
      <ul>
        <li>Users must provide accurate and updated registration information when there are changes.</li>
        <li>Users themselves secure their passwords, login devices, and authentication information.</li>
        <li>Users need to notify immediately when detecting unauthorized access.</li>
      </ul>

      <h2>5. Payment and refund</h2>
      <ul>
        <li>Service fees, billing cycles and package benefits are announced at the time of transaction.</li>
        <li>Refunds are applicable accordingly<a href="/refund-policy">Refund policy</a>.</li>
      </ul>

      <h2>6. Intellectual property rights</h2>
      <ul>
        <li>Learning content, design, source code and brand assets are legally owned by the platform.</li>
        <li>Copying, redistribution or commercial exploitation without written consent is strictly prohibited.</li>
      </ul>

      <h2>7. Prohibited acts</h2>
      <ul>
        <li>Unauthorized intrusion, system intervention, spreading malicious code or API abuse.</li>
        <li>Collect user data without permission or use data for other purposes.</li>
        <li>Impersonate another organization/individual or provide false information.</li>
      </ul>

      <h2>8. Personal data and cookies</h2>
      <ul>
        <li>Processing of personal data follows<a href="/privacy">Privacy policy</a>.</li>
        <li>Cookie usage follows<a href="/cookie-policy">Cookie Policy</a>.</li>
      </ul>

      <h2>9. Limitation of liability</h2>
      <ul>
        <li>Nothing in this document shall exclude or limit the mandatory rights of consumers.</li>
        <li>The limitation of liability only applies to the extent permitted by law.</li>
        <li>The Services are provided on a reasonable efforts basis under actual operating conditions.</li>
        <li>
          We are not responsible for indirect/arising damages beyond the scope of reasonable control according to regulations
          applicable law.
        </li>
      </ul>

      <h2>10. Suspension or termination of service</h2>
      <ul>
        <li>We may suspend/terminate accounts if we detect violations of terms or legal requirements.</li>
        <li>Except in legal/security emergencies, we will notify in advance and provide appropriate complaint channels.</li>
        <li>Users may request account termination in accordance with applicable policies.</li>
      </ul>

      <h2>11. Update terms</h2>
      <p>
        Terms may be updated to reflect legal or product changes. Important changes will be announced
        notify before applying.
      </p>

      <h2>12. Applicable law and dispute resolution</h2>
      <p>
        These terms are governed by Vietnamese law. In case of dispute, the parties prioritize negotiation
        before transferring the matter to the competent authority for resolution according to the law.
      </p>

      <h2>13. Contact</h2>
      <p>Support email: support@tinygeniushubvn.tech</p>

      <h2>14. Legal basis of reference</h2>
      <ul>
        <li>Law on Personal Data Protection No. 91/2025/QH15 (effective from January 1, 2026).</li>
        <li>Decree 356/2025/ND-CP (effective from January 1, 2026; replacing Decree 13/2023/ND-CP).</li>
        <li>
          Law on Consumer Rights Protection No. 19/2023/QH15 (effective from July 1, 2024) and Decree
          55/2024/ND-CP.
        </li>
        <li>Electronic Transaction Law No. 20/2023/QH15 (effective from July 1, 2024).</li>
        <li>Decree 52/2013/ND-CP and Decree 85/2021/ND-CP on e-commerce.</li>
      </ul>

      <p className="last-updated">Last updated: {LEGAL_POLICY_LAST_UPDATED_LABEL}</p>
    </article>
  );
}
