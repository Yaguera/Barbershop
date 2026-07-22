'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Clock, 
  BarChart3, 
  CalendarCheck, 
  User as UserIcon 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface BarberBottomNavigationProps {
  barberProfileId?: string;
}

export function BarberBottomNavigation({ barberProfileId }: BarberBottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const isCurrent = (path: string) => {
    if (path === '/barber/dashboard') {
      return pathname === '/barber/dashboard';
    }
    return pathname?.startsWith(path);
  };

  const userImage = session?.user?.image;
  const userName = session?.user?.name || 'Barbeiro';
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-[rgba(255,255,255,0.06)] shadow-[0_-4px_25px_rgba(0,0,0,0.6)] pb-safe"
    >
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between relative">
        
        {/* Item 1: Início */}
        <button
          type="button"
          onClick={() => router.push('/barber/dashboard')}
          className={`flex flex-col items-center justify-center gap-1 w-14 transition-all duration-200 cursor-pointer ${
            isCurrent('/barber/dashboard') && !pathname?.includes('/schedule')
              ? 'text-[#D4AF37]'
              : 'text-[#7A7A7A] hover:text-[#FFFFFF]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-medium tracking-tight">Início</span>
        </button>

        {/* Item 2: Atendimentos */}
        <button
          type="button"
          onClick={() => router.push('/barber/agenda')}
          className={`flex flex-col items-center justify-center gap-1 w-16 transition-all duration-200 cursor-pointer ${
            isCurrent('/barber/agenda')
              ? 'text-[#D4AF37]'
              : 'text-[#7A7A7A] hover:text-[#FFFFFF]'
          }`}
        >
          <Clock className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-medium tracking-tight">Agenda</span>
        </button>

        {/* Item 3: Botão central com foto do perfil -> Leva para as configurações de perfil (/profile) */}
        <div className="relative -mt-6 flex items-center justify-center">
          <button
            type="button"
            onClick={() => router.push('/profile')}
            aria-label="Configurações do Perfil"
            className={`w-14 h-14 rounded-full bg-[#1C1C1C] hover:bg-[#252525] flex items-center justify-center shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all duration-200 hover:scale-[1.06] active:scale-[0.96] border-4 border-[#0D0D0D] overflow-hidden cursor-pointer ${
              pathname?.startsWith('/profile') ? 'ring-2 ring-[#D4AF37]' : ''
            }`}
          >
            {userImage ? (
              <Image
                src={userImage}
                alt={userName}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-black text-[#D4AF37] tracking-wider">
                {initials}
              </span>
            )}
          </button>
        </div>

        {/* Item 4: Métricas */}
        <button
          type="button"
          onClick={() => router.push('/barber/metricas')}
          className={`flex flex-col items-center justify-center gap-1 w-16 transition-all duration-200 cursor-pointer ${
            isCurrent('/barber/metricas')
              ? 'text-[#D4AF37]'
              : 'text-[#7A7A7A] hover:text-[#FFFFFF]'
          }`}
        >
          <BarChart3 className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-medium tracking-tight">Métricas</span>
        </button>

        {/* Item 5: Meus Horários / Configurações de Agenda */}
        <button
          type="button"
          onClick={() => {
            if (barberProfileId) {
              router.push(`/barber/dashboard/schedule/${barberProfileId}`);
            } else {
              router.push('/profile');
            }
          }}
          className={`flex flex-col items-center justify-center gap-1 w-14 transition-all duration-200 cursor-pointer ${
            pathname?.includes('/schedule/')
              ? 'text-[#D4AF37]'
              : 'text-[#7A7A7A] hover:text-[#FFFFFF]'
          }`}
        >
          <CalendarCheck className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-medium tracking-tight">Horários</span>
        </button>

      </div>
    </motion.nav>
  );
}
