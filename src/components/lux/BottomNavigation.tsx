'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, Home, MoreHorizontal, Plus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { SideDrawerMenu } from './SideDrawerMenu';

export type NavTab = 'inicio' | 'agendamentos' | 'mais_acao' | 'historico' | 'mais';

interface BottomNavigationProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  onPlusClick?: () => void;
  onOpenDrawer?: () => void;
}

export function BottomNavigation({
  activeTab = 'inicio',
  onTabChange,
  onPlusClick,
  onOpenDrawer,
}: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Determine active item dynamically from pathname if activeTab is not explicitly forced
  const currentTab: NavTab =
    pathname === '/' ? activeTab || 'inicio' :
    pathname?.startsWith('/agenda') ? 'agendamentos' :
    pathname?.startsWith('/historico') ? 'historico' :
    activeTab;

  const handleTabClick = (tab: NavTab) => {
    if (onTabChange) {
      onTabChange(tab);
    }

    if (tab === 'inicio') {
      if (pathname !== '/') router.push('/');
    } else if (tab === 'agendamentos') {
      if (pathname !== '/agenda') router.push('/agenda');
    } else if (tab === 'historico') {
      if (pathname !== '/historico') router.push('/historico');
    } else if (tab === 'mais') {
      if (onOpenDrawer) {
        onOpenDrawer();
      } else {
        setIsDrawerOpen(true);
      }
    }
  };

  const handlePlusClick = () => {
    if (onPlusClick) {
      onPlusClick();
    } else {
      router.push('/?action=agendar');
    }
  };

  return (
    <>
      <motion.nav
        aria-label="Navegação do cliente"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#101010]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_25px_rgba(0,0,0,0.6)] pb-safe"
      >
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between relative">
          {/* Item 1: Início */}
          <button
            type="button"
            onClick={() => handleTabClick('inicio')}
            aria-current={currentTab === 'inicio' ? 'page' : undefined}
            className={`flex min-h-11 flex-col items-center justify-center gap-1 w-12 rounded-lg focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-colors cursor-pointer ${
              currentTab === 'inicio' ? 'text-[#E2BE4D]' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Home className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[11px] font-medium tracking-tight">Início</span>
          </button>

          {/* Item 2: Agenda */}
          <button
            type="button"
            onClick={() => handleTabClick('agendamentos')}
            aria-current={currentTab === 'agendamentos' ? 'page' : undefined}
            className={`flex min-h-11 flex-col items-center justify-center gap-1 w-14 rounded-lg focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-colors cursor-pointer ${
              currentTab === 'agendamentos' ? 'text-[#E2BE4D]' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[11px] font-medium tracking-tight">Agenda</span>
          </button>

          {/* Item 3: Botão central com nome visual 'Agendar' */}
          <div className="relative -mt-4 flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={handlePlusClick}
              aria-label="Agendar Horário"
              className="w-11 h-11 rounded-xl bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[2.2]" />
            </button>
            <span className="text-[10px] font-medium text-zinc-300 tracking-tight mt-1">
              Agendar
            </span>
          </div>

          {/* Item 4: Histórico */}
          <button
            type="button"
            onClick={() => handleTabClick('historico')}
            aria-current={currentTab === 'historico' ? 'page' : undefined}
            className={`flex min-h-11 flex-col items-center justify-center gap-1 w-14 rounded-lg focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-colors cursor-pointer ${
              currentTab === 'historico' ? 'text-[#E2BE4D]' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[11px] font-medium tracking-tight">Histórico</span>
          </button>

          {/* Item 5: Mais */}
          <button
            type="button"
            onClick={() => handleTabClick('mais')}
            aria-expanded={onOpenDrawer ? undefined : isDrawerOpen}
            className={`flex min-h-11 flex-col items-center justify-center gap-1 w-12 rounded-lg focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-colors cursor-pointer ${
              currentTab === 'mais' ? 'text-[#E2BE4D]' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[11px] font-medium tracking-tight">Mais</span>
          </button>
        </div>
      </motion.nav>

      {/* Internal Drawer fallback if not opened by Header */}
      <SideDrawerMenu isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
