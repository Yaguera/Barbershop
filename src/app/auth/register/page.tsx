'use client';

import { signUpAction } from '@/app/actions/auth-actions';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);

    // Conforming to RN01.2: backend sanitization handles and restricts role assignment
    formData.append('role', 'CLIENT');

    try {
      const result = await signUpAction(null, formData);

      if (!result.success) {
        setError(result.error || 'Erro ao realizar cadastro.');
      } else {
        setSuccess('Cadastro realizado com sucesso! Redirecionando para login...');
        setTimeout(() => {
          router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        }, 2000);
      }
    } catch {
      setError('Erro ao enviar dados de cadastro.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-[#151515] border border-white/10 rounded-3xl shadow-2xl space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar para o início
      </Link>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Criar uma conta</h1>
        <p className="text-white/60 text-sm">Cadastre-se para agendar seu horário em instantes.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl p-4 text-[#EF4444] text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-2xl p-4 text-[#22C55E] text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="input-name" className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            Nome Completo
          </label>
          <div className="relative">
            <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
            <input
              id="input-name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="João da Silva"
              className="w-full pl-12 pr-4 py-3 bg-[#1C1C1C] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="input-email" className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
            <input
              id="input-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              className="w-full pl-12 pr-4 py-3 bg-[#1C1C1C] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="input-password" className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
            <input
              id="input-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full pl-12 pr-12 py-3 bg-[#1C1C1C] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              className="absolute right-3.5 top-3.5 text-white/40 hover:text-white transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          id="btn-register-submit"
          type="submit"
          disabled={isLoading || !!success}
          className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(212,175,55,0.25)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Criando conta...
            </>
          ) : (
            'Cadastrar'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-white/60">
        Já tem uma conta?{' '}
        <Link href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-[#D4AF37] hover:underline font-semibold">
          Faça Login
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md p-8 bg-[#151515] border border-white/10 rounded-3xl flex flex-col items-center py-24 shadow-sm">
          <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37]" />
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
