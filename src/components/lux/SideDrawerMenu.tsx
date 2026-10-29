'use client';

import {
  Calendar,
  ChevronRight,
  Clock,
  Gift,
  LogOut,
  Scissors,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

interface SideDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideDrawerMenu({ isOpen, onClose }: SideDrawerMenuProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [imageError, setImageError] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeMenu = useEffectEvent(onClose);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const controls = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]') || []).filter((element) => element.getClientRects().length > 0);
    controls()[0]?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
      if (e.key === 'Tab') {
        const items = controls();
        if (!items.length) return;
        if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === items[items.length - 1]) { e.preventDefault(); items[0].focus(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, [isOpen]);

  if (!isOpen) return null;

  if (!session?.user) {
    return (
      <div
        ref={dialogRef}
        className="fixed inset-0 z-[100] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de acesso"
      >
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-sm sm:max-w-md bg-[#0D0D0D] border-l border-white/10 text-white shadow-2xl flex flex-col justify-between overflow-y-auto selection:bg-[#D4AF37]/30">
            <div>
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                    Minha Conta
                  </span>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Fechar menu"
                  className="p-2 rounded-full bg-[#151515] border border-white/10 text-white/70 hover:text-white hover:border-[#D4AF37]/40 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5 stroke-[2]" />
                </button>
              </div>

              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center mx-auto shadow-lg">
                  <User className="w-8 h-8 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Bem-vindo(a)</h3>
                  <p className="text-xs text-white/60 mt-2 leading-relaxed">
                    Entre na sua conta para agendar horários, consultar histórico e gerenciar suas preferências.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-[#151515]/30">
              <button
                onClick={() => {
                  onClose();
                  router.push('/auth/login');
                }}
                className="w-full py-4 px-6 rounded-2xl font-bold text-sm bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <User className="w-5 h-5 stroke-[2.5]" />
                <span>Entrar na Minha Conta</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleLogout = async () => {
    onClose();
    await signOut({ callbackUrl: '/auth/login' });
  };

  const userRole = session?.user?.role || 'CLIENT';
  const userName = session?.user?.name || 'Cliente';
  const userEmail = session?.user?.email || '';
  const userImage = session?.user?.image;

  const handleShareInvite = () => {
    onClose();
    const shareText = encodeURIComponent(
      `Recomendo a barbearia! Agende seu horário: ${window.location.origin}`
    );
    window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
  };

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[100] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu principal"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Drawer Container (Right side slide-in) */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm sm:max-w-md bg-[#0D0D0D] border-l border-white/10 text-white shadow-2xl flex flex-col justify-between overflow-y-auto selection:bg-[#D4AF37]/30">
          {/* Top Section */}
          <div>
            {/* Top Bar with Close Button */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                  Menu
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar menu"
                className="p-2 rounded-full bg-[#151515] border border-white/10 text-white/70 hover:text-white hover:border-[#D4AF37]/40 transition-all cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Profile Info Card with Error-Resistant Avatar */}
            <div className="p-6 border-b border-white/5 bg-[#151515]/60">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-full border border-[#D4AF37]/40 p-0.5 overflow-hidden shrink-0 shadow-md">
                  {userImage && !imageError ? (
                    <Image
                      src={userImage}
                      alt={userName}
                      width={56}
                      height={56}
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1C1C1C] rounded-full flex items-center justify-center text-[#D4AF37] font-black text-lg">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base text-white truncate">{userName}</h3>
                  <p className="text-xs text-white/50 truncate mt-0.5">{userEmail}</p>
                  <span className="inline-block mt-1.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#1C1C1C] border border-white/10 text-[#D4AF37]">
                    {userRole === 'BARBER'
                      ? 'Barbeiro'
                      : userRole === 'ADMIN'
                      ? 'Administrador'
                      : 'Cliente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Options List */}
            <div className="p-4 space-y-1">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                Navegação
              </div>

              <button
                onClick={() => handleNavigate('/profile')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-transparent hover:bg-[#151515] border border-transparent hover:border-white/5 transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1C1C1C] flex items-center justify-center text-[#D4AF37]">
                    <User className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">Minha Conta</span>
                    <span className="text-xs text-white/50">Dados pessoais e preferências</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#D4AF37] transition-colors" />
              </button>

              <button
                onClick={() => handleNavigate('/agenda')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-transparent hover:bg-[#151515] border border-transparent hover:border-white/5 transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1C1C1C] flex items-center justify-center text-[#D4AF37]">
                    <Calendar className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">Meus Agendamentos</span>
                    <span className="text-xs text-white/50">Horários confirmados e futuros</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#D4AF37] transition-colors" />
              </button>

              <button
                onClick={() => handleNavigate('/historico')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-transparent hover:bg-[#151515] border border-transparent hover:border-white/5 transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1C1C1C] flex items-center justify-center text-[#D4AF37]">
                    <Clock className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">Histórico</span>
                    <span className="text-xs text-white/50">Atendimentos anteriores</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#D4AF37] transition-colors" />
              </button>

              <button
                onClick={() => handleNavigate('/?action=agendar')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 transition-all group text-left mt-1 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#D4AF37] flex items-center justify-center text-[#0D0D0D] font-black">
                    <Scissors className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#D4AF37] block">Agendar Horário</span>
                    <span className="text-xs text-white/70">Escolha o serviço e profissional</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
              </button>

              {/* Exclusive Barber / Admin Area */}
              {(userRole === 'BARBER' || userRole === 'ADMIN') && (
                <>
                  <div className="px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]/80">
                    Área Operacional
                  </div>
                  <button
                    onClick={() =>
                      handleNavigate(userRole === 'BARBER' ? '/barber/dashboard' : '/admin/dashboard')
                    }
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#151515] hover:bg-[#1C1C1C] border border-white/10 transition-all group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                        <ShieldCheck className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block">Painel Profissional</span>
                        <span className="text-xs text-[#D4AF37]">Acessar gestão e atendimentos</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-[#D4AF37]" />
                  </button>
                </>
              )}

              <div className="px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-white/40">
                Outras Opções
              </div>

              <button
                onClick={handleShareInvite}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-transparent hover:bg-[#151515] border border-transparent hover:border-white/5 transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1C1C1C] flex items-center justify-center text-[#D4AF37]">
                    <Gift className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">Indicar Amigos</span>
                    <span className="text-xs text-white/50">Compartilhar a barbearia</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#D4AF37] transition-colors" />
              </button>

            </div>
          </div>

          {/* Bottom Section: Logout Button */}
          <div className="p-6 border-t border-white/5 bg-[#151515]/30">
            <button
              onClick={handleLogout}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <LogOut className="w-4 h-4 stroke-[2]" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
