'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  X, 
  User, 
  Calendar, 
  Clock, 
  Gift, 
  MessageCircle, 
  LogOut, 
  ShieldCheck, 
  Scissors, 
  Settings, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';

interface SideDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideDrawerMenu({ isOpen, onClose }: SideDrawerMenuProps) {
  const router = useRouter();
  const { data: session } = useSession();

  if (!isOpen) return null;

  if (!session?.user) {
    return (
      <div className="fixed inset-0 z-[100] overflow-hidden">
        <div 
          onClick={onClose} 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-sm sm:max-w-md bg-[#0D0D0D] border-l border-white/10 text-white shadow-2xl flex flex-col justify-between overflow-y-auto selection:bg-[#D4AF37]/30">
            <div>
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                    Acesso VIP
                  </span>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full bg-[#151515] border border-white/10 text-white/70 hover:text-white hover:border-[#D4AF37]/40 transition-all"
                >
                  <X className="w-5 h-5 stroke-[2]" />
                </button>
              </div>

              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center mx-auto shadow-lg shadow-[#D4AF37]/10">
                  <User className="w-8 h-8 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Bem-vindo(a) à Barbearia VIP</h3>
                  <p className="text-xs text-white/60 mt-2 leading-relaxed">
                    Para realizar agendamentos, consultar seus horários ou acessar o clube de benefícios e métricas, entre na sua conta.
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
                className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-[#D4AF37]/20 transform hover:-translate-y-0.5"
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
  const userName = session?.user?.name || 'Cliente VIP';
  const userEmail = session?.user?.email || 'Bem-vindo(a) à nossa barbearia';
  const userImage = session?.user?.image;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      />

      {/* Drawer Container (Right side slide-in) */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm sm:max-w-md bg-[#0D0D0D] border-l border-white/10 text-white shadow-2xl flex flex-col justify-between overflow-y-auto selection:bg-[#D4AF37]/30">
          
          {/* Top Section: Header & Profile Summary */}
          <div>
            {/* Top Bar with Close Button */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                  Menu VIP
                </span>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full bg-[#151515] border border-white/10 text-white/70 hover:text-white hover:border-[#D4AF37]/40 transition-all"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Profile Info Card */}
            <div className="p-6 border-b border-white/5 bg-[#151515]/60">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full border-2 border-[#D4AF37] p-0.5 overflow-hidden shrink-0 shadow-lg shadow-[#D4AF37]/10">
                  {userImage ? (
                    <Image 
                      src={userImage} 
                      alt={userName} 
                      width={64} 
                      height={64} 
                      className="w-full h-full object-cover rounded-full" 
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1C1C1C] rounded-full flex items-center justify-center text-[#D4AF37]">
                      <User className="w-8 h-8 stroke-[2]" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#22C55E] border-2 border-[#0D0D0D]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-lg text-white truncate">{userName}</h3>
                    <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  </div>
                  <p className="text-xs text-white/50 truncate mt-0.5">{userEmail}</p>
                  <span className="inline-block mt-2 text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
                    {userRole === 'BARBER' ? 'Barbeiro Master' : userRole === 'ADMIN' ? 'Administrador' : 'Membro VIP'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Options List */}
            <div className="p-4 space-y-1">
              <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-widest text-white/40">
                Navegação Principal
              </div>

              <button
                onClick={() => handleNavigate('/profile')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-transparent hover:bg-[#151515] border border-transparent hover:border-white/5 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform">
                    <User className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">Minha Conta</span>
                    <span className="text-xs text-white/50">Dados pessoais e preferências</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#D4AF37] transition-colors" />
              </button>

              <button
                onClick={() => handleNavigate('/agenda')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-transparent hover:bg-[#151515] border border-transparent hover:border-white/5 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform">
                    <Calendar className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">Meus Agendamentos</span>
                    <span className="text-xs text-white/50">Horários confirmados e futuros</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#D4AF37] transition-colors" />
              </button>

              <button
                onClick={() => handleNavigate('/historico')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-transparent hover:bg-[#151515] border border-transparent hover:border-white/5 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform">
                    <Clock className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">Histórico Completo</span>
                    <span className="text-xs text-white/50">Atendimentos realizados e cancelados</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#D4AF37] transition-colors" />
              </button>

              <button
                onClick={() => handleNavigate('/?action=agendar')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 transition-all group text-left mt-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-[#0D0D0D] font-black group-hover:scale-105 transition-transform">
                    <Scissors className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#D4AF37] block">Novo Agendamento VIP</span>
                    <span className="text-xs text-white/70">Marque agora o seu próximo horário</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
              </button>

              {/* Exclusive Barber / Admin Area */}
              {(userRole === 'BARBER' || userRole === 'ADMIN') && (
                <>
                  <div className="px-3 pt-4 pb-2 text-[11px] font-extrabold uppercase tracking-widest text-[#D4AF37]/80">
                    Área Profissional
                  </div>
                  <button
                    onClick={() => handleNavigate(userRole === 'BARBER' ? '/barber/dashboard' : '/admin/dashboard')}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#151515] hover:bg-[#1C1C1C] border border-white/10 transition-all group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                        <ShieldCheck className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block">Painel Profissional</span>
                        <span className="text-xs text-[#D4AF37]">Acessar gestão e agenda da barbearia</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-[#D4AF37]" />
                  </button>
                </>
              )}

              <div className="px-3 pt-4 pb-2 text-[11px] font-extrabold uppercase tracking-widest text-white/40">
                Mais Opções
              </div>

              <button
                onClick={() => {
                  onClose();
                  alert('Seu código de indicação VIP: BARBER-VIP-2026. Compartilhe com amigos e ganhe 20% de desconto no próximo corte!');
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-transparent hover:bg-[#151515] border border-transparent hover:border-white/5 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform">
                    <Gift className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">Indique e Ganhe</span>
                    <span className="text-xs text-white/50">Ganhe descontos exclusivos</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#D4AF37] transition-colors" />
              </button>

              <a
                href="https://wa.me/5585986279194"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-transparent hover:bg-[#151515] border border-transparent hover:border-white/5 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] flex items-center justify-center text-[#22C55E] group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">Suporte via WhatsApp</span>
                    <span className="text-xs text-white/50">Atendimento rápido e dúvidas</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#22C55E] transition-colors" />
              </a>
            </div>
          </div>

          {/* Bottom Section: Logout Button */}
          <div className="p-6 border-t border-white/5 bg-[#151515]/30">
            <button
              onClick={handleLogout}
              className="w-full py-4 px-6 rounded-2xl font-bold text-sm bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-[#EF4444]/5"
            >
              <LogOut className="w-5 h-5 stroke-[2]" />
              <span>Sair da Conta (Logout)</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
