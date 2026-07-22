'use client';

import React from 'react';
import { Home, Clock, Plus, Calendar, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

export type NavTab = 'inicio' | 'agendamentos' | 'mais_acao' | 'historico' | 'mais';

interface BottomNavigationProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  onPlusClick?: () => void;
}

export function BottomNavigation({
  activeTab = 'inicio',
  onTabChange,
  onPlusClick,
}: BottomNavigationProps) {
  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-[rgba(255,255,255,0.06)] shadow-[0_-4px_25px_rgba(0,0,0,0.5)] pb-safe"
    >
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between relative">
        {/* Item 1: Início */}
        <button
          type="button"
          onClick={() => onTabChange && onTabChange('inicio')}
          className={`flex flex-col items-center justify-center gap-1 w-12 transition-all duration-200 cursor-pointer ${
            activeTab === 'inicio' ? 'text-[#D4AF37]' : 'text-[#7A7A7A] hover:text-[#FFFFFF]'
          }`}
        >
          <Home className="w-6 h-6 stroke-[2]" />
          <span className="text-[11px] font-medium tracking-tight">Início</span>
        </button>

        {/* Item 2: Agendamentos */}
        <button
          type="button"
          onClick={() => onTabChange && onTabChange('agendamentos')}
          className={`flex flex-col items-center justify-center gap-1 w-16 transition-all duration-200 cursor-pointer ${
            activeTab === 'agendamentos' ? 'text-[#D4AF37]' : 'text-[#7A7A7A] hover:text-[#FFFFFF]'
          }`}
        >
          <Clock className="w-6 h-6 stroke-[2]" />
          <span className="text-[11px] font-medium tracking-tight">Agenda</span>
        </button>

        {/* Item 3: Botão central (+) - Circular, Maior, Dourado, Sombra */}
        <div className="relative -mt-6 flex items-center justify-center">
          <button
            type="button"
            onClick={onPlusClick}
            aria-label="Novo Agendamento"
            className="w-14 h-14 rounded-full bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] flex items-center justify-center shadow-[0_4px_20px_rgba(212,175,55,0.45)] transition-all duration-200 hover:scale-[1.06] active:scale-[0.96] border-4 border-[#0D0D0D] cursor-pointer"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Item 4: Histórico */}
        <button
          type="button"
          onClick={() => onTabChange && onTabChange('historico')}
          className={`flex flex-col items-center justify-center gap-1 w-16 transition-all duration-200 cursor-pointer ${
            activeTab === 'historico' ? 'text-[#D4AF37]' : 'text-[#7A7A7A] hover:text-[#FFFFFF]'
          }`}
        >
          <Calendar className="w-6 h-6 stroke-[2]" />
          <span className="text-[11px] font-medium tracking-tight">Histórico</span>
        </button>

        {/* Item 5: Mais */}
        <button
          type="button"
          onClick={() => onTabChange && onTabChange('mais')}
          className={`flex flex-col items-center justify-center gap-1 w-12 transition-all duration-200 cursor-pointer ${
            activeTab === 'mais' ? 'text-[#D4AF37]' : 'text-[#7A7A7A] hover:text-[#FFFFFF]'
          }`}
        >
          <MoreHorizontal className="w-6 h-6 stroke-[2]" />
          <span className="text-[11px] font-medium tracking-tight">Mais</span>
        </button>
      </div>
    </motion.nav>
  );
}
