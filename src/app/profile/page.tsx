'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { updateProfileAction, updatePasswordAction } from '@/app/actions/auth-actions';
import { uploadProfileImageAction } from '@/app/actions/upload-actions';
import { User, Key, Mail, Image as ImageIcon, Phone, Save, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, UploadCloud, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { compressImageClient } from '@/utils/compress-image';

const formatPhone = (value: string): string => {
  if (!value) return '';
  
  let cleaned = value.replace(/\D/g, '');
  
  if (value === '+' || value === '+5' || value === '+55') {
    return value;
  }
  
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  cleaned = cleaned.slice(0, 13);
  
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState('');
  const [phone, setPhone] = useState('');
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        <span>Carregando dados da sessão...</span>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    setIsUploadingImage(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Compressão no navegador (Frontend) antes de enviar à Server Action
      const compressedFile = await compressImageClient(originalFile, {
        maxSizeMB: 0.5, // 500KB
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.append('file', compressedFile);

      const res = await uploadProfileImageAction(formData);
      if (res.success && res.imageUrl) {
        setImage(res.imageUrl);
        setSuccessMsg('Imagem enviada com sucesso! Clique em Salvar Alterações para confirmar.');
      } else {
        setErrorMsg(res.error || 'Erro ao fazer upload da imagem.');
      }
    } catch {
      setErrorMsg('Erro ao comprimir ou enviar imagem.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    // 1. Check password logic if attempting change
    if (newPassword.trim()) {
      if (!currentPassword.trim()) {
        setErrorMsg('Para alterar a senha, você deve informar sua Senha Atual para verificação de segurança.');
        setIsSaving(false);
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('A nova senha deve ter pelo menos 6 caracteres.');
        setIsSaving(false);
        return;
      }
    }

    try {
      // 2. Save profile details
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('image', image);
      formData.append('phone', phone);

      const profileResult = await updateProfileAction(null, formData);
      if (!profileResult.success) {
        setErrorMsg(profileResult.error || 'Erro ao atualizar dados do perfil.');
        setIsSaving(false);
        return;
      }

      // 3. Save password if requested
      if (newPassword.trim()) {
        const passResult = await updatePasswordAction({
          currentPassword,
          newPassword,
        });

        if (!passResult.success) {
          setErrorMsg(passResult.error || 'Erro ao atualizar a senha. Verifique se a Senha Atual está correta.');
          setIsSaving(false);
          return;
        }

        setCurrentPassword('');
        setNewPassword('');
        setSuccessMsg('Perfil e senha atualizados com sucesso!');
      } else {
        setSuccessMsg(profileResult.message || 'Perfil atualizado com sucesso!');
      }

      // 4. Update session
      await update({
        name: profileResult.user?.name,
        email: profileResult.user?.email,
        image: profileResult.user?.image,
        phone: profileResult.user?.phone,
      });
    } catch {
      setErrorMsg('Erro de rede ou no servidor ao salvar alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  const getBackPath = () => {
    if (session?.user?.role === 'ADMIN') return '/admin/dashboard';
    if (session?.user?.role === 'BARBER') return '/barber/dashboard';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-preto-profundo text-branco flex flex-col selection:bg-dourado-premium/30">
      {/* Universal Responsive Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-preto-profundo/90 backdrop-blur-md text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="w-10 h-10 rounded-full border border-dourado-premium/30 object-cover" />
            <span className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              José Carlos Barber Shop
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={getBackPath()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-800 text-slate-200 hover:text-white hover:bg-zinc-800 transition-colors motion-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao Painel
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content: 2-Column Responsive Layout */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl animate-fade-in-up">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-dourado-premium">Configurações</span>
          <h1 className="text-3xl sm:text-4xl font-black text-branco tracking-tight mt-1">Editar Meu Perfil</h1>
          <p className="text-off-white/70 text-sm font-medium mt-1">Atualize seus dados pessoais, foto de identificação e credenciais de acesso.</p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-300 text-sm mb-6 animate-fade-in-up">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <p>{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-emerald-300 text-sm mb-6 animate-fade-in-up">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <p>{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Photo Upload Card & Status */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass p-6 sm:p-8 rounded-3xl border border-branco/10 motion-card space-y-6 text-center">
              <span className="text-xs font-extrabold uppercase tracking-widest text-dourado-premium block">Foto do Perfil</span>
              
              <div className="relative w-32 h-32 mx-auto">
                {image ? (
                  <Image
                    src={image}
                    alt="Avatar"
                    width={128}
                    height={128}
                    className="w-full h-full rounded-full object-cover border-2 border-dourado-premium/50 shadow-2xl transition-transform hover:scale-105"
                    onError={() => {
                      setImage(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`);
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-dourado-premium/15 border-2 border-dourado-premium/40 flex items-center justify-center text-dourado-premium font-black text-3xl shadow-inner">
                    {name ? name.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                )}
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/80 rounded-full flex flex-col items-center justify-center text-dourado-premium gap-1">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-[10px] font-bold">5MB max</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-dourado-premium/15 hover:bg-dourado-premium/25 text-dourado-premium border border-dourado-premium/30 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 motion-btn cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  {isUploadingImage ? 'Processando Foto...' : 'Carregar Nova Foto'}
                </button>
                <p className="text-[11px] text-zinc-500">
                  Formatos: JPG, PNG ou WEBP (máximo 5MB com otimização automática).
                </p>
              </div>

              {/* URL fallback */}
              <div className="pt-4 border-t border-branco/10 text-left space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 block">Ou insira URL de imagem da web:</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://exemplo.com/foto.jpg"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-slate-100 placeholder-zinc-600 focus:border-dourado-premium focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Personal Data & Security Forms */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Personal Info Section */}
            <div className="glass p-6 sm:p-8 rounded-3xl border border-branco/10 motion-card space-y-5">
              <span className="text-xs font-extrabold uppercase tracking-widest text-dourado-premium block">Informações Pessoais</span>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-11 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-slate-100 placeholder-zinc-600 focus:border-dourado-premium focus:outline-none text-sm font-medium transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">E-mail de Contato</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-11 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-slate-100 placeholder-zinc-600 focus:border-dourado-premium focus:outline-none text-sm font-medium transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  WhatsApp / Telefone <span className="text-zinc-500 font-normal text-[11px]">(+55 DD XXXXX-XXXX)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+55 11 99999-9999"
                    className="w-full pl-11 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-slate-100 placeholder-zinc-600 focus:border-dourado-premium focus:outline-none text-sm font-medium transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Security / Password Section */}
            <div className="glass p-6 sm:p-8 rounded-3xl border border-branco/10 motion-card space-y-5">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-dourado-premium" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-200">Segurança & Troca de Senha</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Preencha os campos abaixo apenas se desejar substituir sua senha de acesso ao sistema.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">Senha Atual</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Sua senha atual"
                      className="w-full pl-11 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-slate-100 placeholder-zinc-600 focus:border-dourado-premium focus:outline-none text-sm font-medium transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">Nova Senha</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-11 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-slate-100 placeholder-zinc-600 focus:border-dourado-premium focus:outline-none text-sm font-medium transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSaving || isUploadingImage}
              className="w-full py-4.5 bg-dourado-premium hover:bg-dourado-dark text-preto-profundo font-black rounded-2xl transition-all shadow-[0_0_25px_rgba(245,197,66,0.25)] animate-pulse-glow motion-btn flex items-center justify-center gap-2 text-base disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando Alterações...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Perfil e Configurações
                </>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
