'use client';

import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { CommissionSettings } from '@/components/admin/CommissionSettings';
import {
  Info,
  Percent,
  Scissors,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminComissoesPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] lg:bg-[#141416] text-white flex flex-col lg:flex-row selection:bg-[#C5A059]/30">
      <AdminNavbar activePage="comissoes" />

      <main
        id="main-content"
        className="flex-grow px-4 sm:px-6 py-8 space-y-6 lg:my-3 lg:mr-3 lg:flex-1 lg:min-w-0 lg:rounded-[24px] lg:border lg:border-white/[0.07] lg:bg-[#0A0A0C] lg:p-6 xl:p-8 lg:shadow-2xl"
      >
        {/* Cabeçalho e Subnavegação de Configurações */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
              <Percent className="w-3.5 h-3.5" />
              <span>Configurações do Sistema</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Política de Comissões por Serviço
            </h1>
            <p className="text-white/60 text-xs sm:text-sm mt-1">
              Configure os percentuais de comissão aplicados aos novos agendamentos sem alterar o histórico financeiro já gravado.
            </p>
          </div>

          <div
            className="inline-flex rounded-xl bg-[#151515] p-1 border border-white/10"
            role="navigation"
            aria-label="Subnavegação de configurações"
          >
            <Link
              href="/admin/configuracoes/comissoes"
              aria-current="page"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-black"
            >
              <Percent className="w-3.5 h-3.5" />
              Comissões
            </Link>
            <Link
              href="/admin/configuracoes/permissoes"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Permissões e Perfis
            </Link>
          </div>
        </div>

        {/* Regras de governança e preservação histórica */}
        <section
          aria-labelledby="governance-heading"
          className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <Info className="w-5 h-5 text-[#D4AF37] shrink-0" />
              <h2 id="governance-heading" className="text-base font-semibold text-white">
                Regras de Preservação Histórica e Cálculo em Centavos
              </h2>
            </div>
            <Link
              href="/admin/servicos"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/5"
            >
              <Scissors className="w-3.5 h-3.5 text-[#D4AF37]" />
              Gerenciar catálogo de serviços
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-xs leading-relaxed text-zinc-300">
            <div className="rounded-xl border border-white/10 bg-[#1C1C1C] p-4 space-y-1.5">
              <strong className="block text-white">1. Snapshot imutável na criação</strong>
              <p className="text-zinc-400">
                Cada agendamento grava <code className="text-[#D4AF37]">priceCents</code> e{' '}
                <code className="text-[#D4AF37]">commissionCents</code> no momento da reserva. Alterar uma taxa de 50% para 40% vale somente para novas reservas.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#1C1C1C] p-4 space-y-1.5">
              <strong className="block text-white">2. Soma exata sem perda de arredondamento</strong>
              <p className="text-zinc-400">
                A parte da barbearia antes das despesas é sempre calculada como{' '}
                <code className="text-[#D4AF37]">priceCents − commissionCents</code> em centavos inteiros. O percentual efetivo nos relatórios é ponderado pelos valores realizados.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#1C1C1C] p-4 space-y-1.5">
              <strong className="block text-white">3. Comissão calculada ≠ Repasse pago</strong>
              <p className="text-zinc-400">
                A comissão calculada reflete os serviços concluídos no período. O registro de pagamento efetivo de repasses e saldo devido ao profissional faz parte da evolução financeira (Fase P2).
              </p>
            </div>
          </div>
        </section>

        {/* Componente de configuração por serviço */}
        <CommissionSettings />
      </main>
    </div>
  );
}
