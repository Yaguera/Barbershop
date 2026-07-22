'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { updateProfileAction, updatePasswordAction } from '@/app/actions/auth-actions';
import { uploadProfileImageAction } from '@/app/actions/upload-actions';
import { User, Key, Mail, Image as ImageIcon, Phone, Save, RefreshCw, AlertCircle, CheckCircle2, UploadCloud, Lock, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { compressImageClient } from '@/utils/compress-image';
import { Header } from '@/components/lux/Header';
import { BottomNavigation } from '@/components/lux/BottomNavigation';

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
      <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
        <span className="text-sm font-bold">Carregando dados da conta VIP...</span>
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
      const compressedFile = await compressImageClient(originalFile, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.append('file', compressedFile);

      const res = await uploadProfileImageAction(formData);
      if (res.success && res.imageUrl) {
        setImage(res.imageUrl);
        setSuccessMsg('Imagem enviada com sucesso! Clique em Salvar para confirmar.');
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

    if (newPassword.trim()) {
      if (!currentPassword.trim()) {
        setErrorMsg('Para alterar a senha, informe sua Senha Atual para verificação de segurança.');
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

      if (newPassword.trim()) {
        const passResult = await updatePasswordAction({
          currentPassword,
          newPassword,
        });

        if (!passResult.success) {
          setErrorMsg(passResult.error || 'Erro ao atualizar a senha. Verifique a Senha Atual.');
          setIsSaving(false);
          return;
        }

        setCurrentPassword('');
        setNewPassword('');
        setSuccessMsg('Perfil e senha atualizados com sucesso!');
      } else {
        setSuccessMsg(profileResult.message || 'Perfil atualizado com sucesso!');
      }

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

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#FFFFFF] flex flex-col pb-24 selection:bg-[#D4AF37]/30 font-sans">
      <Header />

      <main className="flex-grow max-w-4xl mx-auto px-6 py-8 w-full space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              Minha Conta VIP
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Configurações de Perfil
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-1">
            Gerencie seus dados pessoais, telefone para contato e segurança.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl p-4 text-[#EF4444] text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-2xl p-4 text-[#22C55E] text-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Photo Upload */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#151515] p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 text-center shadow-xl">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block">
                Avatar de Identificação
              </span>
              
              <div className="relative w-32 h-32 mx-auto">
                {image ? (
                  <Image
                    src={image}
                    alt="Avatar"
                    width={128}
                    height={128}
                    className="w-full h-full rounded-full object-cover border-2 border-[#D4AF37] shadow-2xl transition-transform hover:scale-105"
                    onError={() => {
                      setImage(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`);
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#1C1C1C] border-2 border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-black text-3xl shadow-inner">
                    {name ? name.substring(0, 2).toUpperCase() : 'VIP'}
                  </div>
                )}
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/80 rounded-full flex flex-col items-center justify-center text-[#D4AF37] gap-1">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-[10px] font-bold">Enviando...</span>
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
                  className="w-full py-3 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/30 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  {isUploadingImage ? 'Processando Foto...' : 'Carregar Nova Foto'}
                </button>
                <p className="text-[11px] text-white/40">
                  JPG, PNG ou WEBP (máximo 5MB).
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 text-left space-y-1.5">
                <label className="text-[11px] font-semibold text-white/60 block">Ou URL da web:</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://exemplo.com/foto.jpg"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#1C1C1C] border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Personal Data & Security */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#151515] p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5 shadow-xl">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block">
                Dados Pessoais
              </span>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80 block">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-11 pr-4 py-3 bg-[#1C1C1C] border border-white/10 rounded-2xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none text-sm font-medium transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80 block">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-11 pr-4 py-3 bg-[#1C1C1C] border border-white/10 rounded-2xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none text-sm font-medium transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80 block">
                  Telefone / WhatsApp <span className="text-white/40 font-normal text-[11px]">(+55 DD XXXXX-XXXX)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+55 11 99999-9999"
                    className="w-full pl-11 pr-4 py-3 bg-[#1C1C1C] border border-white/10 rounded-2xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none text-sm font-medium transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#151515] p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5 shadow-xl">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-bold uppercase tracking-widest text-white">Segurança & Senha</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                Preencha os campos abaixo apenas se desejar trocar sua senha de acesso.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 block">Senha Atual</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Sua senha atual"
                      className="w-full pl-11 pr-4 py-3 bg-[#1C1C1C] border border-white/10 rounded-2xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none text-sm font-medium transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 block">Nova Senha</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-11 pr-4 py-3 bg-[#1C1C1C] border border-white/10 rounded-2xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none text-sm font-medium transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving || isUploadingImage}
              className="w-full py-4.5 bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-black rounded-2xl transition-all shadow-[0_4px_25px_rgba(212,175,55,0.35)] flex items-center justify-center gap-2 text-base disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Salvando Alterações...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Salvar Perfil VIP</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      <BottomNavigation activeTab="mais" />
    </div>
  );
}
