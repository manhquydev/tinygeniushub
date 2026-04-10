import { env } from "@/lib/env";
import { isEmailFeatureEnabled } from "@/lib/email/email-feature-flags";
import { renderProjectEmailHtml } from "@/lib/email/project-email-template-builder";

export type EmailTag = {
  name: string;
  value: string;
};

export type SendTransactionalEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  tags?: EmailTag[];
};

export type TransactionalEmailDelivery = {
  provider: string;
  attempted: boolean;
  sent: boolean;
};

function normalizeTags(tags?: EmailTag[]) {
  const baseTags = [...(tags ?? [])];
  baseTags.push({ name: "environment", value: env.NODE_ENV });
  return baseTags;
}

function findFeatureTag(tags: EmailTag[]) {
  return tags.find((tag) => tag.name === "feature")?.value ?? null;
}

async function sendWithResend(input: SendTransactionalEmailInput, tags: EmailTag[]) {
  const html = input.html ?? renderProjectEmailHtml({ subject: input.subject, text: input.text, tags });
  const response = await fetch(`${env.REPORT_EMAIL_RESEND_API_BASE_URL}/emails`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.REPORT_EMAIL_RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.REPORT_EMAIL_FROM,
      to: [env.REPORT_EMAIL_TO_OVERRIDE ?? input.to],
      subject: input.subject,
      text: input.text,
      html,
      ...(env.REPORT_EMAIL_REPLY_TO ? { reply_to: env.REPORT_EMAIL_REPLY_TO } : {}),
      tags,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend delivery failed: status=${response.status}`);
  }
}

async function sendWithBrevo(input: SendTransactionalEmailInput, tags: EmailTag[]) {
  const html = input.html ?? renderProjectEmailHtml({ subject: input.subject, text: input.text, tags });
  const response = await fetch(`${env.REPORT_EMAIL_BREVO_API_BASE_URL}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": String(env.REPORT_EMAIL_BREVO_API_KEY),
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: env.REPORT_EMAIL_FROM,
        ...(env.REPORT_EMAIL_FROM_NAME ? { name: env.REPORT_EMAIL_FROM_NAME } : {}),
      },
      to: [{ email: env.REPORT_EMAIL_TO_OVERRIDE ?? input.to }],
      subject: input.subject,
      textContent: input.text,
      htmlContent: html,
      ...(env.REPORT_EMAIL_REPLY_TO ? { replyTo: { email: env.REPORT_EMAIL_REPLY_TO } } : {}),
      tags: tags.map((tag) => `${tag.name}:${tag.value}`),
    }),
  });

  if (!response.ok) {
    throw new Error(`Brevo delivery failed: status=${response.status}`);
  }
}

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<TransactionalEmailDelivery> {
  const tags = normalizeTags(input.tags);
  const featureTag = findFeatureTag(tags);
  const enabled = await isEmailFeatureEnabled(featureTag);

  if (!enabled) {
    console.info(`[email] skipped by admin toggle: feature=${featureTag ?? "unknown"} to=${input.to}`);
    return {
      provider: env.REPORT_EMAIL_PROVIDER,
      attempted: false,
      sent: false,
    };
  }

  if (env.REPORT_EMAIL_PROVIDER === "mock_email") {
    console.log(`[email] mock sent: to=${input.to} subject="${input.subject}"`);
    return {
      provider: env.REPORT_EMAIL_PROVIDER,
      attempted: true,
      sent: true,
    };
  }

  if (env.REPORT_EMAIL_PROVIDER === "resend") {
    await sendWithResend(input, tags);
    return {
      provider: env.REPORT_EMAIL_PROVIDER,
      attempted: true,
      sent: true,
    };
  }

  if (env.REPORT_EMAIL_PROVIDER === "brevo") {
    await sendWithBrevo(input, tags);
    return {
      provider: env.REPORT_EMAIL_PROVIDER,
      attempted: true,
      sent: true,
    };
  }

  throw new Error(`Unsupported report email provider: ${env.REPORT_EMAIL_PROVIDER}`);
}
