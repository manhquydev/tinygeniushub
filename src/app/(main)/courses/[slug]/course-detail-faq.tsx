const FAQ_ITEMS = [
  {
    q: "Does my child need any background before studying?",
    a: "No prior background required. Each course is designed according to a roadmap from the beginning, parents just need to follow the instructions for each lesson.",
  },
  {
    q: "Do parents have to sit with their children during the lesson?",
    a: "No need to sit all the time. However, for children under 7 years old, parents should assist in the first 10 minutes to help the child get used to the interface.",
  },
  {
    q: "How long does each lesson take?",
    a: "Each lesson usually lasts 10-20 minutes, suitable for daily study. The suggested rhythm is 4-5 exercises/week to maintain steady progress.",
  },
  {
    q: "After purchasing, can I learn immediately?",
    a: "Have. After successful payment, your child can start school immediately.",
  },
  {
    q: "If it's not suitable, can I get a refund?",
    a: "Have. Refund policy within the first 30 days if the course does not suit your child's needs.",
  },
] as const;

export function CourseDetailFaq() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">Frequently asked questions from parents</h2>
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
