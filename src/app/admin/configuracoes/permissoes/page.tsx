'use client';

import { AdminNavbar } from '@/components/admin/AdminNavbar';
import {
  Briefcase,
  CheckCircle2,
  Lock,
  Percent,
  ShieldCheck,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

interface RoleSpec {
  role: 'ADMIN' | 'BARBER' | 'RECEPTIONIST' | 'CLIENT';
  label: string;
  badgeClass: string;
  summary: string;
  homeRoute: string;
  allowedRoutes: string[];
  allowedOperations: string[];
  blockedOperations: string[];
  manageHref?: string;
  manageLabel?: string;
}

const ROLES: RoleSpec[] = [
  {
    role: 'ADMIN',
    label: 'Administrador (ADMIN)',
    badgeClass: 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/40',
    summary:
      'Acesso integral à inteligência de gestão, indicadores financeiros, configuração de comissões, catálogo de serviços, equipe e auditoria de estornos.',
    homeRoute: '/admin/dashboard',
    allowedRoutes: [
      '/admin/dashboard',
      '/admin/calendario',
      '/admin/financeiro',
      '/admin/barbeiros e /admin/barbeiros/[id]/metricas',
      '/admin/atendentes',
      '/admin/servicos e /admin/clientes',
      '/admin/configuracoes/comissoes e /admin/configuracoes/permissoes',
      '/profile',
    ],
    allowedOperations: [
      'Consultar produção, recebimentos no caixa, comissões e parte da barbearia',
      'Marcar agendamentos como concluídos, falta ou cancelados dentro das seções operacionais do Painel Admin',
      'Confirmar pagamentos realizados (Dinheiro, Pix, Cartão) e reverter recebimentos com justificativa auditável dentro do Painel Admin',
      'Cadastrar e desativar barbeiros e atendentes (com revogação imediata de sessão)',
      'Configurar catálogo de serviços e taxas de comissão para novos agendamentos',
    ],
    blockedOperations: [
      'Acesso às telas operacionais exclusivas de atendentes (/atendente/*) e barbeiros (/barber/*) — redireciona automaticamente para /admin/dashboard',
      'Acesso às telas exclusivas de agendamento pessoal de cliente (/agenda, /historico)',
    ],
  },
  {
    role: 'BARBER',
    label: 'Barbeiro (BARBER)',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    summary:
      'Acesso restrito à própria agenda profissional e às próprias métricas de produção e comissão.',
    homeRoute: '/barber/dashboard',
    allowedRoutes: [
      '/barber/dashboard',
      '/barber/agenda',
      '/barber/metricas',
      '/profile',
    ],
    allowedOperations: [
      'Consultar a própria fila diária e agenda mensal',
      'Marcar atendimentos próprios como concluídos (COMPLETED), falta (NO_SHOW) ou cancelados',
      'Acompanhar os próprios serviços concluídos e a própria comissão calculada',
    ],
    blockedOperations: [
      'Consultar agenda, clientes ou métricas de outros barbeiros (bloqueado no servidor com 403)',
      'Confirmar ou estornar pagamentos no caixa',
      'Alterar preços, taxas de comissão ou configurações administrativas',
    ],
    manageHref: '/admin/barbeiros',
    manageLabel: 'Gerenciar Barbeiros',
  },
  {
    role: 'RECEPTIONIST',
    label: 'Atendente / Recepção (RECEPTIONIST)',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    summary:
      'Operação diária de agendas da equipe, reservas manuais (WhatsApp/presencial) e confirmação de pagamentos no caixa.',
    homeRoute: '/atendente',
    allowedRoutes: ['/atendente', '/atendente/caixa', '/profile'],
    allowedOperations: [
      'Visualizar agendas diárias de todos os barbeiros e filtrar por profissional',
      'Criar agendamentos manuais para clientes cadastrados ou contatos sem conta (WALK_IN / WHATSAPP)',
      'Buscar clientes por nome ou telefone com retorno mínimo',
      'Confirmar recebimentos de atendimentos concluídos informando método (Dinheiro, Pix, Cartão)',
    ],
    blockedOperations: [
      'Acessar relatórios gerenciais de lucro, comissões da equipe ou configurações (/admin/* → 403)',
      'Estornar recebimentos já confirmados (exclusivo do Administrador)',
      'Acessar fluxo de reserva de cliente comum (/agenda, /historico → 403)',
    ],
    manageHref: '/admin/atendentes',
    manageLabel: 'Gerenciar Atendentes',
  },
  {
    role: 'CLIENT',
    label: 'Cliente (CLIENT)',
    badgeClass: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
    summary:
      'Agendamento online autenticado, consulta e gestão apenas dos próprios horários e histórico.',
    homeRoute: '/agenda',
    allowedRoutes: ['/', '/agenda', '/agenda/[id]', '/historico', '/profile'],
    allowedOperations: [
      'Criar reservas online autenticado na própria conta',
      'Consultar, reagendar ou cancelar apenas seus próprios agendamentos elegíveis',
      'Atualizar seus próprios dados de perfil e senha',
    ],
    blockedOperations: [
      'Acessar painéis administrativos, do barbeiro ou da recepção (/admin/*, /barber/*, /atendente/* → 403)',
      'Visualizar agendamentos de terceiros (/agenda/[id] de outro cliente retorna 404 para não revelar existência)',
      'Confirmar conclusão de atendimento ou pagamento',
    ],
    manageHref: '/admin/clientes',
    manageLabel: 'Consultar Clientes',
  },
];

export default function AdminPermissoesPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col selection:bg-[#D4AF37]/30">
      <AdminNavbar activePage="permissoes" />

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-8 space-y-6 max-w-6xl">
        {/* Cabeçalho e Subnavegação de Configurações */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Configurações do Sistema</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Permissões e Perfis de Acesso
            </h1>
            <p className="text-white/60 text-xs sm:text-sm mt-1">
              Matriz de controle de acesso baseada em papéis fixos (RBAC), políticas de sessão e isolamento de dados no servidor.
            </p>
          </div>

          <div
            className="inline-flex rounded-xl bg-[#151515] p-1 border border-white/10"
            role="navigation"
            aria-label="Subnavegação de configurações"
          >
            <Link
              href="/admin/configuracoes/comissoes"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Percent className="w-3.5 h-3.5" />
              Comissões
            </Link>
            <Link
              href="/admin/configuracoes/permissoes"
              aria-current="page"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-black"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Permissões e Perfis
            </Link>
          </div>
        </div>

        {/* Garantias Técnicas de Autorização */}
        <section
          aria-labelledby="security-guarantees-heading"
          className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <h2 id="security-guarantees-heading" className="text-base font-semibold text-white">
              Políticas Ativas de Autenticação, Autorização e Revogação
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-xs leading-relaxed">
            <div className="rounded-xl border border-white/10 bg-[#1C1C1C] p-4 space-y-1.5">
              <strong className="block text-white">HTTP 401 vs HTTP 403 Semânticos</strong>
              <p className="text-zinc-400">
                Visitantes sem sessão ativa recebem <strong className="text-zinc-200">HTTP 401</strong>. Contas autenticadas tentando acessar área de outro perfil recebem <strong className="text-zinc-200">HTTP 403 (Acesso negado)</strong> sem redirecionamento indevido.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#1C1C1C] p-4 space-y-1.5">
              <strong className="block text-white">Validação Dupla no Servidor</strong>
              <p className="text-zinc-400">
                Todas as <em>Server Actions</em>, casos de uso e endpoints validam o papel da sessão e a propriedade do registro no servidor, impedindo acesso por manipulação de IDs ou parâmetros na URL.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#1C1C1C] p-4 space-y-1.5">
              <strong className="block text-white">Revogação Imediata de Sessão</strong>
              <p className="text-zinc-400">
                Ao desativar um barbeiro ou atendente, o contador <code className="text-[#D4AF37]">sessionVersion</code> é incrementado no banco, invalidando tokens antigos imediatamente sem apagar o histórico.
              </p>
            </div>
          </div>
        </section>

        {/* Atalhos de Gestão de Contas */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/barbeiros"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-[#151515] px-4 py-2 text-xs font-bold text-white hover:bg-white/5"
          >
            <Briefcase className="w-4 h-4 text-[#D4AF37]" />
            Gerenciar contas de Barbeiros
          </Link>
          <Link
            href="/admin/atendentes"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-[#151515] px-4 py-2 text-xs font-bold text-white hover:bg-white/5"
          >
            <UserCheck className="w-4 h-4 text-[#D4AF37]" />
            Gerenciar contas de Atendentes
          </Link>
          <Link
            href="/admin/clientes"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-[#151515] px-4 py-2 text-xs font-bold text-white hover:bg-white/5"
          >
            <Users className="w-4 h-4 text-[#D4AF37]" />
            Consultar base de Clientes
          </Link>
        </div>

        {/* Matriz de Papéis Fixos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ROLES.map((item) => (
            <section
              key={item.role}
              className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase ${item.badgeClass}`}
                    >
                      {item.role}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-2">{item.label}</h3>
                  </div>
                  <span className="text-xs text-zinc-400 bg-[#1C1C1C] border border-white/10 rounded-lg px-2.5 py-1">
                    Entrada: <code className="text-zinc-200">{item.homeRoute}</code>
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-zinc-300">{item.summary}</p>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Rotas Autorizadas
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {item.allowedRoutes.map((route) => (
                      <code
                        key={route}
                        className="rounded-lg bg-[#1C1C1C] border border-white/10 px-2.5 py-1 text-[11px] text-zinc-200"
                      >
                        {route}
                      </code>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Operações Permitidas
                  </h4>
                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {item.allowedOperations.map((op) => (
                      <li key={op} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{op}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400">
                    Restrições e Bloqueios
                  </h4>
                  <ul className="space-y-1.5 text-xs text-zinc-400">
                    {item.blockedOperations.map((op) => (
                      <li key={op} className="flex items-start gap-2">
                        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span>{op}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {item.manageHref && item.manageLabel && (
                <div className="pt-3 border-t border-white/10 flex justify-end">
                  <Link
                    href={item.manageHref}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 px-3.5 py-1.5 text-xs font-bold text-[#D4AF37] transition-colors"
                  >
                    {item.manageLabel} →
                  </Link>
                </div>
              )}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
