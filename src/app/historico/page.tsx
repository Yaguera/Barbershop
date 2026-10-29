import { Pagination } from '@/components/Pagination';
import { auth } from '@/auth';
import { BottomNavigation } from '@/components/lux/BottomNavigation';
import { Header } from '@/components/lux/Header';
import { prisma } from '@/infra/db/prisma-client';
import { CheckCircle2,Clock,RotateCcw,Scissors,Sparkles,XCircle } from 'lucide-react';
import { ForbiddenView } from '@/components/auth/ForbiddenView';
import { UnauthorizedView } from '@/components/auth/UnauthorizedView';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HistoricoPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth();

  if (!session?.user?.id) {
    return <UnauthorizedView callbackUrl="/historico" />;
  }

  if (session.user.role !== 'CLIENT') {
    return (
      <ForbiddenView
        currentRole={session.user.role}
        allowedRoles={['CLIENT']}
        message="O histórico de atendimentos de cliente é exclusivo para clientes da barbearia."
      />
    );
  }

  const requestedPage = Number((await searchParams).page || 1);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 10000) : 1;
  const now = new Date();
  const rows = await prisma.appointment.findMany({
    skip: (page - 1) * 30,
    take: 31,
    where: {
      clientId: session.user.id,
      OR: [
        { status: { in: ['COMPLETED', 'CANCELED', 'NO_SHOW'] } },
        { startTime: { lt: new Date(now.getTime() - 15 * 60 * 1000) } },
      ],
    },
    include: {
      barber: {
        include: { user: true },
      },
      service: true,
    },
    orderBy: { startTime: 'desc' },
  });

  const hasMore = rows.length > 30;
  const appointments = rows.slice(0, 30);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#FFFFFF] flex flex-col pb-24 md:pb-12 selection:bg-[#D4AF37]/30 font-sans">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-6 py-8 w-full space-y-6">
        {/* Title Section */}
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
              SEUS ATENDIMENTOS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Histórico
          </h1>
          <p className="mt-2 text-sm text-zinc-400">Consulte seus atendimentos anteriores e suas situações.</p>
        </div>

        {/* List of Past Appointments */}
        {appointments.length === 0 ? (
          <div className="bg-[#151515] border border-white/10 rounded-2xl p-8 sm:p-14 text-center space-y-5">
            <div className="w-12 h-12 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#C5A059] mx-auto">
              <Clock className="w-6 h-6 stroke-[1.6]" />
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <h3 className="text-base font-semibold text-white">Nenhum histórico registrado</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Quando você realizar ou concluir atendimentos, eles ficarão salvos aqui.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/?action=agendar"
                className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-[#C5A059]/60 text-white font-medium text-xs transition-all"
              >
                <Scissors className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Agendar um horário</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => {
              const isCompleted = appt.status === 'COMPLETED';
              const isCanceled = appt.status === 'CANCELED';
              const isNoShow = appt.status === 'NO_SHOW';
              const isPending = !isCompleted && !isCanceled && !isNoShow;

              return (
                <div
                  key={appt.id}
                  className="bg-[#141414] border border-white/[0.07] hover:border-white/15 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      {isCompleted ? (
                        <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : isCanceled || isNoShow ? (
                        <div className="w-9 h-9 rounded-md bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                          <XCircle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-md bg-white/[0.04] text-[#C5A059] flex items-center justify-center border border-white/10">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-white text-sm sm:text-base truncate">{appt.service.name}</h4>
                        {isCompleted && (
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Concluído
                          </span>
                        )}
                        {isCanceled && (
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                            Cancelado
                          </span>
                        )}
                        {isNoShow && (
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                            Falta
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] text-[#C5A059] border border-white/10">
                            Pendente
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 mt-1">
                        Profissional: <span className="text-zinc-200 font-medium">{appt.barber.user?.name || 'Barbeiro Master'}</span>
                      </p>

                      <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-normal mt-1.5">
                        <span>{formatDate(appt.startTime)}</span>
                        <span>•</span>
                        <span>{formatTime(appt.startTime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/[0.06] pt-3 sm:pt-0 gap-3">
                    <span className="font-bold text-[#C5A059] text-base">
                      R$ {(appt.priceCents / 100).toFixed(2)}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/agenda/${appt.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white border border-white/10 hover:border-white/25 transition-all"
                      >
                        <span>Ver detalhes</span>
                      </Link>
                      <Link
                        href="/?action=agendar"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-zinc-200 hover:text-white border border-white/10 hover:border-[#C5A059]/50 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Agendar de novo</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Pagination page={page} hasMore={hasMore} path="/historico" />
      </main>

      <BottomNavigation activeTab="historico" />
    </div>
  );
}
