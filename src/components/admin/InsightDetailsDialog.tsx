"use client";
import { getAdminInsightDetailsAction } from "@/app/actions/admin-insights-actions";
import type {
  InsightDetailFilter,
  InsightDetails,
} from "@/core/domain/repositories/AdminInsightsRepository";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
export const insightMoney = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateTime = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
const statuses: Record<string, string> = {
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  NO_SHOW: "Falta",
  PENDING: "Agendado",
};
export function InsightDetailsDialog({
  filter,
  title,
  onClose,
}: {
  filter: InsightDetailFilter;
  title: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<InsightDetails | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current!;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    let active = true;
    getAdminInsightDetailsAction({ ...filter, page })
      .then((res) => {
        if (!active) return;
        if (res.success) setResult(res.details);
        else setError(res.error);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filter, page, retry]);
  function navigate(next: number) {
    setLoading(true);
    setError("");
    setResult(null);
    setPage(next);
  }
  return (
    <dialog
      ref={dialog}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], [tabindex="0"]',
          ),
        ).filter((el) => el.getClientRects().length > 0);
        const first = controls[0],
          last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first && last) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last &&
          first
        ) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="insight-detail-title"
      className="m-auto w-[calc(100%-2rem)] max-w-3xl max-h-[85dvh] overflow-y-auto rounded-2xl border border-white/15 bg-[#151515] p-5 text-white backdrop:bg-black/75 sm:p-7"
    >
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs text-[#D4AF37]">Detalhes do indicador</p>
          <h2 id="insight-detail-title" className="mt-1 text-xl font-semibold">
            {title}
          </h2>
          <p className="mt-2 text-xs text-zinc-400">
            {filter.startDate
              ? `${filter.startDate.split("-").reverse().join("/")} a ${filter.endDate!.split("-").reverse().join("/")}`
              : "Período selecionado no painel"}{" "}
            · Horário de Brasília
          </p>
        </div>
        <button
          autoFocus
          aria-label="Fechar detalhes"
          onClick={onClose}
          className="min-h-11 min-w-11 rounded-xl hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
        >
          <X className="mx-auto size-5" />
        </button>
      </header>
      {loading ? (
        <p role="status" className="py-12 text-center text-zinc-300">
          Carregando atendimentos…
        </p>
      ) : error ? (
        <div role="alert" className="py-8">
          <p>{error}</p>
          <button
            className="mt-3 min-h-11 text-[#D4AF37]"
            onClick={() => {
              setError("");
              setLoading(true);
              setRetry((r) => r + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        result && (
          <>
            <p className="my-5 text-sm text-zinc-300">
              {result.total} atendimentos ·{" "}
              <strong className="text-white">
                {insightMoney(result.amountCents)}
              </strong>{" "}
              {filter.kind === "received"
                ? "recebidos no caixa"
                : "em serviços"}
            </p>
            {!result.total && (
              <p className="py-8 text-zinc-400">
                Nenhum atendimento corresponde a estes filtros.
              </p>
            )}
            <ul className="divide-y divide-white/10">
              {result.rows.map((row) => (
                <li key={row.id} className="py-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="font-semibold">{row.clientName}</h3>
                    <strong>{insightMoney(row.amountCents)}</strong>
                  </div>
                  <p className="mt-1 text-sm text-zinc-300">
                    {row.serviceName} · {row.barberName}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Atendimento: {dateTime(row.startTime)} ·{" "}
                    {statuses[row.status] || row.status}
                  </p>
                  <p className="mt-2 text-xs text-zinc-300">
                    {row.paid && row.confirmedAt
                      ? `Pago no caixa em ${dateTime(row.confirmedAt)}`
                      : "Sem pagamento confirmado no caixa"}
                  </p>
                  <p className="mt-2 text-xs text-[#D4AF37]">
                    Divisão do serviço: barbeiro{" "}
                    {insightMoney(row.commissionCents)} (
                    {row.priceCents
                      ? (
                          (row.commissionCents / row.priceCents) *
                          100
                        ).toLocaleString("pt-BR", { maximumFractionDigits: 2 })
                      : "0"}
                    %) · barbearia{" "}
                    {insightMoney(row.priceCents - row.commissionCents)}
                  </p>
                </li>
              ))}
            </ul>
            <footer className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-white/10 bg-[#151515] py-3 text-sm">
              <button
                disabled={result.page <= 1}
                onClick={() => navigate(result.page - 1)}
                className="min-h-11 rounded-xl px-3 hover:bg-white/10 disabled:opacity-40"
              >
                Anterior
              </button>
              <span>
                Página {result.page} de{" "}
                {Math.max(1, Math.ceil(result.total / result.pageSize))}
              </span>
              <button
                disabled={result.page * result.pageSize >= result.total}
                onClick={() => navigate(result.page + 1)}
                className="min-h-11 rounded-xl px-3 hover:bg-white/10 disabled:opacity-40"
              >
                Próxima
              </button>
            </footer>
          </>
        )
      )}
    </dialog>
  );
}
