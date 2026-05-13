import type { Metadata } from "next";
import { CookieConsentActions } from "@/components/legal/cookie-consent-actions";
import { LEGAL_POLICY_LAST_UPDATED_LABEL } from "@/lib/legal/legal-policy-version";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Explains how TinyGenius Hub uses necessary, analytical and marketing cookies; how parents manage or withdraw consent.",
  alternates: { canonical: "https://www.tinygeniushubvn.tech/cookie-policy" },
};

export default function CookiePolicyPage() {
  return (
    <article className="prose-page">
      <h1>Cookie Policy</h1>
      <p>
        This policy describes how TinyGenius Hub uses cookies when you visit the website/app. We only have cookies enabled
        is not essential after explicit consent from parents.
      </p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small files saved in your browser to identify sessions, remember choices, and measure product performance
        products.
      </p>

      <h2>2. Groups of cookies we use</h2>
      <ul>
        <li>
          <strong>Necessary cookies:</strong> required for sign-in, session continuity, abuse prevention, and system security.
        </li>
        <li>
          <strong>Analytical cookies:</strong> measure aggregate usage behavior (for example GA4) to improve the product.
        </li>
        <li>
          <strong>Marketing cookies:</strong> measure campaign effectiveness (for example Meta Pixel) for parent-facing content.
        </li>
      </ul>

      <h2>3. Principle of consent</h2>
      <ul>
        <li>We do not default to “all in.”</li>
        <li>Silence/inaction is not considered consent.</li>
        <li>You can withdraw or change your selection at any time.</li>
      </ul>

      <h2>4. Manage cookie preferences</h2>
      <p>
        The cookie panel currently supports 2 choices: (i) necessary cookies only or (ii) accept all
        non-essential cookies.
      </p>
      <CookieConsentActions className="not-prose mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4" />

      <h2>5. Main cookies according to the current platform</h2>
      <ul>
        <li>
          <code>ccth_session</code>, <code>ccth_reader_session</code>: necessary cookies for authentication.
        </li>
        <li>
          <code>ccth_cookie_consent_v1</code>: stores your cookie choice.
        </li>
        <li>
          <code>ab_pricing_v</code>, <code>ab_courses_v</code>, <code>ccth_attr_v1</code>: enabled only with consent for
          analysis.
        </li>
      </ul>
      <p>
        Cookie storage duration is applied per group and/or session, up to the maximum according to the configuration announced at the time
        processing point.
      </p>

      <h2>6. Legal basis of reference</h2>
      <ul>
        <li>Law on Personal Data Protection No. 91/2025/QH15 (effective from January 1, 2026).</li>
        <li>Decree 356/2025/ND-CP (effective from January 1, 2026; replacing Decree 13/2023/ND-CP).</li>
        <li>Law on Consumer Rights Protection No. 19/2023/QH15 and related guiding documents.</li>
      </ul>

      <h2>7. Contact</h2>
      <p>
        For support with cookie choices or personal data rights, please contact:{" "}
        <a href="mailto:privacy@tinygeniushubvn.tech">privacy@tinygeniushubvn.tech</a>.
      </p>

      <p className="last-updated">Last updated: {LEGAL_POLICY_LAST_UPDATED_LABEL}</p>
    </article>
  );
}
