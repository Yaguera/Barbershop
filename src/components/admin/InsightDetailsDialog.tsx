"use client";
import { getAdminInsightDetailsAction } from "@/app/actions/admin-insights-actions";
import type {
  InsightDetailFilter,
  InsightDetails,
} from "@/core/domain/repositories/AdminInsightsRepository";
import { CalendarDays, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

const originLabels: Record<string, string> = {
  ONLINE: "Online",
  WHATSAPP: "WhatsApp",
  WALK_IN: "Presencial",
};

const methodLabels: Record<string, string> = {
  PIX: "Pix",
  MONEY: "Dinheiro",
  CARD: "Cartão",
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

  // Build contextual link to /admin/calendario
  const calendarParams = new URLSearchParams();
  calendarParams.set("context", filter.kind === "received" ? "caixa" : "agenda");
  const singleBarber =
    filter.barberId && filter.barberId !== "all"
      ? filter.barberId
      : filter.barberIds?.length === 1
        ? filter.barberIds[0]
        : null;
  if (singleBarber) {
    calendarParams.set("barber", singleBarber);
  }
  const calendarDate = filter.startDate || filter.customStart;
  if (calendarDate && /^\d{4}-\d{2}-\d{2}$/.test(calendarDate)) {
    const [y, m, d] = calendarDate.split("-");
    calendarParams.set("year", y);
    calendarParams.set("month", String(Number(m)));
    if (filter.startDate && filter.startDate === filter.endDate) {
      calendarParams.set("day", String(Number(d)));
      calendarParams.set("view", "day");
    }
  }
  const calendarHref = `/admin/calendario?${calendarParams.toString()}`;
  const hasUnsupportedCalendarFilters =
    (filter.barberIds && filter.barberIds.length > 1) ||
    Boolean(filter.serviceId) ||
    Boolean(filter.serviceIds && filter.serviceIds.length > 0) ||
    Boolean(filter.origins && filter.origins.length > 0);

  return (
    <dialog
      ref={dialog}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
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
      className="m-auto w-[calc(100%-2rem)] max-w-3xl max-h-[85dvh] overflow-y-auto rounded-2xl border border-white/15 bg-[#151515] p-0 text-white backdrop:bg-black/75 backdrop:cursor-pointer"
    >
      <div
        className="p-5 sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
            Detalhamento auditável
          </p>
          <h2 id="insight-detail-title" className="text-xl font-semibold">
            {title}
          </h2>
          <p className="text-xs text-zinc-400">
            {filter.startDate && filter.endDate
              ? `${filter.startDate.split("-").reverse().join("/")} a ${filter.endDate.split("-").reverse().join("/")}`
              : filter.customStart && filter.customEnd
                ? `${filter.customStart.split("-").reverse().join("/")} a ${filter.customEnd.split("-").reverse().join("/")}`
                : "Período selecionado no painel"}{" "}
            · Base:{" "}
            {filter.kind === "received"
              ? "Data de confirmação no caixa"
              : "Data agendada do atendimento"}{" "}
            · Fuso America/Sao_Paulo
            {result?.calculatedAt &&
              ` · Apurado às ${new Date(result.calculatedAt).toLocaleTimeString(
                "pt-BR",
                {
                  timeZone: "America/Sao_Paulo",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}`}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link
              href={calendarHref}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#1C1C1C] px-2.5 py-1 text-xs font-medium text-[#D4AF37] hover:bg-white/5"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Abrir no Calendário (
              {filter.kind === "received" ? "Caixa" : "Agenda"})
            </Link>
            {hasUnsupportedCalendarFilters && (
              <span className="text-[11px] text-zinc-500">
                Nota: o calendário preserva data, contexto e profissional único;
                filtros de múltiplos serviços/origens não se aplicam na grade do
                calendário.
              </span>
            )}
          </div>
        </div>
        <button
          autoFocus
          aria-label="Fechar detalhes"
          onClick={onClose}
          className="min-h-11 min-w-11 rounded-xl hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#D4AF37] cursor-pointer"
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
            className="mt-3 min-h-11 text-[#D4AF37] cursor-pointer"
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
            {/* Subtotais Reconciliados de Todo o Recorte Filtrado (Seção 9) */}
            <div className="my-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl border border-white/10 bg-[#1C1C1C] p-3.5 text-xs">
              <div>
                <span className="text-zinc-400 block">Total de registros</span>
                <strong className="text-sm font-bold text-white tabular-nums">
                  {result.total} atendimentos
                </strong>
              </div>
              <div>
                <span className="text-zinc-400 block">
                  {filter.kind === "received"
                    ? "Total recebido no caixa"
                    : "Valor dos serviços"}
                </span>
                <strong className="text-sm font-bold text-white tabular-nums">
                  {insightMoney(result.amountCents)}
                </strong>
              </div>
              <div>
                <span className="text-zinc-400 block">Comissão calculada</span>
                <strong className="text-sm font-bold text-[#D4AF37] tabular-nums">
                  {insightMoney(result.commissionCents ?? 0)}
                </strong>
              </div>
              <div>
                <span className="text-zinc-400 block">
                  Parte da barbearia
                </span>
                <strong className="text-sm font-bold text-emerald-400 tabular-nums">
                  {insightMoney(result.contributionCents ?? 0)}
                </strong>
              </div>
            </div>

            {!result.total && (
              <p className="py-8 text-zinc-400">
                Nenhum atendimento corresponde a estes filtros.
              </p>
            )}
            <ul className="divide-y divide-white/10">
              {result.rows.map((row) => (
                <li key={row.id} className="py-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{row.clientName}</h3>
                      {row.origin && (
                        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                          {originLabels[row.origin] || row.origin}
                        </span>
                      )}
                      {row.paymentMethod && (
                        <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                          {methodLabels[row.paymentMethod] || row.paymentMethod}
                        </span>
                      )}
                    </div>
                    <strong className="tabular-nums">
                      {insightMoney(row.amountCents)}
                    </strong>
                  </div>
                  <p className="mt-1 text-sm text-zinc-300">
                    {row.serviceName} · {row.barberName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                    <span>
                      Atendimento: {dateTime(row.startTime)} ·{" "}
                      {statuses[row.status] || row.status}
                    </span>
                    <Link
                      href={`/admin/calendario?view=day&date=${encodeURIComponent(row.startTime.slice(0, 10))}`}
                      className="inline-flex items-center gap-1 text-[#D4AF37] hover:underline"
                    >
                      Ver no calendário do dia
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <p className="mt-2 text-xs text-zinc-300">
                    {row.paid && row.confirmedAt
                      ? `Pago no caixa em ${dateTime(row.confirmedAt)}${row.paymentMethod ? ` (${methodLabels[row.paymentMethod] || row.paymentMethod})` : ""}`
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
                className="min-h-11 rounded-xl px-3 hover:bg-white/10 disabled:opacity-40 cursor-pointer"
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
                className="min-h-11 rounded-xl px-3 hover:bg-white/10 disabled:opacity-40 cursor-pointer"
              >
                Próxima
              </button>
            </footer>
          </>
        )
      )}
      </div>
    </dialog>
  );
}

