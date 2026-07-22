'use client';

import React from 'react';
import { ServiceCard } from './ServiceCard';

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
  // Default mock items if none provided
  const displayServices: ServiceItem[] = services.length > 0 ? services : [
    { id: '1', name: 'Corte de cabelo', price: 40, durationMinutes: 45, image: '/images/service_image.png' },
    { id: '2', name: 'Barba Terapia Completa', price: 35, durationMinutes: 30, image: '/images/service_image.png' },
    { id: '3', name: 'Combo VIP (Corte + Barba)', price: 70, durationMinutes: 65, image: '/images/service_image.png' },
    { id: '4', name: 'Acabamento & Pezinho', price: 20, durationMinutes: 20, image: '/images/service_image.png' },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[24px] font-bold text-[#FFFFFF] tracking-tight">
          Nossos serviços
        </h2>
        <button
          type="button"
          onClick={onViewAllClick}
          className="text-[#D4AF37] text-[15px] font-semibold hover:underline cursor-pointer transition-colors"
        >
          Ver todos
        </button>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory">
        {displayServices.map((srv) => (
          <ServiceCard
            key={srv.id}
            name={srv.name}
            priceFormatted={formatCurrency(srv.price)}
            duration={`${srv.durationMinutes} min`}
            imageUrl={srv.image || '/images/service_image.png'}
            onClick={() => onServiceSelect && onServiceSelect(srv)}
          />
        ))}
      </div>
    </section>
  );
}
