'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  X, 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  LogOut, 
  User, 
  Sparkles,
  ChevronRight,
  Clock
} from 'lucide-react';
import Image from 'next/image';

interface BarberSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BarberSidebar({ isOpen, onClose }: BarberSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleLogout = async () => {
    onClose();
    await signOut({ callbackUrl: '/auth/login' });
  };

  const userName = session?.user?.name || 'Barbeiro Master';
  const userEmail = session?.user?.email || 'Profissional da Barbearia';
  const userImage = session?.user?.image;
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const navItems = [
    { label: 'Início', path: '/barber/dashboard', icon: LayoutDashboard },
    { label: 'Meus Atendimentos', path: '/barber/agenda', icon: Calendar },
    { label: 'Minhas Métricas', path: '/barber/metricas', icon: BarChart3 },
  ];

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden select-none">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      />

      {/* Drawer Container (Slide-in from Right or Left) */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm sm:max-w-md bg-[#0D0D0D] border-l border-white/10 text-white shadow-2xl flex flex-col justify-between overflow-y-auto selection:bg-[#D4AF37]/30">
          
          {/* Top Section: Profile & Navigation */}
          <div>
            {/* Header / Close Bar */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#151515]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse shadow-[0_0_8px_#D4AF37]" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#D4AF37]">
                  Painel do Barbeiro
                </span>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full bg-[#1C1C1C] border border-white/10 text-white/70 hover:text-white hover:border-[#D4AF37]/40 transition-all cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Profile Info Card */}
            <div className="p-6 border-b border-white/5 bg-[#151515]/60">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl border-2 border-[#D4AF37]/60 overflow-hidden shrink-0 shadow-lg bg-[#1C1C1C] flex items-center justify-center">
                  {userImage ? (
                    <Image 
                      src={userImage} 
                      alt={userName} 
                      width={56} 
                      height={56} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-black text-[#D4AF37] tracking-wider">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black uppercase tracking-wider">
                      Profissional
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white truncate tracking-tight mt-1">
                    {userName}
                  </h3>
                  <p className="text-xs text-white/50 truncate mt-0.5">
                    {userEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Menu Items */}
            <div className="p-4 space-y-2">
              <div className="px-3 py-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Menu Principal
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer border ${
                      isActive 
                        ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/40 font-bold shadow-lg shadow-[#D4AF37]/5' 
                        : 'bg-transparent text-white/80 border-transparent hover:bg-[#151515] hover:text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl ${isActive ? 'bg-[#D4AF37] text-[#0D0D0D]' : 'bg-[#1C1C1C] text-white/70'}`}>
                        <Icon className="w-5 h-5 stroke-[2]" />
                      </div>
                      <span className="text-sm tracking-tight">{item.label}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-white/30'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Section: Logout & Footer */}
          <div className="p-6 border-t border-white/5 bg-[#151515]/40 space-y-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/20 font-bold text-sm transition-all cursor-pointer hover:scale-[1.01]"
            >
              <LogOut className="w-4 h-4 stroke-[2.5]" />
              <span>Sair da Conta</span>
            </button>
            <p className="text-center text-[11px] text-white/30 font-medium tracking-wide">
              BarberApp Pro &bull; Clean Architecture
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
