'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { updateProfileAction } from '@/app/actions/auth-actions';
import { User, Key, Mail, Image as ImageIcon, Phone, Save, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const formatPhone = (value: string): string => {
  if (!value) return '';
  
  // Extract only numbers
  let cleaned = value.replace(/\D/g, '');
  
  // If the user deleted down to just "+", "+5", or "+55", let them delete it to empty
  if (value === '+' || value === '+5' || value === '+55') {
    return value;
  }
  
  // If the user typed numbers that don't start with 55, prefix with 55
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  cleaned = cleaned.slice(0, 13); // max 13 digits: 55 + 2 + 9
  
  if (cleaned.length <= 2) {
    return '+55';
  }
  if (cleaned.length <= 4) {
    return `+55 ${cleaned.slice(2)}`;
  }
  if (cleaned.length <= 9) {
    return `+55 ${cleaned.slice(2, 4)} ${cleaned.slice(4)}`;
  }
  return `+55 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
};

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form with session data when loaded
  useEffect(() => {
    if (session?.user) {
      const timer = setTimeout(() => {
        setName(session.user.name || '');
        setEmail(session.user.email || '');
        setImage(session.user.image || '');
        setPhone(session.user.phone || '');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-preto-classico text-off-white flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-carvalho" />
        <span>Carregando dados da sessão...</span>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.replace('/auth/login');
    return null;
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('image', image);
    formData.append('phone', phone);
    formData.append('password', password);

    try {
      const result = await updateProfileAction(null, formData);

      if (result.success) {
        setSuccessMsg(result.message || 'Perfil atualizado com sucesso!');
        setPassword(''); // clear password field
        
        // Update local session details
        await update({
          name: result.user?.name,
          email: result.user?.email,
          image: result.user?.image,
          phone: result.user?.phone,
        });
      } else {
        setErrorMsg(result.error || 'Erro ao atualizar o perfil.');
      }
    } catch {
      setErrorMsg('Erro de rede ou interno no servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  // Dynamic back path based on user role
  const getBackPath = () => {
    if (session?.user?.role === 'ADMIN') return '/admin/dashboard';
    if (session?.user?.role === 'BARBER') return '/barber/dashboard';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-preto-classico text-off-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-preto-classico/95 backdrop-blur-md text-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="José Carlos Barber Shop Logo" className="w-10 h-10 rounded-full border border-carvalho/30" />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              José Carlos Barber Shop
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={getBackPath()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 border border-zinc-700 text-slate-200 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao Painel
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-10 flex items-center justify-center max-w-lg">
        <div className="w-full bg-zinc-900 border border-[#5C3A21]/15 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="space-y-6 relative">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-preto-classico tracking-tight">Editar Perfil</h1>
              <p className="text-zinc-500 text-xs sm:text-sm">Mantenha suas informações de contato e segurança atualizadas.</p>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-3 bg-vermelho-classico/5 border border-vermelho-classico/20 rounded-2xl p-4 text-vermelho-classico text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-vermelho-classico" />
                <p>{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 text-sm">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                <p>{successMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Profile image preview & selector */}
              <div className="flex items-center gap-4 bg-zinc-50/80 p-4 border border-zinc-150 rounded-2xl">
                {image ? (
                  <img
                    src={image}
                    alt="Prévia de Perfil"
                    className="w-16 h-16 rounded-full object-cover border-2 border-carvalho/30 shadow-inner flex-shrink-0"
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`;
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-carvalho/10 border border-carvalho/20 flex items-center justify-center text-nogueira font-extrabold text-lg flex-shrink-0">
                    {name ? name.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                )}
                <div className="space-y-0.5">
                  <span className="block font-bold text-sm text-off-white">Foto de Perfil</span>
                  <span className="block text-xs text-zinc-500">Insira uma URL válida abaixo para alterar.</span>
                </div>
              </div>

              {/* Name field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Nome</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-450" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-off-white placeholder-zinc-400 focus:border-azul-barbeiro focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Email field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-450" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-off-white placeholder-zinc-400 focus:border-azul-barbeiro focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Phone field with mask */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  Telefone <span className="text-zinc-450 text-[10px] font-normal lowercase">(formato: +55 DD XXXXX-XXXX)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-450" />
                  <input
                    type="text"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+55 11 99999-9999"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-off-white placeholder-zinc-400 focus:border-azul-barbeiro focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Avatar URL field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">URL da Foto de Perfil</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-450" />
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://exemplo.com/sua-foto.jpg"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-off-white placeholder-zinc-400 focus:border-azul-barbeiro focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Nova Senha</label>
                  <span className="text-[10px] text-zinc-400 italic">Deixe em branco para não alterar</span>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-450" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-off-white placeholder-zinc-400 focus:border-azul-barbeiro focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full mt-2 py-3 bg-azul-barbeiro hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
