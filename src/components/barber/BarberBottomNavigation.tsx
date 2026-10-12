'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  Clock,
  LayoutDashboard,
  User,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

interface BarberBottomNavigationProps {
  barberProfileId?: string;
}

export function BarberBottomNavigation({}: BarberBottomNavigationProps = {}) {
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

  const navItems = [
    {
      label: 'Início',
      path: '/barber/dashboard',
      icon: LayoutDashboard,
      active: isCurrent('/barber/dashboard'),
    },
    {
      label: 'Agenda',
      path: '/barber/agenda',
      icon: Clock,
      active: isCurrent('/barber/agenda'),
    },
    {
      label: 'Análises',
      path: '/barber/metricas',
      icon: BarChart3,
      active: isCurrent('/barber/metricas'),
    },
    {
      label: 'Conta',
      path: '/profile',
      icon: User,
      active: pathname?.startsWith('/profile'),
      isUser: true,
    },
  ];

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Navegação inferior do barbeiro"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_25px_rgba(0,0,0,0.6)] pb-safe"
    >
      <div className="max-w-md mx-auto px-2 h-16 grid grid-cols-4 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => router.push(item.path)}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center gap-1 py-1 transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-[#D4AF37]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {item.isUser && userImage ? (
                <div
                  className={`w-5 h-5 rounded-full overflow-hidden border transition-all ${
                    isActive ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]' : 'border-white/20'
                  }`}
                >
                  <Image
                    src={userImage}
                    alt={userName}
                    width={20}
                    height={20}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <Icon className={`w-5 h-5 stroke-[2] ${isActive ? 'text-[#D4AF37]' : ''}`} />
              )}
              <span className={`text-[10px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}

