import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Mail, MapPin } from "lucide-react";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Liên hệ",
  description: "Liên hệ với đội ngũ Cùng Con Tự Học để được hỗ trợ hoặc hợp tác.",
  alternates: { canonical: "https://cungcontuhoc.io.vn/contact" },
};

export default function ContactPage() {
  return (
    <div className="contact-page">
      <header className="contact-header">
        <h1>Liên hệ với chúng tôi</h1>
        <p className="muted-text">Chúng tôi luôn sẵn sàng hỗ trợ phụ huynh, nhà trường và đối tác.</p>
      </header>

      <section className="contact-grid">
        <aside className="contact-info-card">
          <div className="contact-info-item">
            <Mail size={18} aria-hidden />
            <div>
              <strong>Email hỗ trợ</strong>
              <p>support@cungcontuhoc.io.vn</p>
            </div>
          </div>

          <div className="contact-info-item">
            <Clock3 size={18} aria-hidden />
            <div>
              <strong>Thời gian phản hồi</strong>
              <p>Trong vòng 24-48 giờ làm việc</p>
            </div>
          </div>

          <div className="contact-info-item">
            <MapPin size={18} aria-hidden />
            <div>
              <strong>Địa chỉ liên hệ</strong>
              <p>Việt Nam (làm việc từ xa)</p>
            </div>
          </div>

          <p className="muted-text">
            Cần giải đáp nhanh? Xem câu hỏi thường gặp tại{" "}
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
