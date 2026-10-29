import { Pagination } from '@/components/Pagination';
import { auth } from '@/auth';
import { AppointmentCard } from '@/components/lux/AppointmentCard';
import { BottomNavigation } from '@/components/lux/BottomNavigation';
import { Header } from '@/components/lux/Header';
import { prisma } from '@/infra/db/prisma-client';
import { Calendar as CalendarIcon,Scissors,Sparkles } from 'lucide-react';
import { ForbiddenView } from '@/components/auth/ForbiddenView';
import { UnauthorizedView } from '@/components/auth/UnauthorizedView';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth();

  if (!session?.user?.id) {
    return <UnauthorizedView callbackUrl="/agenda" />;
  }

  if (session.user.role !== 'CLIENT') {
    return (
      <ForbiddenView
        currentRole={session.user.role}
        allowedRoles={['CLIENT']}
        message="A agenda de cliente é exclusiva para clientes da barbearia."
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
      status: { in: ['PENDING', 'CONFIRMED'] },
      startTime: { gte: new Date(now.getTime() - 15 * 60 * 1000) }, // include active right now / tolerance
    },
    include: {
      barber: {
        include: { user: true },
      },
      service: true,
    },
    orderBy: { startTime: 'asc' },
  });

  const hasMore = rows.length > 30;
  const appointments = rows.slice(0, 30);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
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
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                Sua Cadeira Reservada
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              Meus Agendamentos
            </h1>
          </div>

          <Link
            href="/?action=agendar"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-bold text-sm shadow-lg shadow-[#D4AF37]/20 transition-all"
          >
            <Scissors className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </Link>
        </div>

        {/* Appointments List or Empty State */}
        {appointments.length === 0 ? (
          <div className="bg-[#151515] border border-white/10 rounded-3xl p-10 sm:p-14 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#1C1C1C] border border-white/10 flex items-center justify-center text-[#D4AF37] mx-auto shadow-inner">
              <CalendarIcon className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <h3 className="text-lg font-bold text-white">Nenhum agendamento ativo</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Você ainda não possui horários marcados para os próximos dias.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/?action=agendar"
                className="inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-bold text-sm shadow-xl shadow-[#D4AF37]/25 transition-all hover:scale-105"
              >
                <Scissors className="w-4 h-4" />
                <span>Agendar Horário VIP</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                id={appt.id}
                autoFetch={false}
                date={formatDate(appt.startTime)}
                time={formatTime(appt.startTime)}
                barberName={appt.barber.user?.name || 'Barbeiro Master'}
                serviceName={appt.service.name}
                status={appt.status}
              />
            ))}
          </div>
        )}
        <Pagination page={page} hasMore={hasMore} path="/agenda" />
      </main>

      <BottomNavigation activeTab="agendamentos" />
    </div>
  );
}
