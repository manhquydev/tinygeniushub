"use client";

import { FormEvent, useMemo, useState } from "react";

type ContactStatus = "idle" | "loading" | "success" | "error";

const SUBJECT_OPTIONS = [
  "Hỗ trợ kỹ thuật",
  "Hợp tác / B2B",
  "Báo lỗi",
  "Khác",
] as const;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<(typeof SUBJECT_OPTIONS)[number]>("Hỗ trợ kỹ thuật");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [feedback, setFeedback] = useState("");

  const submitDisabled = useMemo(() => {
    if (status === "loading") {
      return true;
    }

    return name.trim().length === 0 || email.trim().length === 0 || message.trim().length < 10;
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
        throw new Error(messageFromServer || "Không thể gửi biểu mẫu. Vui lòng thử lại.");
      }

      setStatus("success");
      setFeedback(body && "data" in body && body.data?.message ? body.data.message : "Cảm ơn! Chúng tôi sẽ phản hồi trong 24-48 giờ.");
      setMessage("");
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.");
    }
  }

  return (
    <form className="contact-form-card" onSubmit={handleSubmit}>
      <div className="contact-form-field">
        <label htmlFor="contact-name">Họ và tên</label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nhập họ và tên của bạn"
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
        <label htmlFor="contact-subject">Chủ đề</label>
        <select id="contact-subject" name="subject" value={subject} onChange={(event) => setSubject(event.target.value as typeof subject)}>
          {SUBJECT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="contact-form-field">
        <label htmlFor="contact-message">Nội dung</label>
        <textarea
          id="contact-message"
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Vui lòng mô tả chi tiết để chúng tôi hỗ trợ nhanh hơn."
          rows={6}
          minLength={10}
          required
        />
      </div>

      <button type="submit" className="contact-form-submit" disabled={submitDisabled}>
        {status === "loading" ? "Đang gửi..." : "Gửi liên hệ"}
      </button>

      {feedback ? (
        <p className={status === "error" ? "error-text" : "muted-text"} role={status === "error" ? "alert" : "status"}>
          {feedback}
        </p>
      ) : null}
    </form>
  );
}
