"use client";

import { FormEvent, useMemo, useState } from "react";

type ContactStatus = "idle" | "loading" | "success" | "error";
const MAX_MESSAGE_LENGTH = 500;

const SUBJECT_OPTIONS = [
  "Technical support",
  "Collaboration / B2B",
  "Report error",
  "Other",
] as const;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<(typeof SUBJECT_OPTIONS)[number]>("Technical support");
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
        throw new Error(messageFromServer || "Cannot submit form. Please try again.");
      }

      setStatus("success");
      setFeedback(body && "data" in body && body.data?.message ? body.data.message : "Thank! We will respond within 24-48 hours.");
      setMessage("");
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : "An error has occurred. Please try again.");
    }
  }

  return (
    <form className="contact-form-card" onSubmit={handleSubmit}>
      <div className="contact-form-field">
        <label htmlFor="contact-name">Full name</label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter your first and last name"
          required
        />
      </div>

      <div className="contact-form-field">
        <label htmlFor="contact-email">Email</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="contact-form-field">
        <label htmlFor="contact-subject">Topic</label>
        <select id="contact-subject" name="subject" value={subject} onChange={(event) => setSubject(event.target.value as typeof subject)}>
          {SUBJECT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="contact-form-field">
        <label htmlFor="contact-message">Content</label>
        <textarea
          id="contact-message"
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Please describe in detail so we can support you faster."
          rows={6}
          minLength={10}
          maxLength={MAX_MESSAGE_LENGTH}
          required
        />
        <p className="muted-text text-right">{message.length}/{MAX_MESSAGE_LENGTH}</p>
      </div>

      <button type="submit" className="contact-form-submit" disabled={submitDisabled}>
        {status === "loading" ? "Sending..." : "Send contact"}
      </button>

      {feedback ? (
        <p className={status === "error" ? "error-text" : "muted-text"} role={status === "error" ? "alert" : "status"}>
          {feedback}
        </p>
      ) : null}
    </form>
  );
}
