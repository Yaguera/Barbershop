import { ShieldAlert, ArrowRight, UserCheck, MoveLeft } from 'lucide-react';
import Link from 'next/link';

interface ForbiddenViewProps {
  currentRole?: string;
  allowedRoles?: string[];
  message?: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  BARBER: 'Barbeiro',
  RECEPTIONIST: 'Atendente',
  CLIENT: 'Cliente',
};

const ROLE_DASHBOARDS: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  BARBER: '/barber/dashboard',
  RECEPTIONIST: '/atendente',
  CLIENT: '/agenda',
};

export function ForbiddenView({
  currentRole,
  message = 'Sua conta conectada não possui autorização para acessar esta área ou executar esta ação.',
}: ForbiddenViewProps) {
  const roleName = currentRole ? ROLE_LABELS[currentRole] || currentRole : 'Usuário';
  const myAreaUrl = currentRole && ROLE_DASHBOARDS[currentRole] ? ROLE_DASHBOARDS[currentRole] : '/';

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center p-4 selection:bg-[#D4AF37]/30">
      <main className="w-full max-w-md p-8 bg-[#141414] border border-red-500/25 rounded-3xl shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
          HTTP 403 • Acesso Negado
        </div>

        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white tracking-tight">Área Restrita</h1>
          <p className="text-white/60 text-xs sm:text-sm leading-relaxed">{message}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 flex items-center justify-center gap-2">
          <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>
            Perfil conectado: <strong className="text-white font-semibold">{roleName}</strong>
          </span>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href={myAreaUrl}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0A0A] flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20 transition-all cursor-pointer"
          >
            <span>Ir para Minha Área</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/auth/login"
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Entrar com Outra Conta</span>
          </Link>

          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-white/40 hover:text-white/70 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <MoveLeft className="w-3 h-3" />
            <span>Início</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
