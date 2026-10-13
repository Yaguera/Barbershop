import { sanitizeCallbackUrl } from '@/core/utils/safe-redirect';
import { Lock, LogIn, MoveLeft } from 'lucide-react';
import Link from 'next/link';

interface UnauthorizedViewProps {
  callbackUrl?: string;
  message?: string;
}

export function UnauthorizedView({
  callbackUrl = '/',
  message = 'Você precisa entrar na sua conta para acessar esta área restrita.',
}: UnauthorizedViewProps) {
  const safeCallback = sanitizeCallbackUrl(callbackUrl, '/');
  const loginUrl = `/auth/login?callbackUrl=${encodeURIComponent(safeCallback)}`;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center p-4 selection:bg-[#D4AF37]/30">
      <main className="w-full max-w-md p-8 bg-[#141414] border border-[#D4AF37]/20 rounded-3xl shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
          HTTP 401 • Não Autorizado
        </div>

        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white tracking-tight">Autenticação Necessária</h1>
          <p className="text-white/60 text-xs sm:text-sm leading-relaxed">{message}</p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href={loginUrl}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0A0A] flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Entrar na Conta</span>
          </Link>

          <Link
            href="/"
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <MoveLeft className="w-3.5 h-3.5" />
            <span>Voltar para o Início</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
