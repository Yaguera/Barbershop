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
        <p className="text-branco/60 mb-10">Seu horário VIP foi garantido com sucesso.</p>

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

        <button
          onClick={() => {
            setBookingSuccess(null);
            setStep(0);
            router.push('/dashboard');
          }}
          className="w-full py-4 rounded-2xl font-bold bg-dourado-premium hover:bg-dourado-dark text-preto-profundo transition-all shadow-[0_0_20px_rgba(245,197,66,0.4)]"
        >
          Meus Agendamentos
        </button>
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

      {/* STEP 0: HOME DASHBOARD */}
      {step === 0 && (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-branco/60 text-sm uppercase tracking-widest font-medium mb-1">Bem-vindo de volta</h2>
              <h1 className="text-2xl font-bold text-branco">{session?.user?.name || 'Visitante VIP'}</h1>
            </div>
            {session?.user?.image ? (
              <Image src={session.user.image} alt="Profile" width={48} height={48} className="w-12 h-12 rounded-full border-2 border-dourado-premium/50 object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-cinza-grafite flex items-center justify-center border border-branco/10">
                <UserIcon className="w-6 h-6 text-branco/50" />
              </div>
            )}
          </div>

          {/* Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cinza-grafite to-cinza-chumbo p-6 shadow-lg border border-branco/5">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-dourado-premium/20 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-dourado-premium/20 text-dourado-premium text-xs font-bold rounded-full mb-3">OFERTA VIP</span>
              <h3 className="text-2xl font-bold text-branco mb-2 w-2/3 leading-tight">Agende agora e ganhe hidratação grátis.</h3>
              <button 
                onClick={() => setStep(1)}
                className="mt-4 bg-dourado-premium text-preto-profundo px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-dourado-dark transition-all"
              >
                Agendar Agora
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-lg font-bold text-branco">Serviços Destaque</h3>
              <button onClick={() => setStep(1)} className="text-dourado-premium text-sm font-semibold">Ver Todos</button>
            </div>
            <div 
              {...servicesScroll}
              className={`flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x ${servicesScroll.className}`}
            >
              {initialServices.slice(0, 3).map((service) => (
                <div key={service.id} onClick={() => { setService(service.id, service.name, service.price); setStep(2); }} 
                     className="snap-center shrink-0 w-64 glass rounded-3xl p-4 border border-branco/5 cursor-pointer hover:bg-cinza-grafite/50 transition-all">
                  <div className="h-32 rounded-2xl mb-4 overflow-hidden relative">
                    <Image src={service.image || "/images/service_image.png"} alt="Service" fill className="object-cover" />
                  </div>
                  <h4 className="font-bold text-branco text-lg">{service.name}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-dourado-premium font-bold">{formatPrice(service.price)}</span>
                    <span className="text-branco/50 text-xs flex items-center"><Clock className="w-3 h-3 mr-1"/> {service.durationMinutes} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Barbers */}
          <div>
            <h3 className="text-lg font-bold text-branco mb-4">Nossos Barbeiros</h3>
            <div className="grid grid-cols-2 gap-4">
              {initialBarbers.filter((b) => b.active !== false).slice(0, 4).map((barber) => (
                <div key={barber.id} onClick={() => { setBarber(barber.id, barber.name); setStep(3); }} 
                     className="glass rounded-3xl p-4 flex flex-col items-center cursor-pointer hover:bg-cinza-grafite/50 transition-all text-center">
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-dourado-premium/30">
                    <Image src={barber.image || "/images/barber_portrait.png"} alt="Barber" width={64} height={64} className="object-cover w-full h-full" />
                  </div>
                  <h4 className="font-bold text-branco text-sm">{barber.name}</h4>
                  <p className="text-branco/50 text-[10px] mt-0.5 line-clamp-1">{barber.specialty || 'Especialista Premium'}</p>
                  <div className="flex items-center mt-1 text-dourado-premium text-xs">
                    <Star className="w-3 h-3 fill-current mr-1" /> 4.9
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: SERVICES */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-branco mb-2">Qual o serviço?</h1>
            <p className="text-branco/60">Escolha um dos nossos serviços premium.</p>
          </div>
          <div className="grid gap-4">
            {initialServices.map((service) => (
              <button
                key={service.id}
                onClick={() => { setService(service.id, service.name, service.price); setStep(2); }}
                className={`flex items-center p-4 rounded-3xl border transition-all text-left ${
                  serviceId === service.id ? 'border-dourado-premium bg-dourado-premium/10' : 'border-branco/10 glass hover:border-branco/20'
                }`}
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 mr-4">
                  <Image src={service.image || "/images/service_image.png"} alt="Service" width={80} height={80} className="object-cover w-full h-full" />
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-branco text-lg">{service.name}</h3>
                  <div className="flex items-center text-branco/50 text-xs mt-1">
                    <Clock className="w-3.5 h-3.5 mr-1" /> {service.durationMinutes} min
                  </div>
                </div>
                <div className="text-dourado-premium font-bold text-lg">
                  {formatPrice(service.price)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: BARBERS */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-branco mb-2">Com quem?</h1>
            <p className="text-branco/60">Selecione o profissional de sua preferência.</p>
          </div>
          <div className="grid gap-4">
            {initialBarbers.filter((b) => b.active !== false).map((barber) => (
              <button
                key={barber.id}
                onClick={() => { setBarber(barber.id, barber.name); setStep(3); }}
                className={`flex items-center p-4 rounded-3xl border transition-all text-left ${
                  barberId === barber.id ? 'border-dourado-premium bg-dourado-premium/10' : 'border-branco/10 glass hover:border-branco/20'
                }`}
              >
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 mr-4 border border-branco/10">
                  <Image src={barber.image || "/images/barber_portrait.png"} alt="Barber" width={64} height={64} className="object-cover w-full h-full" />
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-branco text-lg">{barber.name}</h3>
                  <p className="text-dourado-premium/90 text-xs font-medium mt-0.5">{barber.specialty || 'Especialista Premium'}</p>
                  <div className="flex items-center mt-1 text-dourado-premium text-xs">
                    <Star className="w-3.5 h-3.5 fill-current mr-1" /> 4.9 <span className="text-branco/30 ml-1">(120+ avaliações)</span>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 ${barberId === barber.id ? 'text-dourado-premium' : 'text-branco/30'}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: DATETIME */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-branco mb-2">Quando?</h1>
            <p className="text-branco/60">Encontre o melhor horário na agenda.</p>
          </div>

          <div 
            {...daysScroll}
            className={`flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x ${daysScroll.className}`}
          >
            {daysList.map((day, idx) => {
              const isSelected = formatYYYYMMDD(day) === formatYYYYMMDD(selectedDate);
              const isWorkday = initialBarbers.find((b) => b.id === barberId)?.workDays.includes(day.getDay());

              return (
                <button
                  key={idx}
                  onClick={() => { setSelectedDate(day); setStartTime(null); }}
                  disabled={!isWorkday}
                  className={`snap-center shrink-0 w-20 py-4 rounded-3xl flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-dourado-premium text-preto-profundo shadow-[0_0_20px_rgba(245,197,66,0.3)]'
                      : isWorkday
                      ? 'glass border border-branco/10 text-branco hover:bg-branco/5'
                      : 'glass border border-transparent text-branco/20 cursor-not-allowed'
                  }`}
                >
                  <span className="text-xs uppercase font-medium tracking-wider mb-1">{formatWeekDay(day)}</span>
                  <span className="text-2xl font-bold">{day.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4">
            <h3 className="text-branco font-bold mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-dourado-premium" />
              Horários disponíveis
            </h3>
            
            {isLoadingSlots ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-dourado-premium animate-spin" /></div>
            ) : availableSlots.length === 0 ? (
              <div className="glass p-6 rounded-3xl text-center text-branco/50 border border-branco/5">Nenhum horário disponível.</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {availableSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => { if (slot.available) { setStartTime(slot.dateTime); setStep(4); } }}
                    disabled={!slot.available}
                    className={`py-3 rounded-2xl text-sm font-bold transition-all ${
                      !slot.available
                        ? 'bg-transparent border border-branco/5 text-branco/20 line-through'
                        : startTime === slot.dateTime
                        ? 'bg-dourado-premium text-preto-profundo shadow-lg'
                        : 'glass border border-branco/10 text-branco hover:border-dourado-premium/50'
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
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-branco mb-2">Revisão</h1>
            <p className="text-branco/60">Confirme os dados do agendamento.</p>
          </div>

          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-start gap-3 text-red-200 text-sm">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="glass-heavy rounded-3xl p-1 border border-branco/10">
            <div className="bg-cinza-grafite/40 rounded-[22px] p-6 space-y-6">
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-dourado-premium/10 rounded-2xl flex items-center justify-center shrink-0">
                  <Scissors className="w-6 h-6 text-dourado-premium" />
                </div>
                <div>
                  <p className="text-xs text-branco/50 uppercase tracking-widest font-semibold mb-1">Serviço</p>
                  <p className="font-bold text-branco text-lg leading-none">{serviceName}</p>
                  <p className="text-dourado-premium font-bold mt-1">{formatPrice(servicePrice || 0)}</p>
                </div>
              </div>

              <div className="h-px bg-branco/5 w-full" />

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-branco/5 rounded-2xl flex items-center justify-center shrink-0">
                  <UserIcon className="w-6 h-6 text-branco/80" />
                </div>
                <div>
                  <p className="text-xs text-branco/50 uppercase tracking-widest font-semibold mb-1">Barbeiro</p>
                  <p className="font-bold text-branco text-lg leading-none">{barberName}</p>
                </div>
              </div>

              <div className="h-px bg-branco/5 w-full" />

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-branco/5 rounded-2xl flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6 text-branco/80" />
                </div>
                <div>
                  <p className="text-xs text-branco/50 uppercase tracking-widest font-semibold mb-1">Data e Hora</p>
                  <p className="font-bold text-branco text-lg leading-tight">
                    {startTime && new Date(startTime).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl font-bold text-lg bg-dourado-premium hover:bg-dourado-dark text-preto-profundo transition-all shadow-[0_0_20px_rgba(245,197,66,0.2)] disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirmar Reserva'}
            </button>
            {status !== 'authenticated' && (
              <p className="text-center text-branco/40 text-xs mt-4">
                Você será redirecionado para fazer login.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
