'use client';

import { createAppointmentAction } from '@/app/actions/appointment-actions';
import { useDragScroll } from '@/hooks/useDragScroll';
import { useBookingStore } from '@/store/booking-store';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Loader2,
  Scissors,
  Star,
  User as UserIcon,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useEffectEvent, useState } from 'react';
import { ClientLuxDashboard } from './lux/ClientLuxDashboard';
import SplashScreen from './SplashScreen';

interface ServiceProp {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  image?: string | null;
}

interface BarberProp {
  id: string;
  name: string;
  workDays: number[];
  workStart: string;
  workEnd: string;
  image?: string | null;
  active?: boolean;
  specialty?: string;
}

interface BookingFlowProps {
  initialServices: ServiceProp[];
  initialBarbers: BarberProp[];
}

interface BookingSuccessProp {
  id?: string;
  serviceId: string;
  barberId: string;
  startTime: string | Date;
}

const STEP_LABELS = [
  'Início',
  'Serviço',
  'Profissional',
  'Horário',
  'Revisão',
];

export default function BookingFlow({ initialServices, initialBarbers }: BookingFlowProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Zustand Store
  const {
    serviceId,
    serviceName,
    servicePrice,
    barberId,
    barberName,
    startTime,
    setService,
    setBarber,
    setStartTime,
    clearBooking,
  } = useBookingStore();

  // Local state
  const [showSplash, setShowSplash] = useState(false);
  const [step, setStep] = useState(0); // 0 = Home, 1 = Services, 2 = Barber, 3 = DateTime, 4 = Confirm

  const action = searchParams?.get('action');
  const [previousAction, setPreviousAction] = useState<string | null | undefined>(undefined);
  if (action !== previousAction) {
    setPreviousAction(action);
    if (action === 'agendar' && step === 0) setStep(1);
  }

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<{ time: string; dateTime: string; available: boolean }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<BookingSuccessProp | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Drag scroll hooks
  const daysScroll = useDragScroll<HTMLDivElement>();

  const daysList: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    daysList.push(d);
  }

  const formatYYYYMMDD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const readSplashPreference = useEffectEvent(() => {
    if (typeof window !== 'undefined') {
      const shown = sessionStorage.getItem('splash_shown_perf');
      if (!shown) {
        setShowSplash(true);
        sessionStorage.setItem('splash_shown_perf', 'true');
      }
    }
  });

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate a sessionStorage preference unavailable during SSR.
  useEffect(() => {
    readSplashPreference();
  }, []);

  // Quando o usuário volta autenticado com um rascunho completo, posiciona na Revisão sem disparar agendamento automático
  useEffect(() => {
    if (
      status === 'authenticated' &&
      serviceId &&
      barberId &&
      startTime &&
      !bookingSuccess &&
      step === 0 &&
      action === 'agendar'
    ) {
      setStep(4);
    }
  }, [status, serviceId, barberId, startTime, bookingSuccess, step, action]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!barberId || !serviceId) return;
      setIsLoadingSlots(true);
      setAvailableSlots([]);
      try {
        const dateStr = formatYYYYMMDD(selectedDate);
        const res = await fetch(`/api/barbers/${barberId}/availability?date=${dateStr}&serviceId=${serviceId}`);
        if (!res.ok) throw new Error('Failed to load slots');
        const data = await res.json();
        setAvailableSlots(data);
      } catch (err) {
        console.error('Error fetching availability:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    if (step === 3) fetchSlots();
  }, [barberId, serviceId, selectedDate, step]);

  const handleConfirm = async () => {
    if (isSubmitting) return;

    if (status !== 'authenticated') {
      router.push(`/auth/login?callbackUrl=/?action=agendar`);
      return;
    }
    if (!barberId || !serviceId || !startTime) {
      setErrorMessage('Por favor, certifique-se de selecionar todos os campos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await createAppointmentAction({
        barberId,
        serviceId,
        startTimeStr: startTime,
      });

      if (result.success && result.appointment) {
        setBookingSuccess(result.appointment);
        clearBooking();
      } else {
        setErrorMessage(result.error || 'Ocorreu um erro ao confirmar o agendamento.');
        if (result.error?.includes('reservado')) {
          setStep(3); // Redireciona de volta para seleção de horários em caso de conflito
        }
      }
    } catch {
      setErrorMessage('Erro inesperado de comunicação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatWeekDay = (d: Date): string => {
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return weekdays[d.getDay()];
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);
  };

  const selectedServiceObj = initialServices.find((s) => s.id === serviceId);

  if (bookingSuccess) {
    const bookedService = initialServices.find((s) => s.id === bookingSuccess.serviceId);
    const bookedBarber = initialBarbers.find((b) => b.id === bookingSuccess.barberId);

    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(212,175,55,0.3)]">
          <CheckCircle2 className="w-10 h-10 text-[#D4AF37]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Reserva Confirmada</h1>
        <p className="text-white/60 text-sm mb-8">Seu horário foi garantido com sucesso no sistema.</p>

        <div className="w-full bg-[#151515] rounded-3xl p-6 mb-8 text-left space-y-4 border border-white/10 shadow-xl">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">Serviço</span>
            <span className="text-white font-bold text-sm text-right">{bookedService?.name}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">Profissional</span>
            <span className="text-white font-bold text-sm text-right">{bookedBarber?.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">Data & Horário</span>
            <span className="text-[#D4AF37] font-black text-sm text-right">
              {new Date(bookingSuccess.startTime).toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </span>
          </div>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={() => {
              setBookingSuccess(null);
              setStep(0);
              router.push('/agenda');
            }}
            className="w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ver Meus Agendamentos</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setBookingSuccess(null);
              setStep(0);
              router.push('/');
            }}
            className="w-full py-3.5 px-6 rounded-2xl font-semibold text-xs sm:text-sm bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white transition-all cursor-pointer"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <div className="space-y-6 pb-12 max-w-4xl mx-auto px-4 sm:px-6">
        {/* Dynamic Header based on Step */}
        {step > 0 && (
          <div className="bg-[#151515] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl flex items-center justify-between gap-4">
            <button
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white/80 hover:text-white transition-all text-xs font-bold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>

            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
                Etapa {step} de 4
              </span>
              <span className="text-xs font-semibold text-white/80">
                {STEP_LABELS[step]}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step >= i ? 'w-5 sm:w-6 bg-[#D4AF37]' : 'w-2 bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* STEP 0: LUXURY HOME / DASHBOARD */}
        {step === 0 && (
          <ClientLuxDashboard
            services={initialServices}
            barbers={initialBarbers}
            onStartBooking={() => setStep(1)}
            onServiceSelect={(srv) => {
              setService(srv.id, srv.name, srv.price);
              setStep(2);
            }}
            onOpenHistory={() => {
              if (!session?.user) {
                router.push('/auth/login');
              } else {
                router.push('/profile');
              }
            }}
          />
        )}

        {/* STEP 1: SERVICES */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-1.5 tracking-tight">
                Qual o serviço?
              </h1>
              <p className="text-white/60 text-xs sm:text-sm">
                Selecione o serviço desejado com preço e duração exatos.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {initialServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setService(service.id, service.name, service.price);
                    setStep(2);
                  }}
                  className={`flex items-center p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                    serviceId === service.id
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                      : 'border-white/5 bg-[#151515] hover:border-[#D4AF37]/30 hover:bg-[#1C1C1C]'
                  }`}
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 mr-4 border border-white/10 relative">
                    <Image
                      src={service.image || '/images/service_image.png'}
                      alt={service.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-grow min-w-0 pr-2">
                    <h3 className="font-bold text-white text-base truncate">{service.name}</h3>
                    <div className="flex items-center text-white/60 text-xs mt-1 font-medium">
                      <Clock className="w-3.5 h-3.5 mr-1 text-[#D4AF37] shrink-0" />{' '}
                      {service.durationMinutes} min
                    </div>
                  </div>
                  <div className="text-[#D4AF37] font-black text-base sm:text-lg tracking-tight shrink-0">
                    {formatPrice(service.price)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: BARBERS */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-1.5 tracking-tight">
                Com qual profissional?
              </h1>
              <p className="text-white/60 text-xs sm:text-sm">
                Escolha o especialista de sua preferência para realizar o atendimento.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {initialBarbers
                .filter((b) => b.active !== false)
                .map((barber) => (
                  <button
                    key={barber.id}
                    onClick={() => {
                      setBarber(barber.id, barber.name);
                      setStep(3);
                    }}
                    className={`flex items-center p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                      barberId === barber.id
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                        : 'border-white/5 bg-[#151515] hover:border-[#D4AF37]/30 hover:bg-[#1C1C1C]'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 mr-4 border border-[#D4AF37]/30 shadow-md">
                      <Image
                        src={barber.image || '/images/barber_portrait.png'}
                        alt={barber.name}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-grow min-w-0 pr-2">
                      <h3 className="font-bold text-white text-base truncate">{barber.name}</h3>
                      <p className="text-[#D4AF37] text-xs font-semibold mt-0.5 truncate">
                        {barber.specialty || 'Especialista'}
                      </p>
                      <div className="flex items-center mt-1 text-white/50 text-xs">
                        <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-current mr-1 shrink-0" />
                        <span>Profissional qualificado</span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 shrink-0 ${
                        barberId === barber.id ? 'text-[#D4AF37]' : 'text-white/30'
                      }`}
                    />
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* STEP 3: DATETIME */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-1.5 tracking-tight">
                Quando?
              </h1>
              <p className="text-white/60 text-xs sm:text-sm">
                Selecione a data e o horário desejado na agenda do profissional.
              </p>
            </div>

            <div
              {...daysScroll}
              className={`flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none snap-x ${daysScroll.className}`}
            >
              {daysList.map((day, idx) => {
                const isSelected = formatYYYYMMDD(day) === formatYYYYMMDD(selectedDate);
                const isWorkday = initialBarbers
                  .find((b) => b.id === barberId)
                  ?.workDays.includes(day.getDay());

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDate(day);
                      setStartTime(null);
                    }}
                    disabled={!isWorkday}
                    className={`snap-center shrink-0 w-20 sm:w-24 py-4 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#D4AF37] text-[#0D0D0D] shadow-[0_0_20px_rgba(212,175,55,0.3)] font-black'
                        : isWorkday
                        ? 'bg-[#151515] border border-white/10 text-white hover:bg-[#1C1C1C]'
                        : 'bg-[#151515]/40 border border-transparent text-white/20 cursor-not-allowed opacity-40'
                    }`}
                  >
                    <span className="text-[11px] uppercase font-bold tracking-wider mb-1">
                      {formatWeekDay(day)}
                    </span>
                    <span className="text-2xl font-black">{day.getDate()}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <h3 className="text-white font-bold text-sm mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-[#D4AF37]" />
                Horários disponíveis
              </h3>

              {isLoadingSlots ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-white/60 text-xs">
                  <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
                  <span>Consultando horários disponíveis...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="bg-[#151515] p-6 rounded-2xl text-center text-white/50 border border-white/5 text-xs">
                  Nenhum horário disponível para a data selecionada. Escolha outra data acima.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {availableSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (slot.available) {
                          setStartTime(slot.dateTime);
                          setStep(4);
                        }
                      }}
                      disabled={!slot.available}
                      className={`py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !slot.available
                          ? 'bg-transparent border border-white/5 text-white/20 line-through cursor-not-allowed'
                          : startTime === slot.dateTime
                          ? 'bg-[#D4AF37] text-[#0D0D0D] shadow-md font-black'
                          : 'bg-[#151515] border border-white/10 text-white hover:border-[#D4AF37]/50 hover:bg-[#1C1C1C]'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & CONFIRM */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-1.5 tracking-tight">
                Revisão do Agendamento
              </h1>
              <p className="text-white/60 text-xs sm:text-sm">
                Confira os detalhes escolhidos antes de realizar a confirmação.
              </p>
            </div>

            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start gap-3 text-red-300 text-sm shadow-md">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            <div className="bg-[#151515] rounded-2xl p-6 border border-white/5 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Resumo da Reserva
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1C1C1C] text-[#D4AF37] border border-[#D4AF37]/30">
                  Ainda não confirmado
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:divide-x divide-white/5">
                {/* Coluna 1: Serviço */}
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-white/50 uppercase tracking-widest font-bold">
                        Serviço
                      </p>
                      <button
                        onClick={() => setStep(1)}
                        className="text-xs text-[#D4AF37] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    </div>
                    <p className="font-bold text-white text-base mt-2">{serviceName}</p>
                    <p className="text-xs text-white/60 mt-0.5">
                      Duração estimada: {selectedServiceObj?.durationMinutes || 45} min
                    </p>
                  </div>
                  <p className="text-[#D4AF37] font-black text-lg mt-3">
                    {formatPrice(servicePrice || 0)}
                  </p>
                </div>

                {/* Coluna 2: Profissional */}
                <div className="sm:pl-6 flex flex-col justify-between border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-white/50 uppercase tracking-widest font-bold">
                        Profissional
                      </p>
                      <button
                        onClick={() => setStep(2)}
                        className="text-xs text-[#D4AF37] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    </div>
                    <p className="font-bold text-white text-base mt-2">{barberName}</p>
                    <p className="text-xs text-white/60 mt-0.5">Atendimento presencial</p>
                  </div>
                  <span className="text-xs text-white/50 mt-3">
                    Pagamento realizado no local
                  </span>
                </div>

                {/* Coluna 3: Data e Horário */}
                <div className="sm:pl-6 flex flex-col justify-between border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-white/50 uppercase tracking-widest font-bold">
                        Data e Horário
                      </p>
                      <button
                        onClick={() => setStep(3)}
                        className="text-xs text-[#D4AF37] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    </div>
                    <p className="font-bold text-white text-base capitalize mt-2">
                      {startTime &&
                        new Date(startTime).toLocaleString('pt-BR', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                        })}
                    </p>
                    <p className="text-[#D4AF37] font-black text-base mt-0.5">
                      {startTime &&
                        new Date(startTime).toLocaleString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                    </p>
                  </div>
                  <span className="text-xs text-white/50 mt-3">
                    Cancelamento gratuito até 2h antes
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-bold text-base bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] transition-all shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Confirmando...</span>
                  </span>
                ) : (
                  <span>Confirmar Agendamento</span>
                )}
              </button>

              {status !== 'authenticated' && (
                <p className="text-center text-white/50 text-xs leading-relaxed">
                  Você será direcionado para entrar ou se cadastrar com segurança, mantendo suas escolhas.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
