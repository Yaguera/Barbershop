'use client';

import {
  createManualAppointmentAction,
  getReceptionAgendaAction,
  searchClientsForReceptionAction,
} from '@/app/actions/reception-actions';
import { ReceptionNavbar } from '@/components/reception/ReceptionNavbar';
import { getYYYYMMDD } from '@/core/utils/date-utils';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Scissors,
  Search,
  Sparkles,
  User,
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

interface ClientSearchResult {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  type: 'REGISTERED' | 'CONTACT';
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

  // Modal de Novo Agendamento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOrigin, setModalOrigin] = useState<'WHATSAPP' | 'WALK_IN'>('WHATSAPP');
  const [customerMode, setCustomerMode] = useState<'SEARCH' | 'NEW'>('NEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ClientSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ClientSearchResult | null>(null);
  const [isSearchingClients, setIsSearchingClients] = useState(false);

  // Dados do novo contato
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  // Seleções de serviço e barbeiro
  const [modalBarberId, setModalBarberId] = useState('');
  const [modalServiceId, setModalServiceId] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [selectedSlotTime, setSelectedSlotTime] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Data do agendamento manual no modal
  const [modalDate, setModalDate] = useState(() => getYYYYMMDD(new Date()));

  const todayDateStr = getYYYYMMDD(new Date());
  const tomorrowDateStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return getYYYYMMDD(d);
  })();

  const formatModalDateDisplay = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  // Submissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

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

  // Busca de clientes existentes
  useEffect(() => {
    if (customerMode !== 'SEARCH' || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingClients(true);
      try {
        const res = await searchClientsForReceptionAction(searchQuery);
        if (res.success && res.clients) {
          setSearchResults(res.clients as ClientSearchResult[]);
        }
      } finally {
        setIsSearchingClients(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, customerMode]);

  // Carregar slots disponíveis para a reserva manual
  useEffect(() => {
    if (!isModalOpen || !modalBarberId || !modalServiceId || !modalDate) {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setSelectedSlotTime('');
      try {
        const res = await fetch(`/api/barbers/${modalBarberId}/availability?date=${modalDate}&serviceId=${modalServiceId}`);
        if (!res.ok) throw new Error('Falha ao carregar horários disponíveis');
        const data = await res.json();
        setAvailableSlots(data);
      } catch {
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [isModalOpen, modalBarberId, modalServiceId, modalDate]);

  const handleOpenModal = () => {
    setModalError(null);
    setModalSuccess(null);
    setModalOrigin('WHATSAPP');
    setCustomerMode('NEW');
    setSearchQuery('');
    setSelectedCustomer(null);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactEmail('');
    setModalBarberId(barbers[0]?.id || '');
    setModalServiceId(services[0]?.id || '');
    setModalDate(selectedDate >= todayDateStr ? selectedDate : todayDateStr);
    setSelectedSlotTime('');
    setIsModalOpen(true);
  };

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);

    if (!selectedSlotTime) {
      setModalError('Selecione um horário disponível para o agendamento.');
      return;
    }

    let customerPayload: {
      type: 'REGISTERED' | 'NEW_CONTACT' | 'EXISTING_CONTACT';
      clientId?: string;
      contactId?: string;
      name?: string;
      phone?: string;
      email?: string;
    };

    if (customerMode === 'SEARCH') {
      if (!selectedCustomer) {
        setModalError('Selecione um cliente da busca ou use o cadastro de novo contato.');
        return;
      }
      customerPayload = selectedCustomer.type === 'REGISTERED'
        ? { type: 'REGISTERED', clientId: selectedCustomer.id }
        : { type: 'EXISTING_CONTACT', contactId: selectedCustomer.id };
    } else {
      if (!newContactName.trim()) {
        setModalError('O nome do cliente é obrigatório.');
        return;
      }
      if (modalOrigin === 'WHATSAPP' && !newContactPhone.trim()) {
        setModalError('O telefone com DDD é obrigatório para reservas com origem WhatsApp.');
        return;
      }
      customerPayload = {
        type: 'NEW_CONTACT',
        name: newContactName.trim(),
        phone: newContactPhone.trim() || undefined,
        email: newContactEmail.trim() || undefined,
      };
    }

    setIsSubmitting(true);
    try {
      const res = await createManualAppointmentAction({
        customer: customerPayload,
        origin: modalOrigin,
        barberId: modalBarberId,
        serviceId: modalServiceId,
        startTimeStr: selectedSlotTime,
      });

      if (res.success) {
        setModalSuccess(`Reserva confirmada com sucesso para ${formatModalDateDisplay(modalDate)}!`);
        if (modalDate !== selectedDate) {
          setSelectedDate(modalDate);
        } else {
          loadAgenda();
        }
        setTimeout(() => {
          setIsModalOpen(false);
        }, 1200);
      } else {
        setModalError(res.error || 'Falha ao confirmar reserva manual.');
      }
    } catch {
      setModalError('Erro inesperado de comunicação.');
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Modal de Novo Agendamento Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                  <span>Novo Agendamento Manual</span>
                </h2>
                <p className="text-xs text-white/60">Reserva de horário exclusiva da atendente</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <p>{modalError}</p>
              </div>
            )}

            {modalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <p>{modalSuccess}</p>
              </div>
            )}

            <form onSubmit={handleCreateManualBooking} className="space-y-4 text-xs">
              {/* Seleção de Origem */}
              <div>
                <label className="block font-semibold text-white/70 mb-1.5">Origem da Reserva *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOrigin('WHATSAPP')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      modalOrigin === 'WHATSAPP'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-[#1C1C1C] border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalOrigin('WALK_IN')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      modalOrigin === 'WALK_IN'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                        : 'bg-[#1C1C1C] border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Presencial</span>
                  </button>
                </div>
              </div>

              {/* Modo de Cliente */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-white/70">Pessoa Atendida *</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerMode('NEW');
                        setSelectedCustomer(null);
                      }}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        customerMode === 'NEW' ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      Novo Contato
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerMode('SEARCH')}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        customerMode === 'SEARCH' ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      Buscar Existente
                    </button>
                  </div>
                </div>

                {customerMode === 'NEW' ? (
                  <div className="space-y-2.5 p-3 rounded-xl bg-[#181818] border border-white/5">
                    <div>
                      <input
                        type="text"
                        required
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="Nome do cliente *"
                        className="w-full bg-[#1C1C1C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        required={modalOrigin === 'WHATSAPP'}
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        placeholder={modalOrigin === 'WHATSAPP' ? 'Telefone WhatsApp (com DDD) *' : 'Telefone (opcional)'}
                        className="w-full bg-[#1C1C1C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        placeholder="E-mail (opcional)"
                        className="w-full bg-[#1C1C1C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 p-3 rounded-xl bg-[#181818] border border-white/5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Digite nome, telefone ou e-mail..."
                        className="w-full bg-[#1C1C1C] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                      />
                      {isSearchingClients && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37] absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>

                    {selectedCustomer ? (
                      <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-between text-xs text-white">
                        <div>
                          <p className="font-bold text-[#D4AF37]">{selectedCustomer.name}</p>
                          <p className="text-[11px] text-white/60">
                            {selectedCustomer.phone || selectedCustomer.email || 'Sem contato'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(null)}
                          className="text-[11px] text-red-400 hover:underline cursor-pointer"
                        >
                          Trocar
                        </button>
                      </div>
                    ) : (
                      searchResults.length > 0 && (
                        <div className="max-h-36 overflow-y-auto space-y-1 pt-1">
                          {searchResults.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setSelectedCustomer(c)}
                              className="w-full text-left p-2 rounded-lg bg-black/30 hover:bg-white/5 border border-white/5 flex items-center justify-between text-xs cursor-pointer"
                            >
                              <div>
                                <span className="font-semibold text-white">{c.name}</span>
                                <span className="text-[10px] text-white/40 ml-2">
                                  {c.phone || c.email}
                                </span>
                              </div>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-white/50">
                                {c.type === 'REGISTERED' ? 'Conta' : 'Contato'}
                              </span>
                            </button>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Data do Agendamento */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="modal-date-input" className="block font-semibold text-white/70 text-xs">
                    Data do Agendamento *
                  </label>
                  <span className="text-[11px] text-[#D4AF37] font-medium capitalize">
                    {formatModalDateDisplay(modalDate)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <CalendarIcon className="w-4 h-4 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="modal-date-input"
                      type="date"
                      min={todayDateStr}
                      value={modalDate}
                      onChange={(e) => {
                        if (e.target.value) setModalDate(e.target.value);
                      }}
                      className="w-full bg-[#1C1C1C] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                    />
                  </div>

                  {/* Atalhos Rápidos */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const [y, m, d] = modalDate.split('-').map(Number);
                        const dt = new Date(y, m - 1, d);
                        dt.setDate(dt.getDate() - 1);
                        const newStr = getYYYYMMDD(dt);
                        if (newStr >= todayDateStr) setModalDate(newStr);
                      }}
                      disabled={modalDate <= todayDateStr}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white text-xs transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Dia anterior"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalDate(todayDateStr)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        modalDate === todayDateStr
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                      title="Agendar para hoje"
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalDate(tomorrowDateStr)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        modalDate === tomorrowDateStr
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                      title="Agendar para amanhã"
                    >
                      Amanhã
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const [y, m, d] = modalDate.split('-').map(Number);
                        const dt = new Date(y, m - 1, d);
                        dt.setDate(dt.getDate() + 1);
                        setModalDate(getYYYYMMDD(dt));
                      }}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white text-xs transition-all cursor-pointer"
                      title="Próximo dia"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Barbeiro e Serviço */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-white/70 mb-1.5">Profissional *</label>
                  <select
                    value={modalBarberId}
                    onChange={(e) => setModalBarberId(e.target.value)}
                    className="w-full bg-[#1C1C1C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-white/70 mb-1.5">Serviço *</label>
                  <select
                    value={modalServiceId}
                    onChange={(e) => setModalServiceId(e.target.value)}
                    className="w-full bg-[#1C1C1C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.durationMinutes} min - {formatPrice(s.price)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grade de Horários */}
              <div>
                <label className="block font-semibold text-white/70 mb-1.5 text-xs">
                  Horário Disponível para {formatModalDateDisplay(modalDate)} *
                </label>
                {isLoadingSlots ? (
                  <div className="py-4 text-center text-white/40 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    <span>Consultando disponibilidade...</span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-white/40 py-3 text-center bg-white/[0.02] rounded-xl border border-white/5 text-xs">
                    Nenhum horário disponível para este profissional em {formatModalDateDisplay(modalDate)}.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1">
                    {availableSlots.map((slot) => {
                      const timeDisplay = slot.time.substring(11, 16);
                      const isSelected = selectedSlotTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedSlotTime(slot.time)}
                          className={`py-1.5 rounded-lg font-bold text-center text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#D4AF37] text-[#0A0A0A] shadow-md shadow-[#D4AF37]/20'
                              : slot.available
                              ? 'bg-[#1C1C1C] text-white/80 border border-white/10 hover:border-[#D4AF37]/50'
                              : 'bg-white/[0.02] text-white/20 border border-transparent cursor-not-allowed line-through'
                          }`}
                        >
                          {timeDisplay}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Botões do Formulário */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedSlotTime}
                  className="px-5 py-2.5 rounded-xl font-bold bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0A0A0A] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Gravando...</span>
                    </>
                  ) : (
                    <span>Confirmar Agendamento</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
