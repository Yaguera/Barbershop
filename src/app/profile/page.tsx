'use client';

import { updatePasswordAction, updateProfileAction } from '@/app/actions/auth-actions';
import { uploadProfileImageAction } from '@/app/actions/upload-actions';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { BarberNavbar } from '@/components/barber/BarberNavbar';
import { ReceptionNavbar } from '@/components/reception/ReceptionNavbar';
import { BottomNavigation } from '@/components/lux/BottomNavigation';
import { Header } from '@/components/lux/Header';
import { UnauthorizedView } from '@/components/auth/UnauthorizedView';
import { compressImageClient } from '@/utils/compress-image';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  Trash2,
  UploadCloud,
  User,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const formatPhone = (val: string): string => {
  if (!val) return '';
  let digits = val.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('55') && digits.length > 2) {
    digits = digits.slice(2);
  } else if (digits === '55') {
    return '+55 ';
  }

  digits = digits.slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `+55 ${digits}`;
  if (digits.length <= 7) return `+55 ${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `+55 ${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Dados Pessoais
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState('');
  const [phone, setPhone] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);

  // Estados de Segurança e Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados de Operação Independentes
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Inicializa dados a partir da sessão
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
      setImage(session.user.image || '');
      setPhone(session.user.phone || '');
      setImageLoadError(false);
    }
  }, [session?.user]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
        <span className="text-xs font-semibold text-white/70">Carregando configurações da conta...</span>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session?.user) {
    return <UnauthorizedView callbackUrl="/profile" />;
  }

  const isAdminUser = session.user.role === 'ADMIN';
  const isReceptionistUser = session.user.role === 'RECEPTIONIST';
  const isBarberUser = session.user.role === 'BARBER';
  const isProfessionalUser = isAdminUser || isBarberUser || isReceptionistUser;

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  const isImageModified = image !== (session?.user?.image || '');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    setIsUploadingImage(true);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

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
        setImageLoadError(false);
        setProfileSuccessMsg('Nova foto carregada! Clique em "Salvar dados pessoais" para confirmar.');
      } else {
        setProfileErrorMsg(res.error || 'Erro ao fazer upload da imagem.');
      }
    } catch {
      setProfileErrorMsg('Erro ao comprimir ou enviar imagem.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemovePhoto = () => {
    setImage('');
    setImageLoadError(false);
    setProfileSuccessMsg('Foto removida da prévia. Clique em "Salvar dados pessoais" para confirmar.');
  };

  // Operação 1: Salvar Dados Pessoais e Foto
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('image', image);
      formData.append('phone', phone);

      const profileResult = await updateProfileAction(null, formData);
      if (!profileResult.success) {
        setProfileErrorMsg(profileResult.error || 'Erro ao atualizar dados pessoais.');
        return;
      }

      setProfileSuccessMsg(profileResult.message || 'Dados pessoais salvos com sucesso!');

      await update({
        name: profileResult.user?.name,
        email: profileResult.user?.email,
        image: profileResult.user?.image,
        phone: profileResult.user?.phone,
      });
    } catch {
      setProfileErrorMsg('Erro de rede ou servidor ao salvar dados pessoais.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Operação 2: Alterar Senha de Segurança
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (!currentPassword.trim()) {
      setPasswordErrorMsg('Informe sua Senha Atual para verificação de segurança.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordErrorMsg('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('A confirmação não coincide com a nova senha.');
      return;
    }

    setIsSavingPassword(true);

    try {
      const passResult = await updatePasswordAction({
        currentPassword,
        newPassword,
      });

      if (!passResult.success) {
        setPasswordErrorMsg(passResult.error || 'Erro ao atualizar senha. Verifique a senha atual.');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccessMsg('Senha alterada com sucesso!');
    } catch {
      setPasswordErrorMsg('Erro de comunicação ao atualizar senha.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#0D0D0D] text-[#FFFFFF] flex flex-col pb-24 selection:bg-[#C5A059]/30 font-sans ${
        isProfessionalUser ? 'lg:bg-[#141416] lg:flex-row lg:pb-0' : ''
      }`}
    >
      {/* Navegação Conforme o Perfil */}
      {isAdminUser ? (
        <AdminNavbar />
      ) : isReceptionistUser ? (
        <ReceptionNavbar />
      ) : isBarberUser ? (
        <BarberNavbar />
      ) : (
        <Header />
      )}

      <main
        id="main-content"
        className={`flex-grow px-4 sm:px-6 py-6 sm:py-8 w-full space-y-6 ${
          isProfessionalUser
            ? 'lg:my-3 lg:mr-3 lg:flex-1 lg:min-w-0 lg:rounded-[24px] lg:border lg:border-white/[0.07] lg:bg-[#0A0A0C] lg:p-6 xl:p-8 lg:shadow-2xl'
            : 'max-w-4xl mx-auto'
        }`}
      >
        <div className="max-w-4xl space-y-6">
          {/* Cabeçalho da Página */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Minha conta
            </h1>
            <p className="text-white/60 text-xs sm:text-sm">
              Atualize seus dados, sua foto e sua senha.
            </p>
          </div>

        {/* Bloco 1: Formulário de Dados Pessoais e Foto */}
        <section className="bg-[#151515] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-md space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-[#D4AF37]" />
              <span>Dados pessoais</span>
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              Suas informações de contato e apresentação na plataforma.
            </p>
          </div>

          {profileErrorMsg && (
            <div role="alert" className="flex items-center gap-2.5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-3.5 text-red-300 text-xs sm:text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          {profileSuccessMsg && (
            <div role="status" className="flex items-center gap-2.5 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl p-3.5 text-[#22C55E] text-xs sm:text-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Foto de Perfil com Fallback Local e Ações Claras */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-xl bg-[#1C1C1C] border border-white/5">
              <div className="relative w-24 h-24 shrink-0">
                {image && !imageLoadError ? (
                  <Image
                    src={image}
                    alt={name || 'Avatar'}
                    width={96}
                    height={96}
                    className="w-full h-full rounded-2xl object-cover border border-[#D4AF37]/50 shadow-md"
                    onError={() => setImageLoadError(true)}
                  />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-[#0D0D0D] border border-white/15 flex items-center justify-center text-[#D4AF37] font-bold text-2xl shadow-inner">
                    {initials}
                  </div>
                )}
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/80 rounded-2xl flex flex-col items-center justify-center text-[#D4AF37] gap-1">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-[9px] font-bold">Enviando...</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div>
                  <h3 className="text-sm font-semibold text-white">Foto de Apresentação</h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Formatos JPG, PNG ou WEBP. Máximo 5MB (comprimido automaticamente).
                  </p>
                  {isImageModified && (
                    <span className="inline-block mt-1 text-[11px] font-medium text-[#D4AF37]">
                      * Alteração de foto pendente de confirmação.
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingImage || isSavingProfile}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? 'Enviando...' : 'Carregar nova foto'}</span>
                  </button>

                  {image && (
                    <button
                      type="button"
                      disabled={isUploadingImage || isSavingProfile}
                      onClick={handleRemovePhoto}
                      className="px-3.5 py-2 bg-[#1C1C1C] hover:bg-[#EF4444]/15 text-white/60 hover:text-[#EF4444] border border-white/10 hover:border-[#EF4444]/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover foto</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Campos de Dados Pessoais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="profile-name" className="text-xs font-semibold text-white/80 block">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    id="profile-name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#1C1C1C] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none text-xs sm:text-sm font-medium transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-email" className="text-xs font-semibold text-white/80 block">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    id="profile-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#1C1C1C] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none text-xs sm:text-sm font-medium transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-phone" className="text-xs font-semibold text-white/80 block">
                  Telefone / WhatsApp <span className="text-white/40 font-normal text-[11px]">(+55 DD XXXXX-XXXX)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    id="profile-phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+55 11 99999-9999"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#1C1C1C] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none text-xs sm:text-sm font-medium transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingProfile || isUploadingImage}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando dados...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar dados pessoais</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Bloco 2: Formulário Independente de Segurança e Senha */}
        <section className="bg-[#151515] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-md space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#D4AF37]" />
              <span>Segurança e Credenciais</span>
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              Atualize sua senha de acesso. Esta operação é independente dos dados pessoais.
            </p>
          </div>

          {passwordErrorMsg && (
            <div role="alert" className="flex items-center gap-2.5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-3.5 text-red-300 text-xs sm:text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordErrorMsg}</span>
            </div>
          )}

          {passwordSuccessMsg && (
            <div role="status" className="flex items-center gap-2.5 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl p-3.5 text-[#22C55E] text-xs sm:text-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="current-password" className="text-xs font-semibold text-white/80 block">
                Senha Atual
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Informe sua senha atual"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#1C1C1C] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none text-xs sm:text-sm font-medium transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? 'Ocultar senha atual' : 'Exibir senha atual'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors focus:outline-none cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-xs font-semibold text-white/80 block">
                  Nova Senha
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#1C1C1C] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none text-xs sm:text-sm font-medium transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Ocultar nova senha' : 'Exibir nova senha'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors focus:outline-none cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-xs font-semibold text-white/80 block">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#1C1C1C] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none text-xs sm:text-sm font-medium transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Exibir confirmação de senha'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingPassword}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 hover:border-[#D4AF37]/50 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
              >
                {isSavingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    <span>Alterando senha...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#D4AF37]" />
                    <span>Atualizar senha</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
        </div>
      </main>

      {/* Navegação Inferior para Clientes (Perfis profissionais já possuem navegação própria em seus navbars) */}
      {isProfessionalUser ? null : <BottomNavigation activeTab="mais" />}
    </div>
  );
}
