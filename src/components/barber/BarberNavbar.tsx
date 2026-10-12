'use client';

import {
  getNotificationsAction,
  markAllAsReadAction,
  markAsReadAction,
} from '@/app/actions/notification-actions';
import { BarberBottomNavigation } from '@/components/barber/BarberBottomNavigation';
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bell,
  Check,
  CheckCheck,
  Clock,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Settings,
  Sparkles,
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

interface BarberNavbarProps {
  barberProfileId?: string;
}

export function BarberNavbar({ barberProfileId }: BarberNavbarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifLoading, setIsNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  const navRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!session?.user) return;
    setIsNotifLoading(true);
    setNotifError(null);

    try {
      const res = await getNotificationsAction();
      if (res.success && res.notifications) {
        setNotifications(res.notifications as NotificationItem[]);
        setUnreadCount(res.unreadCount || 0);
      } else {
        setNotifError(res.error || 'Erro ao carregar notificações.');
      }
    } catch {
      setNotifError('Falha de comunicação ao buscar notificações.');
    } finally {
      setIsNotifLoading(false);
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

  // Fechar dropdowns ao clicar fora
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

  // Reversão otimista se a marcação falhar no backend
  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const previousNotifications = [...notifications];
    const previousUnread = unreadCount;

    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await markAsReadAction(id);
      if (!res.success) {
        setNotifications(previousNotifications);
        setUnreadCount(previousUnread);
      }
    } catch {
      setNotifications(previousNotifications);
      setUnreadCount(previousUnread);
    }
  };

  const handleMarkAllAsRead = async () => {
    const previousNotifications = [...notifications];
    const previousUnread = unreadCount;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      const res = await markAllAsReadAction();
      if (!res.success) {
        setNotifications(previousNotifications);
        setUnreadCount(previousUnread);
      }
    } catch {
      setNotifications(previousNotifications);
      setUnreadCount(previousUnread);
    }
  };

  const formatNotifTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });

    if (isToday) {
      return timeStr;
    }

    const dateStrFormatted = d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });

    return `${dateStrFormatted} às ${timeStr}`;
  };

  const userName = session?.user?.name || 'Barbeiro';
  const userEmail = session?.user?.email || '';
  const userImage = session?.user?.image;
  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'B';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0D0D0D]/95 backdrop-blur-xl text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between" ref={navRef}>
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
              <span className="text-sm font-bold tracking-wide text-white uppercase leading-tight mt-0.5">
                Área do Barbeiro
              </span>
            </div>
          </Link>

          {/* Área Direita: Links + Notificações + Dropdown de Perfil */}
          <div className="flex items-center gap-2 sm:gap-3 relative">
            <div className="hidden md:flex items-center gap-1.5 mr-2 pr-4 border-r border-white/10">
              <Link
                href="/barber/dashboard"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  pathname === '/barber/dashboard'
                    ? 'bg-[#1C1C1C] text-[#D4AF37] border border-[#D4AF37]/30 shadow-sm'
                    : 'bg-transparent hover:bg-[#151515] text-white/80 hover:text-[#D4AF37] border border-transparent'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Início</span>
              </Link>
              <Link
                href="/barber/agenda"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  pathname?.startsWith('/barber/agenda')
                    ? 'bg-[#1C1C1C] text-[#D4AF37] border border-[#D4AF37]/30 shadow-sm'
                    : 'bg-transparent hover:bg-[#151515] text-white/80 hover:text-[#D4AF37] border border-transparent'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Agenda</span>
              </Link>
              <Link
                href="/barber/metricas"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  pathname?.startsWith('/barber/metricas')
                    ? 'bg-[#1C1C1C] text-[#D4AF37] border border-[#D4AF37]/30 shadow-sm'
                    : 'bg-transparent hover:bg-[#151515] text-white/80 hover:text-[#D4AF37] border border-transparent'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Análises</span>
              </Link>
            </div>

            {/* Sino de Notificações com Badge Estático Limpo e Acessível */}
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsAccountMenuOpen(false);
                if (!isNotificationsOpen) fetchNotifications();
              }}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-[#151515] transition-all relative cursor-pointer"
              aria-label={unreadCount > 0 ? `${unreadCount} notificações não lidas` : 'Notificações'}
              aria-expanded={isNotificationsOpen}
            >
              <Bell className="w-5 h-5 stroke-[2]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 px-1.5 min-w-[16px] h-4 rounded-full bg-[#D4AF37] text-[#0D0D0D] text-[10px] font-black flex items-center justify-center shadow-md">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown de Notificações com Tratamento de Erro e Dimensão Segura */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-14 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-[#151515] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#1C1C1C]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Notificações
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="text-[11px] text-[#D4AF37] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Ler todas
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-white/5 selection:bg-[#D4AF37]/30">
                  {isNotifLoading && notifications.length === 0 ? (
                    <div className="p-8 flex items-center justify-center text-white/50 gap-2 text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#D4AF37]" />
                      <span>Carregando notificações...</span>
                    </div>
                  ) : notifError ? (
                    <div className="p-6 text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-[#EF4444]">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{notifError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={fetchNotifications}
                        className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-white/80 transition-colors cursor-pointer"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  ) : notifications.length === 0 ? (
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
                              type="button"
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              className="mt-2 text-[10px] text-[#D4AF37] hover:underline font-bold flex items-center gap-1 cursor-pointer"
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

            {/* Gatilho do Menu da Conta */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsAccountMenuOpen(!isAccountMenuOpen);
                  setIsNotificationsOpen(false);
                }}
                className="w-10 h-10 rounded-full bg-[#1C1C1C] border-2 border-white/10 hover:border-[#D4AF37] overflow-hidden flex items-center justify-center shadow-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                aria-label="Opções da conta"
                aria-expanded={isAccountMenuOpen}
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
                  <span className="text-xs font-bold text-[#D4AF37]">
                    {initials}
                  </span>
                )}
              </button>

              {/* Menu Suspenso da Conta */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 top-14 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-[#151515] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-fade-in">
                  
                  {/* Cabeçalho da Conta */}
                  <div className="p-5 bg-gradient-to-b from-[#1C1C1C] to-[#151515] border-b border-white/10 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full border-2 border-[#D4AF37] p-0.5 bg-[#0D0D0D] mb-2.5 shadow-md overflow-hidden flex items-center justify-center">
                      {userImage ? (
                        <Image
                          src={userImage}
                          alt={userName}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-base font-bold text-[#D4AF37]">
                          {initials}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-sm text-white truncate max-w-full">
                      {userName}
                    </span>
                    {userEmail && (
                      <span className="text-xs text-white/50 truncate max-w-full mt-0.5">
                        {userEmail}
                      </span>
                    )}
                  </div>

                  {/* Lista de Destinos */}
                  <div className="p-2 space-y-1">
                    <Link
                      href="/barber/dashboard"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-[#1C1C1C] transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#D4AF37]" />
                      <span>Início</span>
                    </Link>

                    <Link
                      href="/barber/agenda"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-[#1C1C1C] transition-colors"
                    >
                      <Clock className="w-4 h-4 text-[#D4AF37]" />
                      <span>Agenda do Dia</span>
                    </Link>

                    <Link
                      href="/barber/metricas"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-[#1C1C1C] transition-colors"
                    >
                      <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
                      <span>Métricas e Desempenho</span>
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-[#1C1C1C] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#D4AF37]" />
                      <span>Configurações da Conta</span>
                    </Link>
                  </div>

                  {/* Rodapé de Encerramento de Sessão */}
                  <div className="p-2 border-t border-white/10 bg-[#1C1C1C]/40">
                    <button
                      type="button"
                      onClick={() =>
                        signOut({
                          callbackUrl:
                            typeof window !== 'undefined' ? window.location.origin : '/',
                        })
                      }
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 transition-all cursor-pointer"
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

      {/* Navegação Inferior para Mobile */}
      <BarberBottomNavigation barberProfileId={barberProfileId} />
    </>
  );
}
