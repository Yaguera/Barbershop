'use client';

import React from 'react';
import { Calendar, Scissors, User, Gift } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickAccessProps {
  onActionClick?: (action: 'agendar' | 'servicos' | 'conta' | 'indicar') => void;
}

export function QuickAccess({ onActionClick }: QuickAccessProps) {
  const items = [
    { id: 'agendar' as const, label: 'Agendar', icon: Calendar },
    { id: 'servicos' as const, label: 'Serviços', icon: Scissors },
    { id: 'conta' as const, label: 'Minha conta', icon: User },
    { id: 'indicar' as const, label: 'Indique e ganhe', icon: Gift },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-4">
      <h2 className="text-[24px] font-bold text-[#FFFFFF] mb-4 tracking-tight">
        Acesso rápido
      </h2>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-[#151515] rounded-[18px] p-4 sm:p-6 border border-[rgba(255,255,255,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
      >
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {items.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onActionClick && onActionClick(item.id)}
                className="flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-[14px] transition-all duration-200 hover:scale-[1.03] hover:bg-[#1C1C1C] active:scale-[0.98] group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#1C1C1C] border border-[rgba(255,255,255,0.06)] group-hover:border-[#D4AF37]/30 flex items-center justify-center transition-colors">
                  <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-[#D4AF37] stroke-[2] transition-transform group-hover:scale-110" />
                </div>
                <span className="text-[13px] sm:text-[15px] font-normal text-[#FFFFFF] mt-2.5 text-center line-clamp-1">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
