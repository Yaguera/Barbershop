'use client';

import { getReceptionAgendaAction } from '@/app/actions/reception-actions';
import { ManualAppointmentDialog } from '@/components/reception/ManualAppointmentDialog';
import { ReceptionNavbar } from '@/components/reception/ReceptionNavbar';
import { getYYYYMMDD } from '@/core/utils/date-utils';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Scissors,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface AppointmentItem {
  id: string;
  barberId: string;
  barberName: string;
  startTime: string | Date;
  endTime: string | Date;
  status: string;
  origin: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  isRegisteredClient: boolean;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  priceCents: number;
  isPaid: boolean;
  paymentStatus: 'NOT_APPLICABLE' | 'AWAITING_PAYMENT' | 'PAID';
}

interface BarberOption {
  id: string;
  name: string;
  image?: string | null;
  workDays: number[];
  workStart: string;
  workEnd: string;
}

interface ServiceOption {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

export default function AtendenteAgendaPage() {
  const { status: authStatus } = useSession();

  // Data selecionada (padrão hoje no fuso local)
  const [selectedDate, setSelectedDate] = useState(() => getYYYYMMDD(new Date()));
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [barbers, setBarbers] = useState<BarberOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenModal = () => setIsModalOpen(true);

  const loadAgenda = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getReceptionAgendaAction(selectedDate, selectedBarberId);
      if (res.success) {
        setAppointments((res.appointments as unknown as AppointmentItem[]) || []);
        if (res.barbers) setBarbers(res.barbers);
        if (res.services) setServices(res.services);
      } else {
        setError(res.error || 'Erro ao carregar a agenda da recepção.');
      }
    } catch {
      setError('Erro de conexão ao buscar a agenda.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === 'authenticated') {
      loadAgenda();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, selectedDate, selectedBarberId]);

  // Navegação de datas
  const changeDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    setSelectedDate(getYYYYMMDD(date));
  };

  const setToday = () => {
    setSelectedDate(getYYYYMMDD(new Date()));
  };

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col font-sans pb-24 md:pb-8">
      <ReceptionNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Barra Superior de Operação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <CalendarIcon className="w-6 h-6 text-[#D4AF37]" />
              <span>Agenda da Recepção</span>
            </h1>
            <p className="text-white/60 text-xs sm:text-sm mt-0.5">
              Consulte os horários da equipe e crie agendamentos manuais para clientes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0A0A0A] transition-all shadow-lg shadow-[#D4AF37]/15 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Agendamento</span>
            </button>
          </div>
        </div>

        {/* Controles de Data e Filtro */}
        <div className="bg-[#141414] rounded-2xl border border-white/5 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          {/* Navegação de Data */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors cursor-pointer"
              title="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={setToday}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors cursor-pointer"
            >
              Hoje
            </button>

            <button
              onClick={() => changeDate(1)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors cursor-pointer"
              title="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#1C1C1C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            />
          </div>

          {/* Filtro de Barbeiro */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Filter className="w-4 h-4 text-[#D4AF37]" />
              <span>Profissional:</span>
            </div>
            <select
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="bg-[#1C1C1C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            >
              <option value="all">Toda a Equipe</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <button
              onClick={loadAgenda}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
              title="Atualizar"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Grid de Atendimentos */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-white/40">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
            <p className="text-xs">Carregando horários da equipe...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-[#121212] rounded-2xl border border-white/5 p-12 text-center text-white/40 space-y-3">
            <CalendarIcon className="w-10 h-10 mx-auto text-white/20" />
            <p className="text-sm font-semibold text-white/70">Nenhum agendamento para esta data</p>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              Utilize o botão &quot;Novo Agendamento&quot; acima para reservar horários para clientes que entraram em contato.
            </p>
          </div>
        ) : (
          <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between text-xs text-white/60">
              <span className="font-semibold uppercase tracking-wider">
                Atendimentos ({appointments.length})
              </span>
              <span>
                {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                })}
              </span>
            </div>

            <div className="divide-y divide-white/5">
              {appointments.map((app) => {
                const start = new Date(app.startTime);
                const end = new Date(app.endTime);
                return (
                  <div
                    key={app.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Horário */}
                      <div className="w-20 shrink-0 text-center py-2 px-2.5 rounded-xl bg-[#1C1C1C] border border-[#D4AF37]/20">
                        <p className="text-xs font-black text-[#D4AF37]">
                          {start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-white/40">
                          {end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Dados do Cliente e Serviço */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{app.clientName}</span>
                          {app.origin === 'WHATSAPP' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              WhatsApp
                            </span>
                          )}
                          {app.origin === 'WALK_IN' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              Presencial
                            </span>
                          )}
                          {app.origin === 'ONLINE' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                              Online
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
                          <span className="flex items-center gap-1 text-white/80">
                            <Scissors className="w-3.5 h-3.5 text-[#D4AF37]" />
                            {app.serviceName} ({app.serviceDuration} min)
                          </span>
                          <span>•</span>
                          <span className="text-white/60">Barbeiro: <strong className="text-white">{app.barberName}</strong></span>
                          {app.clientPhone && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-white/50">
                                <Phone className="w-3 h-3" />
                                {app.clientPhone}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status & Financeiro */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <p className="font-bold text-xs text-[#D4AF37]">{formatPrice(app.servicePrice)}</p>
                        <div className="mt-1">
                          {app.status === 'COMPLETED' ? (
                            app.isPaid ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Pago no Caixa
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                Aguardando Pagamento
                              </span>
                            )
                          ) : app.status === 'PENDING' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">
                              Agendado
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                              {app.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {isModalOpen && (
        <ManualAppointmentDialog
          barbers={barbers}
          services={services}
          initialDate={selectedDate}
          initialBarberId={selectedBarberId === 'all' ? undefined : selectedBarberId}
          onClose={() => setIsModalOpen(false)}
          onCreated={(date) => {
            if (date !== selectedDate) setSelectedDate(date);
            else void loadAgenda();
          }}
        />
      )}
    </div>
  );
}
