'use client';

import { createAppointmentAction } from '@/app/actions/appointment-actions';
import { trackBookingTelemetryAction } from '@/app/actions/telemetry-goals-actions';
import { canResumeBooking } from '@/core/utils/booking-resume';
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
  User,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { ClientLuxDashboard } from './lux/ClientLuxDashboard';
import { Header } from './lux/Header';
import SplashScreen from './SplashScreen';

function getOrCreateJourneyId(): string {
  if (typeof window === 'undefined') return '';
  let jId = sessionStorage.getItem('barberapp_booking_journey_id');
  if (!jId) {
    jId = `j_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('barberapp_booking_journey_id', jId);
  }
  return jId;
}

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
  const resumeBooking = searchParams?.get('retomar') === '1';
  const resumed = useRef(false);
  const [previousAction, setPreviousAction] = useState<string | null | undefined>(undefined);
  if (action !== previousAction) {
    setPreviousAction(action);
    if (action === 'agendar' && !resumeBooking && step === 0) setStep(1);
  }

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<{ time: string; dateTime: string; available: boolean }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(false);
  const [slotsRetry, setSlotsRetry] = useState(0);
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

  useEffect(() => {
    readSplashPreference();
  }, []);

  // Instrumentação Fase P4: booking_started (uma vez por jornada iniciada)
  useEffect(() => {
    if (step >= 1) {
      const journeyId = getOrCreateJourneyId();
      if (journeyId) {
        trackBookingTelemetryAction({
          eventName: 'booking_started',
          journeyId,
          channel: 'ONLINE',
        });
      }
    }
  }, [step]);

  // Instrumentação Fase P4: booking_details_selected (quando serviço, barbeiro e horário são escolhidos)
  useEffect(() => {
    if (step === 4 && serviceId && barberId && startTime) {
      const journeyId = getOrCreateJourneyId();
      if (journeyId) {
        trackBookingTelemetryAction({
          eventName: 'booking_details_selected',
          journeyId,
          serviceId,
          barberId,
          channel: 'ONLINE',
        });
      }
    }
  }, [step, serviceId, barberId, startTime]);

  // Quando o usuário volta autenticado com um rascunho completo, posiciona na Revisão sem disparar agendamento automático
  useEffect(() => {
    if (action !== 'agendar' || !resumeBooking || resumed.current || status === 'loading') return;
    resumed.current = true;
    if (canResumeBooking({ authenticated: status === 'authenticated', serviceId, servicePrice, barberId, startTime, services: initialServices, barbers: initialBarbers, now: Date.now() })) {
      setStep(4);
    } else {
      setStep(1);
      setErrorMessage('Confira novamente o serviço e o horário para continuar seu agendamento.');
    }
  }, [status, serviceId, servicePrice, barberId, startTime, action, resumeBooking, initialServices, initialBarbers]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchSlots = async () => {
      if (!barberId || !serviceId) return;
      setIsLoadingSlots(true);
      setSlotsError(false);
      setAvailableSlots([]);
      try {
        const dateStr = formatYYYYMMDD(selectedDate);
        const res = await fetch(`/api/barbers/${barberId}/availability?date=${dateStr}&serviceId=${serviceId}`, { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to load slots');
        const data = await res.json();
        if (!controller.signal.aborted) setAvailableSlots(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Error fetching availability:', err);
          setSlotsError(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingSlots(false);
      }
    };
    if (step === 3) fetchSlots();
    return () => controller.abort();
  }, [barberId, serviceId, selectedDate, step, slotsRetry]);

  const handleConfirm = async () => {
    if (isSubmitting) return;

    if (status !== 'authenticated') {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent('/?action=agendar&retomar=1')}`);
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
        const journeyId = getOrCreateJourneyId();
        if (journeyId) {
          trackBookingTelemetryAction({
            eventName: 'appointment_created',
            journeyId,
            serviceId,
            barberId,
            appointmentId: result.appointment.id,
            channel: 'ONLINE',
          });
          sessionStorage.removeItem('barberapp_booking_journey_id');
        }
        setBookingSuccess(result.appointment);
        clearBooking();
      } else {
        setErrorMessage(result.error || 'Ocorreu um erro ao confirmar o agendamento.');
        if (!result.success && result.code === 'SLOT_CONFLICT') {
          setErrorMessage('Este horário acabou de ficar indisponível. Escolha outro horário.');
          setStartTime(null);
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
        <div className="w-16 h-16 bg-white/[0.04] border border-white/10 rounded-lg flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-[#C5A059]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Reserva Confirmada</h1>
        <p className="text-zinc-400 text-sm mb-8">Seu horário foi garantido com sucesso no sistema.</p>

        <div className="w-full bg-[#141414] rounded-lg p-6 mb-8 text-left space-y-4 border border-white/[0.08]">
          <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Serviço</span>
            <span className="text-white font-semibold text-sm text-right">{bookedService?.name}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Profissional</span>
            <span className="text-white font-semibold text-sm text-right">{bookedBarber?.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Data & Horário</span>
            <span className="text-[#C5A059] font-bold text-sm text-right">
              {new Date(bookingSuccess.startTime).toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
                timeZone: 'America/Sao_Paulo',
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
            className="w-full py-3.5 px-6 rounded-md font-semibold text-sm bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-[#C5A059]/60 text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
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
            className="w-full py-3 px-6 rounded-md font-medium text-xs sm:text-sm bg-transparent hover:bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white transition-all cursor-pointer"
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

      {/* STEP 0: LUXURY HOME / DASHBOARD (Full width on Desktop & Mobile) */}
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

      {/* STEPS 1-4: BOOKING FLOW (2-Column Layout with Sticky Summary on Desktop) */}
      {step > 0 && (
        <div className="min-h-screen flex flex-col">
          <Header onLogoClick={() => setStep(0)} onBookClick={() => setStep(1)} />

          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 pb-16">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
              {/* Left Column: Step Header + Active Step Selection */}
              <div className="lg:col-span-8 space-y-6">
                {/* Dynamic Header based on Step */}
                <div className="bg-[#141414] border border-white/[0.07] rounded-lg p-4 sm:p-5 flex items-center justify-between gap-4">
                  <button
                    onClick={() => setStep(step - 1)}
                    className="inline-flex min-h-11 items-center gap-1.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white transition-colors text-sm font-medium focus-visible:outline-2 focus-visible:outline-[#D4AF37] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <div className="flex flex-col items-center" aria-live="polite">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                      Etapa {step} de 4
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {STEP_LABELS[step]}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-sm transition-all duration-300 ${
                          step >= i ? 'w-5 sm:w-6 bg-[#C5A059]' : 'w-2 bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>

        {/* STEP 1: SERVICES */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 tracking-tight">
                Qual o serviço?
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm">
                Selecione o serviço desejado com preço e duração exatos.
              </p>
            </div>
            {errorMessage && <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">{errorMessage}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {initialServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setErrorMessage(null);
                    setService(service.id, service.name, service.price);
                    setStep(2);
                  }}
                  className={`flex items-center p-4 rounded-lg border transition-all text-left cursor-pointer ${
                    serviceId === service.id
                      ? 'border-[#C5A059]/70 bg-white/[0.06]'
                      : 'border-white/[0.07] bg-[#141414] hover:border-white/20 hover:bg-[#181818]'
                  }`}
                >
                  <div className="w-14 h-14 rounded-md overflow-hidden shrink-0 mr-4 border border-white/10 relative">
                    <Image
                      src={service.image || '/images/service_image.png'}
                      alt={service.name}
                      width={56}
                      height={56}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-grow min-w-0 pr-2">
                    <h3 className="font-semibold text-white text-sm sm:text-base truncate">{service.name}</h3>
                    <div className="flex items-center text-zinc-400 text-xs mt-1 font-normal">
                      <Clock className="w-3.5 h-3.5 mr-1 text-zinc-500 shrink-0" />{' '}
                      {service.durationMinutes} min
                    </div>
                  </div>
                  <div className="text-[#C5A059] font-bold text-sm sm:text-base tracking-tight shrink-0">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 tracking-tight">
                Com qual profissional?
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm">
                Escolha o especialista de sua preferência para realizar o atendimento.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {initialBarbers
                .filter((b) => b.active !== false)
                .map((barber) => (
                  <button
                    key={barber.id}
                    onClick={() => {
                      setBarber(barber.id, barber.name);
                      setStep(3);
                    }}
                    className={`flex items-center p-4 rounded-lg border transition-all text-left cursor-pointer ${
                      barberId === barber.id
                        ? 'border-[#C5A059]/70 bg-white/[0.06]'
                        : 'border-white/[0.07] bg-[#141414] hover:border-white/20 hover:bg-[#181818]'
                    }`}
                  >
                    <div className="w-13 h-13 rounded-md overflow-hidden shrink-0 mr-4 border border-white/10">
                      <Image
                        src={barber.image || '/images/barber_portrait.png'}
                        alt={barber.name}
                        width={52}
                        height={52}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-grow min-w-0 pr-2">
                      <h3 className="font-semibold text-white text-sm sm:text-base truncate">{barber.name}</h3>
                      <p className="text-zinc-400 text-xs font-normal mt-0.5 truncate">
                        {barber.specialty || 'Especialista'}
                      </p>
                      <div className="flex items-center mt-1 text-zinc-500 text-xs">
                        <Star className="w-3 h-3 text-[#C5A059] mr-1 shrink-0" />
                        <span>Profissional qualificado</span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 ${
                        barberId === barber.id ? 'text-white' : 'text-zinc-600'
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
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 tracking-tight">
                Quando?
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm">
                Selecione a data e o horário desejado na agenda do profissional.
              </p>
            </div>

            <div
              {...daysScroll}
              className={`flex gap-2.5 sm:gap-3 overflow-x-auto pb-3 scrollbar-none snap-x ${daysScroll.className}`}
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
                    aria-pressed={isSelected}
                    aria-label={day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    className={`snap-center shrink-0 w-18 sm:w-22 py-3.5 rounded-xl flex flex-col items-center justify-center transition-all focus-visible:outline-2 focus-visible:outline-[#D4AF37] cursor-pointer border ${
                      isSelected
                        ? 'bg-white/[0.08] border-[#C5A059]/70 text-white font-bold'
                        : isWorkday
                        ? 'bg-[#141414] border-white/[0.07] text-zinc-300 hover:bg-[#181818] hover:border-white/20 hover:text-white'
                        : 'bg-[#141414]/40 border-transparent text-zinc-600 cursor-not-allowed opacity-40'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-medium tracking-wider mb-1 text-zinc-400">
                      {formatWeekDay(day)}
                    </span>
                    <span className="text-xl font-bold">{day.getDate()}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <label htmlFor="booking-date" className="block text-sm font-medium text-zinc-300">Escolher outra data</label>
              <input id="booking-date" type="date" min={formatYYYYMMDD(today)} value={formatYYYYMMDD(selectedDate)}
                onChange={(event) => {
                  if (!event.target.value) return;
                  setSelectedDate(new Date(`${event.target.value}T12:00:00`));
                  setStartTime(null);
                  setErrorMessage(null);
                }}
                className="min-h-11 w-full max-w-xs rounded-xl border border-white/15 bg-[#151515] px-3 text-white focus-visible:outline-2 focus-visible:outline-[#D4AF37]" />
            </div>

            <div className="pt-2">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-[#C5A059]" />
                Horários disponíveis
              </h3>

              {errorMessage && <p role="alert" className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">{errorMessage}</p>}
              {isLoadingSlots ? (
                <div role="status" className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400 text-sm">
                  <Loader2 className="w-5 h-5 text-[#C5A059] animate-spin" />
                  <span>Consultando horários disponíveis...</span>
                </div>
              ) : slotsError ? (
                <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-5 text-sm text-red-200">
                  <p>Não foi possível consultar os horários. Verifique sua conexão e tente novamente.</p>
                  <button type="button" onClick={() => setSlotsRetry((value) => value + 1)} className="mt-3 min-h-11 rounded-lg border border-red-300/40 px-4 font-semibold focus-visible:outline-2 focus-visible:outline-white">Tentar novamente</button>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="bg-[#141414] p-6 rounded-lg text-center text-zinc-500 border border-white/[0.07] text-xs">
                  Nenhum horário disponível para a data selecionada. Escolha outra data acima.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {availableSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (slot.available) {
                          setErrorMessage(null);
                          setStartTime(slot.dateTime);
                          setStep(4);
                        }
                      }}
                      disabled={!slot.available}
                      className={`min-h-11 py-2.5 rounded-xl text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-[#D4AF37] cursor-pointer border ${
                        !slot.available
                          ? 'bg-transparent border-white/[0.04] text-zinc-600 line-through cursor-not-allowed'
                          : startTime === slot.dateTime
                          ? 'bg-white/[0.09] border-[#C5A059]/70 text-white font-semibold'
                          : 'bg-[#141414] border-white/[0.07] text-zinc-300 hover:border-white/25 hover:bg-[#181818] hover:text-white'
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
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 tracking-tight">
                Revisão do Agendamento
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm">
                Confira os detalhes escolhidos antes de realizar a confirmação.
              </p>
            </div>

            {errorMessage && (
              <div role="alert" className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-start gap-3 text-red-300 text-sm">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            <div className="bg-[#141414] rounded-lg p-6 border border-white/[0.07] space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Resumo da Reserva
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.04] text-zinc-300 border border-white/10">
                  Aguardando confirmação
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:divide-x divide-white/[0.06]">
                {/* Coluna 1: Serviço */}
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium">
                        Serviço
                      </p>
                      <button aria-label="Editar serviço"
                        onClick={() => setStep(1)}
                        className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    </div>
                    <p className="font-semibold text-white text-base mt-2">{serviceName}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Duração estimada: {selectedServiceObj?.durationMinutes || 45} min
                    </p>
                  </div>
                  <p className="text-[#C5A059] font-bold text-lg mt-3">
                    {formatPrice(servicePrice || 0)}
                  </p>
                </div>

                {/* Coluna 2: Profissional */}
                <div className="sm:pl-6 flex flex-col justify-between border-t sm:border-t-0 border-white/[0.06] pt-4 sm:pt-0">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium">
                        Profissional
                      </p>
                      <button aria-label="Editar profissional"
                        onClick={() => setStep(2)}
                        className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    </div>
                    <p className="font-semibold text-white text-base mt-2">{barberName}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Atendimento presencial</p>
                  </div>
                  <span className="text-xs text-zinc-500 mt-3">
                    Pagamento realizado no local
                  </span>
                </div>

                {/* Coluna 3: Data e Horário */}
                <div className="sm:pl-6 flex flex-col justify-between border-t sm:border-t-0 border-white/[0.06] pt-4 sm:pt-0">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium">
                        Data e Horário
                      </p>
                      <button aria-label="Editar data e horário"
                        onClick={() => setStep(3)}
                        className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    </div>
                    <p className="font-semibold text-white text-base capitalize mt-2">
                      {startTime &&
                        new Date(startTime).toLocaleString('pt-BR', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          timeZone: 'America/Sao_Paulo',
                        })}
                    </p>
                    <p className="text-[#C5A059] font-bold text-base mt-0.5">
                      {startTime &&
                        new Date(startTime).toLocaleString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'America/Sao_Paulo',
                        })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={handleConfirm}
                disabled={isSubmitting || status === 'loading'}
                className="w-full min-h-12 py-3.5 rounded-xl font-semibold text-sm bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] transition-colors disabled:opacity-50 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirmando...</span>
                  </span>
                ) : (
                  <span>Confirmar Agendamento</span>
                )}
              </button>

              {status !== 'authenticated' && (
                <p className="text-center text-zinc-500 text-xs leading-relaxed">
                  Você será direcionado para entrar ou se cadastrar com segurança, mantendo suas escolhas.
                </p>
              )}
            </div>
          </div>
        )}
              </div>

              {/* Right Column: Sticky Live Booking Summary Sidebar (Desktop Only) */}
              <aside className="hidden lg:block lg:col-span-4 sticky top-24">
                <div className="bg-[#141414] border border-white/[0.07] rounded-lg p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                        Resumo em Tempo Real
                      </span>
                      <h3 className="text-base font-semibold text-white mt-0.5">
                        Seu Agendamento
                      </h3>
                    </div>
                    <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#C5A059]">
                      <Scissors className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Step 1 Summary: Serviço */}
                  <div className="space-y-3">
                    <div
                      onClick={() => setStep(1)}
                      className={`p-3.5 rounded-md border transition-all cursor-pointer ${
                        step === 1
                          ? 'bg-white/[0.04] border-white/20'
                          : 'bg-[#111111] border-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5 text-[#C5A059]" />
                          1. Serviço
                        </span>
                        {serviceId && (
                          <span className="text-zinc-400 hover:text-white text-[10px]">Alterar</span>
                        )}
                      </div>
                      {serviceName ? (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{serviceName}</p>
                            <p className="text-[11px] text-zinc-500">
                              {selectedServiceObj?.durationMinutes || 45} min
                            </p>
                          </div>
                          <span className="text-sm font-bold text-[#C5A059]">
                            {formatPrice(servicePrice || 0)}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-1.5 text-xs text-zinc-600">
                          Aguardando seleção...
                        </p>
                      )}
                    </div>

                    {/* Step 2 Summary: Profissional */}
                    <div
                      onClick={() => serviceId && setStep(2)}
                      className={`p-3.5 rounded-md border transition-all ${
                        serviceId ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
                      } ${
                        step === 2
                          ? 'bg-white/[0.04] border-white/20'
                          : 'bg-[#111111] border-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#C5A059]" />
                          2. Profissional
                        </span>
                        {barberId && (
                          <span className="text-zinc-400 hover:text-white text-[10px]">Alterar</span>
                        )}
                      </div>
                      {barberName ? (
                        <p className="mt-2 text-sm font-semibold text-white">{barberName}</p>
                      ) : (
                        <p className="mt-1.5 text-xs text-zinc-600">
                          Aguardando seleção...
                        </p>
                      )}
                    </div>

                    {/* Step 3 Summary: Data e Horário */}
                    <div
                      onClick={() => serviceId && barberId && setStep(3)}
                      className={`p-3.5 rounded-md border transition-all ${
                        serviceId && barberId ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
                      } ${
                        step === 3
                          ? 'bg-white/[0.04] border-white/20'
                          : 'bg-[#111111] border-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                          3. Data e Horário
                        </span>
                        {startTime && (
                          <span className="text-zinc-400 hover:text-white text-[10px]">Alterar</span>
                        )}
                      </div>
                      {startTime ? (
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-white capitalize">
                            {new Date(startTime).toLocaleString('pt-BR', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                            })}
                          </span>
                          <span className="text-sm font-bold text-[#C5A059]">
                            {new Date(startTime).toLocaleString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-1.5 text-xs text-zinc-600">
                          Aguardando seleção...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Total Footer */}
                  <div className="pt-4 border-t border-white/[0.06] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Valor Total
                      </span>
                      <span className="text-lg font-bold text-[#C5A059]">
                        {formatPrice(servicePrice || 0)}
                      </span>
                    </div>

                    {serviceId && barberId && startTime && step < 4 && (
                      <button
                        type="button"
                        onClick={() => setStep(4)}
                        className="w-full py-3 px-4 rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-[#C5A059]/60 text-white font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Revisar e Confirmar</span>
                        <ChevronRight className="w-4 h-4 stroke-[2]" />
                      </button>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
