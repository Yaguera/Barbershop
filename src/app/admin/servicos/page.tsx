'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  getServicesAdminAction,
  createServiceAction,
  updateServiceAction,
  deleteServiceAction,
} from '@/app/actions/service-actions';
import { uploadServiceImageAction } from '@/app/actions/upload-actions';
import {
  Scissors,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  Image as ImageIcon,
  Clock,
  DollarSign,
  Percent,
  ArrowLeft,
  CalendarDays,
  Users,
  User,
  LogOut,
  X,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ServiceProp {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  commissionRate: number;
  image?: string | null;
  active: boolean;
}

export default function AdminServicesPage() {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [services, setServices] = useState<ServiceProp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [commissionRatePercent, setCommissionRatePercent] = useState('40');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadServices = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getServicesAdminAction(filterActiveOnly);
      if (res.success && res.services) {
        setServices(res.services);
      } else {
        setErrorMsg(res.error || 'Erro ao carregar serviços.');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Erro de conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [filterActiveOnly]);

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentServiceId(null);
    setName('');
    setPrice('');
    setDurationMinutes('30');
    setCommissionRatePercent('40');
    setImageUrl('');
    setActive(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (service: ServiceProp) => {
    setModalMode('edit');
    setCurrentServiceId(service.id);
    setName(service.name);
    setPrice(service.price.toString());
    setDurationMinutes(service.durationMinutes.toString());
    setCommissionRatePercent(Math.round(service.commissionRate * 100).toString());
    setImageUrl(service.image || '');
    setActive(service.active);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsSubmitting(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setErrorMsg(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadServiceImageAction(formData);
      if (res.success && res.imageUrl) {
        setImageUrl(res.imageUrl);
      } else {
        setErrorMsg(res.error || 'Erro ao fazer upload da imagem.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro de conexão ao enviar imagem.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const parsedPrice = parseFloat(price);
    const parsedDuration = parseInt(durationMinutes, 10);
    const parsedCommission = parseFloat(commissionRatePercent) / 100;

    if (!name || name.trim().length === 0) {
      setErrorMsg('O nome do serviço é obrigatório.');
      setIsSubmitting(false);
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg('O preço deve ser maior que zero.');
      setIsSubmitting(false);
      return;
    }

    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      setErrorMsg('A duração em minutos deve ser maior que zero.');
      setIsSubmitting(false);
      return;
    }

    if (isNaN(parsedCommission) || parsedCommission < 0 || parsedCommission > 1) {
      setErrorMsg('A comissão deve estar entre 0% e 100%.');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('price', parsedPrice.toString());
    formData.append('durationMinutes', parsedDuration.toString());
    formData.append('commissionRate', parsedCommission.toString());
    if (imageUrl) {
      formData.append('image', imageUrl);
    }
    formData.append('active', active ? 'true' : 'false');

    try {
      if (modalMode === 'create') {
        const res = await createServiceAction(formData);
        if (res.success) {
          setSuccessMsg('Serviço criado com sucesso!');
          await loadServices();
          handleCloseModal();
        } else {
          setErrorMsg(res.error || 'Erro ao criar serviço.');
        }
      } else if (modalMode === 'edit' && currentServiceId) {
        const res = await updateServiceAction(currentServiceId, formData);
        if (res.success) {
          setSuccessMsg('Serviço atualizado com sucesso!');
          await loadServices();
          handleCloseModal();
        } else {
          setErrorMsg(res.error || 'Erro ao atualizar serviço.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro inesperado ao salvar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    if (!confirm(`Deseja realmente desativar o serviço "${serviceName}"? O histórico financeiro e de agendamentos será preservado, mas o serviço não aparecerá para novos agendamentos.`)) {
      return;
    }

    setDeletingId(serviceId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await deleteServiceAction(serviceId);
      if (res.success) {
        setSuccessMsg(`Serviço "${serviceName}" desativado com sucesso!`);
        await loadServices();
      } else {
        setErrorMsg(res.error || 'Erro ao desativar serviço.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro de conexão.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);
  };

  const activeServicesCount = services.filter((s) => s.active).length;
  const avgPrice = services.length > 0 ? services.reduce((acc, s) => acc + s.price, 0) / services.length : 0;
  const avgCommission = services.length > 0 ? (services.reduce((acc, s) => acc + s.commissionRate, 0) / services.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col selection:bg-amber-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-900 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="w-10 h-10 rounded-full border border-amber-500/30 object-cover" />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent hidden sm:inline">
              José Carlos Barber Shop
            </span>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            {session?.user && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-sm text-slate-400 hidden md:inline">
                  Admin: <span className="text-slate-200 font-semibold">{session.user.name}</span>
                </span>
              </div>
            )}
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-slate-200 border border-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <Link
              href="/admin/calendario"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Calendário
            </Link>
            <Link
              href="/admin/clientes"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              Clientes
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-slate-200 border border-zinc-800 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              Perfil
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/25 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Scissors className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Catálogo & Preços</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Gestão de Serviços</h1>
            <p className="text-slate-400 text-sm">Gerencie os cortes, barbas e combos oferecidos com fotos e cálculo automático de comissão.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilterActiveOnly(!filterActiveOnly)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                filterActiveOnly
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              {filterActiveOnly ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {filterActiveOnly ? 'Apenas Ativos' : 'Todos os Serviços'}
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Novo Serviço
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-400 block mb-1">Total de Serviços</span>
              <span className="text-2xl font-black text-slate-100">{services.length}</span>
              <span className="text-[11px] text-emerald-400 block mt-0.5 font-medium">{activeServicesCount} ativos no menu</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Scissors className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-400 block mb-1">Preço Médio</span>
              <span className="text-2xl font-black text-emerald-400">{formatPrice(avgPrice)}</span>
              <span className="text-[11px] text-zinc-400 block mt-0.5">Por atendimento</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-400 block mb-1">Comissão Média</span>
              <span className="text-2xl font-black text-amber-400">{Math.round(avgCommission)}%</span>
              <span className="text-[11px] text-zinc-400 block mt-0.5">Repasse para barbeiros</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Percent className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-emerald-400 text-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Services Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            <span>Carregando serviços...</span>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-12 text-center text-zinc-500 space-y-3">
            <Scissors className="w-12 h-12 mx-auto text-zinc-700" />
            <p className="text-base font-semibold text-slate-300">Nenhum serviço encontrado</p>
            <p className="text-xs text-zinc-500">Clique em &quot;Novo Serviço&quot; acima para adicionar o primeiro corte ou tratamento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const barberGain = service.price * service.commissionRate;
              const salonGain = service.price * (1 - service.commissionRate);

              return (
                <div
                  key={service.id}
                  className={`relative group bg-zinc-900/80 border rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                    service.active
                      ? 'border-zinc-800 hover:border-amber-500/40 shadow-lg hover:shadow-amber-500/5'
                      : 'border-red-900/40 opacity-60 bg-zinc-950/80'
                  }`}
                >
                  {/* Status Badge */}
                  <div className="absolute top-3.5 right-3.5 z-10">
                    {service.active ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-md">
                        Inativo
                      </span>
                    )}
                  </div>

                  {/* Image Header */}
                  <div className="relative h-44 w-full bg-zinc-950 overflow-hidden">
                    {service.image ? (
                      <Image
                        src={service.image}
                        alt={service.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 text-zinc-600 gap-2">
                        <Scissors className="w-10 h-10 opacity-40" />
                        <span className="text-xs font-medium">Sem Foto Ilustrativa</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/95 via-transparent to-transparent" />
                    
                    {/* Price & Duration Overlay */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                      <div>
                        <span className="text-xs font-medium text-zinc-400 block">Preço</span>
                        <span className="text-2xl font-black text-amber-400 drop-shadow-md">{formatPrice(service.price)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{service.durationMinutes} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Body & Commission Details */}
                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-100 group-hover:text-amber-400 transition-colors">
                        {service.name}
                      </h3>
                      
                      <div className="mt-3 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span>Comissão do Barbeiro:</span>
                          <span className="font-bold text-amber-400">{Math.round(service.commissionRate * 100)}%</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-zinc-800/60">
                          <span className="text-zinc-500">Ganho Barbeiro:</span>
                          <span className="font-semibold text-emerald-400">{formatPrice(barberGain)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">Ganho Barbearia:</span>
                          <span className="font-semibold text-blue-400">{formatPrice(salonGain)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-3 border-t border-zinc-800/80 flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(service)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-slate-200 border border-zinc-700/60 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        Editar
                      </button>

                      {service.active ? (
                        <button
                          onClick={() => handleDeleteService(service.id, service.name)}
                          disabled={deletingId === service.id}
                          className="flex items-center justify-center p-2.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 transition-all disabled:opacity-50"
                          title="Desativar serviço (Soft Delete)"
                        >
                          {deletingId === service.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => openEditModal(service)}
                          className="px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 transition-all"
                        >
                          Reativar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal / Drawer for Create & Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={handleCloseModal}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  {modalMode === 'create' ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-100">
                    {modalMode === 'create' ? 'Cadastrar Novo Serviço' : 'Editar Serviço'}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {modalMode === 'create'
                      ? 'Preencha os dados e anexe uma foto para o catálogo.'
                      : 'Altere preço, comissão, duração ou desative o serviço no menu.'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Nome do Serviço *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Corte Degradê, Barba na Toalha, Nevou..."
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm text-slate-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Preço (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="35.00"
                        className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm text-slate-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Duração (Minutos) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        placeholder="30"
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm text-slate-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-medium">min</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Comissão do Barbeiro (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={commissionRatePercent}
                      onChange={(e) => setCommissionRatePercent(e.target.value)}
                      placeholder="40"
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm text-slate-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-sm">%</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Exemplo: 40% significa que em um corte de R$ 40,00, o barbeiro recebe R$ 16,00.
                  </p>
                </div>

                {/* Photo Upload Dropzone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Foto Ilustrativa do Serviço
                  </label>
                  
                  <div className="space-y-3">
                    {imageUrl && (
                      <div className="relative h-36 w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
                        <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute top-2 right-2 px-3 py-1 rounded-xl bg-black/80 text-xs font-bold text-red-400 border border-red-500/30 backdrop-blur-md hover:bg-red-500/20 transition-all"
                        >
                          Remover Foto
                        </button>
                      </div>
                    )}

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
                      className="w-full py-4 px-4 border-2 border-dashed border-zinc-800 hover:border-amber-500/50 rounded-2xl bg-zinc-950/60 hover:bg-zinc-950 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-amber-400 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingImage ? (
                        <>
                          <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                          <span className="text-xs font-semibold">Enviando e otimizando imagem...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-6 h-6 text-amber-400" />
                          <span className="text-xs font-semibold">
                            {imageUrl ? 'Trocar Imagem do Serviço (Clique aqui)' : 'Anexar Imagem (JPG, PNG ou WEBP)'}
                          </span>
                        </>
                      )}
                    </button>

                    <div className="relative">
                      <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Ou cole uma URL da imagem aqui..."
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-slate-200 placeholder-zinc-600 focus:border-amber-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Toggle for Edit Mode */}
                {modalMode === 'edit' && (
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-slate-200 block">Status no Catálogo</span>
                      <span className="text-xs text-zinc-500">Serviços inativos não aparecem na tela de agendamento.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActive(!active)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}
                    >
                      {active ? 'Ativo' : 'Inativo (Oculto)'}
                    </button>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-2xl text-xs font-bold text-zinc-400 hover:bg-zinc-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploadingImage}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                  >
                    {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    {modalMode === 'create' ? 'Cadastrar Serviço' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
