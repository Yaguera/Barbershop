'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/' })}
      className="text-branco/50 hover:text-red-400 transition-colors cursor-pointer"
      title="Sair"
    >
      <LogOut className="w-5 h-5" />
    </button>
  );
}
