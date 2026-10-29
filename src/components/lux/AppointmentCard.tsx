'use client';

import { getClientAppointmentsAction } from '@/app/actions/appointment-actions';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Clock, RefreshCw, User as UserIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AppointmentCardProps {
  id?: string;
  autoFetch?: boolean;
  date?: string;
  time?: string;
  barberName?: string;
  serviceName?: string;
  status?: string;
  onDetailsClick?: () => void;
}

interface DynamicAppointment {
  id: string;
  status: string;
  startTime: string | Date;
  serviceName: string;
  servicePrice: number;
  barberName: string;
}

export function AppointmentCard({
  id: propId,
  autoFetch = false,
  date: propDate,
  time: propTime,
  barberName: propBarberName,
  serviceName: propServiceName,
  status: propStatus = 'CONFIRMED',
  onDetailsClick,
}: AppointmentCardProps) {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [dynamicAppt, setDynamicAppt] = useState<DynamicAppointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!autoFetch) return;

    async function loadNextAppointment() {
      if (!session?.user) return;
      setIsLoading(true);
      try {
        const res = await getClientAppointmentsAction(1, true);
        if (res.success && 'appointments' in res && res.appointments) {
          const upcoming = res.appointments
            .filter((app) => app.status === 'PENDING' || app.status === 'CONFIRMED')
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

          if (upcoming.length > 0) {
            setDynamicAppt(upcoming[0] as DynamicAppointment);
          } else {
            setDynamicAppt(null);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar próximo agendamento do cliente:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user) {
      loadNextAppointment();
    }
  }, [autoFetch, session?.user]);

  // Se autoFetch for verdadeiro e o usuário não estiver logado, não renderiza
  if (autoFetch && !session?.user && authStatus !== 'loading') {
    return null;
  }

  // Se estiver carregando no modo autoFetch
  if (autoFetch && (authStatus === 'loading' || isLoading)) {
    return (
      <section className="w-full max-w-7xl mx-auto py-2">
        <div className="px-6">
          <div className="bg-[#141414] border border-white/[0.07] rounded-lg p-6 flex items-center justify-center gap-3 text-zinc-400 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" />
            <span className="text-xs font-medium">Consultando agendamentos...</span>
          </div>
        </div>
      </section>
    );
  }

  // Se for autoFetch e o cliente não tiver nenhum agendamento futuro confirmado ou pendente, não exibe cartão de exemplo falso
  if (autoFetch && !dynamicAppt) {
    return null;
  }

  // Se não for autoFetch e não tiver dados válidos para exibição
  if (!autoFetch && !propServiceName && !dynamicAppt) {
    return null;
  }

  const apptDateObj = dynamicAppt ? new Date(dynamicAppt.startTime) : null;

  const formattedDate = apptDateObj
    ? apptDateObj
        .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
        .replace('-feira', '')
        .replace(/^\w/, (c) => c.toUpperCase())
    : typeof propDate === 'string'
    ? propDate.replace('-feira', '').replace(/^\w/, (c) => c.toUpperCase())
    : 'Data a definir';

  const formattedTime = apptDateObj
    ? apptDateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : propTime || '--:--';

  const formattedBarber = dynamicAppt ? dynamicAppt.barberName : propBarberName || 'Profissional';
  const formattedService = dynamicAppt ? dynamicAppt.serviceName : propServiceName || 'Serviço';
  const finalStatus = dynamicAppt ? dynamicAppt.status : propStatus;
  const isConfirmed = finalStatus === 'CONFIRMED';
  const isPending = finalStatus === 'PENDING';
  const targetId = dynamicAppt?.id || propId;

  const handleDetailsClick = () => {
    if (onDetailsClick) {
      onDetailsClick();
    } else if (targetId) {
      router.push(`/agenda/${targetId}`);
    } else {
      router.push('/agenda');
    }
  };

  return (
    <section className={`w-full ${autoFetch ? 'max-w-7xl mx-auto py-2 md:py-4' : 'py-2'}`}>
      <div className={autoFetch ? 'px-6' : 'px-0'}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-[#141414] rounded-lg p-5 md:p-6 border border-white/[0.07] hover:border-white/15 transition-all duration-200"
        >
          {/* Top Title inside Card */}
          <div className="flex items-center justify-between gap-2 mb-3.5 border-b border-white/[0.06] pb-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 truncate">
              {autoFetch ? 'Próximo horário agendado' : formattedService}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase shrink-0 border ${
                isConfirmed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : isPending
                  ? 'bg-white/[0.04] text-[#C5A059] border-white/10'
                  : 'bg-white/[0.04] text-zinc-400 border-white/10'
              }`}
            >
              {isConfirmed ? 'Confirmado' : isPending ? 'Agendado' : finalStatus}
            </span>
          </div>

          {/* Middle Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-3.5 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-[#C5A059] stroke-[1.8]" />
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:gap-6 min-w-0 flex-1">
                <div>
                  <span className="text-sm md:text-[15px] font-semibold text-white truncate leading-tight block">
                    {formattedDate}
                  </span>

                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>{formattedTime}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <UserIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">com {formattedBarber}</span>
                    </div>
                  </div>
                </div>

                {autoFetch && (
                  <div className="mt-1 md:mt-0 md:px-2.5 md:py-1 md:rounded-md md:bg-white/[0.04] md:border md:border-white/10 text-xs font-medium text-zinc-200 truncate w-fit">
                    {formattedService}
                  </div>
                )}
              </div>
            </div>

            {autoFetch && (
              <div className="hidden md:block shrink-0">
                <button
                  type="button"
                  onClick={handleDetailsClick}
                  className="px-4 py-2 rounded-md bg-white/[0.04] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/10 hover:border-white/25 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Ver Detalhes</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom Button inside Card (Mobile always, or non-autoFetch cards) */}
          <div className={`mt-4 pt-3 border-t border-white/[0.06] ${autoFetch ? 'md:hidden' : ''}`}>
            <button
              type="button"
              onClick={handleDetailsClick}
              className="w-full text-center text-xs font-medium text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 py-1 transition-colors group cursor-pointer"
            >
              <span>Ver Detalhes do Agendamento</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2] transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
