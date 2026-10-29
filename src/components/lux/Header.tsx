'use client';

import { getNotificationsAction,markAllAsReadAction,markAsReadAction } from '@/app/actions/notification-actions';
import { AlertTriangle,Bell,Check,CheckCheck,Clock,Scissors,Sparkles,User } from 'lucide-react';
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
      <header className="w-full bg-[#0D0D0D]/90 backdrop-blur-xl sticky top-0 z-40 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          {/* Left: Small Logo & Company Name */}
          <Link
            href="/"
            onClick={() => onLogoClick && onLogoClick()}
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div className="w-9 h-9 rounded-md border border-white/10 overflow-hidden bg-[#141414] shrink-0 flex items-center justify-center group-hover:border-white/25 transition-colors">
              <Image
                src="/logo.png"
                alt="Barber Shop Logo"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wider text-white uppercase leading-none">
                BARBER
              </span>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-2 h-[1px] bg-[#C5A059]/70" />
                <span className="text-[9px] font-semibold tracking-[0.22em] text-[#C5A059] uppercase leading-none">
                  SHOP
                </span>
                <span className="w-2 h-[1px] bg-[#C5A059]/70" />
              </div>
            </div>
          </Link>

          {/* Center: Clean Minimalist Desktop Navigation (No pill background, subtle hover) */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              onClick={() => onLogoClick && onLogoClick()}
              className={`text-sm font-medium transition-colors py-1 relative ${
                pathname === '/'
                  ? 'text-white after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-[#C5A059]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Início
            </Link>

            <Link
              href="/agenda"
              className={`text-sm font-medium transition-colors py-1 relative ${
                pathname?.startsWith('/agenda')
                  ? 'text-white after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-[#C5A059]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Meus Agendamentos
            </Link>

            <Link
              href="/historico"
              className={`text-sm font-medium transition-colors py-1 relative ${
                pathname?.startsWith('/historico')
                  ? 'text-white after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-[#C5A059]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Histórico
            </Link>

            <Link
              href="/profile"
              className={`text-sm font-medium transition-colors py-1 relative ${
                pathname?.startsWith('/profile')
                  ? 'text-white after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-[#C5A059]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Minha Conta
            </Link>
          </nav>

          {/* Right: Subtle Desktop CTA + Notifications & User Avatar */}
          <div className="flex items-center gap-2.5 relative shrink-0">
            {onBookClick ? (
              <button
                type="button"
                onClick={onBookClick}
                className="hidden md:inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.09] text-zinc-200 hover:text-white border border-white/10 hover:border-[#C5A059]/50 font-medium text-xs px-4 py-2 rounded-md transition-all duration-200 cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Agendar Horário</span>
              </button>
            ) : (
              <Link
                href="/?action=agendar"
                className="hidden md:inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.09] text-zinc-200 hover:text-white border border-white/10 hover:border-[#C5A059]/50 font-medium text-xs px-4 py-2 rounded-md transition-all duration-200"
              >
                <Scissors className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Agendar Horário</span>
              </Link>
            )}
            <button
              type="button"
              aria-label="Notificações"
              aria-expanded={isNotificationsOpen}
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                if (!isNotificationsOpen) fetchNotifications();
              }}
              className="w-9 h-9 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all duration-200 relative cursor-pointer"
            >
              <Bell className="w-4 h-4 stroke-[1.8]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C5A059] border border-[#0D0D0D]" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96 bg-[#141414] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between bg-[#181818]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                      Notificações
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[11px] text-zinc-400 hover:text-white font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Ler todas
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.06]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs">
                      Nenhuma notificação por enquanto.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3.5 transition-colors flex gap-3 ${
                          notif.read ? 'bg-transparent opacity-60 hover:opacity-100' : 'bg-white/[0.02] hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="shrink-0 pt-0.5">
                          {notif.type === 'ALERT' || notif.type === 'NO_SHOW' ? (
                            <div className="w-7 h-7 rounded-md bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                          ) : notif.type === 'REMINDER' ? (
                            <div className="w-7 h-7 rounded-md bg-white/[0.05] text-[#C5A059] flex items-center justify-center">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-md bg-white/[0.05] text-zinc-300 flex items-center justify-center">
                              <Bell className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-semibold text-white truncate">{notif.title}</h4>
                            <span className="text-[10px] text-zinc-500 shrink-0">
                              {formatNotifTime(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          {!notif.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              className="mt-2 text-[10px] text-[#C5A059] hover:text-white font-medium flex items-center gap-1 transition-colors"
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
                else setIsDrawerOpen(true);
              }}
              aria-label="Abrir menu da conta"
              aria-expanded={onOpenDrawer ? undefined : isDrawerOpen}
              className="block rounded-lg focus-visible:outline-2 focus-visible:outline-[#D4AF37] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 overflow-hidden flex items-center justify-center transition-all duration-200">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'Usuário'}
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-zinc-300 stroke-[1.8]" />
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
