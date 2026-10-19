'use client';

import {
  deactivateReceptionistAction,
  getReceptionistsAction,
  registerReceptionistAction,
} from '@/app/actions/admin-actions';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Key,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  ShieldAlert,
  User,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ReceptionistItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string | Date;
}

export default function AdminAtendentesPage() {
  const { status } = useSession();
  const [receptionists, setReceptionists] = useState<ReceptionistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal de cadastro
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal de confirmação de desativação
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const loadReceptionists = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getReceptionistsAction();
      if (res.success && res.receptionists) {
        setReceptionists(res.receptionists);
      } else {
        setError(res.error || 'Erro ao carregar lista de atendentes.');
      }
    } catch {
      setError('Erro de conexão ao buscar atendentes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      loadReceptionists();
    }
  }, [status]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!name.trim() || !email.trim() || !password) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setFormError('A senha provisória deve conter pelo menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerReceptionistAction({
        name: name.trim(),
        email: email.trim(),
        passwordHash: password,
      });

      if (res.success) {
        setSuccessMessage(res.message || 'Atendente cadastrada com sucesso!');
        setName('');
        setEmail('');
        setPassword('');
        setIsRegisterOpen(false);
        loadReceptionists();
      } else {
        setFormError(res.error || 'Falha ao cadastrar atendente.');
      }
    } catch {
      setFormError('Erro inesperado de comunicação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingId) return;
    setIsDeactivating(true);
    setError(null);
    try {
      const res = await deactivateReceptionistAction(deactivatingId);
      if (res.success) {
        setSuccessMessage(res.message || 'Atendente desativada com sucesso.');
        setDeactivatingId(null);
        loadReceptionists();
      } else {
        setError(res.error || 'Falha ao desativar atendente.');
      }
    } catch {
      setError('Erro inesperado ao desativar atendente.');
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans">
      <AdminNavbar activePage="atendentes" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Gestão de Equipe</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3 mt-1">
              <span>Atendentes e Recepção</span>
            </h1>
            <p className="text-white/60 text-xs sm:text-sm mt-1">
              Gerencie as credenciais e permissões da equipe de recepção e caixa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div
              className="inline-flex rounded-xl bg-[#151515] p-1 border border-white/10"
              role="navigation"
              aria-label="Subnavegação de equipe"
            >
              <Link
                href="/admin/barbeiros"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Briefcase className="w-3.5 h-3.5" />
                Barbeiros
              </Link>
              <Link
                href="/admin/atendentes"
                aria-current="page"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-black"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Atendentes ({receptionists.length})
              </Link>
            </div>

            <button
              onClick={loadReceptionists}
              disabled={isLoading}
              className="min-h-11 min-w-11 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                setFormError(null);
                setIsRegisterOpen(true);
              }}
              className="min-h-11 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0A0A0A] transition-all shadow-lg shadow-[#D4AF37]/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Atendente</span>
            </button>
          </div>
        </div>

        {/* Alertas */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <p>{successMessage}</p>
          </div>
        )}

        {/* Lista de Atendentes */}
        <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Atendentes Cadastradas ({receptionists.length})
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-white/40">
              <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
              <p className="text-xs">Carregando equipe de recepção...</p>
            </div>
          ) : receptionists.length === 0 ? (
            <div className="py-16 text-center text-white/40 space-y-2">
              <UserCheck className="w-10 h-10 mx-auto text-white/20" />
              <p className="text-sm font-semibold text-white/70">Nenhuma atendente cadastrada</p>
              <p className="text-xs text-white/40">Cadastre uma atendente para liberar o acesso à agenda e caixa.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {receptionists.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold shrink-0">
                      {rec.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{rec.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            rec.active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {rec.active ? 'Ativa' : 'Desativada'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/50 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-white/40" />
                          {rec.email}
                        </span>
                        <span>•</span>
                        <span>
                          Cadastrada em{' '}
                          {new Date(rec.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {rec.active ? (
                      <button
                        onClick={() => setDeactivatingId(rec.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Desativar</span>
                      </button>
                    ) : (
                      <span className="text-xs text-white/30 italic">Acesso revogado</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Cadastro */}
      {isRegisterOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !isSubmitting && setIsRegisterOpen(false)}
        >
          <div
            className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h2 className="text-lg font-bold text-white">Cadastrar Nova Atendente</h2>
                <p className="text-xs text-white/60">Crie a identidade da profissional na recepção</p>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="text-white/40 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <p>{formError}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Maria Souza"
                    className="w-full bg-[#1C1C1C] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">E-mail de Acesso</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="recepcao@barbearia.com"
                    className="w-full bg-[#1C1C1C] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Senha Provisória</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-[#1C1C1C] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                  Entregue a senha provisória de forma segura. A atendente poderá alterá-la no perfil.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0A0A0A] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <span>Cadastrar Atendente</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Desativação */}
      {deactivatingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !isDeactivating && setDeactivatingId(null)}
        >
          <div
            className="bg-[#141414] border border-red-500/20 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-white">Desativar Atendente?</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                As sessões ativas da atendente serão revogadas imediatamente. O histórico de agendamentos e recebimentos registrados será integralmente preservado.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeactivatingId(null)}
                disabled={isDeactivating}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={isDeactivating}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isDeactivating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Desativando...</span>
                  </>
                ) : (
                  <span>Confirmar Desativação</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
