'use client';

import {
  confirmPaymentReceiptAction,
  getCashRegisterDataAction,
} from '@/app/actions/reception-actions';
import { revertPaymentReceiptAction } from '@/app/actions/admin-actions';
import { ReceptionNavbar } from '@/components/reception/ReceptionNavbar';
import { getYYYYMMDD } from '@/core/utils/date-utils';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  CreditCard,
  Filter,
  Loader2,
  QrCode,
  Receipt,
  RefreshCw,
  RotateCcw,
  Scissors,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface PendingItem {
  id: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  clientId: string | null;
  clientContactId?: string | null;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  startTime: string | Date;
  endTime: string | Date;
  priceCents: number;
  origin: string;
}

interface ConfirmedItem {
  id: string;
  appointmentId: string;
  amountCents: number;
  method: string;
  confirmedById: string;
  confirmedByName: string;
  confirmedAt: string | Date;
  status: string;
  clientName: string;
  serviceName: string;
  barberName: string;
  serviceStartTime: string | Date;
}

interface CashSummary {
  receivedTodayCents: number;
  receivedTodayCount: number;
  totalPendingCents: number;
  totalPendingCount: number;
  byMethodCents: {
    money: number;
    pix: number;
    card: number;
  };
}

export default function AtendenteCaixaPage() {
  const { data: session, status: authStatus } = useSession();

  const [selectedDate, setSelectedDate] = useState(() => getYYYYMMDD(new Date()));
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'RECEIVED'>('PENDING');

  const [pendingList, setPendingList] = useState<PendingItem[]>([]);
  const [receiptsToday, setReceiptsToday] = useState<ConfirmedItem[]>([]);
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [barbers, setBarbers] = useState<{ id: string; name: string }[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal de Confirmação de Pagamento
  const [confirmingItem, setConfirmingItem] = useState<PendingItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'MONEY' | 'PIX' | 'CARD'>('MONEY');
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Modal de Reversão (exclusivo ADMIN)
  const [revertingItem, setRevertingItem] = useState<ConfirmedItem | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReverting, setIsReverting] = useState(false);
  const [revertError, setRevertError] = useState<string | null>(null);

  const loadCashData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCashRegisterDataAction(selectedDate, selectedBarberId);
      if (res.success) {
        setPendingList((res.pending as unknown as PendingItem[]) || []);
        setReceiptsToday((res.receiptsToday as unknown as ConfirmedItem[]) || []);
        setSummary(res.summary || null);
        if (res.barbers) setBarbers(res.barbers);
      } else {
        setError(res.error || 'Erro ao carregar dados do caixa.');
      }
    } catch {
      setError('Erro de conexão ao carregar dados do caixa.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === 'authenticated') {
      loadCashData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, selectedDate, selectedBarberId]);

  const changeDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    setSelectedDate(getYYYYMMDD(date));
  };

  const setToday = () => {
    setSelectedDate(getYYYYMMDD(new Date()));
  };

  const formattedDateLabel = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  const handleOpenConfirm = (item: PendingItem) => {
    setConfirmingItem(item);
    setPaymentMethod('MONEY');
    setConfirmError(null);
  };

  const handleConfirmPayment = async () => {
    if (!confirmingItem) return;
    setIsConfirming(true);
    setConfirmError(null);
    setSuccessMessage(null);

    const idempotencyKey = `pay-${confirmingItem.id}-${Date.now()}`;

    try {
      const res = await confirmPaymentReceiptAction({
        appointmentId: confirmingItem.id,
        method: paymentMethod,
        idempotencyKey,
      });

      if (res.success) {
        setSuccessMessage(`Recebimento de ${formatPrice(confirmingItem.priceCents)} confirmado com sucesso!`);
        setConfirmingItem(null);
        loadCashData();
      } else {
        setConfirmError(res.error || 'Falha ao confirmar pagamento.');
      }
    } catch {
      setConfirmError('Erro inesperado de comunicação.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleConfirmReversal = async () => {
    if (!revertingItem) return;
    if (!reversalReason.trim() || reversalReason.trim().length < 5) {
      setRevertError('Informe o motivo detalhado da reversão (mínimo de 5 caracteres).');
      return;
    }

    setIsReverting(true);
    setRevertError(null);
    setSuccessMessage(null);

    try {
      const res = await revertPaymentReceiptAction(revertingItem.id, reversalReason.trim());
      if (res.success) {
        setSuccessMessage('Recebimento revertido com sucesso para auditoria.');
        setRevertingItem(null);
        setReversalReason('');
        loadCashData();
      } else {
        setRevertError(res.error || 'Falha ao reverter recebimento.');
      }
    } catch {
      setRevertError('Erro inesperado de comunicação.');
    } finally {
      setIsReverting(false);
    }
  };

  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-[#0D0D0D] lg:bg-[#141416] text-white flex flex-col lg:flex-row font-sans pb-24 md:pb-8 lg:pb-0">
      <ReceptionNavbar />

      <main
        id="main-content"
        className="flex-1 w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6 lg:my-3 lg:mr-3 lg:min-w-0 lg:rounded-[24px] lg:border lg:border-white/[0.07] lg:bg-[#0A0A0C] lg:p-6 xl:p-8 lg:shadow-2xl"
      >
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <CircleDollarSign className="w-6 h-6 text-[#D4AF37]" />
              <span>Controle de Caixa</span>
            </h1>
            <p className="text-white/60 text-xs sm:text-sm mt-0.5">
              Confirme recebimentos de serviços concluídos e acompanhe a movimentação financeira.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#141414] border border-white/5 rounded-xl p-1">
              <button
                onClick={() => changeDate(-1)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                title="Dia anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={setToday}
                className="px-2.5 py-1 text-xs font-semibold text-white/80 hover:text-[#D4AF37] capitalize transition-all cursor-pointer"
                title="Voltar para hoje"
              >
                {formattedDateLabel()}
              </button>
              <button
                onClick={() => changeDate(1)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                title="Próximo dia"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={loadCashData}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Alertas */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        {/* Resumo Operacional em Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Recebido Hoje */}
            <div className="p-5 rounded-2xl bg-[#141414] border border-white/5 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Recebido Hoje
                </span>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Wallet className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-[#D4AF37]">
                {formatPrice(summary.receivedTodayCents)}
              </p>
              <p className="text-xs text-white/40">
                {summary.receivedTodayCount} recebimento{summary.receivedTodayCount === 1 ? '' : 's'} confirmado{summary.receivedTodayCount === 1 ? '' : 's'}
              </p>
            </div>

            {/* Card 2: Total em Aberto */}
            <div className="p-5 rounded-2xl bg-[#141414] border border-white/5 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Aguardando Pagamento
                </span>
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Receipt className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-amber-400">
                {formatPrice(summary.totalPendingCents)}
              </p>
              <p className="text-xs text-white/40">
                {summary.totalPendingCount} atendimento{summary.totalPendingCount === 1 ? '' : 's'} concluído{summary.totalPendingCount === 1 ? '' : 's'} na fila
              </p>
            </div>

            {/* Card 3: Dinheiro em Espécie */}
            <div className="p-5 rounded-2xl bg-[#141414] border border-white/5 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Dinheiro Físico
                </span>
                <span className="p-2 rounded-xl bg-white/5 text-white/70">
                  <Banknote className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-white">
                {formatPrice(summary.byMethodCents.money)}
              </p>
              <p className="text-xs text-white/40">Total recebido em cédulas hoje</p>
            </div>

            {/* Card 4: Pix e Cartão */}
            <div className="p-5 rounded-2xl bg-[#141414] border border-white/5 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Pix e Cartões
                </span>
                <span className="p-2 rounded-xl bg-white/5 text-white/70">
                  <CreditCard className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] text-white/40 block">Pix:</span>
                  <span className="text-sm font-bold text-white">{formatPrice(summary.byMethodCents.pix)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block">Cartão:</span>
                  <span className="text-sm font-bold text-white">{formatPrice(summary.byMethodCents.card)}</span>
                </div>
              </div>
              <p className="text-[11px] text-white/30 italic">Comprovantes bancários digitais</p>
            </div>
          </div>
        )}

        {/* Abas e Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          {/* Abas */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-[#141414] border border-white/5 self-start">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'PENDING'
                  ? 'bg-[#1C1C1C] text-[#D4AF37] border border-[#D4AF37]/30 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>Aguardando Pagamento</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-400">
                {pendingList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('RECEIVED')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'RECEIVED'
                  ? 'bg-[#1C1C1C] text-[#D4AF37] border border-[#D4AF37]/30 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>Recebidos Hoje</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400">
                {receiptsToday.length}
              </span>
            </button>
          </div>

          {/* Filtro por Profissional */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#D4AF37]" />
            <select
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="bg-[#1C1C1C] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            >
              <option value="all">Todos os Barbeiros</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conteúdo da Aba */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-white/40">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
            <p className="text-xs">Consultando registros do caixa...</p>
          </div>
        ) : activeTab === 'PENDING' ? (
          /* Fila Aguardando Pagamento */
          pendingList.length === 0 ? (
            <div className="bg-[#121212] rounded-2xl border border-white/5 p-12 text-center text-white/40 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400/40" />
              <p className="text-sm font-semibold text-white/70">Nenhum atendimento aguardando pagamento</p>
              <p className="text-xs text-white/40">
                Assim que um barbeiro marcar um serviço como concluído, ele aparecerá aqui para conferência no caixa.
              </p>
            </div>
          ) : (
            <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-white/5 flex items-center justify-between text-xs text-white/60">
                <span className="font-semibold uppercase tracking-wider">
                  Fila de Cobrança Pendente ({pendingList.length})
                </span>
                <span className="text-[11px] text-amber-400">
                  Inclui serviços concluídos de hoje e de dias anteriores
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {pendingList.map((item) => {
                  const date = new Date(item.startTime);
                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{item.clientName}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Aguardando Caixa
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
                          <span className="flex items-center gap-1 text-white/80">
                            <Scissors className="w-3.5 h-3.5 text-[#D4AF37]" />
                            {item.serviceName}
                          </span>
                          <span>•</span>
                          <span>Barbeiro: <strong className="text-white">{item.barberName}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-white/40">
                            <Clock className="w-3 h-3" />
                            {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}{' '}
                            {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-auto">
                        <span className="font-black text-base text-[#D4AF37]">
                          {formatPrice(item.priceCents)}
                        </span>

                        <button
                          onClick={() => handleOpenConfirm(item)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0A0A0A] transition-all shadow-md shadow-[#D4AF37]/10 flex items-center gap-1.5 cursor-pointer"
                        >
                          <CircleDollarSign className="w-4 h-4" />
                          <span>Receber</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          /* Histórico de Recebidos Hoje */
          receiptsToday.length === 0 ? (
            <div className="bg-[#121212] rounded-2xl border border-white/5 p-12 text-center text-white/40 space-y-2">
              <Receipt className="w-10 h-10 mx-auto text-white/20" />
              <p className="text-sm font-semibold text-white/70">Nenhum pagamento registrado nesta data</p>
              <p className="text-xs text-white/40">
                Os recebimentos confirmados no caixa aparecerão aqui com hora, método e responsável.
              </p>
            </div>
          ) : (
            <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-white/5 flex items-center justify-between text-xs text-white/60">
                <span className="font-semibold uppercase tracking-wider">
                  Recebimentos Confirmados Hoje ({receiptsToday.length})
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {receiptsToday.map((rec) => {
                  const confTime = new Date(rec.confirmedAt);
                  return (
                    <div
                      key={rec.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{rec.clientName}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            {rec.method === 'MONEY' && <Banknote className="w-3 h-3" />}
                            {rec.method === 'PIX' && <QrCode className="w-3 h-3" />}
                            {rec.method === 'CARD' && <CreditCard className="w-3 h-3" />}
                            {rec.method === 'MONEY' ? 'Dinheiro' : rec.method === 'PIX' ? 'Pix' : 'Cartão'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
                          <span>{rec.serviceName}</span>
                          <span>•</span>
                          <span>Profissional: <strong className="text-white">{rec.barberName}</strong></span>
                          <span>•</span>
                          <span>Recebido por: <strong className="text-white">{rec.confirmedByName}</strong></span>
                          <span>•</span>
                          <span className="text-white/40">
                            {confTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-auto">
                        <span className="font-black text-base text-emerald-400">
                          {formatPrice(rec.amountCents)}
                        </span>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setRevertingItem(rec);
                              setReversalReason('');
                              setRevertError(null);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Reverter recebimento (Admin)"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reverter</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </main>

      {/* Modal de Confirmação de Recebimento */}
      {confirmingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CircleDollarSign className="w-5 h-5 text-[#D4AF37]" />
                  <span>Confirmar Recebimento no Caixa</span>
                </h2>
                <p className="text-xs text-white/60">Verificação do valor recebido do cliente</p>
              </div>
              <button
                onClick={() => setConfirmingItem(null)}
                className="text-white/40 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {confirmError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <p>{confirmError}</p>
              </div>
            )}

            {/* Resumo do Atendimento */}
            <div className="p-3.5 rounded-xl bg-[#1C1C1C] border border-white/5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-white/60">Cliente:</span>
                <span className="font-bold text-white">{confirmingItem.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Serviço:</span>
                <span className="text-white">{confirmingItem.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Profissional:</span>
                <span className="text-white">{confirmingItem.barberName}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/5">
                <span className="font-bold text-white">Valor Devido:</span>
                <span className="font-black text-sm text-[#D4AF37]">
                  {formatPrice(confirmingItem.priceCents)}
                </span>
              </div>
            </div>

            {/* Seleção do Meio de Pagamento */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/70">
                Forma de Pagamento Verificada *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('MONEY')}
                  className={`py-2.5 px-3 rounded-xl font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer text-xs ${
                    paymentMethod === 'MONEY'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-md'
                      : 'bg-[#1C1C1C] border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Dinheiro</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('PIX')}
                  className={`py-2.5 px-3 rounded-xl font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer text-xs ${
                    paymentMethod === 'PIX'
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-400 shadow-md'
                      : 'bg-[#1C1C1C] border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Pix</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`py-2.5 px-3 rounded-xl font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer text-xs ${
                    paymentMethod === 'CARD'
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-400 shadow-md'
                      : 'bg-[#1C1C1C] border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cartão</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-white/40 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
              <strong>Importante:</strong> Confirmar o recebimento insere o valor nas métricas financeiras recebidas da empresa. Certifique-se de conferir as cédulas ou aprovação eletrônica antes de confirmar.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setConfirmingItem(null)}
                disabled={isConfirming}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isConfirming}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0A0A0A] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/15"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Confirmando...</span>
                  </>
                ) : (
                  <span>Confirmar recebimento de {formatPrice(confirmingItem.priceCents)}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reversão Administrativa (exclusivo ADMIN) */}
      {revertingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141414] border border-red-500/20 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Reversão de Recebimento</h3>
                <p className="text-[11px] text-white/60">Ação administrativa auditável</p>
              </div>
            </div>

            {revertError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {revertError}
              </div>
            )}

            <div className="p-3 rounded-xl bg-[#1C1C1C] border border-white/5 space-y-1 text-xs">
              <p>Cliente: <strong className="text-white">{revertingItem.clientName}</strong></p>
              <p>Valor: <strong className="text-red-400">{formatPrice(revertingItem.amountCents)}</strong></p>
              <p>Forma original: <strong className="text-white">{revertingItem.method}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                Motivo da Reversão (obrigatório para auditoria) *
              </label>
              <textarea
                rows={3}
                required
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="Ex: Registro duplicado ou erro de conferência de meio..."
                className="w-full bg-[#1C1C1C] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setRevertingItem(null)}
                disabled={isReverting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReversal}
                disabled={isReverting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isReverting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Revertendo...</span>
                  </>
                ) : (
                  <span>Confirmar Reversão</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
