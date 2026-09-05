type BillingTicket = {
  id: string;
  status: string;
  validUntil: string | null;
  offeringCode: string;
  catalogKey: string;
};

type BillingTicketsProps = {
  tickets: BillingTicket[];
  heading: string;
  empty: string;
  codeLabel: string;
  catalogLabel: string;
  statusLabel: string;
  validUntilLabel: string;
  openEnded: string;
};

export function BillingTickets({
  tickets,
  heading,
  empty,
  codeLabel,
  catalogLabel,
  statusLabel,
  validUntilLabel,
  openEnded,
}: BillingTicketsProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">{heading}</h2>
      {tickets.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">{empty}</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm"
            >
              <p className="font-bold text-slate-900">
                {codeLabel}: {ticket.offeringCode}
              </p>
              <p className="mt-1 text-slate-600">
                {catalogLabel}: {ticket.catalogKey}
              </p>
              <p className="mt-1 text-slate-600">
                {statusLabel}: {ticket.status}
              </p>
              <p className="mt-1 text-slate-600">
                {validUntilLabel}: {ticket.validUntil ?? openEnded}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
