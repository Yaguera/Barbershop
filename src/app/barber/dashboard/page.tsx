'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Sparkles, 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Clock, 
  Star, 
  TrendingUp, 
  ChevronRight, 
  User as UserIcon,
  Quote,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { BarberNavbar } from '@/components/barber/BarberNavbar';
import { getBarberMetricsDetailedAction, getBarberAppointmentsAction } from '@/app/actions/appointment-actions';

interface ReviewItem {
  id: string;
  name: string;
  date: string;
  stars: number;
  comment: string;
  avatar?: string;
}

const mockReviews: ReviewItem[] = [
  {
    id: 'rev-1',
    name: 'Dr. Roberto Mendonça',
    date: 'Ontem',
    stars: 5,
    comment: 'Atendimento de altíssimo padrão! Corte impecável e pontualidade britânica. Melhor barbearia da cidade.'
  },
  {
    id: 'rev-2',
    name: 'Fernando Vasconcelos',
    date: 'Há 3 dias',
    stars: 5,
    comment: 'Profissionalismo fantástico. O ambiente é extremamente elegante e o barbeiro sabe exatamente o que faz. Recomendo 100%.'
  },
  {
    id: 'rev-3',
    name: 'Lucas Sampaio',
    date: '15 de Julho',
    stars: 5,
    comment: 'O ritual de barba na toalha quente foi espetacular. Acabamento perfeito e ótimo bate-papo.'
  }
];

export default function BarberDashboardHome() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<{
    totalAppointments: number;
    totalRevenue: number;
  }>({ totalAppointments: 0, totalRevenue: 0 });
  const [todayCount, setTodayCount] = useState<number>(0);
  const [barberProfileId, setBarberProfileId] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, todayRes] = await Promise.all([
        getBarberMetricsDetailedAction('month'),
        getBarberAppointmentsAction(new Date().toISOString().split('T')[0])
      ]);

      if (metricsRes.success && metricsRes.report) {
        setMetrics({
          totalAppointments: metricsRes.report.totalAppointments,
          totalRevenue: metricsRes.report.totalRevenue
        });
        if (metricsRes.barberId) setBarberProfileId(metricsRes.barberId);
      }

      if (todayRes.success && todayRes.appointments) {
        setTodayCount(todayRes.appointments.length);
        if (todayRes.barberId && !barberProfileId) {
          setBarberProfileId(todayRes.barberId);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard do barbeiro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [session?.user]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const userName = session?.user?.name || 'Barbeiro Master';
  const userImage = session?.user?.image;
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#FFFFFF] flex flex-col selection:bg-[#D4AF37]/30 font-sans pb-24">
      <BarberNavbar barberProfileId={barberProfileId || undefined} />

      <main className="flex-grow max-w-6xl mx-auto px-6 py-8 w-full space-y-10">
        
        {/* Header de Perfil do Barbeiro */}
        <section className="bg-gradient-to-br from-[#151515] via-[#151515] to-[#1C1C1C] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              {/* Profile Image / Fallback Initials */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-2 border-[#D4AF37] p-1 bg-[#1C1C1C] shadow-[0_0_25px_rgba(212,175,55,0.25)] shrink-0 flex items-center justify-center overflow-hidden">
                {userImage ? (
                  <Image 
                    src={userImage} 
                    alt={userName} 
                    width={96} 
                    height={96} 
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-black text-[#D4AF37] tracking-wider">
                    {initials}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-xs font-black uppercase tracking-wider border border-[#D4AF37]/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Barbeiro Profissional</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#22C55E]/15 text-[#22C55E] text-xs font-bold border border-[#22C55E]/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Ativo</span>
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight pt-1">
                  Olá, {userName}!
                </h1>
                <p className="text-white/60 text-xs sm:text-sm">
                  Bem-vindo ao seu painel executivo. Confira seus desempenhos e agenda de hoje.
                </p>
              </div>
            </div>

            {/* Quick action button to Agenda */}
            <div className="flex items-center gap-3 self-start sm:self-center">
              <Link
                href="/barber/agenda"
                className="px-6 py-3.5 rounded-2xl bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-extrabold text-xs sm:text-sm shadow-xl hover:shadow-[#D4AF37]/20 transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
              >
                <Calendar className="w-4 h-4 stroke-[2.5]" />
                <span>Ver Agenda Completa</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>
        </section>

        {/* Cards de Resumo (Mês Atual) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
              <span>Resumo do Mês Atual</span>
            </h2>
            <Link 
              href="/barber/metricas" 
              className="text-xs text-[#D4AF37] hover:underline font-bold flex items-center gap-1"
            >
              <span>Relatórios Detalhados</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Total de Atendimentos */}
            <div className="bg-[#151515] hover:bg-[#1C1C1C] border border-white/10 rounded-3xl p-6 shadow-2xl transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#22C55E]/5 rounded-full blur-2xl group-hover:bg-[#22C55E]/10 transition-all pointer-events-none" />
              
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white/50 block">
                    Total de Atendimentos
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white mt-2 tracking-tight">
                    {isLoading ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-white/40 my-2" />
                    ) : (
                      metrics.totalAppointments
                    )}
                  </div>
                  <p className="text-xs text-[#22C55E] font-semibold mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Serviços com status Finalizado</span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 stroke-[2]" />
                </div>
              </div>
            </div>

            {/* Card 2: Faturamento Acumulado */}
            <div className="bg-[#151515] hover:bg-[#1C1C1C] border border-white/10 rounded-3xl p-6 shadow-2xl transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl group-hover:bg-[#D4AF37]/15 transition-all pointer-events-none" />
              
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white/50 block">
                    Faturamento Acumulado
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-[#D4AF37] mt-2 tracking-tight">
                    {isLoading ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-[#D4AF37]/60 my-2" />
                    ) : (
                      formatPrice(metrics.totalRevenue)
                    )}
                  </div>
                  <p className="text-xs text-white/60 font-medium mt-2">
                    Soma total dos serviços realizados no mês
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center shrink-0">
                  <DollarSign className="w-6 h-6 stroke-[2]" />
                </div>
              </div>
            </div>

            {/* Card 3: Atendimentos Hoje */}
            <div className="bg-[#151515] hover:bg-[#1C1C1C] border border-white/10 rounded-3xl p-6 shadow-2xl transition-all relative overflow-hidden group sm:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
              
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white/50 block">
                    Atendimentos Hoje
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white mt-2 tracking-tight">
                    {isLoading ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-white/40 my-2" />
                    ) : (
                      todayCount
                    )}
                  </div>
                  <p className="text-xs text-white/60 font-medium mt-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Clientes agendados para a data atual</span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6 stroke-[2]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção de Avaliações (Mock/Simulação) */}
        <section className="bg-[#151515] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                  Reputação & Qualidade
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Feedback dos Clientes
              </h2>
            </div>

            {/* Média Simulação Card */}
            <div className="flex items-center gap-4 bg-[#1C1C1C] border border-white/10 px-5 py-3 rounded-2xl">
              <div className="text-3xl font-black text-[#D4AF37] tracking-tighter">
                4.8
              </div>
              <div className="space-y-0.5 border-l border-white/10 pl-4">
                <div className="flex items-center text-[#D4AF37]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-[#D4AF37]" />
                  ))}
                </div>
                <span className="text-[11px] text-white/60 font-medium block">
                  Média de 142 avaliações verificadas
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {mockReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#1C1C1C]/80 hover:bg-[#1C1C1C] border border-white/5 rounded-2xl p-6 transition-all flex flex-col justify-between space-y-4 relative group"
              >
                <Quote className="w-8 h-8 text-[#D4AF37]/15 absolute top-4 right-4 pointer-events-none group-hover:text-[#D4AF37]/30 transition-all" />
                
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center gap-1 text-[#D4AF37]">
                    {Array.from({ length: rev.stars }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-[#D4AF37]" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed italic">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-white/5 relative z-10">
                  <div className="w-9 h-9 rounded-full bg-[#151515] border border-white/10 flex items-center justify-center text-xs font-black text-[#D4AF37]">
                    {rev.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">{rev.name}</h4>
                    <span className="text-[10px] text-white/40 block">{rev.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
