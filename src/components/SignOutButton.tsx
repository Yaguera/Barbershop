'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

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
