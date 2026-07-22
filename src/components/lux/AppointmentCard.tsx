'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User as UserIcon, ChevronRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getClientAppointmentsAction } from '@/app/actions/appointment-actions';

interface AppointmentCardProps {
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
  autoFetch = false,
  date: propDate = 'Sábado, 18 de Maio',
  time: propTime = '10:00',
  barberName: propBarberName = 'Lucas',
  serviceName: propServiceName = 'Corte & Estilo VIP',
  status: propStatus = 'CONFIRMED',
  onDetailsClick,
}: AppointmentCardProps) {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [dynamicAppt, setDynamicAppt] = useState<DynamicAppointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!autoFetch) return; // SOMENTE busca no cliente se autoFetch for ativado (ex: Homepage)

    async function loadNextAppointment() {
      if (!session?.user) return;
      setIsLoading(true);
      try {
        const res = await getClientAppointmentsAction();
        if (res.success && res.appointments) {
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

  // Se autoFetch for verdadeiro (ex: banner da home), só renderiza se estiver logado
  if (autoFetch && !session?.user && authStatus !== 'loading') {
    return null;
  }

  if (autoFetch && (authStatus === 'loading' || isLoading)) {
    return (
      <section className="w-full max-w-6xl mx-auto py-2">
        <div className="px-6">
          <div className="bg-[#151515] border border-white/5 rounded-2xl p-6 flex items-center justify-center gap-3 text-white/50 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-[#D4AF37]" />
            <span className="text-xs font-semibold">Carregando próximo horário...</span>
          </div>
        </div>
      </section>
    );
  }

  const apptDateObj = dynamicAppt ? new Date(dynamicAppt.startTime) : null;
  
  const formattedDate = apptDateObj
    ? apptDateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
        .replace('-feira', '')
        .replace(/^\w/, (c) => c.toUpperCase())
    : typeof propDate === 'string'
    ? propDate.replace('-feira', '').replace(/^\w/, (c) => c.toUpperCase())
    : propDate;
  
  const formattedTime = apptDateObj
    ? apptDateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : propTime;

  const formattedBarber = dynamicAppt
    ? dynamicAppt.barberName
    : propBarberName;

  const formattedService = dynamicAppt
    ? dynamicAppt.serviceName
    : propServiceName;

  const finalStatus = dynamicAppt ? dynamicAppt.status : propStatus;
  const isConfirmed = finalStatus === 'CONFIRMED' || finalStatus === 'PENDING' || finalStatus === 'COMPLETED';

  return (
    <section className="w-full max-w-6xl mx-auto py-2">
      <div className={autoFetch ? 'px-6' : 'px-0'}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-[#151515] rounded-2xl p-5 border border-white/5 shadow-xl hover:border-[#D4AF37]/30 transition-all duration-300"
        >
          {/* Top Title inside Card */}
          <div className="flex items-center justify-between gap-2 mb-3.5 border-b border-white/5 pb-2.5">
            <h3 className="text-sm font-bold text-[#D4AF37] tracking-tight truncate">
              {autoFetch ? 'Próximo horário' : formattedService}
            </h3>
            {!autoFetch && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#052e16] text-[#22C55E] border border-[#14532d] shrink-0">
                {finalStatus === 'CONFIRMED' ? 'Confirmado' : finalStatus === 'PENDING' ? 'Agendado' : finalStatus}
              </span>
            )}
          </div>

          {/* Middle Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-[#1C1C1C] border border-white/5 flex items-center justify-center shrink-0 shadow-md">
                <Calendar className="w-6 h-6 text-[#D4AF37] stroke-[1.8]" />
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-bold text-white truncate leading-tight">
                  {formattedDate}
                </span>
                
                <div className="flex items-center gap-1.5 text-xs text-white/70 mt-1">
                  <Clock className="w-3.5 h-3.5 text-white/50 shrink-0" />
                  <span>{formattedTime}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-white/70 mt-0.5">
                  <UserIcon className="w-3.5 h-3.5 text-white/50 shrink-0" />
                  <span className="truncate">com {formattedBarber}</span>
                </div>

                {autoFetch && (
                  <div className="mt-1 text-xs font-semibold text-[#D4AF37] truncate">
                    {formattedService}
                  </div>
                )}
              </div>
            </div>

            {autoFetch && (
              <div className="shrink-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#052e16] text-[#22C55E] border border-[#14532d]">
                  {isConfirmed ? 'Confirmado' : 'Pendente'}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Button inside Card */}
          <div className="mt-4 pt-3.5 border-t border-white/5">
            <button
              type="button"
              onClick={onDetailsClick || (() => router.push('/agenda'))}
              className="w-full text-center text-xs font-bold text-[#D4AF37] hover:text-[#E2BE4D] uppercase tracking-wider flex items-center justify-center gap-1.5 py-1 transition-colors group cursor-pointer"
            >
              <span>VER DETALHES</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5] transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
