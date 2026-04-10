const FAQ_ITEMS = [
  {
    q: "Con tôi cần có nền tảng gì trước khi học không?",
    a: "Không cần nền tảng trước. Mỗi khóa được thiết kế theo lộ trình từ đầu, phụ huynh chỉ cần làm theo hướng dẫn từng bài.",
  },
  {
    q: "Phụ huynh có phải ngồi cùng con trong suốt buổi học không?",
    a: "Không bắt buộc ngồi suốt. Tuy nhiên, với bé dưới 7 tuổi, phụ huynh nên hỗ trợ trong 10 phút đầu để bé quen với giao diện.",
  },
  {
    q: "Mỗi buổi học mất bao lâu?",
    a: "Mỗi bài học thường kéo dài 10-20 phút, phù hợp để học theo ngày. Nhịp gợi ý là 4-5 bài/tuần để duy trì tiến bộ đều đặn.",
  },
  {
    q: "Sau khi mua, tôi có thể học ngay không?",
    a: "Có. Sau khi thanh toán thành công, bé có thể vào học ngay.",
  },
  {
    q: "Nếu không phù hợp, tôi có được hoàn tiền không?",
    a: "Có. Chính sách hoàn tiền trong 30 ngày đầu nếu khóa học chưa phù hợp với nhu cầu của bé.",
  },
] as const;

export function CourseDetailFaq() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">Câu hỏi thường gặp từ phụ huynh</h2>
      <div className="mt-4 grid gap-2">
        {FAQ_ITEMS.map((item, idx) => (
          <details key={idx} className="group rounded-2xl border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800 marker:hidden [&::-webkit-details-marker]:hidden">
              {item.q}
            </summary>
            <p className="px-4 pb-3 text-sm leading-relaxed text-slate-600">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
