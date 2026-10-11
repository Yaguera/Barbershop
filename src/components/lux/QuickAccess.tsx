'use client';

import { motion } from 'framer-motion';
import { Calendar, Gift, Scissors, User } from 'lucide-react';

interface QuickAccessProps {
  onActionClick?: (action: 'agendar' | 'servicos' | 'conta' | 'indicar') => void;
}

export function QuickAccess({ onActionClick }: QuickAccessProps) {
  const items = [
    { id: 'agendar' as const, label: 'Agendar', icon: Calendar },
    { id: 'servicos' as const, label: 'Serviços', icon: Scissors },
    { id: 'conta' as const, label: 'Conta', icon: User },
    { id: 'indicar' as const, label: 'Indicação', icon: Gift },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto py-2">
      <h2 className="text-sm font-bold text-[#FFFFFF] mb-2.5 px-6 tracking-tight">
        Acesso rápido
      </h2>

      <div className="px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="bg-[#151515] rounded-2xl p-3 sm:p-4 border border-white/5 shadow-xl"
        >
          <div className="grid grid-cols-4 divide-x divide-white/5">
            {items.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onActionClick && onActionClick(item.id)}
                  className="flex flex-col items-center justify-center py-1.5 px-1 transition-all duration-200 hover:opacity-80 active:scale-[0.96] group cursor-pointer"
                >
                  <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37] stroke-[1.8] transition-transform group-hover:scale-110" />
                  <span className="text-[11px] sm:text-xs font-semibold text-white/80 mt-1.5 text-center leading-tight">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
