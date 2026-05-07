import type { Metadata } from "next";
import { GiftCodeForm } from "@/components/gift-code-form";

export const metadata: Metadata = {
  title: "Nhập mã quà tặng — TinyGenius Hub",
  description: "Kích hoạt mã quà tặng để truy cập khóa học hoặc gói dịch vụ TinyGenius Hub.",
};

export default function GiftCodePage() {
  return (
    <div className="page-stack">
      <section className="card" style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Nhập mã quà tặng</h1>
        <p className="muted-text">
          Nhận được mã từ người thân hoặc chương trình khuyến mãi? Nhập mã bên dưới để kích hoạt ngay.
        </p>
        <GiftCodeForm />
      </section>
    </div>
  );
}
