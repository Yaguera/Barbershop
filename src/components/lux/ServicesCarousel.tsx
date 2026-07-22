'use client';

import React from 'react';
import { ServiceCard } from './ServiceCard';
import { ChevronRight } from 'lucide-react';

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  image?: string | null;
}

interface ServicesCarouselProps {
  services?: ServiceItem[];
  onServiceSelect?: (service: ServiceItem) => void;
  onViewAllClick?: () => void;
}

export function ServicesCarousel({
  services = [],
  onServiceSelect,
  onViewAllClick,
}: ServicesCarouselProps) {
  // Default mock items EXACTLY matching screenshot
  const displayServices: (ServiceItem & { iconType?: 'scissors' | 'beard' | 'star' | 'smile' })[] =
    services.length > 0
      ? services.map((s, idx) => ({
          ...s,
          iconType: idx === 0 ? 'scissors' : idx === 1 ? 'beard' : idx === 2 ? 'star' : 'smile',
        }))
      : [
          { id: '1', name: 'Corte de Cabelo', price: 40, durationMinutes: 45, image: '/images/service_image.png', iconType: 'scissors' },
          { id: '2', name: 'Barba', price: 30, durationMinutes: 30, image: '/images/service_image.png', iconType: 'beard' },
          { id: '3', name: 'Corte + Barba', price: 60, durationMinutes: 65, image: '/images/service_image.png', iconType: 'star' },
          { id: '4', name: 'Corte Infantil', price: 35, durationMinutes: 40, image: '/images/service_image.png', iconType: 'smile' },
        ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <section className="w-full max-w-6xl mx-auto py-2">
      <div className="flex items-center justify-between mb-3 px-6">
        <h2 className="text-sm font-bold text-[#FFFFFF] tracking-tight">
          Nossos serviços
        </h2>
        <button
          type="button"
          onClick={onViewAllClick}
          className="text-[#D4AF37] text-xs font-bold hover:underline cursor-pointer transition-colors flex items-center gap-1"
        >
          <span>Ver todos</span>
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto px-6 pb-3 pt-1 scrollbar-none snap-x snap-mandatory">
        {displayServices.map((srv) => (
          <ServiceCard
            key={srv.id}
            name={srv.name}
            priceFormatted={formatCurrency(srv.price)}
            duration={`${srv.durationMinutes} min`}
            imageUrl={srv.image || '/images/service_image.png'}
            iconType={srv.iconType}
            onClick={() => onServiceSelect && onServiceSelect(srv)}
          />
        ))}
      </div>
    </section>
  );
}
