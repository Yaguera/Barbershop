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
  const desktopNavRef = useRef<HTMLElement>(null);

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
      const target = event.target as Node;
      const outsideMobile = !navRef.current || !navRef.current.contains(target);
      const outsideDesktop = !desktopNavRef.current || !desktopNavRef.current.contains(target);
      if (outsideMobile && outsideDesktop) {
        setIsNotificationsOpen(false);
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fechar dropdowns ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotificationsOpen(false);
        setIsAccountMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const isAgendaActive = pathname === '/atendente';
  const isCaixaActive = pathname?.startsWith('/atendente/caixa') ?? false;
  const isProfileActive = pathname?.startsWith('/profile') ?? false;

  const navLinks = [
    { label: 'Agenda', href: '/atendente', icon: Calendar, active: isAgendaActive },
    { label: 'Caixa', href: '/atendente/caixa', icon: CircleDollarSign, active: isCaixaActive },
    { label: 'Conta', href: '/profile', icon: UserIcon, active: isProfileActive },
  ];

  const userName = session?.user?.name || 'Atendente';
  const userInitial = userName.charAt(0).toUpperCase();

  const sidebarLinkClass = (active: boolean) =>
    `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
      active
        ? 'bg-white/[0.08] text-white font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-[#C5A059]'
        : 'text-zinc-400 font-medium hover:bg-white/[0.04] hover:text-zinc-200'
    }`;

  const sidebarIconClass = (active: boolean) =>
    `w-4 h-4 shrink-0 transition-colors ${
      active ? 'text-[#C5A059]' : 'text-zinc-500 group-hover:text-zinc-300'
    }`;

  const renderNotificationsDropdownContent = () => (
    <>
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <span className="font-bold text-xs uppercase tracking-wider text-white">
          Notificações
        </span>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-[11px] text-[#C5A059] hover:underline flex items-center gap-1 cursor-pointer"
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
          <p className="text-center py-6 text-xs text-white/40">
            Nenhuma notificação no momento.
          </p>
        ) : (
          notifications.slice(0, 15).map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-xl border text-xs transition-colors flex items-start justify-between gap-2 ${
                n.read
                  ? 'bg-black/20 border-white/5 text-white/50'
                  : 'bg-[#181818] border-[#C5A059]/20 text-white'
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
                  className="p-1 rounded text-white/40 hover:text-[#C5A059] transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-[#C5A059] focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-zinc-950 focus:shadow-lg"
      >
        Pular para o conteúdo
      </a>

      {/* Desktop Left Sidebar (≥ 1024px) */}
      <aside
        ref={desktopNavRef}
        aria-label="Navegação lateral da recepção"
        className="hidden lg:flex lg:w-60 xl:w-64 lg:shrink-0 lg:flex-col lg:justify-between lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:px-3.5 lg:py-5 select-none z-40"
      >
        <div className="space-y-5 relative">
          {/* Top Identity + Notification Bell */}
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <Link href="/atendente" className="flex items-center gap-3 min-w-0 group">
              <div className="relative shrink-0">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={userName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-lg border border-white/10 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-white/[0.07] border border-white/10 flex items-center justify-center text-xs font-semibold text-zinc-200">
                    {userInitial}
                  </div>
                )}
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#141416]"
                  aria-hidden="true"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-zinc-100 truncate leading-tight group-hover:text-white transition-colors">
                  {userName}
                </span>
                <span className="text-[11px] font-medium text-zinc-500 truncate leading-tight mt-0.5">
                  Recepção
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsAccountMenuOpen(false);
                if (!isNotificationsOpen) fetchNotifications();
              }}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] transition-colors relative cursor-pointer shrink-0"
              aria-label={
                unreadCount > 0 ? `${unreadCount} notificações não lidas` : 'Notificações'
              }
              aria-expanded={isNotificationsOpen}
            >
              <Bell className="w-4 h-4 stroke-[2]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 px-1 min-w-[14px] h-3.5 rounded-full bg-[#C5A059] text-[#0D0D0D] text-[9px] font-black flex items-center justify-center shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {isNotificationsOpen && (
            <div className="fixed left-4 top-16 w-80 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-4 z-[60] text-left animate-in fade-in zoom-in-95 duration-100">
              {renderNotificationsDropdownContent()}
            </div>
          )}

          {/* Main Navigation */}
          <nav className="space-y-1" aria-label="Menu principal da recepção">
            <Link
              href="/atendente"
              aria-current={isAgendaActive ? 'page' : undefined}
              className={sidebarLinkClass(isAgendaActive)}
            >
              <Calendar className={sidebarIconClass(isAgendaActive)} />
              <span>Agenda</span>
            </Link>

            <Link
              href="/atendente/caixa"
              aria-current={isCaixaActive ? 'page' : undefined}
              className={sidebarLinkClass(isCaixaActive)}
            >
              <CircleDollarSign className={sidebarIconClass(isCaixaActive)} />
              <span>Caixa</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Footer Actions */}
        <div className="pt-4 mt-4 border-t border-white/[0.06] space-y-1">
          <Link
            href="/profile"
            aria-current={isProfileActive ? 'page' : undefined}
            className={sidebarLinkClass(isProfileActive)}
          >
            <UserIcon className={sidebarIconClass(isProfileActive)} />
            <span>Minha Conta</span>
          </Link>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="w-full group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0 text-zinc-500 group-hover:text-red-400 transition-colors" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile & Tablet Top Header (< 1024px) */}
      <header
        ref={navRef}
        className="sticky top-0 z-40 bg-[#0E0E0E]/95 backdrop-blur-md border-b border-white/5 h-16 w-full lg:hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          {/* Logo / Título */}
          <Link
            href="/atendente"
            className="flex items-center gap-2 group transition-opacity hover:opacity-90"
          >
            <div className="w-8 h-8 rounded-lg bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                <span>Barbearia</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                  Recepção
                </span>
              </div>
            </div>
          </Link>

          {/* Links Tablet (md to lg) */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={link.active ? 'page' : undefined}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    link.active
                      ? 'bg-[#1C1C1C] text-[#C5A059] border border-[#C5A059]/30 shadow-sm shadow-[#C5A059]/5'
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
                    ? 'bg-[#1C1C1C] border-[#C5A059]/40 text-[#C5A059]'
                    : 'bg-black/20 border-white/5 text-white/70 hover:text-white hover:bg-white/5'
                }`}
                aria-label="Notificações"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C5A059] text-black text-[10px] font-black rounded-full flex items-center justify-center shadow-md">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Menu de Notificações Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                  {renderNotificationsDropdownContent()}
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
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-[#181818] border border-[#C5A059]/30 flex items-center justify-center relative">
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'Atendente'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-[#C5A059]" />
                  )}
                </div>
                <div className="hidden sm:block text-left text-xs pr-1">
                  <p className="font-semibold text-white leading-none truncate max-w-[100px]">
                    {session?.user?.name || 'Atendente'}
                  </p>
                  <p className="text-[10px] text-[#C5A059] mt-0.5">Recepção</p>
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
