'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signUpAction } from '@/app/actions/auth-actions';
import { User as UserIcon, Mail, Lock, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    // Conforming to RN01.2: We simulate sending an admin role to test our backend sanitization filter
    formData.append('role', 'ADMIN');

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
    <div className="w-full max-w-md p-8 bg-zinc-900 border border-nogueira/15 rounded-3xl shadow-xl space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar para o início
      </Link>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-preto-classico">Criar uma conta</h1>
        <p className="text-off-white text-sm">Cadastre-se para agendar seu horário em instantes.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-vermelho-classico" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-700 text-sm animate-pulse">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nome Completo</label>
          <div className="relative">
            <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
            <input
              id="input-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="João da Silva"
              className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-off-white placeholder-zinc-400 focus:border-azul-barbeiro focus:outline-none transition-colors"
            />
          </div>
        </div>

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
              placeholder="Mínimo 6 caracteres"
              className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-off-white placeholder-zinc-400 focus:border-azul-barbeiro focus:outline-none transition-colors"
            />
          </div>
        </div>

        <button
          id="btn-register-submit"
          type="submit"
          disabled={isLoading || !!success}
          className="w-full py-3.5 bg-azul-barbeiro hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
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

      <p className="text-center text-sm text-off-white">
        Já tem uma conta?{' '}
        <Link href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-azul-barbeiro hover:underline font-semibold">
          Faça Login
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-preto-classico flex flex-col items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col items-center py-24 shadow-sm">
          <Loader2 className="w-12 h-12 animate-spin text-azul-barbeiro" />
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
