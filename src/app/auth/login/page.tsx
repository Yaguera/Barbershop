'use client';

import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      } else {
        router.refresh();
        router.push(callbackUrl);
      }
    } catch {
      setError('Ocorreu um erro ao fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch {
      setError('Erro ao iniciar login com o Google.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-[#151515] border border-white/10 rounded-3xl shadow-2xl space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar para o início
      </Link>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Bem-vindo de volta</h1>
        <p className="text-white/60 text-sm">Entre na sua conta para agendar e gerenciar seus horários.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl p-4 text-[#EF4444] text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
          id="btn-login-submit"
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(212,175,55,0.25)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-white/10"></div>
        <span className="flex-shrink mx-4 text-xs font-semibold text-white/40 uppercase tracking-wider">ou</span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>

      <button
        id="btn-login-google"
        onClick={handleGoogleLogin}
        disabled={isLoading || isGoogleLoading}
        className="w-full py-3 bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer shadow-sm"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-white/60" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Entrar com Google
      </button>

      <p className="text-center text-sm text-white/60">
        Não tem uma conta?{' '}
        <Link href={`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-[#D4AF37] hover:underline font-semibold">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md p-8 bg-[#151515] border border-white/10 rounded-3xl flex flex-col items-center py-24 shadow-sm">
          <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37]" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
