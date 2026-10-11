'use client';

import { ChevronRight, Scissors } from 'lucide-react';
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
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <section className="w-full max-w-6xl mx-auto py-2">
      <div className="flex items-center justify-between mb-3 px-6">
        <h2 className="text-sm font-bold text-[#FFFFFF] tracking-tight">
          Nossos serviços
        </h2>
        {services.length > 0 && (
          <button
            type="button"
            onClick={onViewAllClick}
            className="text-[#D4AF37] text-xs font-bold hover:underline cursor-pointer transition-colors flex items-center gap-1"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>

      {services.length === 0 ? (
        <div className="px-6">
          <div className="bg-[#151515] border border-white/5 rounded-2xl p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] text-[#D4AF37] flex items-center justify-center mx-auto">
              <Scissors className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-white/70">
              Nenhum serviço disponível no catálogo no momento.
            </p>
            <p className="text-[11px] text-white/40">
              Entre em contato conosco ou tente novamente mais tarde.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto px-6 pb-3 pt-1 scrollbar-none snap-x snap-mandatory">
          {services.map((srv, idx) => (
            <ServiceCard
              key={srv.id}
              name={srv.name}
              priceFormatted={formatCurrency(srv.price)}
              duration={`${srv.durationMinutes} min`}
              imageUrl={srv.image || '/images/service_image.png'}
              iconType={idx === 0 ? 'scissors' : idx === 1 ? 'beard' : idx === 2 ? 'star' : 'smile'}
              onClick={() => onServiceSelect && onServiceSelect(srv)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
