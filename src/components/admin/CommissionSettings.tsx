"use client";
import {
  getServicesAdminAction,
  updateServiceAction,
} from "@/app/actions/service-actions";
import { useEffect, useState } from "react";
type Service = {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  active: boolean;
};
export function CommissionSettings() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    getServicesAdminAction()
      .then((res) => {
        if (!active) return;
        if (res.success) setServices(res.services);
        else setError(res.error);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os serviços.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section
      className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6"
      id="comissoes"
    >
      <h2 className="text-lg font-semibold">Configurar comissões</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Defina quanto o barbeiro recebe em cada serviço. Alterações valem para
        novos agendamentos; os já registrados preservam a divisão original.
      </p>
      <p className="mt-2 text-xs text-zinc-400">
        Exemplo: R$ 30,00 a 50% → R$ 15,00 para o barbeiro e R$ 15,00 para a
        barbearia.
      </p>
      {loading && (
        <p role="status" className="mt-4">
          Carregando serviços…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-red-300">
          {error}
        </p>
      )}
      <div className="mt-5 divide-y divide-white/10">
        {services.map((s) => (
          <CommissionRow key={s.id} service={s} />
        ))}
      </div>
      {!loading && !error && !services.length && (
        <p className="mt-4 text-sm text-zinc-400">
          Cadastre um serviço para configurar sua comissão.
        </p>
      )}
    </section>
  );
}
function CommissionRow({ service }: { service: Service }) {
  const [value, setValue] = useState(
    String(Math.round(service.commissionRate * 10000) / 100),
  );
  const [saved, setSaved] = useState(value);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const rate = Number(value);
  const valid =
    value.trim() !== "" &&
    Number.isFinite(rate) &&
    rate >= 0 &&
    rate <= 100 &&
    Math.abs(rate * 100 - Math.round(rate * 100)) < 1e-7;
  const cents = Math.round(service.price * 100);
  const commission = valid ? Math.round((cents * rate) / 100) : 0;
  const money = (c: number) =>
    (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <form
      className="flex flex-wrap items-end justify-between gap-4 py-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid || busy) return;
        setBusy(true);
        setFeedback("");
        try {
          const data = new FormData();
          data.set("commissionRate", String(rate / 100));
          const res = await updateServiceAction(service.id, data);
          if (res.success) {
            const current = String(
              Math.round(res.service.commissionRate * 10000) / 100,
            );
            setSaved(current);
            setValue(current);
            setFeedback("Comissão salva para novos agendamentos.");
          } else setFeedback(res.error);
        } catch {
          setFeedback("Falha ao salvar. Tente novamente.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-medium">
          {service.name}
          {!service.active && (
            <span className="ml-2 text-xs text-zinc-400">Inativo</span>
          )}
        </h3>
        <p className="mt-1 text-xs text-zinc-400">Serviço: {money(cents)}</p>
        <p className="mt-2 text-xs text-zinc-300">
          {valid
            ? `Barbeiro: ${money(commission)} · Barbearia: ${money(cents - commission)}`
            : "Informe de 0 a 100%, com até duas casas decimais."}
        </p>
        <p role="status" className="mt-2 text-xs text-[#D4AF37]">
          {feedback}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label
          htmlFor={`commission-${service.id}`}
          className="text-xs text-zinc-300"
        >
          Comissão do barbeiro (%)
          <input
            disabled={busy}
            id={`commission-${service.id}`}
            type="number"
            min="0"
            max="100"
            step="0.01"
            required
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setFeedback("");
            }}
            className="mt-1 block min-h-11 w-28 rounded-xl border border-white/15 bg-[#1C1C1C] px-3 text-sm text-white"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setValue("50");
            setFeedback("Clique em Salvar para aplicar 50%.");
          }}
          className="min-h-11 rounded-xl border border-white/15 px-3 text-sm hover:bg-white/10"
        >
          Usar 50%
        </button>
        <button
          disabled={!valid || busy || value === saved}
          className="min-h-11 rounded-xl bg-[#D4AF37] px-4 text-sm font-semibold text-black disabled:opacity-40"
        >
          {busy ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
