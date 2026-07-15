'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="w-full max-w-md p-8 bg-zinc-900 border border-nogueira/15 rounded-3xl shadow-xl space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar para o início
      </Link>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-preto-classico">Bem-vindo de volta</h1>
        <p className="text-off-white text-sm">Entre na sua conta para agendar e gerenciar seus horários.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-vermelho-classico" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
            <input
              id="input-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-off-white placeholder-zinc-400 focus:border-azul-barbeiro focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Senha</label>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
            <input
              id="input-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-off-white placeholder-zinc-400 focus:border-azul-barbeiro focus:outline-none transition-colors"
            />
          </div>
        </div>

        <button
          id="btn-login-submit"
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full py-3.5 bg-azul-barbeiro hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
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
        <div className="flex-grow border-t border-zinc-800"></div>
        <span className="flex-shrink mx-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">ou</span>
        <div className="flex-grow border-t border-zinc-800"></div>
      </div>

      <button
        id="btn-login-google"
        onClick={handleGoogleLogin}
        disabled={isLoading || isGoogleLoading}
        className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-off-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer shadow-sm"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
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

      <p className="text-center text-sm text-off-white">
        Não tem uma conta?{' '}
        <Link href={`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-azul-barbeiro hover:underline font-semibold">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-preto-classico flex flex-col items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col items-center py-24 shadow-sm">
          <Loader2 className="w-12 h-12 animate-spin text-azul-barbeiro" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
