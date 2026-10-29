'use client';

import { getNotificationsAction,markAllAsReadAction,markAsReadAction } from '@/app/actions/notification-actions';
import { AlertTriangle,Bell,Calendar,Check,CheckCheck,Clock,Home,Scissors,Sparkles,User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React,{ useEffect,useEffectEvent,useState } from 'react';
import { SideDrawerMenu } from './SideDrawerMenu';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string | Date;
}

interface HeaderProps {
  onOpenDrawer?: () => void;
  onBookClick?: () => void;
  onLogoClick?: () => void;
}

export function Header({ onOpenDrawer, onBookClick, onLogoClick }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!session?.user) return;
    const res = await getNotificationsAction();
    if (res.success && res.notifications) {
      setNotifications(res.notifications as NotificationItem[]);
      setUnreadCount(res.unreadCount || 0);
    }
  };

  const onEffectfetchNotifications = useEffectEvent(fetchNotifications);

  useEffect(() => {
    if (session?.user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Updates follow awaited server responses.
      onEffectfetchNotifications();
      const interval = setInterval(onEffectfetchNotifications, 15000);
      const handleFocus = () => onEffectfetchNotifications();
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleFocus);
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleFocus);
      };
    }
  }, [session?.user]);

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

  return (
    <>
      <header className="w-full bg-[#0D0D0D]/90 backdrop-blur-xl sticky top-0 z-40 border-b border-[rgba(255,255,255,0.06)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          {/* Left: Small Logo & Company Name */}
          <Link
            href="/"
            onClick={() => onLogoClick && onLogoClick()}
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-[#151515] shrink-0 flex items-center justify-center shadow-lg group-hover:border-[#D4AF37]/40 transition-colors">
              <Image
                src="/logo.png"
                alt="Barber Shop Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-wider text-[#FFFFFF] uppercase leading-none">
                BARBER
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-2 h-[1.5px] bg-[#D4AF37]" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase leading-none">
                  SHOP
                </span>
                <span className="w-2 h-[1.5px] bg-[#D4AF37]" />
              </div>
            </div>
          </Link>

          {/* Center: Desktop Navigation Bar (Hidden on Mobile) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#151515]/90 border border-white/5 rounded-full p-1.5 shadow-inner">
            <Link
              href="/"
              onClick={() => onLogoClick && onLogoClick()}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all flex items-center gap-2 ${
                pathname === '/'
                  ? 'bg-[#D4AF37] text-[#0D0D0D] shadow-[0_2px_12px_rgba(212,175,55,0.3)]'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Início</span>
            </Link>

            <Link
              href="/agenda"
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all flex items-center gap-2 ${
                pathname?.startsWith('/agenda')
                  ? 'bg-[#D4AF37] text-[#0D0D0D] shadow-[0_2px_12px_rgba(212,175,55,0.3)]'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Meus Agendamentos</span>
            </Link>

            <Link
              href="/historico"
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all flex items-center gap-2 ${
                pathname?.startsWith('/historico')
                  ? 'bg-[#D4AF37] text-[#0D0D0D] shadow-[0_2px_12px_rgba(212,175,55,0.3)]'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Histórico</span>
            </Link>

            <Link
              href="/profile"
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all flex items-center gap-2 ${
                pathname?.startsWith('/profile')
                  ? 'bg-[#D4AF37] text-[#0D0D0D] shadow-[0_2px_12px_rgba(212,175,55,0.3)]'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Minha Conta</span>
            </Link>
          </nav>

          {/* Right: Desktop CTA + Notifications & User Avatar */}
          <div className="flex items-center gap-3 relative shrink-0">
            {onBookClick ? (
              <button
                type="button"
                onClick={onBookClick}
                className="hidden md:inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-[0_4px_15px_rgba(212,175,55,0.25)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Agendar Horário</span>
              </button>
            ) : (
              <Link
                href="/?action=agendar"
                className="hidden md:inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-[0_4px_15px_rgba(212,175,55,0.25)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Scissors className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Agendar Horário</span>
              </Link>
            )}
            <button
              type="button"
              aria-label="Notificações"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                if (!isNotificationsOpen) fetchNotifications();
              }}
              className="w-10 h-10 rounded-full bg-[#151515] border border-white/10 text-white flex items-center justify-center transition-all duration-200 relative cursor-pointer shadow-md hover:border-[#D4AF37]/40"
            >
              <Bell className="w-5 h-5 stroke-[2]" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#D4AF37] border border-[#151515] animate-pulse shadow-[0_0_8px_#D4AF37]" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-14 w-80 sm:w-96 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#1C1C1C]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Notificações
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
                      Nenhuma notificação por enquanto.
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

            <button
              type="button"
              onClick={() => {
                if (onOpenDrawer) onOpenDrawer();
                setIsDrawerOpen(true);
              }}
              className="block cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#1C1C1C] border border-white/10 overflow-hidden flex items-center justify-center shadow-md hover:border-[#D4AF37]/40 transition-all duration-200">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'Usuário'}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white stroke-[2]" />
                )}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Global Side Drawer */}
      <SideDrawerMenu isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
