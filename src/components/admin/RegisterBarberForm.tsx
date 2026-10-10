'use client';

import { registerBarberAction } from '@/app/actions/admin-actions';
import { AlertCircle, CheckCircle2, Loader2, UserPlus } from 'lucide-react';
import { useState } from 'react';

export function RegisterBarberForm({ onRegistered }: { onRegistered: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('18:00');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleRegisterBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await registerBarberAction({
        name,
        email,
        passwordHash: password,
        workDays,
        workStart,
        workEnd,
      });

      if (res.success) {
        setFormSuccess(res.message || 'Barbeiro registrado com sucesso!');
        setName('');
        setEmail('');
        setPassword('');
        onRegistered();
      } else {
        setFormError(res.error || 'Erro ao registrar barbeiro.');
      }
    } catch {
      setFormError('Erro inesperado ao registrar barbeiro.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDayCheck = (day: number) => {
    if (workDays.includes(day)) {
      setWorkDays(workDays.filter((d) => d !== day));
    } else {
      setWorkDays([...workDays, day].sort());
    }
  };

  const weekdaysLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-[#D4AF37]" />
        Registrar Barbeiro
      </h2>

      <div className="bg-[#151515] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
        {formError && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{formError}</p>
          </div>
        )}

        {formSuccess && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <p>{formSuccess}</p>
          </div>
        )}

        <form onSubmit={handleRegisterBarber} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">
              Nome
            </label>
            <input
              id="input-barber-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do profissional"
              className="w-full px-4 py-2.5 bg-[#1C1C1C] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none text-sm transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">
              E-mail de Acesso
            </label>
            <input
              id="input-barber-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="barbeiro@email.com"
              className="w-full px-4 py-2.5 bg-[#1C1C1C] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none text-sm transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">
              Senha Provisória
            </label>
            <input
              id="input-barber-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-2.5 bg-[#1C1C1C] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none text-sm transition-colors"
            />
          </div>

          {/* Days Checkboxes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">
              Dias de Trabalho
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                <button
                  key={day}
                  type="button"
                  id={`btn-check-day-${day}`}
                  onClick={() => handleDayCheck(day)}
                  className={`py-1.5 rounded-lg border text-center font-bold text-xs transition-colors cursor-pointer ${
                    workDays.includes(day)
                      ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-sm font-black'
                      : 'bg-[#1C1C1C] border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  {weekdaysLabels[day]}
                </button>
              ))}
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">
                Início
              </label>
              <input
                id="input-barber-start"
                type="text"
                required
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                placeholder="09:00"
                className="w-full px-4 py-2.5 bg-[#1C1C1C] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none text-sm transition-colors text-center font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">
                Término
              </label>
              <input
                id="input-barber-end"
                type="text"
                required
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                placeholder="18:00"
                className="w-full px-4 py-2.5 bg-[#1C1C1C] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#D4AF37] focus:outline-none text-sm transition-colors text-center font-bold"
              />
            </div>
          </div>

          <button
            id="btn-register-barber-submit"
            type="submit"
            disabled={formLoading}
            className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#E2BE4D] hover:brightness-110 text-black font-black rounded-xl transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
          >
            {formLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Salvar Barbeiro'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
