'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from './Header';
import { HeroBanner } from './HeroBanner';
import { QuickAccess } from './QuickAccess';
import { AppointmentCard } from './AppointmentCard';
import { ServicesCarousel, ServiceItem } from './ServicesCarousel';
import { PremiumBanner } from './PremiumBanner';
import { BottomNavigation, NavTab } from './BottomNavigation';

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
  onOpenHistory,
}: ClientLuxDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NavTab>('inicio');

  const handleActionClick = (action: 'agendar' | 'servicos' | 'conta' | 'indicar') => {
    if (action === 'agendar' || action === 'servicos') {
      onStartBooking && onStartBooking();
    } else if (action === 'conta') {
      router.push('/profile');
    } else if (action === 'indicar') {
      alert('Seu código de indicação VIP: BARBER-VIP-2026. Compartilhe e ganhe R$ 20 de desconto!');
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

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#FFFFFF] flex flex-col pb-24 selection:bg-[#D4AF37]/30 font-sans">
      {/* Top Header */}
      <Header />

      {/* Main Container respecting exact layout spacing and mobile-first widths up to desktop */}
      <main className="flex-grow w-full space-y-4">
        {/* Hero Section */}
        <HeroBanner onBookClick={onStartBooking} />

        {/* Acesso Rápido */}
        <QuickAccess onActionClick={handleActionClick} />

        {/* Próximo Agendamento */}
        <AppointmentCard
          autoFetch={true}
          date="Sábado, 18 de Maio"
          time="10:00"
          barberName={barbers.length > 0 ? barbers[0].name : 'Lucas'}
          serviceName="Corte & Estilo VIP"
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

        {/* Seja Premium Banner */}
        <PremiumBanner
          onLearnMoreClick={() => {
            alert('Clube VIP: Assinatura mensal com cortes ilimitados, bar aberto e atendimento prioritário.');
          }}
        />
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onPlusClick={onStartBooking}
      />
    </div>
  );
}
