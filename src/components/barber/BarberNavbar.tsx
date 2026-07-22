'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  BarChart3, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard,
  Bell,
  Check,
  CheckCheck,
  Sparkles,
  Clock,
  AlertTriangle,
  CalendarCheck,
  Settings
} from 'lucide-react';
import { getNotificationsAction, markAsReadAction, markAllAsReadAction } from '@/app/actions/notification-actions';
import { BarberBottomNavigation } from '@/components/barber/BarberBottomNavigation';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string | Date;
}

interface BarberNavbarProps {
  barberProfileId?: string;
}

export function BarberNavbar({ barberProfileId }: BarberNavbarProps) {
  const { data: session } = useSession();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!session?.user) return;
    const res = await getNotificationsAction();
    if (res.success && res.notifications) {
      setNotifications(res.notifications as NotificationItem[]);
      setUnreadCount(res.unreadCount || 0);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [session?.user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markAsReadAction(id);
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await markAllAsReadAction();
  };

  const formatNotifTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const userName = session?.user?.name || 'Barbeiro Profissional';
  const userEmail = session?.user?.email || 'barbeiro@vip.com';
  const userImage = session?.user?.image;
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0D0D0D]/95 backdrop-blur-xl text-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between" ref={navRef}>
          {/* Logo / Brand */}
          <Link href="/barber/dashboard" className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="Barber Logo" 
              width={36} 
              height={36} 
              className="w-9 h-9 rounded-full border border-[#D4AF37]/40 object-cover shadow-lg" 
            />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase leading-none">
                ÁREA PROFISSIONAL
              </span>
              <span className="text-sm font-black tracking-wider text-white uppercase leading-tight mt-0.5">
                Barbeiro Master
              </span>
            </div>
          </Link>

          {/* Right Area: Links + Notifications + Profile Dropdown */}
          <div className="flex items-center gap-3 relative">
            <div className="hidden md:flex items-center gap-1.5 mr-2 pr-4 border-r border-white/10">
              <Link
                href="/barber/dashboard"
                className="px-3 py-1.5 rounded-xl bg-transparent hover:bg-[#151515] text-xs font-bold text-white/80 hover:text-[#D4AF37] border border-transparent hover:border-white/10 transition-all flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Início</span>
              </Link>
              <Link
                href="/barber/agenda"
                className="px-3 py-1.5 rounded-xl bg-transparent hover:bg-[#151515] text-xs font-bold text-white/80 hover:text-[#D4AF37] border border-transparent hover:border-white/10 transition-all flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Meus Atendimentos</span>
              </Link>
              <Link
                href="/barber/metricas"
                className="px-3 py-1.5 rounded-xl bg-transparent hover:bg-[#151515] text-xs font-bold text-white/80 hover:text-[#D4AF37] border border-transparent hover:border-white/10 transition-all flex items-center gap-1.5"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Minhas Métricas</span>
              </Link>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsAccountMenuOpen(false);
                if (!isNotificationsOpen) fetchNotifications();
              }}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-[#151515] transition-all relative cursor-pointer"
              aria-label="Notificações do Barbeiro"
            >
              <Bell className="w-5 h-5 stroke-[2]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 px-1.5 min-w-[16px] h-4 rounded-full bg-[#D4AF37] text-[#0D0D0D] text-[10px] font-black flex items-center justify-center animate-pulse shadow-md">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-14 w-80 sm:w-96 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#1C1C1C]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Alertas do Profissional
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[11px] text-[#D4AF37] hover:underline font-semibold flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Ler todas
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-white/5 selection:bg-[#D4AF37]/30">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-white/40 text-xs">
                      Nenhum alerta de atendimento por enquanto.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={(e) => !notif.read && handleMarkAsRead(notif.id, e)}
                        className={`p-4 transition-colors cursor-pointer flex gap-3 ${
                          notif.read ? 'bg-transparent opacity-60 hover:opacity-100' : 'bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10'
                        }`}
                      >
                        <div className="shrink-0 pt-0.5">
                          {notif.type === 'ALERT' || notif.type === 'NO_SHOW' ? (
                            <div className="w-8 h-8 rounded-full bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                          ) : notif.type === 'REMINDER' ? (
                            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
                              <Clock className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center">
                              <Bell className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                            <span className="text-[10px] text-white/40 shrink-0">
                              {formatNotifTime(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-white/70 mt-1 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          {!notif.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              className="mt-2 text-[10px] text-[#D4AF37] hover:underline font-bold flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Marcar como lida
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Profile Photo / Account Menu Trigger (Semelhante ao Google) */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsAccountMenuOpen(!isAccountMenuOpen);
                  setIsNotificationsOpen(false);
                }}
                className="w-10 h-10 rounded-full bg-[#1C1C1C] border-2 border-white/10 hover:border-[#D4AF37] overflow-hidden flex items-center justify-center shadow-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                aria-label="Conta do Google / Opções de Perfil"
              >
                {userImage ? (
                  <Image
                    src={userImage}
                    alt={userName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-black text-[#D4AF37]">
                    {initials}
                  </span>
                )}
              </button>

              {/* Google-Style Account Dropdown Menu */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 top-14 w-72 sm:w-80 bg-[#151515] border border-white/10 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-fade-in">
                  
                  {/* Account Header */}
                  <div className="p-6 bg-gradient-to-b from-[#1C1C1C] to-[#151515] border-b border-white/10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37] p-0.5 bg-[#0D0D0D] mb-3 shadow-md overflow-hidden flex items-center justify-center">
                      {userImage ? (
                        <Image
                          src={userImage}
                          alt={userName}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-lg font-black text-[#D4AF37]">
                          {initials}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-base text-white truncate max-w-full">
                      {userName}
                    </span>
                    <span className="text-xs text-white/50 truncate max-w-full mt-0.5">
                      {userEmail}
                    </span>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-[10px] font-black uppercase tracking-wider border border-[#D4AF37]/30">
                      <Sparkles className="w-3 h-3" />
                      <span>Conta Profissional VIP</span>
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="p-2 space-y-1">
                    <Link
                      href="/barber/dashboard"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-white/80 hover:text-white hover:bg-[#1C1C1C] transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#D4AF37]" />
                      <span>Início / Painel Executivo</span>
                    </Link>

                    <Link
                      href="/barber/agenda"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-white/80 hover:text-white hover:bg-[#1C1C1C] transition-colors"
                    >
                      <Clock className="w-4 h-4 text-[#D4AF37]" />
                      <span>Meus Atendimentos & Fila</span>
                    </Link>

                    <Link
                      href="/barber/metricas"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-white/80 hover:text-white hover:bg-[#1C1C1C] transition-colors"
                    >
                      <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
                      <span>Minhas Métricas & Rendimento</span>
                    </Link>

                    {barberProfileId && (
                      <Link
                        href={`/barber/dashboard/schedule/${barberProfileId}`}
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-white/80 hover:text-white hover:bg-[#1C1C1C] transition-colors"
                      >
                        <CalendarCheck className="w-4 h-4 text-[#D4AF37]" />
                        <span>Configurar Meus Horários</span>
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-white/80 hover:text-white hover:bg-[#1C1C1C] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#D4AF37]" />
                      <span>Configurações do Perfil</span>
                    </Link>
                  </div>

                  {/* Sign Out Footer */}
                  <div className="p-2 border-t border-white/10 bg-[#1C1C1C]/40">
                    <button
                      onClick={() => signOut({ callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/' })}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-extrabold bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation for Mobile / Tablet */}
      <BarberBottomNavigation barberProfileId={barberProfileId} />
    </>
  );
}
