'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AppointmentCard } from './AppointmentCard';
import { BottomNavigation, NavTab } from './BottomNavigation';
import { Header } from './Header';
import { HeroBanner } from './HeroBanner';
import { PremiumBanner } from './PremiumBanner';
import { QuickAccess } from './QuickAccess';
import { ServiceItem, ServicesCarousel } from './ServicesCarousel';

interface BarberProp {
  id: string;
  name: string;
  specialty?: string;
}

interface ClientLuxDashboardProps {
  services?: ServiceItem[];
  barbers?: BarberProp[];
  onStartBooking?: () => void;
  onServiceSelect?: (service: ServiceItem) => void;
  onOpenHistory?: () => void;
}

export function ClientLuxDashboard({
  services = [],
  barbers = [],
  onStartBooking,
  onServiceSelect,
}: ClientLuxDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NavTab>('inicio');

  const handleActionClick = (action: 'agendar' | 'servicos' | 'conta' | 'indicar') => {
    if (action === 'agendar' || action === 'servicos') {
      onStartBooking && onStartBooking();
    } else if (action === 'conta') {
      router.push('/profile');
    } else if (action === 'indicar') {
      const shareText = encodeURIComponent(
        'Venha conhecer a barbearia e agende seu atendimento com profissionais de excelência!'
      );
      window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
    }
  };

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'agendamentos') {
      router.push('/agenda');
    } else if (tab === 'historico') {
      router.push('/historico');
    } else if (tab === 'inicio') {
      // already on home
    }
  };

  const handleLearnMorePlans = () => {
    const text = encodeURIComponent(
      'Olá! Gostaria de conhecer os planos e condições de assinatura mensal da barbearia.'
    );
    window.open(`https://wa.me/5585986279194?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#FFFFFF] flex flex-col pb-24 md:pb-12 selection:bg-[#D4AF37]/30 font-sans">
      {/* Top Header */}
      <Header onBookClick={onStartBooking} />

      {/* Main Container */}
      <main className="flex-grow w-full space-y-4 md:space-y-6">
        {/* Hero Section */}
        <HeroBanner onBookClick={onStartBooking} />

        {/* Acesso Rápido (Mobile Only) */}
        <QuickAccess onActionClick={handleActionClick} />

        {/* Próximo Agendamento */}
        <AppointmentCard
          autoFetch={true}
          barberName={barbers.length > 0 ? barbers[0].name : undefined}
        />

        {/* Nossos Serviços */}
        <ServicesCarousel
          services={services}
          onServiceSelect={(srv) => {
            if (onServiceSelect) {
              onServiceSelect(srv);
            } else if (onStartBooking) {
              onStartBooking();
            }
          }}
          onViewAllClick={onStartBooking}
        />

        {/* Seja Premium Banner + Indique um Amigo (Desktop Grid) */}
        <PremiumBanner
          onLearnMoreClick={handleLearnMorePlans}
          onReferClick={() => handleActionClick('indicar')}
        />
      </main>

      {/* Fixed Bottom Navigation (Mobile Only) */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onPlusClick={onStartBooking}
      />
    </div>
  );
}
