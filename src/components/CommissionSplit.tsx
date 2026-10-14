export function CommissionSplit({
  revenue,
  commission,
  breakdown,
  admin = false,
}: {
  admin?: boolean;
  revenue: number;
  commission: number;
  breakdown?: {
    serviceName: string;
    priceCents: number;
    commissionCents: number;
    count: number;
  }[];
}) {
  const money = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const share = revenue > 0 ? (commission / revenue) * 100 : 0;
  const percent = (value: number) =>
    value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return (
    <section
      className="rounded-2xl border border-white/10 bg-[#151515] p-5 text-white"
      aria-label="Divisão dos serviços realizados"
    >
      <h2 className="font-semibold">Divisão dos serviços realizados</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <p className="text-sm text-zinc-300">
          {admin ? "Comissão do barbeiro" : "Sua comissão"}{" "}
          <strong className="mt-1 block text-xl text-[#D4AF37]">
            {money(commission)} · {percent(share)}%
          </strong>
        </p>
        <p className="text-sm text-zinc-300">
          Parte da barbearia{" "}
          <strong className="mt-1 block text-xl">
            {money(revenue - commission)} · {percent(revenue ? 100 - share : 0)}
            %
          </strong>
        </p>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-zinc-400">
        Percentual efetivo dos atendimentos concluídos, conforme os valores
        registrados no agendamento. Pode variar por serviço e data. Comissão
        calculada não significa repasse pago; a parte da barbearia ainda não
        desconta despesas.
      </p>
      {breakdown && breakdown.length > 0 && (
        <details className="mt-4">
          <summary className="min-h-11 cursor-pointer py-3 text-sm text-[#D4AF37]">
            Ver divisão por serviço
          </summary>
          <ul className="divide-y divide-white/10">
            {breakdown.map((row, index) => (
              <li key={index} className="py-3 text-sm">
                <strong>
                  {row.serviceName} · {row.count} atendimentos
                </strong>
                <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                  Por atendimento: {money(row.priceCents / 100)} ·{" "}
                  {admin ? "Barbeiro" : "Sua parte"}:{" "}
                  {money(row.commissionCents / 100)} (
                  {percent(
                    row.priceCents
                      ? (row.commissionCents / row.priceCents) * 100
                      : 0,
                  )}
                  %) · Barbearia:{" "}
                  {money((row.priceCents - row.commissionCents) / 100)}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
