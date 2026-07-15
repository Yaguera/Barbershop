'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { updateProfileAction, updatePasswordAction } from '@/app/actions/auth-actions';
import { uploadProfileImageAction } from '@/app/actions/upload-actions';
import { User, Key, Mail, Image as ImageIcon, Phone, Save, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, UploadCloud, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadProfileImageAction(formData);
      if (res.success && res.imageUrl) {
        setImage(res.imageUrl);
        setSuccessMsg('Imagem enviada com sucesso! Clique em Salvar Alterações para confirmar.');
      } else {
        setErrorMsg(res.error || 'Erro ao fazer upload da imagem.');
      }
    } catch {
      setErrorMsg('Erro de conexão ao enviar imagem.');
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
    <div className="min-h-screen bg-black text-slate-100 flex flex-col selection:bg-amber-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-black/80 backdrop-blur-md text-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="w-10 h-10 rounded-full border border-amber-500/30 object-cover" />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              José Carlos Barber Shop
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={getBackPath()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-800 text-slate-200 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao Painel
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-10 flex items-center justify-center max-w-xl">
        <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">Editar Perfil</h1>
            <p className="text-slate-400 text-xs sm:text-sm">Atualize seus dados, foto de perfil e senha com segurança.</p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-2xl p-4 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 text-emerald-400 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p>{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Foto de Perfil Upload/Preview Box */}
            <div className="bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">Foto de Perfil</span>
              
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="relative">
                  {image ? (
                    <Image
                      src={image}
                      alt="Avatar"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover border-2 border-amber-500/40 shadow-inner flex-shrink-0"
                      onError={() => {
                        setImage(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`);
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl flex-shrink-0">
                      {name ? name.substring(0, 2).toUpperCase() : 'US'}
                    </div>
                  )}
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                    </div>
                  )}
                </div>

                <div className="flex-grow space-y-2.5 text-center sm:text-left">
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
                    className="px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 mx-auto sm:mx-0 cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    {isUploadingImage ? 'Enviando Imagem...' : 'Escolher Arquivo do Computador'}
                  </button>
                  <p className="text-[11px] text-zinc-500">
                    Formatos aceitos: JPG, PNG, WEBP (máx. 5MB).
                  </p>
                </div>
              </div>

              {/* URL fallback option */}
              <div className="pt-2 border-t border-zinc-900/80 space-y-1">
                <label className="text-[11px] text-zinc-500 block">Ou insira diretamente uma URL da imagem:</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://exemplo.com/sua-foto.jpg"
                    className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-slate-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Personal Info Section */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">Dados Pessoais</span>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 block">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-slate-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 block">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-slate-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 block">
                  Telefone <span className="text-zinc-500 font-normal text-[11px]">(formato: +55 DD XXXXX-XXXX)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+55 11 99999-9999"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-slate-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Security / Password Section */}
            <div className="bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Alterar Senha de Segurança</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Preencha apenas se desejar mudar sua senha de acesso. A confirmação da Senha Atual é obrigatória.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 block">Senha Atual</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Sua senha atual"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-slate-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none text-sm transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 block">Nova Senha</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-slate-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none text-sm transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSaving || isUploadingImage}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Salvando Alterações...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Perfil e Configurações
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
