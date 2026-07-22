'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, User, Check, CheckCheck, Sparkles, AlertTriangle, Clock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { SideDrawerMenu } from './SideDrawerMenu';
import { getNotificationsAction, markAsReadAction, markAllAsReadAction } from '@/app/actions/notification-actions';

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
}

export function Header({ onOpenDrawer }: HeaderProps) {
  const { data: session } = useSession();
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

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      // Periodically check notifications every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
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
        <div className="max-w-6xl mx-auto px-6 pt-4 pb-4 sm:pt-6 flex items-center justify-between">
          {/* Left: Small Logo & Company Name exactly like screenshot */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-[#151515] shrink-0 flex items-center justify-center shadow-lg">
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

          {/* Right: Notifications & User Avatar exactly like screenshot */}
          <div className="flex items-center gap-2.5 relative">
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
