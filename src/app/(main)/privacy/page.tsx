import type { Metadata } from "next";
import { LEGAL_POLICY_LAST_UPDATED_LABEL } from "@/lib/legal/legal-policy-version";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "Committed to protecting parent and child data on the TinyGenius Hub platform.",
  alternates: { canonical: "https://www.tinygeniushubvn.tech/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <article className="prose-page">
      <h1>Privacy policy</h1>
      <p>
        This policy explains how TinyGenius Hub collects, processes, stores and protects women's personal data.
        parent, children's learning data when using the platform.
      </p>

      <h2>1. Legal basis of reference</h2>
      <ul>
        <li>Law on Personal Data Protection No. 91/2025/QH15 (effective from January 1, 2026).</li>
        <li>Decree 356/2025/ND-CP (effective from January 1, 2026; replacing Decree 13/2023/ND-CP).</li>
        <li>Law on Consumer Rights Protection No. 19/2023/QH15 and related guiding documents.</li>
      </ul>

      <h2>2. Data we collect</h2>
      <ul>
        <li>Parent account data: email, display name, registration status.</li>
        <li>Children's learning data: learning records, lesson progress, learning interaction history.</li>
        <li>Technical data: IP address, device, access log for system safety.</li>
        <li>Payment data: transaction information from payment partners (full card number is not saved).</li>
      </ul>

      <h2>3. Purpose of data processing</h2>
      <ul>
        <li>
          We process data on one or more appropriate legal bases, such as performance of a contract or legal obligation
          reason, consent or legitimate interests under applicable law.
        </li>
        <li>Account operations and core learning functions.</li>
        <li>Personalize the learning experience according to the child's age/level.</li>
        <li>Send service notifications, progress reports, technical support.</li>
        <li>Prevent fraud and abuse and meet legal requirements.</li>
      </ul>

      <h2>4. Children's data</h2>
      <ul>
        <li>Main account created and controlled by parents.</li>
        <li>We do not purchase or sell children's personal data for independent commercial purposes.</li>
        <li>Don't run behavioral ads aimed directly at children.</li>
        <li>Where processing beyond the core learning objectives is required, we require an appropriate lawful basis.</li>
      </ul>

      <h2>5. Share data with third parties</h2>
      <ul>
        <li>Share only to the extent necessary to provide the service.</li>
        <li>Key partner groups: infrastructure, email, payments, security and analytics.</li>
        <li>Partners must comply with data security obligations under contracts or applicable laws.</li>
      </ul>

      <h2>6. Store and protect data</h2>
      <ul>
        <li>Data is protected using risk-appropriate technical and organizational measures.</li>
        <li>Role-based access restriction applies.</li>
        <li>The storage period is determined according to the purpose of processing and the legal obligations involved.</li>
      </ul>

      <h2>7. Rights of data subjects</h2>
      <ul>
        <li>Right to know, access, and correct personal data.</li>
        <li>The right to request restriction of processing or deletion of data to the extent permitted by law.</li>
        <li>Right to withdraw consent for purposes based on consent.</li>
        <li>We respond to data subject requests within the time limits prescribed by applicable law.</li>
      </ul>

      <h2>8. Cookies and tracking</h2>
      <ul>
        <li>Necessary cookies are always active to ensure login security.</li>
        <li>Analytical/marketing cookies are enabled only with explicit consent.</li>
        <li>For details see the page<a href="/cookie-policy">Cookie Policy</a>.</li>
      </ul>

      <h2>9. Cross-border data transfer</h2>
      <p>
        When there are cross-border transfers of personal data, we implement records and controls
        according to the legal framework applicable at the time of processing.
      </p>

      <h2>10. Contact to exercise data rights</h2>
      <ul>
        <li>Email: privacy@tinygeniushubvn.tech</li>
        <li>Operating unit: TinyGenius Hub</li>
      </ul>

      <p className="last-updated">Last updated: {LEGAL_POLICY_LAST_UPDATED_LABEL}</p>
    </article>
  );
}
