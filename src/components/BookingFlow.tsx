'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/store/booking-store';
import { createAppointmentAction } from '@/app/actions/appointment-actions';
import { Calendar, Clock, Scissors, User as UserIcon, CheckCircle2, AlertTriangle, Loader2, Star, ChevronRight } from 'lucide-react';
import SplashScreen from './SplashScreen';
import Image from 'next/image';
import { useDragScroll } from '@/hooks/useDragScroll';
import { ClientLuxDashboard } from './lux/ClientLuxDashboard';

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

export default function BookingFlow({ initialServices, initialBarbers }: BookingFlowProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<{ time: string; dateTime: string; available: boolean }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<BookingSuccessProp | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

  // Drag scroll hooks
  const servicesScroll = useDragScroll<HTMLDivElement>();
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shown = sessionStorage.getItem('splash_shown_perf');
      if (!shown) {
        setShowSplash(true);
        sessionStorage.setItem('splash_shown_perf', 'true');
      }
    }
  }, []);

  useEffect(() => {
    const attemptAutoSubmit = async () => {
      if (status === 'authenticated' && serviceId && barberId && startTime && !bookingSuccess && !isAutoSubmitting) {
        setIsAutoSubmitting(true);
        setIsSubmitting(true);
        setErrorMessage(null);

        const result = await createAppointmentAction({
          barberId,
          serviceId,
          startTimeStr: startTime,
        });

        if (result.success && result.appointment) {
          setBookingSuccess(result.appointment);
          clearBooking();
        } else {
          setErrorMessage(result.error || 'Erro ao realizar agendamento.');
          setStep(3);
        }
        setIsSubmitting(false);
        setIsAutoSubmitting(false);
      }
    };

    if (status !== 'loading') {
      attemptAutoSubmit();
    }
  }, [status, serviceId, barberId, startTime, bookingSuccess, isAutoSubmitting, clearBooking]);

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
    if (status !== 'authenticated') {
      router.push(`/auth/login?callbackUrl=/`);
      return;
    }
    if (!barberId || !serviceId || !startTime) {
      setErrorMessage('Por favor, certifique-se de selecionar todos os campos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await createAppointmentAction({
      barberId,
      serviceId,
      startTimeStr: startTime,
    });

    if (result.success && result.appointment) {
      setBookingSuccess(result.appointment);
      clearBooking();
    } else {
      setErrorMessage(result.error || 'Ocorreu um erro.');
    }
    setIsSubmitting(false);
  };

  const formatWeekDay = (d: Date): string => {
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return weekdays[d.getDay()];
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);
  };


  if (bookingSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-lg mx-auto">
        <div className="w-24 h-24 bg-dourado-premium/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(245,197,66,0.3)] animate-pulse">
          <CheckCircle2 className="w-12 h-12 text-dourado-premium" />
        </div>
        <h1 className="text-3xl font-bold text-branco mb-3">Reserva Confirmada</h1>
        <p className="text-branco/60 mb-10">Seu horário foi garantido com sucesso.</p>

        <div className="w-full glass-heavy rounded-3xl p-6 mb-10 text-left space-y-4 border border-branco/10">
          <div className="flex justify-between items-center border-b border-branco/5 pb-3">
            <span className="text-branco/50 text-sm font-medium uppercase tracking-wider">Serviço</span>
            <span className="text-branco font-semibold text-right">{initialServices.find((s) => s.id === bookingSuccess.serviceId)?.name}</span>
          </div>
          <div className="flex justify-between items-center border-b border-branco/5 pb-3">
            <span className="text-branco/50 text-sm font-medium uppercase tracking-wider">Barbeiro</span>
            <span className="text-branco font-semibold text-right">{initialBarbers.find((b) => b.id === bookingSuccess.barberId)?.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-branco/50 text-sm font-medium uppercase tracking-wider">Data & Hora</span>
            <span className="text-dourado-premium font-bold text-right">
              {new Date(bookingSuccess.startTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          </div>
        </div>

        <div className="w-full space-y-3.5">
          {(() => {
            const nomeCliente = session?.user?.name || 'Cliente';
            const dataAgendamento = new Date(bookingSuccess.startTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
            const nomeBarbeiro = initialBarbers.find((b) => b.id === bookingSuccess.barberId)?.name || 'Barbeiro';

            const mensagemText = `Olá! Sou o(a) ${nomeCliente}, acabei de realizar um agendamento para ${dataAgendamento} com o barbeiro ${nomeBarbeiro}. Gostaria de confirmar/tirar uma dúvida.`;
            const whatsappUrl = `https://wa.me/5585986279194?text=${encodeURIComponent(mensagemText)}`;

            return (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-2xl font-bold text-base sm:text-lg bg-green-500 hover:bg-green-600 text-white transition-all shadow-[0_0_20px_rgba(34,197,94,0.35)] flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span className="text-xl leading-none">💬</span>
                Falar com a barbearia no WhatsApp
              </a>
            );
          })()}

          <button
            onClick={() => {
              setBookingSuccess(null);
              setStep(0);
              router.push('/dashboard');
            }}
            className="w-full py-4 rounded-2xl font-bold text-base sm:text-lg bg-dourado-premium hover:bg-dourado-dark text-preto-profundo transition-all shadow-[0_0_20px_rgba(245,197,66,0.35)] cursor-pointer"
          >
            Meus Agendamentos
          </button>
        </div>
      </div>
    );
  }

  if (isAutoSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-lg mx-auto">
        <Loader2 className="w-16 h-16 text-dourado-premium animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-branco mb-2">Finalizando...</h2>
      </div>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <div className="space-y-8 pb-12">
      {/* Dynamic Header based on Step */}
      {step > 0 && (
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setStep(step - 1)} className="p-2 bg-cinza-grafite rounded-full hover:bg-cinza-chumbo transition-colors text-branco">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="flex space-x-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step >= i ? 'w-6 bg-dourado-premium' : 'w-2 bg-cinza-chumbo'}`} />
            ))}
          </div>
          <div className="w-9" /> {/* Spacer */}
        </div>
      )}

      {/* STEP 0: LUXURY APP STORE DASHBOARD */}
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
            <h1 className="text-2xl sm:text-3xl font-black text-branco mb-2 tracking-tight">Qual o serviço?</h1>
            <p className="text-branco/60 text-sm">Escolha um dos nossos serviços de alta performance.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {initialServices.map((service) => (
              <button
                key={service.id}
                onClick={() => { setService(service.id, service.name, service.price); setStep(2); }}
                className={`flex items-center p-4 rounded-3xl border transition-all text-left motion-card cursor-pointer ${
                  serviceId === service.id ? 'border-dourado-premium bg-dourado-premium/15 shadow-[0_0_25px_rgba(245,197,66,0.25)] animate-scale-pop' : 'border-branco/10 glass hover:border-dourado-premium/40'
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 mr-4 border border-branco/10 shadow-md">
                  <Image src={service.image || "/images/service_image.png"} alt="Service" width={80} height={80} className="object-cover w-full h-full transition-transform hover:scale-110" />
                </div>
                <div className="flex-grow min-w-0 pr-2">
                  <h3 className="font-bold text-branco text-base sm:text-lg truncate">{service.name}</h3>
                  <div className="flex items-center text-branco/60 text-xs mt-1 font-medium">
                    <Clock className="w-3.5 h-3.5 mr-1 text-dourado-premium shrink-0" /> {service.durationMinutes} min
                  </div>
                </div>
                <div className="text-dourado-premium font-black text-lg sm:text-xl tracking-tight shrink-0">
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
            <h1 className="text-2xl sm:text-3xl font-black text-branco mb-2 tracking-tight">Com quem?</h1>
            <p className="text-branco/60 text-sm">Selecione o barbeiro especialista de sua preferência.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {initialBarbers.filter((b) => b.active !== false).map((barber) => (
              <button
                key={barber.id}
                onClick={() => { setBarber(barber.id, barber.name); setStep(3); }}
                className={`flex items-center p-4 rounded-3xl border transition-all text-left motion-card cursor-pointer ${
                  barberId === barber.id ? 'border-dourado-premium bg-dourado-premium/15 shadow-[0_0_25px_rgba(245,197,66,0.25)] animate-scale-pop' : 'border-branco/10 glass hover:border-dourado-premium/40'
                }`}
              >
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 mr-4 border-2 border-dourado-premium/30 shadow-md">
                  <Image src={barber.image || "/images/barber_portrait.png"} alt="Barber" width={64} height={64} className="object-cover w-full h-full" />
                </div>
                <div className="flex-grow min-w-0 pr-2">
                  <h3 className="font-bold text-branco text-base sm:text-lg truncate">{barber.name}</h3>
                  <p className="text-dourado-premium/90 text-xs font-semibold mt-0.5 truncate">{barber.specialty || 'Especialista Premium'}</p>
                  <div className="flex items-center mt-1 text-dourado-premium text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current mr-1 text-dourado-premium shrink-0" /> 4.9 <span className="text-branco/40 ml-1 font-normal">(120+)</span>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1 ${barberId === barber.id ? 'text-dourado-premium' : 'text-branco/30'}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: DATETIME */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in-up">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-branco mb-2 tracking-tight">Quando?</h1>
            <p className="text-branco/60 text-sm">Encontre o melhor horário na agenda do profissional.</p>
          </div>

          <div 
            {...daysScroll}
            className={`flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none snap-x ${daysScroll.className}`}
          >
            {daysList.map((day, idx) => {
              const isSelected = formatYYYYMMDD(day) === formatYYYYMMDD(selectedDate);
              const isWorkday = initialBarbers.find((b) => b.id === barberId)?.workDays.includes(day.getDay());

              return (
                <button
                  key={idx}
                  onClick={() => { setSelectedDate(day); setStartTime(null); }}
                  disabled={!isWorkday}
                  className={`snap-center shrink-0 w-20 sm:w-24 py-4 rounded-3xl flex flex-col items-center justify-center transition-all motion-btn cursor-pointer ${
                    isSelected
                      ? 'bg-dourado-premium text-preto-profundo shadow-[0_0_25px_rgba(245,197,66,0.35)] animate-scale-pop font-black'
                      : isWorkday
                      ? 'glass border border-branco/10 text-branco hover:bg-branco/10'
                      : 'glass border border-transparent text-branco/20 cursor-not-allowed opacity-50'
                  }`}
                >
                  <span className="text-[11px] uppercase font-bold tracking-wider mb-1">{formatWeekDay(day)}</span>
                  <span className="text-2xl sm:text-3xl font-black">{day.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4">
            <h3 className="text-branco font-bold text-base mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-dourado-premium" />
              Horários disponíveis
            </h3>
            
            {isLoadingSlots ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-branco/60 text-sm">
                <Loader2 className="w-8 h-8 text-dourado-premium animate-spin" />
                <span>Buscando grade de horários em tempo real...</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="glass p-6 rounded-3xl text-center text-branco/50 border border-branco/5 text-sm">Nenhum horário disponível nesta data.</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {availableSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => { if (slot.available) { setStartTime(slot.dateTime); setStep(4); } }}
                    disabled={!slot.available}
                    className={`py-3.5 rounded-2xl text-sm font-bold transition-all motion-btn cursor-pointer ${
                      !slot.available
                        ? 'bg-transparent border border-branco/5 text-branco/20 line-through cursor-not-allowed'
                        : startTime === slot.dateTime
                        ? 'bg-dourado-premium text-preto-profundo shadow-[0_0_20px_rgba(245,197,66,0.3)] animate-scale-pop font-black'
                        : 'glass border border-branco/10 text-branco hover:border-dourado-premium/50 hover:bg-dourado-premium/10'
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

      {/* STEP 4: CONFIRM */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in-up">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-branco mb-2 tracking-tight">Revisão</h1>
            <p className="text-branco/60 text-sm">Confirme os dados do agendamento VIP.</p>
          </div>

          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-start gap-3 text-red-200 text-sm shadow-md animate-fade-in-up">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="glass-heavy rounded-3xl p-1 border border-branco/10 shadow-2xl motion-card">
            <div className="bg-cinza-grafite/40 rounded-[22px] p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:divide-x divide-branco/10">
                
                {/* Service Column */}
                <div className="flex items-center sm:items-start gap-4 sm:flex-col sm:gap-3">
                  <div className="w-12 h-12 bg-dourado-premium/10 border border-dourado-premium/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <Scissors className="w-5 h-5 text-dourado-premium" />
                  </div>
                  <div>
                    <p className="text-[11px] text-branco/50 uppercase tracking-widest font-bold mb-1">Serviço</p>
                    <p className="font-extrabold text-branco text-base sm:text-lg leading-tight">{serviceName}</p>
                    <p className="text-dourado-premium font-black text-lg mt-1">{formatPrice(servicePrice || 0)}</p>
                  </div>
                </div>

                {/* Barber Column */}
                <div className="flex items-center sm:items-start gap-4 sm:flex-col sm:gap-3 sm:pl-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-branco/5">
                  <div className="w-12 h-12 bg-branco/5 border border-branco/10 rounded-2xl flex items-center justify-center shrink-0">
                    <UserIcon className="w-5 h-5 text-branco/80" />
                  </div>
                  <div>
                    <p className="text-[11px] text-branco/50 uppercase tracking-widest font-bold mb-1">Barbeiro</p>
                    <p className="font-extrabold text-branco text-base sm:text-lg leading-tight">{barberName}</p>
                    <p className="text-emerald-400 text-xs font-semibold mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Confirmado
                    </p>
                  </div>
                </div>

                {/* Date & Time Column */}
                <div className="flex items-center sm:items-start gap-4 sm:flex-col sm:gap-3 sm:pl-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-branco/5">
                  <div className="w-12 h-12 bg-branco/5 border border-branco/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-branco/80" />
                  </div>
                  <div>
                    <p className="text-[11px] text-branco/50 uppercase tracking-widest font-bold mb-1">Data e Hora</p>
                    <p className="font-extrabold text-branco text-base sm:text-lg leading-tight capitalize">
                      {startTime && new Date(startTime).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-dourado-premium font-black text-base mt-0.5">
                      {startTime && new Date(startTime).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full py-4.5 rounded-2xl font-black text-lg bg-dourado-premium text-preto-profundo transition-all animate-pulse-glow motion-btn shadow-[0_0_25px_rgba(245,197,66,0.3)] disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirmar Reserva VIP'}
            </button>
            {status !== 'authenticated' && (
              <p className="text-center text-branco/50 text-xs mt-4 leading-relaxed">
                Ao clicar em confirmar, você poderá se cadastrar ou entrar rapidamente sem perder as opções selecionadas.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

