import React from 'react';
import { auth } from '@/auth';
import { prisma } from '@/infra/db/prisma-client';
import { Header } from '@/components/lux/Header';
import { BottomNavigation } from '@/components/lux/BottomNavigation';
import { Clock, CheckCircle2, XCircle, AlertTriangle, RotateCcw, Scissors, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function HistoricoPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/historico');
  }

  const now = new Date();
  const appointments = await prisma.appointment.findMany({
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
    take: 30,
  });

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
    <div className="min-h-screen bg-[#0D0D0D] text-[#FFFFFF] flex flex-col pb-24 selection:bg-[#D4AF37]/30 font-sans">
      <Header />

      <main className="flex-grow max-w-4xl mx-auto px-6 py-8 w-full space-y-6">
        {/* Title Section */}
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              Registro de Atendimentos
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Histórico Completo
          </h1>
        </div>

        {/* List of Past Appointments */}
        {appointments.length === 0 ? (
          <div className="bg-[#151515] border border-white/10 rounded-3xl p-10 sm:p-14 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#1C1C1C] border border-white/10 flex items-center justify-center text-[#D4AF37] mx-auto shadow-inner">
              <Clock className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <h3 className="text-lg font-bold text-white">Nenhum histórico registrado</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Quando você realizar ou concluir atendimentos, eles ficarão salvos aqui.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/?action=agendar"
                className="inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-bold text-sm shadow-xl shadow-[#D4AF37]/25 transition-all hover:scale-105"
              >
                <Scissors className="w-4 h-4" />
                <span>Realizar Primeiro Corte</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => {
              const isCompleted = appt.status === 'COMPLETED' || (appt.status === 'PENDING' && appt.startTime < now);
              const isCanceled = appt.status === 'CANCELED';
              const isNoShow = appt.status === 'NO_SHOW';

              return (
                <div
                  key={appt.id}
                  className="bg-[#151515] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-white/20 shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      {isCompleted ? (
                        <div className="w-10 h-10 rounded-xl bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center border border-[#22C55E]/30">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : isCanceled || isNoShow ? (
                        <div className="w-10 h-10 rounded-xl bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center border border-[#EF4444]/30">
                          <XCircle className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/30">
                          <Clock className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-white text-base truncate">{appt.service.name}</h4>
                        {isCompleted && (
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                            Concluído
                          </span>
                        )}
                        {isCanceled && (
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                            Cancelado
                          </span>
                        )}
                        {isNoShow && (
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                            No-Show
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-white/60 mt-1">
                        Profissional: <span className="text-white font-medium">{appt.barber.user?.name || 'Barbeiro Master'}</span>
                      </p>

                      <div className="flex items-center gap-3 text-xs text-[#D4AF37] font-semibold mt-1.5">
                        <span>{formatDate(appt.startTime)}</span>
                        <span>•</span>
                        <span>{formatTime(appt.startTime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0 gap-3">
                    <span className="font-bold text-white text-base">
                      R$ {appt.service.price.toFixed(2)}
                    </span>

                    <Link
                      href="/?action=agendar"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#D4AF37]/15 text-xs font-bold text-white hover:text-[#D4AF37] border border-white/10 hover:border-[#D4AF37]/40 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Agendar de novo</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNavigation activeTab="historico" />
    </div>
  );
}
