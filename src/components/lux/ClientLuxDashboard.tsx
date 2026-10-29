'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AppointmentCard } from './AppointmentCard';
import { BottomNavigation, NavTab } from './BottomNavigation';
import { Header } from './Header';
import { HeroBanner } from './HeroBanner';
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
  onStartBooking,
  onServiceSelect,
}: ClientLuxDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NavTab>('inicio');

  const handleActionClick = (action: 'agendar' | 'servicos' | 'conta' | 'indicar') => {
    if (action === 'agendar') {
      onStartBooking?.();
    } else if (action === 'servicos') {
      document.getElementById('servicos')?.scrollIntoView({ behavior: 'smooth' });
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
        <AppointmentCard autoFetch={true} />

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
