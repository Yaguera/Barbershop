'use client';

import { Calendar, CircleDollarSign, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ReceptionBottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Agenda',
      href: '/atendente',
      icon: Calendar,
      isActive: pathname === '/atendente',
    },
    {
      label: 'Caixa',
      href: '/atendente/caixa',
      icon: CircleDollarSign,
      isActive: pathname.startsWith('/atendente/caixa'),
    },
    {
      label: 'Conta',
      href: '/profile',
      icon: User,
      isActive: pathname.startsWith('/profile'),
    },
  ];

  return (
    <nav
      aria-label="Navegação da Atendente"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E0E0E]/95 backdrop-blur-md border-t border-white/5 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-3 h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                item.isActive
                  ? 'text-[#D4AF37]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
