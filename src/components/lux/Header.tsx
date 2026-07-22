'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, User } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="w-full bg-[#0D0D0D]/90 backdrop-blur-xl sticky top-0 z-40 border-b border-[rgba(255,255,255,0.06)]">
      <div className="max-w-6xl mx-auto px-6 pt-4 pb-4 sm:pt-6 flex items-center justify-between">
        {/* Left: Small Logo & Company Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full border border-[rgba(255,255,255,0.06)] overflow-hidden bg-[#151515] shrink-0 flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
            <Image
              src="/logo.png"
              alt="Barber Shop Logo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase leading-none">
              BARBER
            </span>
            <span className="text-[13px] font-bold tracking-[0.15em] text-[#FFFFFF] uppercase leading-tight mt-0.5">
              SHOP
            </span>
          </div>
        </Link>

        {/* Right: Notifications & User Avatar */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Notificações"
            className="p-2 rounded-full text-[#B3B3B3] hover:text-[#FFFFFF] hover:bg-[#151515] transition-all duration-200 relative cursor-pointer"
          >
            <Bell className="w-5 h-5 stroke-[2]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D4AF37]" />
          </button>

          <Link href="/profile" className="block cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-[#1C1C1C] border border-[rgba(255,255,255,0.06)] overflow-hidden flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.35)] hover:border-[#D4AF37]/40 transition-all duration-200">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'Usuário'}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-[#B3B3B3] stroke-[2]" />
              )}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
