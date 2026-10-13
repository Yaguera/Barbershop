'use client';

import {
  getNotificationsAction,
  markAllAsReadAction,
  markAsReadAction,
} from '@/app/actions/notification-actions';
import { ReceptionBottomNavigation } from './ReceptionBottomNavigation';
import {
  Bell,
  Calendar,
  Check,
  CheckCheck,
  CircleDollarSign,
  Clock,
  LogOut,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string | Date;
}

export function ReceptionNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifLoading, setIsNotifLoading] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!session?.user) return;
    setIsNotifLoading(true);
    try {
      const res = await getNotificationsAction();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.notifications.filter((n) => !n.read).length);
      }
    } catch {
      // Ignora falhas menores de polling
    } finally {
      setIsNotifLoading(false);
    }
  };

  const onFetchNotifications = useEffectEvent(fetchNotifications);

  useEffect(() => {
    onFetchNotifications();
  }, []);

  // Fechar menus ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsReadAction(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silêncio
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silêncio
    }
  };

  const navLinks = [
    { label: 'Agenda', href: '/atendente', icon: Calendar, active: pathname === '/atendente' },
    { label: 'Caixa', href: '/atendente/caixa', icon: CircleDollarSign, active: pathname.startsWith('/atendente/caixa') },
    { label: 'Conta', href: '/profile', icon: UserIcon, active: pathname.startsWith('/profile') },
  ];

  return (
    <>
      <header
        ref={navRef}
        className="sticky top-0 z-40 bg-[#0E0E0E]/95 backdrop-blur-md border-b border-white/5 h-16 w-full"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          {/* Logo / Título */}
          <Link
            href="/atendente"
            className="flex items-center gap-2 group transition-opacity hover:opacity-90"
          >
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                <span>Barbearia</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                  Recepção
                </span>
              </div>
            </div>
          </Link>

          {/* Links Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    link.active
                      ? 'bg-[#1C1C1C] text-[#D4AF37] border border-[#D4AF37]/30 shadow-sm shadow-[#D4AF37]/5'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Ações: Notificações & Perfil */}
          <div className="flex items-center gap-2">
            {/* Sino de Notificações */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsAccountMenuOpen(false);
                }}
                className={`relative p-2 rounded-lg border transition-colors cursor-pointer ${
                  isNotificationsOpen
                    ? 'bg-[#1C1C1C] border-[#D4AF37]/40 text-[#D4AF37]'
                    : 'bg-black/20 border-white/5 text-white/70 hover:text-white hover:bg-white/5'
                }`}
                aria-label="Notificações"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4AF37] text-black text-[10px] font-black rounded-full flex items-center justify-center shadow-md">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Menu de Notificações Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="font-bold text-xs uppercase tracking-wider text-white">
                      Notificações
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Marcar todas lidas</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto mt-2 space-y-2">
                    {isNotifLoading && notifications.length === 0 ? (
                      <p className="text-center py-6 text-xs text-white/40">Carregando avisos...</p>
                    ) : notifications.length === 0 ? (
                      <p className="text-center py-6 text-xs text-white/40">Nenhuma notificação no momento.</p>
                    ) : (
                      notifications.slice(0, 15).map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border text-xs transition-colors flex items-start justify-between gap-2 ${
                            n.read
                              ? 'bg-black/20 border-white/5 text-white/50'
                              : 'bg-[#181818] border-[#D4AF37]/20 text-white'
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{n.title}</p>
                            <p className="text-[11px] text-white/70 mt-0.5">{n.message}</p>
                            <span className="text-[10px] text-white/40 mt-1 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(n.createdAt).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {!n.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(n.id, e)}
                              title="Marcar como lida"
                              className="p-1 rounded text-white/40 hover:text-[#D4AF37] transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Menu da Conta */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsAccountMenuOpen(!isAccountMenuOpen);
                  setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 pl-2 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-[#181818] border border-[#D4AF37]/30 flex items-center justify-center relative">
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'Atendente'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-[#D4AF37]" />
                  )}
                </div>
                <div className="hidden sm:block text-left text-xs pr-1">
                  <p className="font-semibold text-white leading-none truncate max-w-[100px]">
                    {session?.user?.name || 'Atendente'}
                  </p>
                  <p className="text-[10px] text-[#D4AF37] mt-0.5">Recepção</p>
                </div>
              </button>

              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-xs font-bold text-white truncate">
                      {session?.user?.name}
                    </p>
                    <p className="text-[10px] text-white/40 truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Minha Conta</span>
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navegação inferior móvel persistente */}
      <ReceptionBottomNavigation />
    </>
  );
}
