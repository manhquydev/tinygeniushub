"use client";

import { FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type ContactStatus = "idle" | "loading" | "success" | "error";
const MAX_MESSAGE_LENGTH = 500;

const SUBJECT_OPTIONS = [
  { value: "Technical support", labelKey: "technical" },
  { value: "Collaboration / B2B", labelKey: "collaboration" },
  { value: "Report error", labelKey: "reportError" },
  { value: "Other", labelKey: "other" },
] as const;

export function ContactForm() {
  const t = useTranslations("contact.form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<(typeof SUBJECT_OPTIONS)[number]["value"]>("Technical support");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [feedback, setFeedback] = useState("");

  const submitDisabled = useMemo(() => {
    if (status === "loading") {
      return true;
    }

    return name.trim().length === 0 || email.trim().length === 0 || message.trim().length < 10 || message.length > MAX_MESSAGE_LENGTH;
  }, [email, message, name, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setFeedback("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject,
          message: message.trim(),
        }),
      });

      const body = (await response.json()) as
        | { ok?: boolean; data?: { message?: string } }
        | { error?: { message?: string } };

      if (!response.ok) {
        const messageFromServer = "error" in body ? body.error?.message : undefined;
        throw new Error(messageFromServer || t("submitError"));
      }

      setStatus("success");
      setFeedback(body && "data" in body && body.data?.message ? body.data.message : t("successFallback"));
      setMessage("");
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : t("unknownError"));
    }
  }

  return (
    <form className="contact-form-card" onSubmit={handleSubmit}>
      <div className="contact-form-field">
        <label htmlFor="contact-name">{t("nameLabel")}</label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("namePlaceholder")}
          required
        />
      </div>

      <div className="contact-form-field">
        <label htmlFor="contact-email">{t("emailLabel")}</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("emailPlaceholder")}
          required
        />
      </div>

      <div className="contact-form-field">
        <label htmlFor="contact-subject">{t("subjectLabel")}</label>
        <select
          id="contact-subject"
          name="subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value as typeof subject)}
        >
          {SUBJECT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(`subjects.${option.labelKey}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="contact-form-field">
        <label htmlFor="contact-message">{t("messageLabel")}</label>
        <textarea
          id="contact-message"
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t("messagePlaceholder")}
          rows={6}
          minLength={10}
          maxLength={MAX_MESSAGE_LENGTH}
          required
        />
        <p className="muted-text text-right">{t("charCount", { current: message.length, max: MAX_MESSAGE_LENGTH })}</p>
      </div>

      <button type="submit" className="contact-form-submit" disabled={submitDisabled}>
        {status === "loading" ? t("sending") : t("submit")}
      </button>

      {feedback ? (
        <p className={status === "error" ? "error-text" : "muted-text"} role={status === "error" ? "alert" : "status"}>
          {feedback}
        </p>
      ) : null}
    </form>
  );
}
