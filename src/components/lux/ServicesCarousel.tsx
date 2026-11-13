'use client';

import { useDragScroll } from '@/hooks/useDragScroll';
import {
  getServiceCategory,
  getServiceImage,
  type ServiceCategoryKey,
} from '@/utils/service-images';
import { ChevronLeft, ChevronRight, Scissors } from 'lucide-react';
import { useMemo, useState } from 'react';
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

const CATEGORY_TABS: { key: ServiceCategoryKey; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'cortes', label: 'Cortes' },
  { key: 'barba_combos', label: 'Barba & Combos' },
  { key: 'cuidados', label: 'Química & Cuidados' },
];

export function ServicesCarousel({
  services = [],
  onServiceSelect,
  onViewAllClick,
}: ServicesCarouselProps) {
  const [activeCategory, setActiveCategory] = useState<ServiceCategoryKey>('todos');
  const scrollDrag = useDragScroll<HTMLDivElement>();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const filteredServices = useMemo(() => {
    if (activeCategory === 'todos') return services;
    return services.filter((srv) => getServiceCategory(srv.name) === activeCategory);
  }, [services, activeCategory]);

  const handleCategoryChange = (category: ServiceCategoryKey) => {
    setActiveCategory(category);
    scrollDrag.ref.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  const handleScrollBy = (offset: number) => {
    scrollDrag.ref.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <section id="servicos" className="scroll-mt-24 w-full max-w-7xl mx-auto py-2 md:py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-4 md:mb-5 px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="hidden md:block text-[11px] font-medium uppercase tracking-widest text-zinc-500 mb-1">
              Catálogo de Especialidades
            </span>
            <h2 className="text-sm md:text-lg font-semibold text-white tracking-tight">
              Nossos serviços
            </h2>
          </div>

          {services.length > 0 && (
            <button
              type="button"
              onClick={onViewAllClick}
              className="md:hidden text-zinc-400 hover:text-white text-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-4 h-4 stroke-[2]" />
            </button>
          )}
        </div>

        {services.length > 0 && (
          <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
            {/* Abas de filtro rápido por categoria */}
            <div
              className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 md:pb-0"
              role="tablist"
              aria-label="Filtrar serviços por categoria"
            >
              {CATEGORY_TABS.map((tab) => {
                const isActive = activeCategory === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleCategoryChange(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-white/[0.08] text-white border-white/15'
                        : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Controles horizontais discretos no desktop + Ver todos */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-white/[0.08]">
              <button
                type="button"
                onClick={() => handleScrollBy(-320)}
                aria-label="Rolar serviços para a esquerda"
                className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScrollBy(320)}
                aria-label="Rolar serviços para a direita"
                className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onViewAllClick}
                className="ml-1 text-zinc-400 hover:text-white text-sm font-medium cursor-pointer transition-colors flex items-center gap-1"
              >
                <span>Ver todos</span>
                <ChevronRight className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {services.length === 0 ? (
        <div className="px-6">
          <div className="bg-[#141414] border border-white/[0.07] rounded-lg p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-md bg-white/[0.04] text-[#C5A059] flex items-center justify-center mx-auto">
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
      ) : filteredServices.length === 0 ? (
        <div className="px-6">
          <div className="bg-[#141414] border border-white/[0.07] rounded-lg p-6 text-center space-y-2">
            <p className="text-xs font-semibold text-white/70">
              Nenhum serviço encontrado nesta categoria.
            </p>
            <button
              type="button"
              onClick={() => handleCategoryChange('todos')}
              className="text-xs text-[#C5A059] hover:underline cursor-pointer"
            >
              Ver todos os serviços
            </button>
          </div>
        </div>
      ) : (
        <div
          {...scrollDrag}
          className={`flex gap-3.5 md:gap-5 overflow-x-auto px-6 pb-4 pt-1 scrollbar-none snap-x snap-mandatory ${scrollDrag.className}`}
        >
          {filteredServices.map((srv, idx) => (
            <ServiceCard
              key={srv.id}
              name={srv.name}
              priceFormatted={formatCurrency(srv.price)}
              duration={`${srv.durationMinutes} min`}
              imageUrl={getServiceImage(srv.name, srv.image, idx)}
              iconType={idx === 0 ? 'scissors' : idx === 1 ? 'beard' : idx === 2 ? 'star' : 'smile'}
              onClick={() => onServiceSelect && onServiceSelect(srv)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
